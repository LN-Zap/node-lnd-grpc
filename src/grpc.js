import EventEmitter from 'events'
import StateMachine from 'javascript-state-machine'
import createDebug from 'debug'
import { status } from '@grpc/grpc-js'
import { validateHost } from './utils'
import { WalletUnlocker, Lightning, Autopilot, ChainNotifier, Invoices, Router, Signer, WalletKit } from './services'
import registry from './registry'

const debug = createDebug('lnrpc:grpc')

const WALLET_STATE_LOCKED = 'WALLET_STATE_LOCKED'
const WALLET_STATE_ACTIVE = 'WALLET_STATE_ACTIVE'

/**
 * Lnd gRPC service wrapper.
 * @extends EventEmitter
 */
class LndGrpc extends EventEmitter {
  constructor(options = {}) {
    super()
    debug(`Initializing LndGrpc with config: %o`, options)
    this.options = options

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
        onAfterActivateWalletUnlocker: this.onAfterActivateWalletUnlocker.bind(this),
        onBeforeActivateLightning: this.onBeforeActivateLightning.bind(this),
        onAfterActivateLightning: this.onAfterActivateLightning.bind(this),
        onBeforeDisconnect: this.onBeforeDisconnect.bind(this),
        onAfterDisconnect: this.onAfterDisconnect.bind(this),
      },
    })

    // Define services.
    this.supportedServices = [WalletUnlocker, Lightning, Autopilot, ChainNotifier, Invoices, Router, Signer, WalletKit]
    this.services = {}

    // Instantiate services.
    this.supportedServices.forEach(Service => {
      const instance = new Service(this.options)
      this.services[instance.serviceName] = instance
    })
  }

  // ------------------------------------
  // FSM Proxies
  // ------------------------------------

  is(...args) {
    return this.fsm.is(args)
  }
  can(...args) {
    return this.fsm.can(args)
  }
  observe(...args) {
    return this.fsm.observe(args)
  }
  get state() {
    return this.fsm.state
  }

  async connect() {
    debug(`Connecting to lnd gRPC service`)

    // Verify that the host is valid.
    const { host } = this.options
    await validateHost(host)

    // Probe the services to determine the wallet state.
    const walletState = await this.determineWalletState()

    // Update our state accordingly.
    switch (walletState) {
      case WALLET_STATE_LOCKED:
        await this.fsm.activateWalletUnlocker()
        break

      case WALLET_STATE_ACTIVE:
        await this.fsm.activateLightning()
        break

      default:
        throw new Error('Unable to determine wallet state')
    }
  }

  async disconnect(...args) {
    return this.fsm.disconnect(args)
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
    await this.services.WalletUnlocker.connect()
  }

  /**
   * Emit event after activating the wallet unlocker.
   */
  async onAfterActivateWalletUnlocker() {
    this.emit('service.WalletUnlocker.active')
  }

  /**
   * Connect to and activate the main api.
   */
  async onBeforeActivateLightning() {
    const { Lightning } = this.services

    // First connect to the Lightning service.
    await Lightning.connect()

    // Fetch the determined version.
    const { version } = Lightning

    // Get a list of all other available and supported servicves.
    const availableServices = registry[version].services
      .map(s => s.name)
      .filter(s => Object.keys(this.services).includes(s))
      .filter(s => !['WalletUnlocker', 'Lightning'].includes(s))

    // Connect to the other services.
    await Promise.all(
      availableServices.map(serviceName => {
        const service = this.services[serviceName]
        service.version = version
        if (service.can('connect')) {
          return service.connect()
        }
      }),
    )
  }

  /**
   * Emit event after activating the main api.
   */
  async onAfterActivateLightning() {
    this.emit('services.Lightning.active')
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
      Object.keys(this.services).map(serviceName => {
        const service = this.services[serviceName]
        if (service.can('disconnect')) {
          return service.disconnect()
        }
      }),
    )
  }

  /**
   * Probe to determine what state lnd is in.
   */
  async determineWalletState() {
    debug('Attempting to determine wallet state')
    try {
      await this.services.WalletUnlocker.connect()
      await this.services.WalletUnlocker.unlockWallet('null')
    } catch (error) {
      switch (error.code) {
        /*
          `UNIMPLEMENTED` indicates that the requested operation is not implemented or not supported/enabled in the
           service. This implies that the wallet is already unlocked, since the WalletUnlocker service is not active.
           See https://github.com/grpc/grpc-node/blob/master/packages/grpc-native-core/src/constants.js#L129
         */
        case status.UNIMPLEMENTED:
          debug('Determined wallet state as:', WALLET_STATE_ACTIVE)
          return WALLET_STATE_ACTIVE

        /**
          `UNKNOWN` indicates that unlockWallet was called without an argument which is invalid.
          This implies that the wallet is waiting to be unlocked.
        */
        case status.UNKNOWN:
          debug('Determined wallet state as:', WALLET_STATE_LOCKED)
          return WALLET_STATE_LOCKED

        /**
          Bubble all other errors back to the caller and abort the connection attempt.
          Disconnect all services.
        */
        default:
          debug('Unable to determine wallet state', error)
          throw error
      }
    } finally {
      if (this.services.WalletUnlocker.can('disconnect')) {
        await this.services.WalletUnlocker.disconnect()
      }
    }
  }

  /**
   * Wait for a service to become active.
   * @param  {String} serviceName Name of service to wait for (Lightning, or WalletUnlocker)
   * @return {Promise<Object>}     Object with `isActive` and `cancel` properties.
   */
  waitForService(serviceName) {
    let successHandler
    const activationEventName = `services.${serviceName}.active`

    /**
     * Promise that resolves when service is active.
     */
    const isActive = new Promise(async resolve => {
      // If the service is already active, return immediately.
      if (this.services[serviceName].is('connected')) {
        return resolve()
      }
      // Otherwise, wait until we receive an activation event from the gRPC service.
      successHandler = () => resolve()
      this.prependOnceListener(activationEventName, successHandler)
    })

    /**
     * Method to abort the wait (prevent the isActive from resolving and remove activation event listener).
     */
    const cancel = () => {
      if (successHandler) {
        this.off(activationEventName, successHandler)
        successHandler = null
      }
    }

    return { isActive, cancel }
  }
}

export default LndGrpc
