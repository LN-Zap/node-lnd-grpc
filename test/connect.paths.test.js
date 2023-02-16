import test from 'tape-promise/tape'
import LndGrpc from '../src'
import { spawnLnd, killLnd, grpcOptions } from './helpers/lnd'
import { encode, format, encodeCert, encodeMacaroon } from 'lndconnect'
import fs from 'fs'
const readFileSync = fs.readFileSync

let lndProcess
let grpc

test('connect.paths:setup', async (t) => {
  lndProcess = await spawnLnd({ cleanLndDir: true })
  t.end()
})

test('connect.paths', async (t) => {
  t.plan(2)
  grpc = new LndGrpc(grpcOptions)
  try {
    await grpc.connect()
    t.equal(grpc.state, 'locked', 'should connect')
    await grpc.disconnect()
    t.equal(grpc.state, 'ready', 'should disconnect')
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('connect.paths:teardown', async (t) => {
  grpc.disconnect()
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
