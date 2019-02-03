import fs from 'fs'
import { promisify } from 'util'
import { basename, dirname, join, normalize } from 'path'
import semver from 'semver'
import createDebug from 'debug'

const debug = createDebug('lnrpc')
const fsReaddir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

export const GRPC_LOWEST_VERSION = '0.5.1-beta'
export const GRPC_HIGHEST_VERSION = '0.5.2-beta.rc3'

/**
 * Get the directory where rpc.proto files are stored.
 * @return {String} Directory where rpoc.proto files are stored.
 */
export const getProtoDir = () => {
  return join(__dirname, '..', 'proto', 'lnrpc')
}

/**
 * Get a list of all rpc.proto files that we provide.
 * @return {Promise<Array>} List of available rpc.proto files.
 */
export const getProtoFiles = async basepath => {
  basepath = basepath || getProtoDir()
  const files = await fsReaddir(basepath)
  return files.map(filename => join(basepath, filename))
}

/**
 * Get a list of all rpc.proto versions that we provide.
 * @return {Promise<Array>} List of available rpc.proto versions.
 */
export const getProtoVersions = async basepath => {
  basepath = basepath || getProtoDir()
  const files = await fsReaddir(basepath)
  return files.map(filename => basename(filename, '.proto'))
}

/**
 * Get the latest rpc.proto version that we provide.
 * @return {Promise<String>} The latest rpc.proto version that we provide.
 */
export const getLatestProtoVersion = async basepath => {
  const versions = await getProtoVersions(basepath)
  return semver.maxSatisfying(versions, `> ${GRPC_LOWEST_VERSION}`, { includePrerelease: true })
}

/**
 * Get the path to the latest rpc.proto version that we provide.
 * @return {Promise<String>} Path to the latest rpc.proto version that we provide.
 */
export const getLatestProtoFile = async basepath => {
  const latestProtoVersion = await getLatestProtoVersion(basepath)
  return join(getProtoDir(), `${latestProtoVersion}.proto`)
}

/**
 * Find the closest matching rpc.proto version based on an lnd version string.
 * @param  {[type]}  info [description]
 * @return {Promise}      [description]
 */
export const getClosestProtoVersion = async (versionString, basepath) => {
  debug('Testing version string: %s', versionString)
  let [version, commitString] = versionString.split(' ')

  debug('Parsed version string into version: %s, commitString: %s', version, commitString)

  try {
    // Extract the semver.
    const fullversionsemver = semver.clean(commitString.replace('commit=', ''))
    // Strip out the commit hash.
    version = fullversionsemver
      .split('-')
      .slice(0, 3)
      .join('-')
    // Format prerelease propely (lnd doesn't return propperly formatted semver string)
    const parse = semver.parse(version)
    parse.prerelease[0] = parse.prerelease[0].replace('-', '.')
    version = parse.format()
  } catch (e) {
    console.warn('Unable to determine exact gRPC version: %s', e)
  }
  debug('Determined semver as %s', version)

  // Get a list of all available proto files.
  const versions = await getProtoVersions(basepath)

  // Find the closest match.
  debug('Searching for closest match for version %s in range: %o', version, versions)
  const match = semver.maxSatisfying(versions, '<= ' + version, {
    includePrerelease: true,
  })
  debug('Determined closest rpc.proto match as: %s', match)

  return match
}

export default {
  getProtoDir,

  getProtoFiles,
  getProtoVersions,

  getLatestProtoFile,
  getLatestProtoVersion,

  getClosestProtoVersion,
}
