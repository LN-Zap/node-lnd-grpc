import Service from '../service'

/**
 * Versioner service controller.
 * @extends Service
 */
class Versioner extends Service {
  constructor(options) {
    super('Versioner', options)
    this.useMacaroon = true
  }
}

export default Versioner
