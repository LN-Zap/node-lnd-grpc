import { status } from '@grpc/grpc-js'
import { getDeadline, getClosestProtoVersion, getLatestProtoVersion, PROBE_TIMEOUT } from '../utils'
import Service from '../service'

/**
 * Lightning service controller.
 * @extends Service
 */
class Lightning extends Service {
  constructor(options) {
    super('Lightning', options)
    this.useMacaroon = true
  }

  /**
   * Reconnect using closest rpc.proto file match.
   */
  async onBeforeConnect() {
    this.debug(`Connecting to ${this.serviceName} gRPC service`)

    // Establish a connection, as normal.
    await this.establishConnection()

    // Try to make a call to ensure that the connection is usable.
    // We call to getInfo in order to determine the api version.
    const info = await this.getInfo({}, { deadline: getDeadline(PROBE_TIMEOUT) })
    this.debug('Connected to Lightning gRPC: %O', info)

    // Determine most relevant proto version based on the api info.
    const [closestProtoVersion, latestProtoVersion] = await Promise.all([
      getClosestProtoVersion(info.version),
      getLatestProtoVersion(),
    ])

    // Reconnect using best matching rpc proto if needed.
    if (closestProtoVersion !== latestProtoVersion) {
      this.debug('Found better match. Reconnecting using rpc.proto version: %s', closestProtoVersion)
      this.service.close()
      await this.establishConnection({ version: closestProtoVersion })
    }
  }
}

export default Lightning
