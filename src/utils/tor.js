import child from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import createDebug from 'debug'
import getPort from 'get-port'
import delay from './delay'
import { TOR_WAIT_TIMEOUT } from './constants'

const debug = createDebug('lnrpc:tor')
const debugTor = createDebug('lnrpc:torproc')

export default function tor({ cwd } = {}) {
  let proc = null

  const isStarted = () => Boolean(proc && proc.pid)

  /**
   * start - Start Tor tunnel service.
   * @param  {object}  settings Settings
   * @param  {string}  settings.datadir Data dir
   *
   * @return {Promise} Promise that resolves once the service is ready to use
   */
  const start = async () => {
    if (isStarted()) {
      throw new Error('Tor is already already running')
    }

    const datadir = cwd || fs.mkdtempSync(path.join(os.tmpdir(), 'lnd-grpc-'))
    const torrcpath = path.join(datadir, 'torrc')
    const datapath = path.join(datadir, 'data')
    const host = '127.0.0.1'
    const port = await getPort({ host, port: getPort.makeRange(9065, 9999) })
    const httpTunnelPort = `${host}:${port}`

    const settings = {
      DataDirectory: datapath,
      HTTPTunnelPort: httpTunnelPort,
      SocksPort: 0,
    }

    debug('Starting tor with settings: %o', settings)

    const torrc = Object.entries(settings).reduce((acc, [key, value]) => {
      return (acc += `${key} ${value}\n`)
    }, '')
    fs.writeFileSync(torrcpath, torrc)
    debug('Generated torrc at %s:\n%s', torrcpath, torrc)

    process.env.grpc_proxy = `http://${httpTunnelPort}`
    debug('Setting grpc_proxy as: %s', process.env.grpc_proxy)

    proc = child.spawn('tor', ['-f', torrcpath], { cwd: datadir })
    debug('Started tor process with pid: %s', proc.pid)

    process.on('exit', () => {
      proc.kill()
    })
    process.on('uncaughtException', () => {
      proc.kill()
    })

    return new Promise((resolve, reject) => {
      proc.stdout.on('data', async (data) => {
        debugTor(data.toString().trim())
        if (data.toString().indexOf('Bootstrapped 100%') !== -1) {
          await delay(TOR_WAIT_TIMEOUT)
          resolve(true)
        }
        if (data.toString().indexOf('[error]') !== -1) {
          reject(data.toString())
        }
      })
    })
  }

  /**
   * Stop Tor service.
   */
  const stop = async () => {
    if (isStarted()) {
      debug('Stopping tor with pid: %o', proc.pid)

      const waitForExit = new Promise((resolve, reject) => {
        proc.on('exit', () => {
          debug('Stopped tor with pid: %o', proc.pid)
          delete process.env.grpc_proxy
          resolve()
        })
      })

      proc.kill('SIGKILL')
      return waitForExit
    }
  }

  return {
    start,
    stop,
    isStarted,
  }
}
