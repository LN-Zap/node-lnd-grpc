// Wallet states.
export const WALLET_STATE_LOCKED = 'WALLET_STATE_LOCKED'
export const WALLET_STATE_ACTIVE = 'WALLET_STATE_ACTIVE'

// Time (in seconds) to wait for interface probe calls to complete.
export const PROBE_TIMEOUT = 5

// Time (in ms) to wait before retrying a connection attempt.
export const PROBE_RETRY_INTERVAL = 250

// global service connect deadline in ms
export const SERVICE_CONNECT_TIMEOUT = 20 * 1000

// Time (in seconds) to wait for a grpc connection to be established.
export const CONNECT_WAIT_TIMEOUT = 10

// Time (in ms) to wait for a cert/macaroon file to become present.
export const FILE_WAIT_TIMEOUT = 10 * 1000

// Default value for `maxSessionMemory` is 10 which is quite low for the lnd gRPC server, which can stream a lot of data
// in a short space of time. We increase this to prevent `NGHTTP2_ENHANCE_YOUR_CALM` errors from http2 streams.
// See https://nodejs.org/api/http2.html#http2_http2_connect_authority_options_listener.
export const MAX_SESSION_MEMORY = 50
