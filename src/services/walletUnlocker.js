import { status } from '@grpc/grpc-js'
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

  async initWallet(payload = {}, options = {}) {
    this.debug(`Calling ${this.serviceName}.initWallet with payload: %o`, { payload, options })
    const res = await promisifiedCall(this.service, this.service.initWallet, payload, options)
    this.emit('unlocked')
    return res
  }

  async unlockWallet(payload = {}, options = {}) {
    this.debug(`Calling ${this.serviceName}.unlockWallet with payload: %o`, { payload, options })
    const res = await promisifiedCall(this.service, this.service.unlockWallet, payload, options)
    this.emit('unlocked')
    return res
  }
}

export default WalletUnlocker
