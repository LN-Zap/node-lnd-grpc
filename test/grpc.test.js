import { spawn } from 'child_process'
import test from 'tape-promise/tape'
import sinon from 'sinon'
import { join } from 'path'
import { getMacaroon } from '../src/utils'
import LndGrpc from '../src'

const hostname = 'testnet3'

const host = `${hostname}-lnd.zaphq.io:10009`
const cert = join(__dirname, `fixtures/${hostname}`, 'tls.cert')
const macaroon = join(__dirname, `fixtures/${hostname}`, 'readonly.macaroon')

const macaroonHex =
  '0201036c6e64028a01030a10fdc5291462aa17bfb06c14bcf7f7bed91201301a0f0a07616464726573731204726561641a0c0a04696e666f1204726561641a100a08696e766f696365731204726561641a0f0a076d6573736167651204726561641a100a086f6666636861696e1204726561641a0f0a076f6e636861696e1204726561641a0d0a0570656572731204726561640000062034557af5357d8c387e0690766d9f74e8e32ff0134ab8ae8d45783c9569a8f2eb'
const macaroobBase64Url =
  'AgEDbG5kAooBAwoQ_cUpFGKqF7-wbBS89_e-2RIBMBoPCgdhZGRyZXNzEgRyZWFkGgwKBGluZm8SBHJlYWQaEAoIaW52b2ljZXMSBHJlYWQaDwoHbWVzc2FnZRIEcmVhZBoQCghvZmZjaGFpbhIEcmVhZBoPCgdvbmNoYWluEgRyZWFkGg0KBXBlZXJzEgRyZWFkAAAGIDRVevU1fYw4fgaQdm2fdOjjL_ATSriujUV4PJVpqPLr'

const lndconenctString =
  'lndconnect://testnet3-lnd.zaphq.io:10009?cert=MIICWTCCAf-gAwIBAgIQRXuRlE6-Zuy4yrwbYMLxNzAKBggqhkjOPQQDAjA-MR8wHQYDVQQKExZsbmQgYXV0b2dlbmVyYXRlZCBjZXJ0MRswGQYDVQQDExJ6YXAtdGVzdG5ldDMtbG5kLTAwHhcNMTkxMDIzMDgzNDI0WhcNMjAxMjE3MDgzNDI0WjA-MR8wHQYDVQQKExZsbmQgYXV0b2dlbmVyYXRlZCBjZXJ0MRswGQYDVQQDExJ6YXAtdGVzdG5ldDMtbG5kLTAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQKjGf1L6Gs8EoZv71_fCcAIKGsROUgUdyLAj97vWlUNfMrPKVfPzQZT3PODMW1b6JjeFRmbd0cw29CsCL4TWNuo4HeMIHbMA4GA1UdDwEB_wQEAwICpDAPBgNVHRMBAf8EBTADAQH_MIG3BgNVHREEga8wgayCEnphcC10ZXN0bmV0My1sbmQtMIIJbG9jYWxob3N0ghV0ZXN0bmV0My1sbmQuemFwaHEuaW-CPnphcG16eW1iZGRuMnJ5bzJodnM2MjZkZ25kaHNzdDVkZnA2cHMzY3RmdTNibmx4aW12cGFscGlkLm9uaW9uggR1bml4ggp1bml4cGFja2V0hwR_AAABhxAAAAAAAAAAAAAAAAAAAAABhwQKNANkhwQiSfzkMAoGCCqGSM49BAMCA0gAMEUCIQCxf0iirNjQlGfpAtmKEWko3YHVQQFFfZhLJ71u9Y_bSwIgJFKGK-35kvJQQWZcKiyBZn1yDZfaLBNAoJXFidfIdts&macaroon=AgEDbG5kAooBAwoQ_cUpFGKqF7-wbBS89_e-2RIBMBoPCgdhZGRyZXNzEgRyZWFkGgwKBGluZm8SBHJlYWQaEAoIaW52b2ljZXMSBHJlYWQaDwoHbWVzc2FnZRIEcmVhZBoQCghvZmZjaGFpbhIEcmVhZBoPCgdvbmNoYWluEgRyZWFkGg0KBXBlZXJzEgRyZWFkAAAGIDRVevU1fYw4fgaQdm2fdOjjL_ATSriujUV4PJVpqPLr'

const grpcOptions = { host, cert, macaroon }

