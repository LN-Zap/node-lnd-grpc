import { join } from 'path'
import EventEmitter from 'events'
import defaultsDeep from 'lodash.defaultsdeep'
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
  onInvalidTransition,
  onPendingTransition,
} from './utils'
import registry from './registry'

// Time (in ms) to wait for a connection to be established.
const CONNECT_WAIT_TIMEOUT = 10000

// Time (in ms) to wait for a cert/macaroon file to become present.
const FILE_WAIT_TIMEOUT = 10000

// Default value for `maxSessionMemory` is 10 which is quite low for the lnd gRPC server, which can stream a lot of data
// in a short space of time. We increase this to prevent `NGHTTP2_ENHANCE_YOUR_CALM` errors from http2 streams.
// See https://nodejs.org/api/http2.html#http2_http2_connect_authority_options_listener.
const MAX_SESSION_MEMORY = 50

const DEFAULT_OPTIONS = {
  grpcOptions,
  connectionOptions: { maxSessionMemory: MAX_SESSION_MEMORY },
}

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
        onInvalidTransition,
        onPendingTransition,
      },
    })

    this.useMacaroon = true
    this.service = null
    this.options = defaultsDeep(options, DEFAULT_OPTIONS)
    this.debug = debug(`lnrpc:service:${this.serviceName}`)
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
  connect(...args) {
    return this.fsm.connect(...args)
  }
  disconnect(...args) {
    return this.fsm.disconnect(...args)
  }

  // ------------------------------------
  // FSM Callbacks
  // ------------------------------------

  /**
   * Connect to the gRPC interface.
   */
  async onBeforeConnect(lifecycle, options) {
    this.debug(`Connecting to ${this.serviceName} gRPC service`)
    await this.establishConnection(options)
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
    const opts = defaultsDeep(options, this.options)
    const {
      host,
      cert,
      macaroon,
      protoDir,
      waitForCert,
      waitForMacaroon,
      grpcOptions,
      connectionOptions,
      version,
    } = opts

    // Find the most recent proto file for this service if a specific version was not requested.
    this.version = version || getLatestProtoVersion()

    const serviceDefinition = registry[this.version].services.find(s => s.name === this.serviceName)
    const [protoPackage, protoFile] = serviceDefinition.proto.split('/')
    const filepath = join(protoDir || getProtoDir(), this.version, protoPackage, protoFile)
    this.debug(`Establishing gRPC connection to ${this.serviceName} with proto file %s`, filepath)

    // Load gRPC package definition as a gRPC object hierarchy.
    const packageDefinition = await load(filepath, grpcOptions)
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
      // Set custom connection options.
      defaultsDeep(creds.connectionOptions, connectionOptions)

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
