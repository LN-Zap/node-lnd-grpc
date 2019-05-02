import test from 'tape-promise/tape'
import LndGrpc from '../src'
import { spawnLnd, killLnd, grpcOptions, seed } from './helpers/lnd'

let lndProcess
let grpc

test('initWallet:setup', async t => {
  lndProcess = await spawnLnd({ cleanLndDir: true })
  t.end()
})

test('initWallet:test', async t => {
  t.plan(1)
  try {
    grpc = new LndGrpc(grpcOptions)
    await grpc.connect()
    grpc.services.WalletUnlocker.initWallet({
      wallet_password: Buffer.from('password'),
      cipher_seed_mnemonic: seed,
    })
    grpc.once('active', async () => {
      t.equal(grpc.state, 'active', 'should emit "active" event and be in active state')
    })
  } catch (e) {
    console.error(e)
    t.fail(e)
  }
})

test('initWallet:teardown', async t => {
  if (grpc.can('disconnect')) {
    await grpc.disconnect()
  }
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
