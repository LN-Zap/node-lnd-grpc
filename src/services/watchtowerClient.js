import Service from '../service'

/**
 * WatchtowerClient service controller.
 * @extends Service
 */
class WatchtowerClient extends Service {
  constructor(options) {
    super('WatchtowerClient', options)
    this.useMacaroon = true
  }
}

export default WatchtowerClient
