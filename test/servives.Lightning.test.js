import test from 'tape-promise/tape'
import { join } from 'path'
import { status } from '@grpc/grpc-js'
import LndGrpc from '../src'

const hostname = 'testnet3'

const host = `${hostname}-lnd.zaphq.io:10009`
const cert = join(__dirname, `fixtures/${hostname}`, 'tls.cert')
const macaroon = join(__dirname, `fixtures/${hostname}`, 'readonly.macaroon')

const grpcOptions = { host, cert, macaroon }

test('Lightning.invoices', async t => {
  t.plan(3)
  let grpc, call
  try {
    grpc = new LndGrpc(grpcOptions)
    await grpc.connect()
    call = grpc.services.Lightning.subscribeInvoices()
    t.equal(
      call.constructor.name,
      'ClientReadableStreamImpl',
      'Lightning.subscribeInvoices() should return a ClientReadableStreamImpl instance',
    )
    const promise = new Promise(async resolve => {
      call.on('error', function(error) {
        t.equal(error.code, status.CANCELLED, 'call.cancel() should cancel an invoice subscription stream')
        if (error.code === status.CANCELLED) {
          return resolve()
        }
      })
    })
    await grpc.services.Lightning.addInvoice({ value: 100 })
    await promise
  } catch (e) {
    t.equal(e.message, 'permission denied', 'should not allow creating an invoice with a readonly macaroon')
  }
  call && call.cancel()
  await grpc.disconnect()
})
