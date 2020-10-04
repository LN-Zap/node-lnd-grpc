import test from 'tape-promise/tape'
import { getMacaroon } from '../src/utils'
import { remoteHost, macaroonHex, macaroobBase64Url } from './helpers/grpc'

const { macaroon } = remoteHost

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
