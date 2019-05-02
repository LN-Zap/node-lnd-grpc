# lnd-grpc

[![](https://img.shields.io/badge/project-LND-blue.svg?style=flat-square)](https://github.com/lightningnetwork/lnd)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Dependency Status](https://david-dm.org/LN-Zap/lnd-grpc.svg?style=flat-square)](https://david-dm.org/LN-Zap/lnd-grpc)
[![Build Status](https://travis-ci.org/LN-Zap/lnd-grpc.svg?branch=master)](https://travis-ci.org/LN-Zap/lnd-grpc)

> Easy to use gRPC wrapper for lnd. ⚡️

This package provides and easy to use gRPC wrapper for lnd.

- Supports all lnd versions
- Supports all lnd gRPC sub services
- Async/Promise support
- Automatic lnd version detection
- lndconnect support

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

- **host {string}:**  
  Hostname and port of lnd gRPC.

- **cert {[string]}:**  
  TLS certificate of the lnd node. This can be a path to the TLS cert or PEM ended cert data.

- **macaroon {[string]}:**  
  Macaroon for the lnd node. This can be a path to the macaroon file or hex encoded macaroon data.

- **waitForCert {[boolean|number]}:**  
  Time (ms) to wait for TLS certificate before aborting connection attempt.

  This is useful in the case where you can not guarantee that the TLS certificate exists at the time when you attempt to establish the connection.

  Set to `true` to use the default of 10 seconds.

- **waitForMacaroon {[boolean|number]}:**  
  Time (ms) to wait for macaroon before aborting connection attempt.

  This is useful in the case where you are connecting to a local node where a wallet does not already exist. After calling lnd's `initWallet` method to create a new wallet, it can take some time for lnd to initialize and create the wallet's macaroons.

  Set to `true` to use the default of 10 seconds.

- **version {[string]}:**  
  If you know which version of lnd you are connecting to in advance you can specify that here.

  By default, we use the latest proto files available when connecting to lnd. As soon as the wallet is unlocked, we call lnd's `getInfo` method in order to determine which version of lnd is running. If needed, we will reconnect using a more appropriate proto version.

- **protoDir {[string]}:**  
  Custom path to rpc proto files. [advanced](#advanced-settings)

- **grpcOptions {[Object]}:**  
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

After successfully connecting, `state` will be set to one of the following, depending on the state of the node that you are connecting to:

- `locked`: The node is locked (`WalletUnlocker` interface is active).
- `active`: The node is unlocked (All other interfaces are active).

After establishing a connection you can access all available lnd gRPC interfaces under the `services` property.

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
grpc.on(`service.WalletUnlocker.active`, () => console.log('wallet locked!'))

// Do something cool when the wallet gets unlocked.
grpc.on(`service.Lightning.active`, () => console.log('wallet unlocked!'))

// Do something cool when the connection gets disconnected.
grpc.on(`disconnected`, () => console.log('disconnected from lnd!'))

// Check if the wallet is locked and unlock if needed.
if (grpc.state === 'locked') {
  const { WalletUnlocker } = grpc.services
  await WalletUnlocker.unlockWallet({
    wallet_password: Buffer.from('mypassword'),
  })
}

// Make some api calls.
const { Lightning } = grpc.services
const info = await Lightning.getInfo()
const balance = await Lightning.walletBalance()

// Disconnect from all services.
await grpc.disconnect()
```

### Events

**Event: 'service.WalletUnlocker.active'**

The `service.WalletUnlocker.active` event is emitted when it has been determined that the wallet is locked and the `WalletUnlocker` interface is active.

**Event: 'service.Lightning.active'**

The `service.Lightning.active` event is emitted when it has been determined that the wallet is unlocked and the `Lightning` interface is active.

**Event: 'disconnected'**

The `disconnected` event is emitted after calling `disconnect`, once the connection has been fully closed.

### Advanced settings

**gRPC Options**

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
