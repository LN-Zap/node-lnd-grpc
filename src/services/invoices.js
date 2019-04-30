import Service from '../service'

/**
 * Invoices service controller.
 * @extends Service
 */
class Invoices extends Service {
  constructor(options) {
    super('Invoices', options)
    this.useMacaroon = true
  }
}

export default Invoices
