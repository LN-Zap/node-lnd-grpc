import Service from '../service'

/**
 * State service controller.
 * @extends Service
 */
class State extends Service {
  constructor(options) {
    super('State', options)
    this.useMacaroon = true
  }
}

export default State
