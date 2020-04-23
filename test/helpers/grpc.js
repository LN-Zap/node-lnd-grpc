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
  'MIICYTCCAgagAwIBAgIRAJMTFnc73j4iP6VAU_-nSOowCgYIKoZIzj0EAwIwPjEfMB0GA1UEChMWbG5kIGF1dG9nZW5lcmF0ZWQgY2VydDEbMBkGA1UEAxMSemFwLXRlc3RuZXQ0LWxuZC0wMB4XDTE5MTAyMzEwMDIyNloXDTIwMTIxNzEwMDIyNlowPjEfMB0GA1UEChMWbG5kIGF1dG9nZW5lcmF0ZWQgY2VydDEbMBkGA1UEAxMSemFwLXRlc3RuZXQ0LWxuZC0wMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEESndkptIDcgVAdH7ulBVDPZNsKWgD12WJhII2VmbUN9IU1ZFFcv43kg_DyzCH0_158tDGqHp-Npyf9JEQ--y4aOB5DCB4TAOBgNVHQ8BAf8EBAMCAqQwDwYDVR0TAQH_BAUwAwEB_zCBvQYDVR0RBIG1MIGyghJ6YXAtdGVzdG5ldDQtbG5kLTCCCWxvY2FsaG9zdIIVdGVzdG5ldDQtbG5kLnphcGhxLmlvgj56YXBuMzRxZmVlZHcybDV5MjZwM2hubmt1c3FuYmh4Y3h3NjRscTVjb2ptdnE0NXl3NGJjM3NxZC5vbmlvboIEdW5peIIKdW5peHBhY2tldIcEfwAAAYcQAAAAAAAAAAAAAAAAAAAAAYcECjQEPocEIklopocECjf8YDAKBggqhkjOPQQDAgNJADBGAiEAiBiCFmgYrgQyF_OKoZb_I47xnaZYTkdUNeajomMoFKoCIQC6X3YEAMV2r1rbNs0faOUYS3hCTmFK75coXBJHHWFsFw'

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