test('initialize', t => {
  t.plan(14)
  const grpc = new LndGrpc(grpcOptions)
  t.equal(grpc.state, 'ready', 'should start in the ready state')
  t.equal(grpc.can('activateWalletUnlocker'), true, 'can activateWalletUnlocker')
  t.equal(grpc.can('activateLightning'), true, 'can activateLightning')
  t.equal(grpc.can('disconnect'), false, 'can not disconnect')
  t.equal(grpc.options, grpcOptions, 'should store constructor options on the options property')
  t.true(grpc.services, 'should have a services property')
  t.true(grpc.services.WalletUnlocker, `should have WalletUnlocker service`)
  t.true(grpc.services.Lightning, `should have Lightning service`)
  t.true(grpc.services.Autopilot, `should have Autopilot service`)
  t.true(grpc.services.ChainNotifier, `should have ChainNotifier service`)
  t.true(grpc.services.Invoices, `should have Invoices service`)
  t.true(grpc.services.Router, `should have Router service`)
  t.true(grpc.services.Signer, `should have Signer service`)
  t.true(grpc.services.WalletKit, `should have WalletKit service`)
})

test('constructor (paths)', t => {
  t.plan(3)
  const grpc = new LndGrpc(grpcOptions)
  t.equal(grpc.options.host, host, 'should extract the host')
  t.equal(grpc.options.cert, cert, 'should extract the cert')
  t.equal(grpc.options.macaroon, macaroon, 'should extract the macaroon')
})

test('constructor (lndconnect)', t => {
  t.plan(3)
  const lndconnectUri = `lndconnect://${host}?cert=${cert}&macaroon=${macaroon}`
  const grpc = new LndGrpc({ lndconnectUri })
  t.equal(grpc.options.host, host, 'should extract the host')
  t.equal(grpc.options.cert, cert, 'should extract the cert')
  t.equal(grpc.options.macaroon, macaroon, 'should extract the macaroon')
})

test('getMacaroon (path)', async t => {
  t.plan(1)
  const res = await getMacaroon(macaroon)
  t.equal(res, macaroonHex, 'should extract correct macaroon')
})

test('getMacaroon (base64url)', async t => {
  t.plan(1)
  const res = await getMacaroon(macaroobBase64Url)
  t.equal(res, macaroonHex, 'should extract correct macaroon')
})

test('connect (paths)', async t => {
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  await grpc.connect()
  t.equal(grpc.state, 'active', 'should connect')
})

test('connect (lndconnect)', async t => {
  t.plan(1)
  const grpc = new LndGrpc({ lndconnectUri: lndconenctString })
  await grpc.connect()
  t.equal(grpc.state, 'active', 'should connect')
})

test('ready -> connect (locked)', async t => {
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_LOCKED')
  const stub = sinon.stub(grpc.fsm, 'activateWalletUnlocker')
  await grpc.connect()
  t.true(stub.called, 'should activate wallet unlocker')
})

test('ready -> connect (active)', async t => {
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_ACTIVE')
  const stub = sinon.stub(grpc.fsm, 'activateLightning')
  await grpc.connect()
  t.true(stub.called, 'should activate lightning')
})

test('locked -> connect', async t => {
  t.plan(2)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_LOCKED')
  await grpc.connect()
  try {
    await grpc.connect()
  } catch (e) {
    t.equal(e.message, 'transition is invalid in current state', 'should throw an error if called from locked state')
    t.ok(e.stack, 'error has stack')
  }
})

test('active -> connect', async t => {
  t.plan(2)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_ACTIVE')
  await grpc.connect()
  try {
    await grpc.connect()
  } catch (e) {
    t.equal(e.message, 'transition is invalid in current state', 'should throw an error if called from active state')
    t.ok(e.stack, 'error has stack')
  }
})

test('locked -> disconnect', async t => {
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_LOCKED')
  await grpc.connect()
  await grpc.disconnect()
  t.equal(grpc.state, 'ready', 'should switch to ready state')
})

test('active -> disconnect', async t => {
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_ACTIVE')
  await grpc.connect()
  await grpc.disconnect()
  t.equal(grpc.state, 'ready', 'should switch to ready state')
})

test('ready -> disconnect', async t => {
  t.plan(2)
  try {
    const grpc = new LndGrpc(grpcOptions)
    await grpc.disconnect()
  } catch (e) {
    t.equal(e.message, 'transition is invalid in current state', 'should throw an error if called from ready state')
    t.ok(e.stack, 'error has stack')
  }
})
