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
      walletPassword: Buffer.from('password'),
      cipherSeedMnemonic: seed,
    })
    grpc.once('service.Lightning.active', async () => {
      try {
        await grpc.disconnect()
        await killLnd(lndProcess)
        lndProcess = await spawnLnd()
        grpc = new LndGrpc(grpcOptions)
        await grpc.connect()
        grpc.services.WalletUnlocker.unlockWallet({
          walletPassword: Buffer.from('password'),
        })
        grpc.once('service.Lightning.active', async () => {
          t.equal(grpc.state, 'active', 'should emit "service.Lightning.active" event and be in active state')
        })
      } catch (e) {
        console.error(e)
        t.fail(e)
      }
    })
  } catch (e) {
    console.error(e)
    t.fail(e)
  }
})

test('unlockWallet:teardown', async t => {
  if (grpc.can('disconnect')) {
    await grpc.disconnect()
  }
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
