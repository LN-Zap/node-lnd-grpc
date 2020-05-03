import test from 'tape-promise/tape'
import LndGrpc from '../src'
import { spawnLnd, killLnd, grpcOptions, seed } from './helpers/lnd'

let lndProcess
let grpc

test('unlockWallet:setup', async t => {
  lndProcess = await spawnLnd({ cleanLndDir: true })
  t.end()
})

test('unlockWallet:test', async t => {
  t.plan(1)
  try {
    // Create a new node.
    grpc = new LndGrpc(grpcOptions)
    await grpc.connect()
    await grpc.services.WalletUnlocker.initWallet({
      wallet_password: Buffer.from('password'),
      cipher_seed_mnemonic: seed,
    })
    await grpc.activateLightning()
    await grpc.disconnect()
    await killLnd(lndProcess)

    // Restart lnd and try to unlock it.
    lndProcess = await spawnLnd()
    grpc = new LndGrpc(grpcOptions)
    await grpc.connect()
    await grpc.services.WalletUnlocker.unlockWallet({
      wallet_password: Buffer.from('password'),
    })
    await grpc.activateLightning()
    t.equal(grpc.state, 'active', 'should emit "active" event and be in active state')
  } catch (e) {
    await grpc.disconnect()
    await killLnd(lndProcess, { cleanLndDir: true })
    t.fail(e)
  }
})

test('unlockWallet:teardown', async t => {
  await grpc.disconnect()
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
