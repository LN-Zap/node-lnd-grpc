import EventEmitter from 'events'
import StateMachine from 'javascript-state-machine'
import createDebug from 'debug'
import parse from 'lndconnect/parse'
import { status } from '@grpc/grpc-js'
import { tor, isTor } from './utils'
import {
  getDeadline,
  grpcSslCipherSuites,
  validateHost,
  onInvalidTransition,
  onPendingTransition,
  WALLET_STATE_LOCKED,
  WALLET_STATE_ACTIVE,
} from './utils'
import {
  WalletUnlocker,
  Lightning,
  Autopilot,
  ChainNotifier,
  Invoices,
  Router,
  Signer,
  State,
  Versioner,
  WalletKit,
} from './services'
import registry from './registry'

const debug = createDebug('lnrpc:grpc')

// Set up SSL with the cypher suits that we need.
if (!process.env.GRPC_SSL_CIPHER_SUITES) {
  process.env.GRPC_SSL_CIPHER_SUITES = grpcSslCipherSuites
}

/**
 * Lnd gRPC service wrapper.
 * @extends EventEmitter
 */
class LndGrpc extends EventEmitter {
  constructor(options = {}) {
    super()
    debug(`Initializing LndGrpc with config: %o`, options)
    this.options = options

    // If an lndconnect uri was provided, extract the connection details from that.
    if (options.lndconnectUri) {
      const connectionInfo = parse(options.lndconnectUri)
      Object.assign(this.options, connectionInfo)
    }

    // Define state machine.
    this.fsm = new StateMachine({
      init: 'ready',
      transitions: [
        { name: 'activateWalletUnlocker', from: ['ready', 'active'], to: 'locked' },
        { name: 'activateLightning', from: ['ready', 'locked'], to: 'active' },
        { name: 'disconnect', from: ['locked', 'active'], to: 'ready' },
      ],
      methods: {
        onBeforeActivateWalletUnlocker: this.onBeforeActivateWalletUnlocker.bind(this),
        onBeforeActivateLightning: this.onBeforeActivateLightning.bind(this),
        onBeforeDisconnect: this.onBeforeDisconnect.bind(this),
        onAfterDisconnect: this.onAfterDisconnect.bind(this),
        onInvalidTransition,
        onPendingTransition,
      },

      onInvalidTransition(transition, from, to) {
        throw Object.assign(new Error(`transition is invalid in current state`), { transition, from, to })
      },
    })

    // Define services.
    this.supportedServices = [
      WalletUnlocker,
      Lightning,
      Autopilot,
      ChainNotifier,
      Invoices,
      Router,
      Signer,
      State,
      Versioner,
      WalletKit,
    ]
    this.services = {}
    this.tor = tor()

    // Instantiate services.
    this.supportedServices.forEach((Service) => {
      const instance = new Service(this.options)
      this.services[instance.serviceName] = instance
    })
  }

  // ------------------------------------
  // FSM Proxies
  // ------------------------------------

  is(...args) {
    return this.fsm.is(...args)
  }
  can(...args) {
    return this.fsm.can(...args)
  }
  observe(...args) {
    return this.fsm.observe(...args)
  }
  get state() {
    return this.fsm.state
  }

  async connect() {
    debug(`Connecting to lnd gRPC service`)

    // Verify that the host is valid.
    const { host } = this.options
    await validateHost(host)

    // Start tor service if needed.
    if (isTor(host) && !this.tor.isStarted()) {
      this.emit('tor.starting')
      await this.tor.start()
      this.emit('tor.started')
    }

    // Probe the services to determine the wallet state.
    const walletState = await this.determineWalletState()

    // Update our state accordingly.
    switch (walletState) {
      case WALLET_STATE_LOCKED:
        await this.activateWalletUnlocker()
        break

      case WALLET_STATE_ACTIVE:
        await this.activateLightning()
        break
    }
  }

  async activateWalletUnlocker(...args) {
    await this.fsm.activateWalletUnlocker(...args)
    this.emit('locked')
  }

  async activateLightning(...args) {
    try {
      await this.fsm.activateLightning(...args)
      this.emit('active')
    } catch (e) {
      await this.disconnectAll()
      throw e
    }
  }

