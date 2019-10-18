import child from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import grpc from 'grpc'
import createDebug from 'debug'
import getPort from 'get-port'

const debug = createDebug('lnrpc:tor')
const debugTor = createDebug('lnrpc:torproc')

export default function tor({ cwd } = {}) {
  let proc = null

  /**
   * start - Start Tor tunnel service.
   * @param  {object}  settings Settings
   * @param  {string}  settings.datadir Data dir
   *
   * @return {Promise} Promise that resolves once the service is ready to use
   */
  const start = async () => {
    if (proc) {
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
      HeartbeatPeriod: '30 minutes',
      NumEntryGuards: 10,
    }

    debug('Starting tor with settings: %o', settings)

    const torrc = Object.entries(settings).reduce((acc, [key, value]) => {
      return (acc += `${key} ${value}\n`)
    }, '')
    fs.writeFileSync(torrcpath, torrc)
    debug('Generated torrc at %s:\n%s', torrcpath, torrc)

    process.env.http_proxy = `http://${httpTunnelPort}`
    debug('Setting http_proxy as: %s', process.env.http_proxy)

    proc = child.spawn('tor', ['-f', torrcpath], { cwd: datadir })
    debug('Started tor process with pid: %s', proc.pid)

    process.on('exit', () => {
      proc.kill()
    })
    process.on('uncaughtException', () => {
      proc.kill()
    })

    return new Promise((resolve, reject) => {
      proc.stdout.on('data', data => {
        debugTor(data.toString().trim())
        if (data.toString().indexOf('Bootstrapped 100%') !== -1) {
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
    if (proc) {
      debug('Stopping tor with pid: %o', proc.pid)
      proc.kill()
      return new Promise((resolve, reject) => {
        proc.on('close', () => {
          resolve()
        })
      })
    }
  }

  return {
    start,
    stop,
  }
}
