import test from 'tape-promise/tape'
import LndGrpc from '../src'
import { spawnLnd, killLnd, grpcOptions } from './helpers/lnd'

let lndProcess
let grpc

test('genSeed:setup', async t => {
  lndProcess = await spawnLnd({ cleanLndDir: true })
  t.end()
})

test('genSeed:test', async t => {
  try {
    grpc = new LndGrpc(grpcOptions)
    await grpc.connect()
    const res = await grpc.services.WalletUnlocker.genSeed()
    t.equal(grpc.state, 'locked', 'should be in locked state')
    t.equal(res.cipher_seed_mnemonic.length, 24, 'should return 24 word seed')
    t.end()
  } catch (e) {
    await grpc.disconnect()
    await killLnd(lndProcess, { cleanLndDir: true })
    t.fail(e)
  }
})

test('genSeed:teardown', async t => {
  await grpc.disconnect()
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
