import test from 'tape-promise/tape'
import LndGrpc from '../src'
import { seed, host, cert, macaroon, spawnLnd, killLnd, grpcOptions } from './helpers/lnd'
import { format, encodeCert, encodeMacaroon } from 'lndconnect'
import fs from 'fs'
const readFileSync = fs.readFileSync

let lndProcess
let grpc

test('connect.lndconnect:setup', async (t) => {
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

test('connect.lndconnect', async (t) => {
  t.plan(2)

  const lndconenctString = format({
    host,
    cert: encodeCert(readFileSync(cert)),
    macaroon: encodeMacaroon(readFileSync(macaroon)),
  })

  grpc = new LndGrpc({ lndconnectUri: lndconenctString })
  try {
    await grpc.connect()
    t.equal(grpc.state, 'active', 'should connect')
    await grpc.disconnect()
    t.equal(grpc.state, 'ready', 'should disconnect')
  } catch (e) {
    await grpc.disconnect()
    t.fail(e)
  }
})

test('connect.lndconnect:teardown', async (t) => {
  await grpc.disconnect()
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
