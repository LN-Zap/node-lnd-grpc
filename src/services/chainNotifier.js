import Service from '../service'

/**
 * ChainNotifier service controller.
 * @extends Service
 */
class ChainNotifier extends Service {
  constructor(options) {
    super('ChainNotifier', options)
    this.useMacaroon = true
  }
}

export default ChainNotifier
