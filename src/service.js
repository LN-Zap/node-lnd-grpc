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

// Time (in ms) to wait for a connection to be established.
const CONNECT_WAIT_TIMEOUT = 10000

// Time (in ms) to wait for a cert/macaroon file to become present.
const FILE_WAIT_TIMEOUT = 10000

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
    await this.establishConnection()
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
    const { version } = options
    const {
      host,
      cert,
      macaroon,
      protoDir,
      waitForCert,
      waitForMacaroon,
      grpcOptions: customGrpcOptions = {},
    } = this.options

    // Find the most recent proto file for this service.
    this.version = version || this.version || getLatestProtoVersion()

    const serviceDefinition = registry[this.version].services.find(s => s.name === this.serviceName)
    const [protoPackage, protoFile] = serviceDefinition.proto.split('/')
    const filepath = join(protoDir || getProtoDir(), this.version, protoPackage, protoFile)
    this.debug(`Establishing gRPC connection to ${this.serviceName} with proto file %s`, filepath)

    // Load gRPC package definition as a gRPC object hierarchy.
    const packageDefinition = await load(filepath, { ...grpcOptions, ...customGrpcOptions })
    const rpc = loadPackageDefinition(packageDefinition)

    // Wait for the cert to exist (this can take some time immediately after starting lnd).
    if (waitForCert) {
      const waitTime = Number.isFinite(waitForCert) ? waitForCert : FILE_WAIT_TIMEOUT
      await waitForFile(cert, waitTime)
    }

    // Create ssl credentials to use with the gRPC client.
    let creds = await createSslCreds(cert)

    // Add macaroon to credentials if service requires macaroons.
    if (this.useMacaroon && macaroon) {
      // Wait for the macaroon to exist (this can take some time immediately after Initializing a wallet).
      if (waitForMacaroon) {
        const waitTime = Number.isFinite(waitForMacaroon) ? waitForMacaroon : FILE_WAIT_TIMEOUT
        await waitForFile(macaroon, waitTime)
      }
      const macaroonCreds = await createMacaroonCreds(macaroon)
      creds = credentials.combineChannelCredentials(creds, macaroonCreds)
    }

    try {
      // Create a new gRPC client instance.
      const rpcService = rpc[protoPackage][this.serviceName]
      this.service = new rpcService(host, creds)

      // Wait up to CONNECT_WAIT_TIMEOUT seconds for the gRPC connection to be established.
      await promisifiedCall(this.service, this.service.waitForReady, getDeadline(CONNECT_WAIT_TIMEOUT / 1000))

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
   * @param {Object} service service description used to extract apply method details
   */
  wrapAsync(service) {
    Object.values(service).forEach(method => {
      const { originalName } = method
      // Do not override existing methods.
      if (this[originalName]) {
        return
      }
      // If this method is a stream, bind it to the service instance as is.
      if (method.requestStream || method.responseStream) {
        this[originalName] = (payload = {}) => {
          this.debug(`Calling ${this.serviceName}.${originalName} with payload: %o`, payload)
          return this.service[originalName].bind(this.service).call()
        }
      }
      // Otherwise, promisify and bind to the service instance.
      this[originalName] = (payload = {}) => {
        this.debug(`Calling ${this.serviceName}.${originalName} with payload: %o`, payload)
        return promisifiedCall(this.service, this.service[originalName], payload)
      }
    })
  }
}

export default Service
