import Service from '../service'

/**
 * WalletUnlocker service controller.
 * @extends Service
 */
class WalletUnlocker extends Service {
  constructor(options) {
    super('WalletUnlocker', options)
    this.useMacaroon = false
  }
}

export default WalletUnlocker
