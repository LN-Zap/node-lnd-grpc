import test from 'tape-promise/tape'
import LndGrpc from '../src'
import { remoteHost } from './helpers/grpc'

const { host, cert, macaroon, lndconenctString } = remoteHost
const grpcOptions = { host, cert, macaroon }

test('connect (paths)', async (t) => {
  t.plan(2)
  const grpc = new LndGrpc(grpcOptions)
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

test('connect (lndconnect)', async (t) => {
  t.plan(2)
  const grpc = new LndGrpc({ lndconnectUri: lndconenctString })
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
