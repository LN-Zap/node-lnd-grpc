import test from 'tape-promise/tape'
import { status } from '@grpc/grpc-js'
import LndGrpc from '../src'
import { spawnLnd, killLnd, grpcOptions, seed } from './helpers/lnd'

let lndProcess
let grpc

test('Lightning.invoices:setup', async (t) => {
  lndProcess = await spawnLnd({ cleanLndDir: true })
  t.end()
})

test('Lightning.invoices', async (t) => {
  grpc = new LndGrpc(grpcOptions)
  await grpc.connect()
  await grpc.services.WalletUnlocker.initWallet({
    wallet_password: Buffer.from('password'),
    cipher_seed_mnemonic: seed,
  })
  await grpc.activateLightning()

  // Subscribe to invoice stream.
  const call = grpc.services.Lightning.subscribeInvoices()

  t.equal(
    call.constructor.name,
    'ClientReadableStreamImpl',
    'Lightning.subscribeInvoices() should return a ClientReadableStreamImpl instance',
  )

  // Add invoice stream listeners.
  const promise = new Promise(async (resolve) => {
    call.on('data', function (data) {
      t.equal(data.value, 100, 'should create an invoice')
    })
    call.on('error', function (error) {
      t.equal(error.code, status.CANCELLED, 'call.cancel() should cancel an invoice subscription stream')
      if (error.code === status.CANCELLED) {
        return resolve()
      }
    })
  })

  call && call.cancel()
  await promise
  t.end()
})

test('Lightning.invoices:teardown', async (t) => {
  await grpc.disconnect()
  await killLnd(lndProcess, { cleanLndDir: true })
  t.end()
})
