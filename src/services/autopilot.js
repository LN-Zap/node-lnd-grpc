import Service from '../service'

/**
 * Autopilot service controller.
 * @extends Service
 */
class Autopilot extends Service {
  constructor(options) {
    super('Autopilot', options)
    this.useMacaroon = true
  }
}

export default Autopilot
