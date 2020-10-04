/**
 * Helper function to determine if a hostname is on Tor.
 *
 * @param {string} host Hostname
 * @return {boolean} Boolean indicating if host is Tor
 */
const isTor = (host) => {
  const [lndHost] = host.split(':')
  return lndHost.endsWith('.onion')
}

export default isTor
