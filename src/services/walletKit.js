import Service from '../service'

/**
 * WalletKit service controller.
 * @extends Service
 */
class WalletKit extends Service {
  constructor(options) {
    super('WalletKit', options)
    this.useMacaroon = true
  }
}

export default WalletKit
