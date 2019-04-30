import { join } from 'path'
import EventEmitter from 'events'
import { credentials, loadPackageDefinition, status } from '@grpc/grpc-js'
import { load } from '@grpc/proto-loader'
import StateMachine from 'javascript-state-machine'
import debug from 'debug'
import {
  promisifiedCall,
  waitForFile,
  grpcOptions,
  getDeadline,
  createSslCreds,
  createMacaroonCreds,
  getLatestProtoVersion,
  getProtoDir,
} from './utils'
import registry from './registry'

/**
 * Base class for lnd gRPC services.
 * @extends EventEmitter
 */
class Service extends EventEmitter {
  constructor(serviceName, options) {
    super()
    this.serviceName = serviceName

    this.fsm = new StateMachine({
      init: 'ready',
      transitions: [
        { name: 'connect', from: 'ready', to: 'connected' },
        { name: 'disconnect', from: 'connected', to: 'ready' },
      ],
      methods: {
        onBeforeConnect: this.onBeforeConnect.bind(this),
        onAfterConnect: this.onAfterConnect.bind(this),
        onBeforeDisconnect: this.onBeforeDisconnect.bind(this),
        onAfterDisconnect: this.onAfterDisconnect.bind(this),
      },
    })

    this.useMacaroon = true
    this.service = null
    this.options = options
    this.debug = debug(`lnrpc:service:${this.serviceName}`)
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
  connect(...args) {
    return this.fsm.connect(args)
  }
  disconnect(...args) {
    return this.fsm.disconnect(args)
  }

  // ------------------------------------
  // FSM Callbacks
  // ------------------------------------

  /**
   * Connect to the gRPC interface.
   */
  async onBeforeConnect() {
    this.debug(`Connecting to ${this.serviceName} gRPC service`)

    await this.establishConnection({
      useMacaroon: this.useMacaroon,
      waitForMacaroon: this.options.waitForMacaroon,
    })
  }

  /**
   * Log successful connection.
   */
  onAfterConnect() {
    this.debug(`Connected to ${this.serviceName} gRPC service`)
  }

  /**
   * Disconnect from the gRPC service.
   */
  async onBeforeDisconnect() {
    this.debug(`Disconnecting from ${this.serviceName} gRPC service`)
    if (this.service) {
      this.service.close()
    }
  }

  /**
   * Log successful disconnect.
   */
  onAfterDisconnect() {
    this.debug(`Disconnected from ${this.serviceName} gRPC service`)
  }

  // ------------------------------------
  // Helpers
  // ------------------------------------

  /**
   * Establish a connection to the Lightning interface.
   */
  async establishConnection(options = {}) {
    const { version, useMacaroon, waitForMacaroon } = options
    const { host, cert, macaroon } = this.options

    // Find the most recent proto file for this service.
    this.version = version || this.version || getLatestProtoVersion()
    const serviceDefinition = registry[this.version].services.find(s => s.name === this.serviceName)
    const [protoPackage, protoFile] = serviceDefinition.proto.split('/')
    const filepath = join(getProtoDir(), this.version, protoPackage, protoFile)
    this.debug(`Establishing gRPC connection to ${this.serviceName} with proto file %s`, filepath)

    // Load gRPC package definition as a gRPC object hierarchy.
    const packageDefinition = await load(filepath, grpcOptions)
    const rpc = loadPackageDefinition(packageDefinition)

    // Create ssl credentials to use with the gRPC client.
    let creds = await createSslCreds(cert)

    // Add macaroon to crenentials if service requires macaroons.
    if (useMacaroon) {
      // If we are trying to connect to the internal lnd, wait up to 20 seconds for the macaroon to be generated.
      if (waitForMacaroon) {
        await waitForFile(macaroon, 20000)
      }
      const macaroonCreds = await createMacaroonCreds(macaroon)
      creds = credentials.combineChannelCredentials(creds, macaroonCreds)
    }

    try {
      const rpcService = rpc[protoPackage][this.serviceName]

      // Create a new gRPC client instance.
      this.service = new rpcService(host, creds)

      // Wait up to 10 seconds for the gRPC connection to be established.
      await promisifiedCall(this.service, this.service.waitForReady, getDeadline(10))

      // Set up helper methods to proxy service methods.
      this.wrapAsync(rpcService.service)
    } catch (e) {
      this.debug(`Unable to connect to ${this.serviceName} service`, e)
      if (this.service) {
        this.service.close()
      }
      throw e
    }
  }

  /**
   * Add promisified helper methods for each method in the gRPC service.
   * Inspiration from https://github.com/altangent/lnd-async
   * @param  {Object} rpc [description]
   * @return {[type]}     [description]
   */
  wrapAsync(service) {
    Object.values(service).forEach(method => {
      const { originalName } = method
      this[originalName] = payload => {
        return promisifiedCall(this.service, this.service[originalName], payload)
      }
    })
  }
}

export default Service
