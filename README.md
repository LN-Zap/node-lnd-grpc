# lnd-grpc

[![](https://img.shields.io/badge/project-LND-blue.svg?style=flat-square)](https://github.com/lightningnetwork/lnd)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Dependency Status](https://david-dm.org/LN-Zap/lnd-grpc.svg?style=flat-square)](https://david-dm.org/LN-Zap/lnd-grpc)
[![Build Status](https://travis-ci.org/LN-Zap/lnd-grpc.svg?branch=master)](https://travis-ci.org/LN-Zap/lnd-grpc)

> Repository of lnd rpc protocol files and utilities for working with them ⚡️

This package provides utilities for locating and selecting lnd rpc protocol files.

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

**getProtoDir():**

Get the directory where rpc.proto files are stored.

**async getProtoFiles():**

Get a list of all rpc.proto files that we provide.

**async getProtoVersions():**

Get a list of all rpc.proto versions that we provide.

**async getLatestProtoVersion():**

Get the latest rpc.proto version that we provide.

**async getLatestProtoFile():**

Get the path to the latest rpc.proto version that we provide.

**async getClosestProtoVersion(version):**

Find the closest matching rpc.proto version based on an lnd version string.

```js
const version = await getClosestProtoVersion('0.5.1-beta commit=v0.5.2-beta-rc3')
expect(version).to.equal('0.5.2-beta.rc3')
```

### Testing

Run the tests suite:

```bash
  npm test
```

## Maintainers

[@Tom Kirkpatrick (mrfelton)](https://github.com/mrfelton).

## Contribute

Feel free to dive in! [Open an issue](https://github.com/LN-Zap/lnd-grpc/issues/new) or submit PRs.

lnd-grpc follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## License

[MIT](LICENSE) © Tom Kirkpatrick
