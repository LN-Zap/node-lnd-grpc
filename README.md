# lnd-grpc

[![](https://img.shields.io/badge/project-LND-blue.svg?style=flat-square)](https://github.com/lightningnetwork/lnd)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Dependency Status](https://david-dm.org/LN-Zap/node-lnd-grpc.svg?style=flat-square)](https://david-dm.org/LN-Zap/node-lnd-grpc)
[![Build Status](https://travis-ci.org/LN-Zap/node-lnd-grpc.svg?branch=master)](https://travis-ci.org/LN-Zap/node-lnd-grpc)

> Easy to use gRPC wrapper for lnd. ⚡️

This package provides and easy to use gRPC wrapper for lnd.

- Supports all lnd versions
- Supports all lnd gRPC sub services
- Automatic async/promise support
- Automatic lnd version detection
- [lndconnect](https://github.com/LN-Zap/node-lndconnect) support

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Install

Install via npm:

```
npm install lnd-grpc --save
```

Then import in your code:

```js
import LndGrpc from 'lnd-grpc'
```

## Usage

### Initialize

Create a new instance of the service using the `LndGrpc` constructor:

```js
import LndGrpc from 'lnd-grpc'

const grpc = new LndGrpc(options)
```

The constructor accepts the following options:

- **lndconnectUri** {[string]}:  
  An [lndconnect uri](https://github.com/LN-Zap/node-lndconnect) that encodes the lnd connection details (host, cert, and macaroon). If `lndconnectUri` is set it will override the `host`, `cert`, and `macaroon` properties (below)

- **host** {[string]}:  
  Hostname and port of lnd gRPC. (extracted from `lndconnectUri` if provided)

- **cert** {[string]}:  
  TLS certificate of the lnd node. This can be a path to the TLS cert or PEM ended cert data. (extracted from `lndconnectUri` if provided)

- **macaroon** {[string]}:  
  Macaroon for the lnd node. This can be a path to the macaroon file or hex encoded macaroon data. (extracted from `lndconnectUri` if provided)

- **waitForCert** {[boolean|number]}:  
  Time (ms) to wait for TLS certificate before aborting connection attempt.

  This is useful in the case where you can not guarantee that the TLS certificate exists at the time when you attempt to establish the connection.

  Set to `true` to use the default of 10 seconds.

- **waitForMacaroon** {[boolean|number]}:  
  Time (ms) to wait for macaroon before aborting connection attempt.

  This is useful in the case where you are connecting to a local node where a wallet does not already exist. After calling lnd's `initWallet` method to create a new wallet, it can take some time for lnd to initialize and create the wallet's macaroons.

  Set to `true` to use the default of 10 seconds.

- **version** {[string]}:  
  If you know which version of lnd you are connecting to in advance you can specify that here.

  By default, we use the latest proto files available when connecting to lnd. As soon as the wallet is unlocked, we call lnd's `getInfo` method in order to determine which version of lnd is running. If needed, we will reconnect using a more appropriate proto version.

- **protoDir** {[string]}:  
  Custom path to rpc proto files. [advanced](#advanced-settings)

- **grpcOptions** {[Object]}:  
  Custom gRPC options. [advanced](#advanced-settings)

**Minimal example:**

```js
new LndGrpc({
  host: 'localhost:10009',
  cert: '~/.lnd/tls.cert',
  macaroon: '~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon',
})
```

**Complete example:**

```js
new LndGrpc({
  host: 'localhost:10009',
  cert: '~/.lnd/tls.cert',
  macaroon: '~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon',
  version: '0.6.0-beta',
  waitForMacaroon: 30 * 1000, // 30 seconds
  waitForCert: true,
  protoDir: '~/path/to/proto/files', // useful when running in electron environment, for example
})
```

### Connect

After initializing a new `LndGrpc` instance, call its `connect` method to establish a connection to lnd.

```js
const grpc = new LndGrpc({ host, cert, macaroon })
await grpc.connect()

console.log(grpc.state) // active|locked
```

After establishing a connection you can access all available lnd gRPC interfaces under the `services` property.

### Unlock & Activate

If the wallet state was determined to be `locked` when the connection was established you must first unlock the wallet and then activate the Lightning service in order to access methods on the Lightnig service or any other grpc subservice that requires the node to be unlocked.

```js
const { WalletUnlocker } = grpc.services
if (grpc.state === 'locked') {
  await WalletUnlocker.unlockWallet({ wallet_password: Buffer.from('your wallet password') })
  await grpc.activateLightning()

  console.log(grpc.state) // active
}
```

### Disconnect

Disconnect from all gRPC services. It's important to disconnect from the lnd node once you have finished using it. This will free up any open handles that could prevent your application from properly closing.

```js
await grpc.disconnect()
```

### Complete Example

```js
import LndGrpc from 'lnd-grpc'

const grpc = new LndGrpc({
  host: 'localhost:10009',
  cert: '~/.lnd/tls.cert',
  macaroon: '~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon',
  waitForCert: true,
  waitForMacaroon: true,
})

// Establish a connection.
await grpc.connect()

// Do something cool if we detect that the wallet is locked.
grpc.on(`locked`, () => console.log('wallet locked!'))

// Do something cool when the wallet gets unlocked.
grpc.on(`active`, () => console.log('wallet unlocked!'))

// Do something cool when the connection gets disconnected.
grpc.on(`disconnected`, () => console.log('disconnected from lnd!'))

// Check if the wallet is locked and unlock if needed.
if (grpc.state === 'locked') {
  const { WalletUnlocker } = grpc.services
  await WalletUnlocker.unlockWallet({
    wallet_password: Buffer.from('mypassword'),
  })
  // After unlocking the wallet, activate the Lightning service and all of it's subservices.
  await WalletUnlocker.activateLightning()
}

// Make some api calls...
const { Lightning, Autopilot, Invoices } = grpc.services
// Fetch current balance.
const balance = await Lightning.walletBalance()
// Enable autopilot.
const modifyStatusRes = await Autopilot.modifyStatus({ enable: true })
// Cancel an invoice.
const cancelInvoiceRes = await Invoices.cancelInvoice({
  payment_hash: '3bba3a6cdbd601dbf096784115f45d314c0f51ffb69ae6d338e229cb825afbe1',
})

// Disconnect from all services.
await grpc.disconnect()
```

### States

The grpc service will be in one of the following states at all times.

**ready**

The `ready` state is the initial state of all new lnd-grpc service instances and indicates that a connection has not yet been established.

**locked**

The `locked` state indicates that a connection has been established and the node was last known to be in a locked state.

**active**

The `active` state indicates that a connection has been established and the node was last known to be in an active (unlocked) state.

### Events

**locked**

The `locked` event is emitted when it has been determined that the wallet is locked and the `WalletUnlocker` interface is active.

**active**

The `active` event is emitted when it has been determined that the wallet is unlocked and the `Lightning` interface is active.

**disconnected**

The `disconnected` event is emitted after calling `disconnect`, once the connection has been fully closed.

### Helpers

**is**

Checks wether the service is in a given state.

Example:

```js
assert(grpc.is('active')) // test wether the service state is active.
```

**can**

Checks wether the service can carry out a given state transition.

Example:

```js
assert(grpc.can('activateLightning')) // test wether the service can activate the lightning service
```

**waitForState**

Wait for the service to enter a particular state.

Example:

```js
await grpc.waitForState('active')
console.log(grpc.state) // active
```

### Advanced settings

**gRPC Options**
x
Under the hood we use the [`grpc-js`](https://github.com/grpc/grpc-node/tree/master/packages/grpc-js) library for the gRPC handling. By default we use the following options to control its behaviour.

```js
{
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
}
```

(Note: when dealing with channel IDs and other fields that can exceed JavaScript's Number.MAX_SAFE_INTEGER, loss of precision can occur. This can be avoided by using `longs: String` on the above gRPC options and dealing with `String`s instead of `Number`s.)

These settings can be overridden by passing `grpcOptions` to the constructor. Custom settings will be merged in with the above defaults.

```js
new LndGrpc({
  host: 'localhost:10009',
  grpcOptions: {
    keepCase: false,
  },
})
```

**gRPC Proto Files**

This repository hosts a copy of the lnd gRPC proto files for all official lnd releases. We attempt to select the most appropriate version of these files when connecting by calling lnd's `getInfo` method and parsing the version string.

In some situations you may want to load these files from an alternate location - such as in an Electron environment where you may need to bundle up the proto files as additional package resources for distribution. You can tell us to read the proto files from an alternate location by passing the `protoDir` option to the constructor.

### Testing

Run the tests suite:

```bash
  npm test
```

Run with debugging output on:

```bash
DEBUG=lnrpc* npm test
```

## Maintainers

[@Tom Kirkpatrick (mrfelton)](https://github.com/mrfelton).

## Contribute

Feel free to dive in! [Open an issue](https://github.com/LN-Zap/node-lnd-grpc/issues/new) or submit PRs.

lnd-grpc follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## License

[MIT](LICENSE) © Tom Kirkpatrick
