import fs from 'fs'
import { promisify } from 'util'
import { basename, dirname, join, normalize } from 'path'
import semver from 'semver'
import createDebug from 'debug'
import registry from '../registry'

const debug = createDebug('lnrpc:proto')

const fsReaddir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

export const GRPC_LOWEST_VERSION = '0.4.2-beta'
export const GRPC_HIGHEST_STABLE_VERSION = '0.9.0-beta'

/**
 * Get the directory where rpc.proto files are stored.
 * @return {String} Directory where rpoc.proto files are stored.
 */
export const getProtoDir = () => {
  return join(__dirname, '..', '..', 'proto')
}

/**
 * Get a list of all rpc.proto versions that we provide.
 * @return {Promise<Array>} List of available rpc.proto versions.
 */
export const getProtoVersions = () => {
  return Object.keys(registry)
}

/**
 * Get the latest rpc.proto version that we provide.
 * @return {Promise<String>} The latest rpc.proto version that we provide.
 */
export const getLatestProtoVersion = () => {
  const versions = getProtoVersions()
  return semver.maxSatisfying(versions, `> ${GRPC_LOWEST_VERSION}`, { includePrerelease: true })
}

/**
 * Find the closest supported rpc.proto version based on an lnd version string.
 * @param  {[type]}  info [description]
 * @return {Promise}      [description]
 */
export const getClosestProtoVersion = async versionString => {
  debug('Testing version string: %s', versionString)
  let [version, commitString] = versionString.split(' ')

  debug('Parsed version string into version: %s, commitString: %s', version, commitString)

  // If this looks like a pre-release.
  if (version.endsWith('99-beta')) {
    throw new Error(`Unsupported prerelease version: ${versionString}`)
  }

  const supportedVersions = getProtoVersions()
  debug('Searching for closest match for version %s in range: %o', version, supportedVersions)

  let match = semver.maxSatisfying(supportedVersions, `<= ${version}`, {
    includePrerelease: true,
  })

  debug('Determined closest rpc.proto match as: %s', match)

  return match
}

export default {
  getProtoDir,
  getProtoVersions,
  getLatestProtoVersion,
  getClosestProtoVersion,
}
