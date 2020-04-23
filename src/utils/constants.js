// Wallet states.
export const WALLET_STATE_LOCKED = 'WALLET_STATE_LOCKED'
export const WALLET_STATE_ACTIVE = 'WALLET_STATE_ACTIVE'

// Time (in seconds) to wait for interface probe calls to complete.
export const PROBE_TIMEOUT = 20

// Time (in ms) to wait before retrying a connection attempt.
export const PROBE_RETRY_INTERVAL = 250

// Time (in seconds) to wait for a grpc connection to be established.
export const CONNECT_WAIT_TIMEOUT = 20

// Time (in seconds) to wait before aborting service connection attempts.
export const SERVICE_CONNECT_TIMEOUT = 30

// Time (in ms) to wait for a cert/macaroon file to become present.
export const FILE_WAIT_TIMEOUT = 10 * 1000

// Time (in ms) to wait for Tor to become ready after starting.
export const TOR_WAIT_TIMEOUT = 500
