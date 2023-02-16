import test from 'tape-promise/tape'
import sinon from 'sinon'
import LndGrpc from '../src'
import { seed, host, cert, macaroon, spawnLnd, killLnd, grpcOptions } from './helpers/lnd'

let lndProcess
let grpc

test('transactions:setup', async (t) => {
  lndProcess = await spawnLnd({ cleanLndDir: true })

  grpc = new LndGrpc(grpcOptions)
  await grpc.connect()

  await grpc.services.WalletUnlocker.initWallet({
    wallet_password: Buffer.from('password'),
    cipher_seed_mnemonic: seed,
  })
  await grpc.activateLightning()
  await grpc.disconnect()

  t.end()
})

test('ready -> connect (locked)', async (t) => {
  sinon.restore()
  t.plan(1)
  grpc = new LndGrpc(grpcOptions)
  sinon.stub(grpc, 'determineWalletState').resolves('WALLET_STATE_LOCKED')
  sinon.stub(grpc, 'getWalletState').resolves('LOCKED')

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

test('ready -> connect (active)', async (t) => {
  sinon.restore()
  t.plan(1)
  grpc = new LndGrpc(grpcOptions)
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

test('locked -> connect', async (t) => {
  sinon.restore()
  t.plan(2)
  grpc = new LndGrpc(grpcOptions)
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

test('active -> connect', async (t) => {
  sinon.restore()
  t.plan(2)
  grpc = new LndGrpc(grpcOptions)
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

test('locked -> disconnect', async (t) => {
  sinon.restore()
  t.plan(1)
  grpc = new LndGrpc(grpcOptions)
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

test('active -> disconnect', async (t) => {
  sinon.restore()
  t.plan(1)
  grpc = new LndGrpc(grpcOptions)
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

test('transactions:teardown', async (t) => {
  grpc.disconnect()
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
