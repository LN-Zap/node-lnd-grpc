import { promisifiedCall } from '../utils'
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

  async initWallet(payload = {}) {
    this.debug(`Calling ${this.serviceName}.initWallet with payload: %o`, payload)
    const res = await promisifiedCall(this.service, this.service.initWallet, payload)
    this.emit('unlocked')
    return res
  }

  async unlockWallet(payload = {}) {
    this.debug(`Calling ${this.serviceName}.unlockWallet with payload: %o`, payload)
    const res = await promisifiedCall(this.service, this.service.unlockWallet, payload)
    this.emit('unlocked')
    return res
  }
}

export default WalletUnlocker
