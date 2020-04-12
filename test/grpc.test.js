import { spawn } from 'child_process'
import test from 'tape-promise/tape'
import sinon from 'sinon'
import { join } from 'path'
import { getMacaroon } from '../src/utils'
import LndGrpc from '../src'
import { onion, delay } from '../src/utils'
import { remoteHost, macaroonHex, macaroobBase64Url } from './helpers/grpc'

const { host, cert, macaroon, lndconenctString } = remoteHost
const grpcOptions = { host, cert, macaroon }

test('initialize', t => {
  sinon.restore()
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
  sinon.restore()
  t.plan(3)
  const grpc = new LndGrpc(grpcOptions)
  t.equal(grpc.options.host, host, 'should extract the host')
  t.equal(grpc.options.cert, cert, 'should extract the cert')
  t.equal(grpc.options.macaroon, macaroon, 'should extract the macaroon')
})

test('constructor (lndconnect)', t => {
  sinon.restore()
  t.plan(3)
  const lndconnectUri = `lndconnect://${host}?cert=${cert}&macaroon=${macaroon}`
  const grpc = new LndGrpc({ lndconnectUri })
  t.equal(grpc.options.host, host, 'should extract the host')
  t.equal(grpc.options.cert, cert, 'should extract the cert')
  t.equal(grpc.options.macaroon, macaroon, 'should extract the macaroon')
})

test('getMacaroon (path)', async t => {
  sinon.restore()
  t.plan(1)
  const res = await getMacaroon(macaroon)
  t.equal(res, macaroonHex, 'should extract correct macaroon')
})

test('getMacaroon (base64url)', async t => {
  sinon.restore()
  t.plan(1)
  const res = await getMacaroon(macaroobBase64Url)
  t.equal(res, macaroonHex, 'should extract correct macaroon')
})

test('connect (paths)', async t => {
  sinon.restore()
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  try {
    await grpc.connect()
    t.equal(grpc.state, 'active', 'should connect')
    await grpc.disconnect()
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test.skip('connect (lndconnect)', async t => {
  sinon.restore()
  t.plan(1)
  const grpc = new LndGrpc({ lndconnectUri: lndconenctString })
  try {
    await grpc.connect()
    t.equal(grpc.state, 'active', 'should connect')
    await grpc.disconnect()
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('ready -> connect (locked)', async t => {
  sinon.restore()
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_LOCKED')
  try {
    const stub = sinon.stub(grpc.fsm, 'activateWalletUnlocker')
    await grpc.connect()
    t.true(stub.called, 'should activate wallet unlocker')
    await grpc.disconnect()
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('ready -> connect (active)', async t => {
  sinon.restore()
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_ACTIVE')
  try {
    const stub = sinon.stub(grpc.fsm, 'activateLightning')
    await grpc.connect()
    t.true(stub.called, 'should activate lightning')
    await grpc.disconnect()
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('locked -> connect', async t => {
  sinon.restore()
  t.plan(2)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_LOCKED')
  try {
    await grpc.connect()
    await grpc.connect()
  } catch (e) {
    t.equal(e.message, 'transition is invalid in current state', 'should throw an error if called from locked state')
    t.ok(e.stack, 'error has stack')
  }
  await grpc.disconnect()
})

test('active -> connect', async t => {
  sinon.restore()
  t.plan(2)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_ACTIVE')
  try {
    await grpc.connect()
    await grpc.connect()
  } catch (e) {
    t.equal(e.message, 'transition is invalid in current state', 'should throw an error if called from active state')
    t.ok(e.stack, 'error has stack')
  }
  await grpc.disconnect()
})

test('locked -> disconnect', async t => {
  sinon.restore()
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_LOCKED')
  try {
    await grpc.connect()
    await grpc.disconnect()
    t.equal(grpc.state, 'ready', 'should switch to ready state')
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('active -> disconnect', async t => {
  sinon.restore()
  t.plan(1)
  const grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_ACTIVE')
  try {
    await grpc.connect()
    await grpc.disconnect()
    t.equal(grpc.state, 'ready', 'should switch to ready state')
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('connect (paths)', async t => {
  sinon.restore()
  const grpc = new LndGrpc(grpcOptions)
  try {
    await grpc.connect()
    t.equal(grpc.state, 'active', 'should connect')
    await grpc.disconnect()
    t.end()
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('connect (lndconnect)', async t => {
  sinon.restore()
  const grpc = new LndGrpc({ lndconnectUri: lndconenctString })
  try {
    await grpc.connect()
    t.equal(grpc.state, 'active', 'should connect')
    await grpc.disconnect()
    t.end()
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})
