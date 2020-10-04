import fs from 'fs'
import { promisify } from 'util'
import { basename } from 'path'
import untildify from 'untildify'
import decodeMacaroon from 'lndconnect/decodeMacaroon'
import { credentials, Metadata } from '@grpc/grpc-js'

const readFile = promisify(fs.readFile)

/**
 * Extract macaroon hex from various sources.
 * @param {String} macaroonPath
 * @returns {String} Hex encoded macaroon.
 */
export const getMacaroon = async (macaroonPath) => {
  let lndMacaroon

  if (macaroonPath) {
    // If the macaroon is already in hex format, add as is.
    const isHex = /^[0-9a-fA-F]+$/.test(macaroonPath)
    if (isHex) {
      lndMacaroon = macaroonPath
    }
    // If it's not a filepath, then assume it is a base64url encoded string.
    else if (macaroonPath === basename(macaroonPath)) {
      lndMacaroon = decodeMacaroon(macaroonPath)
    }
    // Otherwise, treat it as a file path - load the file and convert to hex.
    else {
      const macaroon = await readFile(untildify(macaroonPath)).catch((e) => {
        const error = new Error(`Macaroon path could not be accessed: ${e.message}`)
        error.code = 'LND_GRPC_MACAROON_ERROR'
        throw error
      })
      lndMacaroon = macaroon.toString('hex')
    }
  }

  return lndMacaroon
}

/**
 * Validates and creates the macaroon authorization credentials from the specified file path
 * @param {String} macaroonPath
 * @returns {grpc.CallCredentials}
 */
const createMacaroonCreds = async (macaroonPath) => {
  let lndMacaroon = await getMacaroon(macaroonPath)

  const metadata = new Metadata()
  metadata.add('macaroon', lndMacaroon)

  return credentials.createFromMetadataGenerator((params, callback) => callback(null, metadata))
}

export default createMacaroonCreds
