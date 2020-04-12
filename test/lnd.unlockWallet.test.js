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
    grpc = new LndGrpc(grpcOptions)
    await grpc.connect()
    await grpc.services.WalletUnlocker.initWallet({
      wallet_password: Buffer.from('password'),
      cipher_seed_mnemonic: seed,
    })
    grpc.activateLightning()
    grpc.once('active', async () => {
      try {
        await grpc.disconnect()
        await killLnd(lndProcess)
        lndProcess = await spawnLnd()
        grpc = new LndGrpc(grpcOptions)
        await grpc.connect()

        await grpc.services.WalletUnlocker.unlockWallet({
          wallet_password: Buffer.from('password'),
        })
        grpc.activateLightning()
        grpc.once('active', async () => {
          t.equal(grpc.state, 'active', 'should emit "active" event and be in active state')
        })
      } catch (e) {
        await grpc.disconnect()
        await killLnd(lndProcess, { cleanLndDir: true })
        t.fail(e)
      }
    })
  } catch (e) {
    t.fail(e)
  }
})

test('unlockWallet:teardown', async t => {
  await grpc.disconnect()
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
