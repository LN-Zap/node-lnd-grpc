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

  async getState(payload = {}, options = {}) {
    this.debug(`Calling ${this.serviceName}.getState with payload: %o`, { payload, options })
    const res = await promisifiedCall(this.service, this.service.getState, payload, options)
    return res
  }
}

export default State
