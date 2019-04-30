import Service from '../service'

/**
 * Router service controller.
 * @extends Service
 */
class Router extends Service {
  constructor(options) {
    super('Router', options)
    this.useMacaroon = true
  }
}

export default Router
