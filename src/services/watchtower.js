import Service from '../service'

/**
 * Watchtower service controller.
 * @extends Service
 */
class Watchtower extends Service {
  constructor(options) {
    super('Watchtower', options)
    this.useMacaroon = true
  }
}

export default Watchtower
