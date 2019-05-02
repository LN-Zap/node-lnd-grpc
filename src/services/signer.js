import Service from '../service'

/**
 * Signer service controller.
 * @extends Service
 */
class Signer extends Service {
  constructor(options) {
    super('Signer', options)
    this.useMacaroon = true
  }
}

export default Signer
