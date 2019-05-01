import { spawn } from 'child_process'
import test from 'tape-promise/tape'
import sinon from 'sinon'
import { join } from 'path'
import rimraf from 'rimraf'
import LndGrpc from '../src'
import { spawnLnd, killLnd, grpcOptions, seed } from './helpers/lnd'
import { waitForFile } from '../src/utils'

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
      walletPassword: Buffer.from('password'),
      cipherSeedMnemonic: seed,
    })
    grpc.once('service.Lightning.active', async () => {
      t.equal(grpc.state, 'active', 'should emit "service.Lightning.active" event and be in active state')
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
