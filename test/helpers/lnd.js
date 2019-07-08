import assert from 'assert'
import { join, resolve } from 'path'
import { spawn } from 'child_process'
import rimraf from 'rimraf'
import { extensions } from 'lnd-binary'
import split2 from 'split2'

export const lndBinPath = resolve('node_modules/lnd-binary/vendor', 'lnd' + extensions.getBinaryFileExtension())

export const lndDir = join(__dirname, '../data/lnd')

export const spawnLnd = (options = {}) => {
  if (options.cleanLndDir && lndDir) {
    rimraf.sync(lndDir)
  }

  const process = spawn(lndBinPath, [
    `--lnddir=${lndDir}`,
    '--bitcoin.active',
    '--bitcoin.testnet',
    '--bitcoin.node=neutrino',
    '--neutrino.connect=testnet3-btcd.zaphq.io',
    // '--noseedbackup',
    // '--notls=1',
  ])

  // Listen for when neutrino prints data to stderr.
  process.stderr.pipe(split2()).on('data', line => {
    console.error(line)
  })

  // Listen for when neutrino prints data to stdout.
  process.stdout.pipe(split2()).on('data', line => {
    console.info(line)
  })

  return process
}

export const killLnd = async (lndProcess, options = {}) => {
  return new Promise((resolve, reject) => {
    lndProcess.on('exit', () => {
      if (options.cleanLndDir && lndDir) {
        rimraf.sync(lndDir)
      }
      resolve()
    })
    lndProcess.kill('SIGKILL')
  })
}

export const host = 'localhost:10009'

export const cert = join(lndDir, 'tls.cert')

export const macaroon = join(lndDir, 'data/chain/bitcoin/testnet/', 'admin.macaroon')

export const grpcOptions = { host, cert, macaroon, waitForCert: true, waitForMacaroon: true }

export const seed = [
  'abandon',
  'quick',
  'wing',
  'require',
  'monkey',
  'weather',
  'wrap',
  'child',
  'awake',
  'tooth',
  'tortoise',
  'lawsuit',
  'task',
  'stable',
  'number',
  'wash',
  'stuff',
  'other',
  'advice',
  'report',
  'mother',
  'session',
  'left',
  'ask',
]
