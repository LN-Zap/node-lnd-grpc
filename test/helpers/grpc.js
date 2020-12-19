import { join } from 'path'

export const fixturesDir = join(__dirname, `../fixtures`)

export const testClearnetHostname = 'testnet4'
export const testClearnetHost = `${testClearnetHostname}-lnd.zaphq.io:10009`

export const testOnionHostname = 'zapn34qfeedw2l5y26p3hnnkusqnbhxcxw64lq5cojmvq45yw4bc3sqd.onion'
export const testOnionHost = `${testOnionHostname}:10009`

export const macaroonHex =
  '0201036c6e64028a01030a10184ded6e22a77b04dc159d8f92c9c12f1201301a0f0a07616464726573731204726561641a0c0a04696e666f1204726561641a100a08696e766f696365731204726561641a0f0a076d6573736167651204726561641a100a086f6666636861696e1204726561641a0f0a076f6e636861696e1204726561641a0d0a05706565727312047265616400000620b52e70826cb6371aefef9e7870dbb64210d412e560e1172a0c4b5900e2b91783'
export const macaroobBase64Url =
  'AgEDbG5kAooBAwoQGE3tbiKnewTcFZ2PksnBLxIBMBoPCgdhZGRyZXNzEgRyZWFkGgwKBGluZm8SBHJlYWQaEAoIaW52b2ljZXMSBHJlYWQaDwoHbWVzc2FnZRIEcmVhZBoQCghvZmZjaGFpbhIEcmVhZBoPCgdvbmNoYWluEgRyZWFkGg0KBXBlZXJzEgRyZWFkAAAGILUucIJstjca7--eeHDbtkIQ1BLlYOEXKgxLWQDiuReD'

export const cert =
  'MIICeDCCAh2gAwIBAgIQOMCEKNbMG26NQgqAOmsYoDAKBggqhkjOPQQDAjA-MR8wHQYDVQQKExZsbmQgYXV0b2dlbmVyYXRlZCBjZXJ0MRswGQYDVQQDExJ6YXAtdGVzdG5ldDQtbG5kLTAwHhcNMjAxMjE2MTMzMTI4WhcNMjIwMjEwMTMzMTI4WjA-MR8wHQYDVQQKExZsbmQgYXV0b2dlbmVyYXRlZCBjZXJ0MRswGQYDVQQDExJ6YXAtdGVzdG5ldDQtbG5kLTAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARvFglyFQ1Jn2qT26K-_OWBT86ZanV6mHjbx1eia4UEsdL2fE2FiD2yyJx56OeY-YdXqXNDM-kNiELcf0me4JxAo4H8MIH5MA4GA1UdDwEB_wQEAwICpDATBgNVHSUEDDAKBggrBgEFBQcDATAPBgNVHRMBAf8EBTADAQH_MIHABgNVHREEgbgwgbWCEnphcC10ZXN0bmV0NC1sbmQtMIIJbG9jYWxob3N0ghV0ZXN0bmV0NC1sbmQuemFwaHEuaW-CPnphcG4zNHFmZWVkdzJsNXkyNnAzaG5ua3VzcW5iaHhjeHc2NGxxNWNvam12cTQ1eXc0YmMzc3FkLm9uaW9uggR1bml4ggp1bml4cGFja2V0ggdidWZjb25uhwR_AAABhxAAAAAAAAAAAAAAAAAAAAABhwQKNAFbhwQiSWimMAoGCCqGSM49BAMCA0kAMEYCIQD_aVOTXMfztJ54IIOs-d99H8OtYkRNeYcXQBOVuKWnSQIhAKB-U7Jt8d1qn23RDc85e8tDqJosdPv6QS1cN1SwpxPv'

export const clearnetHost = {
  host: testClearnetHost,
  cert: join(fixturesDir, testClearnetHostname, 'tls.cert'),
  macaroon: join(fixturesDir, testClearnetHostname, 'readonly.macaroon'),
  lndconenctString: `lndconnect://${testClearnetHost}?cert=${cert}&macaroon=${macaroobBase64Url}`,
}

export const torHost = {
  host: testOnionHost,
  cert: join(fixturesDir, testClearnetHostname, 'tls.cert'),
  macaroon: join(fixturesDir, testClearnetHostname, 'readonly.macaroon'),
  lndconenctString: `lndconnect://${testOnionHost}?cert=${cert}&macaroon=${macaroobBase64Url}`,
}

export const remoteHost = process.env.TOR === 'true' ? torHost : clearnetHost
