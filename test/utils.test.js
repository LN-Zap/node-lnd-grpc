import test from 'tape-promise/tape'
import { join } from 'path'
import { getMacaroon } from '../src/utils'

const fixturesDir = join(__dirname, 'fixtures')
const macaroon = join(fixturesDir, 'readonly.macaroon')

export const macaroonHex =
  '0201036c6e64028a01030a10184ded6e22a77b04dc159d8f92c9c12f1201301a0f0a07616464726573731204726561641a0c0a04696e666f1204726561641a100a08696e766f696365731204726561641a0f0a076d6573736167651204726561641a100a086f6666636861696e1204726561641a0f0a076f6e636861696e1204726561641a0d0a05706565727312047265616400000620b52e70826cb6371aefef9e7870dbb64210d412e560e1172a0c4b5900e2b91783'
export const macaroobBase64Url =
  'AgEDbG5kAooBAwoQGE3tbiKnewTcFZ2PksnBLxIBMBoPCgdhZGRyZXNzEgRyZWFkGgwKBGluZm8SBHJlYWQaEAoIaW52b2ljZXMSBHJlYWQaDwoHbWVzc2FnZRIEcmVhZBoQCghvZmZjaGFpbhIEcmVhZBoPCgdvbmNoYWluEgRyZWFkGg0KBXBlZXJzEgRyZWFkAAAGILUucIJstjca7--eeHDbtkIQ1BLlYOEXKgxLWQDiuReD'

test('getMacaroon (path)', async (t) => {
  t.plan(1)
  const res = await getMacaroon(macaroon)
  t.equal(res, macaroonHex, 'should extract correct macaroon')
})

test('getMacaroon (base64url)', async (t) => {
  t.plan(1)
  const res = await getMacaroon(macaroobBase64Url)
  t.equal(res, macaroonHex, 'should extract correct macaroon')
})
