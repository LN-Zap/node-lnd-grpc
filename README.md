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

```
npm install lnd-grpc --save
```

## Usage

### Connect

Instantiate a new instance of the `LndGrpc` class and then call it's `.connect()` method. The constructor can take two different forms:

#### Option 1: {host,cert,macaroon}

- `host`: host:port of lnd node to connect.
- `cert`: path to tls cert or PEM ended cert data.
- `macaroon`: path to macaroon file or hex encoded macaroon data.

```javascript
import LndGrpc from 'lnd-grpc'

const grpc = new LndGrpc({ host, cert, macaroon })
await grpc.connect()
console.log(grpc.state) // active|locked
```

#### Option 2: lndconnect uri

- `lndconnectUri`: An lndconnect uri.

```javascript
import LndGrpc from 'lnd-grpc'

const grpc = new LndGrpc(lndconnectUri)
await grpc.connect()
console.log(grpc.state) // active|locked
```

After successfully connecting, `state` will be set to one of the following, depending on the state of the node that you are connecting to:

- `locked`: The node is locked (`WalletUnlocker` interface is active).
- `active`: The node is unlocked (`Lightning` interface is active).

### Disconnect

Disconnect from all gRPC services and close out any active stream subscribers.

```javascript
await grpc.disconnect()
```

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