  async disconnect(...args) {
    if (this.can('disconnect')) {
      await this.fsm.disconnect(...args)
    }
    if (this.tor.isStarted()) {
      this.emit('tor.stopping')
      await this.tor.stop()
      this.emit('tor.stopped')
    }
    this.emit('disconnected')
  }

  // ------------------------------------
  // FSM Observers
  // ------------------------------------

  /**
   * Disconnect from the gRPC service.
   */
  async onBeforeDisconnect() {
    debug(`Disconnecting from lnd gRPC service`)
    await this.disconnectAll()
  }
  /**
   * Log successful disconnect.
   */
  async onAfterDisconnect() {
    debug('Disconnected from lnd gRPC service')
  }

  /**
   * Connect to and activate the wallet unlocker api.
   */
  async onBeforeActivateWalletUnlocker() {
    if (this.services.WalletUnlocker.can('connect')) {
      await this.services.WalletUnlocker.connect()
    }
  }

  /**
   * Connect to and activate the main api.
   */
  async onBeforeActivateLightning() {
    const { Lightning, WalletUnlocker } = this.services

    // Disconnect wallet unlocker if its connected.
    if (WalletUnlocker.can('disconnect')) {
      await WalletUnlocker.disconnect()
    }

    // First connect to the Lightning service.
    await Lightning.connect()

    // Fetch the determined version.
    const { version } = Lightning

    // Get a list of all other available and supported services.
    const availableServices = registry[version].services
      .map((s) => s.name)
      .filter((s) => Object.keys(this.services).includes(s))
      .filter((s) => !['WalletUnlocker', 'Lightning'].includes(s))

    // Connect to the other services.
    await Promise.all(
      availableServices
        .filter((serviceName) => this.services[serviceName].can('connect'))
        .map((serviceName) => {
          const service = this.services[serviceName]
          service.version = version
          // Disable waiting for cert/macaroon for sub-services.
          return service.connect({
            waitForCert: false,
            waitForMacaroon: false,
          })
        }),
    )
  }

  // ------------------------------------
  // Helpers
  // ------------------------------------

  /**
   * Disconnect all services.
   */
  async disconnectAll() {
    debug('Disconnecting from all gRPC services')
    await Promise.all(
      Object.keys(this.services).map((serviceName) => {
        const service = this.services[serviceName]
        if (service.can('disconnect')) {
          return service.disconnect()
        }
      }),
    )
    debug('Disconnected from all gRPC services')
  }

  /**
   * Probe to determine what state lnd is in.
   */
  async determineWalletState(options = { keepalive: false }) {
    debug('Attempting to determine wallet state')
    let walletState
    try {
      await this.services.State.connect()
      walletState =  await this.services.State.getState()

      switch (walletState.state) {
        case 'RPC_ACTIVE':
          debug('Determined wallet state as:', WALLET_STATE_ACTIVE)
          walletState = WALLET_STATE_ACTIVE
          return walletState

        case 'LOCKED':
         debug('Determined wallet state as:', WALLET_STATE_LOCKED)
         walletState = WALLET_STATE_LOCKED
         return walletState
      }
    } catch (error) {
        console.error(error)
        debug('Unable to determine wallet state', error)
        throw error
    } finally {
      if (!options.keepalive && this.can('disconnect')) {
        await this.disconnect()
      }
    }
  }

  /**
   * Wait for lnd to enter a particular state.
   * @param  {string} state Name of state to wait for (locked, active, disconnected)
   * @return {Promise<Object>} Object with `isDone` and `cancel` properties.
   */
  waitForState(stateName) {
    let successHandler

    /**
     * Promise that resolves when service is active.
     */
    const isDone = new Promise((resolve) => {
      // If the service is already in the requested state, return immediately.
      if (this.fsm.state === stateName) {
        return resolve()
      }
      // Otherwise, wait until we receive a relevant state change event.
      successHandler = () => resolve()
      this.prependOnceListener(stateName, successHandler)
    })

    /**
     * Method to abort the wait (prevent the isDone from resolving and remove activation event listener).
     */
    const cancel = () => {
      if (successHandler) {
        this.off(stateName, successHandler)
        successHandler = null
      }
    }

    return { isDone, cancel }
  }
}

export default LndGrpc
