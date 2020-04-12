import test from 'tape-promise/tape'
import { join } from 'path'
import { status } from '@grpc/grpc-js'
import { remoteHost } from './helpers/grpc'
import LndGrpc from '../src'

const { host, cert, macaroon, lndconenctString } = remoteHost
const grpcOptions = { host, cert, macaroon }

let grpc

test('Lightning.invoices', async t => {
  t.plan(3)

  // Initiate connection.
  grpc = new LndGrpc(grpcOptions)
  await grpc.connect()

  // Subscribe to invoice stream.
  const call = grpc.services.Lightning.subscribeInvoices()

  t.equal(
    call.constructor.name,
    'ClientReadableStreamImpl',
    'Lightning.subscribeInvoices() should return a ClientReadableStreamImpl instance',
  )

  // Add invoice stream listeners.
  const promise = new Promise(async resolve => {
    call.on('data', function(data) {
      t.equal(data.value, 100, 'should create an invoice')
    })
    call.on('error', function(error) {
      t.equal(error.code, status.CANCELLED, 'call.cancel() should cancel an invoice subscription stream')
      if (error.code === status.CANCELLED) {
        return resolve()
      }
    })
  })

  try {
    await grpc.services.Lightning.addInvoice({ value: 100 })
    await promise
  } catch (e) {
    t.equal(e.details, 'permission denied', 'should not allow creating an invoice with a readonly macaroon')
  }
  call && call.cancel()

  await promise
})

test('Lightning.invoices:teardown', async t => {
  await grpc.disconnect()
})
