import { status } from '@grpc/grpc-js'
import { promisifiedCall } from '../utils'
import Service from '../service'

/**
 * State service controller.
 * @extends Service
 */
class State extends Service {
  constructor(options) {
    super('State', options)
    this.useMacaroon = false
  }

  async getState() {
    this.debug(`Calling ${this.serviceName}.getState`)
    const res = await promisifiedCall(this, this.getState)
    return res
  }
}

export default State
