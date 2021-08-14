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
}

export default State
