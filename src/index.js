import fs from 'fs'
import { promisify } from 'util'
import { basename, dirname, join, normalize } from 'path'
import semver from 'semver'
import createDebug from 'debug'

const debug = createDebug('lnrpc')
const fsReaddir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

export const GRPC_LOWEST_VERSION = '0.4.2'
export const GRPC_HIGHEST_STABLE_VERSION = '0.5.2'
export const GRPC_HIGHEST_UNSATABLE_VERSION = '0.5.1+891'

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
export const getLatestProtoVersion = async (options = {}) => {
  const versions = await getProtoVersions(options.basepath)
  if (options.includeUnstable) {
    const unstableBuilds = versions.filter(v => v.includes('+'))
    return unstableBuilds[unstableBuilds.length - 1]
  }
  const stableBuilds = versions.filter(v => !v.includes('+'))
  return semver.maxSatisfying(stableBuilds, `> ${GRPC_LOWEST_VERSION}`, { includePrerelease: true })
}

/**
 * Get the path to the latest rpc.proto version that we provide.
 * @return {Promise<String>} Path to the latest rpc.proto version that we provide.
 */
export const getLatestProtoFile = async options => {
  const latestProtoVersion = await getLatestProtoVersion(options)
  return join(getProtoDir(), `${latestProtoVersion}.proto`)
}

/**
 * Find the closest matching rpc.proto version based on an lnd version string.
 * @param  {[type]}  info [description]
 * @return {Promise}      [description]
 */
export const getClosestProtoVersion = async (versionString, options) => {
  debug('Testing version string: %s', versionString)
  let [version, commitString] = versionString.split(' ')

  debug('Parsed version string into version: %s, commitString: %s', version, commitString)

  // If this looks like a pre-release, fetch the latest unstable proto file.
  if (version.endsWith('99-beta')) {
    debug('Identified build as prerelease (version ends in 99-beta)')
    const latestMasterVersion = await getLatestProtoVersion({ includeUnstable: true })
    debug('Selecting latest unstable rpc.proto as closest version match: %s', latestMasterVersion)
    return latestMasterVersion
  }

  let parse
  try {
    // Attempt to extract a semver from the commit strig.
    const fullversionsemver = semver.clean(commitString.replace(/commit=.*v/, ''))
    debug('Cleaned commit string as', fullversionsemver)

    if (!fullversionsemver) {
      throw new Error(`Could not get version from version string "${versionString}"`)
    }

    // Strip out the commit hash.
    version = fullversionsemver
      .split('-')
      .slice(0, 3)
      .join('-')
    // Format prerelease propely (lnd doesn't return propperly formatted semver string)
    parse = semver.parse(version)

    const prerelease = parse.prerelease[0].split('-').filter(p => p !== 'beta')

    debug('Determined prerelease as %s', prerelease)

    // If the prerelease is actually a build number (is just a numberic), parse it as such.
    if (/^\d+$/.test(prerelease[0])) {
      parse.prerelease = []
      parse.build = [Number(prerelease)]
    } else {
      parse.prerelease = prerelease
    }

    parse.version = parse.format()
    version = parse.format()
  } catch (e) {
    console.warn('Unable to determine exact gRPC version: %s', e)
  }

  debug('Determined semver as %s', version)

  // Get a list of all available proto files.
  const versions = await getProtoVersions(options)

  // Strip out build metadata.
  const filteredVersions = versions.map(v => semver.parse(v).format())

  // Find the closest semver match.
  debug('Searching for closest match for version %s in range: %O', version, versions)
  let match = semver.maxSatisfying(filteredVersions, `<= ${version}`, {
    includePrerelease: true,
  })

  // If a build number is provided, find the closest matching build.
  if (parse && parse.build.length > 0) {
    const matchVersions = versions.filter(v => v.startsWith(`${version}+`))
    debug('Searching for closest build version for %s+%s', version, parse.build)
    const builds = matchVersions.map(v => Number(v.split('+')[1]))
    const closestMatch = closestLower(builds, parse.build)
    if (closestMatch > 0) {
      match = `${version}+${closestMatch}`
    }
  }

  debug('Determined closest rpc.proto match as: %s', match)

  return match
}

/**
 * Given a list of numbers, return the closests match that is lower than our target.
 */
function closestLower(arr, val) {
  const filteredArr = arr.filter(v => v <= val)
  if (filteredArr.length === 0) {
    return null
  }
  return filteredArr.reduce(function(prev, curr) {
    return Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
  })
}

export default {
  getProtoDir,

  getProtoFiles,
  getProtoVersions,

  getLatestProtoFile,
  getLatestProtoVersion,

  getClosestProtoVersion,
}
