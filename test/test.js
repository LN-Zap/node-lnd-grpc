'use strict'

import path from 'path'
import semver from 'semver'
import test from 'tape-promise/tape'
import lnrpc, { GRPC_HIGHEST_STABLE_VERSION, GRPC_HIGHEST_UNSATABLE_VERSION } from '../src'

test('getProtoFiles', async t => {
  t.plan(3)
  const res = await lnrpc.getProtoFiles()
  t.equal(typeof res, 'object', 'should return an array')
  t.true(res.length > 3, 'should return multiple versions')
  t.true(res[0].includes('/proto/lnrpc/'), 'should return absolute filepaths')
})

test('getProtoVersions', async t => {
  t.plan(3)
  const res = await lnrpc.getProtoVersions()
  t.equal(typeof res, 'object', 'should return an array')
  t.true(res.length > 3, 'should return multiple versions')
  t.true(semver.valid(res[0]), 'should return valid semvers')
})

test('getLatestProtoVersion', async t => {
  t.plan(1)
  const res = await lnrpc.getLatestProtoVersion()
  t.equal(res, GRPC_HIGHEST_STABLE_VERSION, 'should return the latest known proto version')
})

test('getLatestProtoVersion (includeUnstable)', async t => {
  t.plan(1)
  const res = await lnrpc.getLatestProtoVersion({ includeUnstable: true })
  t.equal(res, GRPC_HIGHEST_UNSATABLE_VERSION, 'should return the latest known proto version')
})

test('getLatestProtoFile', async t => {
  t.plan(1)
  const res = await lnrpc.getLatestProtoFile()
  t.equal(
    res,
    path.join(__dirname, '..', 'proto', 'lnrpc', `${GRPC_HIGHEST_STABLE_VERSION}.proto`),
    'should return the full path to the latest known proto version',
  )
})

test('getLatestProtoFile (includeUnstable)', async t => {
  t.plan(1)
  const res = await lnrpc.getLatestProtoFile({ includeUnstable: true })
  t.equal(
    res,
    path.join(__dirname, '..', 'proto', 'lnrpc', `${GRPC_HIGHEST_UNSATABLE_VERSION}.proto`),
    'should return the full path to the latest known proto version',
  )
})

test('getClosestProtoVersion', async t => {
  const expectations = [
    ['0.4.2', '0.5.0-beta commit=v0.5-beta-101-g61e867741926bcb318432a6344b80161fabd1455'],
    ['0.5.1', '0.5.2-beta commit='], // Corrupt version string (from bad lnd build)
    ['0.5.1', '0.5.1-beta commit=v0.5.1-beta'],
    ['0.5.1', '0.5.1-beta commit=v0.5.1-beta-40-gfc4fe070100a66ea220a14e74f52f9c9d1550636'],
    ['0.5.1', '0.5.1-beta commit=v0.5.1-beta-215-3ed2241a94a3f8d7666678b69d4b4eebfe30c56c'],
    ['0.5.1+216', '0.5.1-beta commit=v0.5.1-beta-216-0efe5ca49d2008940dbafbe60aca5c58392adbc0'],
    ['0.5.1+216', '0.5.1-beta commit=v0.5.1-beta-217-1199f17cd90a8a276328f7580ee407d0d74f4ca5'],
    ['0.5.1+216', '0.5.1-beta commit=v0.5.1-beta-250-d151916ae16595d0c8ebca1f427bf3f4af46bdd9'],
    ['0.5.1+216', '0.5.1-beta commit=v0.5.1-beta-258-649408003d2f43f5bc1e30ab60250672786a76e5'],
    ['0.5.1+259', '0.5.1-beta commit=v0.5.1-beta-259-g237f2b6d4b5a04fece87ce8bb06290897b9c8d00 '],
    ['0.5.1+377', '0.5.1-beta commit=v0.5.1-beta-377-g5d0a371a7d23dac063dd1a3a1e52bbdaf66cbb2b'],
    ['0.5.2-rc3', '0.5.1-beta commit=v0.5.2-beta-rc3'],
    ['0.5.2-rc4', '0.5.1-beta commit=v0.5.2-beta-rc5'], // This is more recent rc the latest we have.
    [GRPC_HIGHEST_STABLE_VERSION, '0.5.2-beta commit=basedon-v0.5.2-beta-2-dirty'], // This is a build based on a branch other than master.
    [GRPC_HIGHEST_UNSATABLE_VERSION, '0.5.2-99-beta commit=queue/v1.0.1-76-gec62104accc08d22f967b03a31ca564055624886'], // This is build from a commit that exists on a branch other than master.
    [GRPC_HIGHEST_UNSATABLE_VERSION, '0.5.2-99-beta commit=queue/v1.0.1-109'], // Another random build, probably from master.
  ]

  t.plan(expectations.length)

  expectations.map(async tuple => {
    const expectation = tuple[0]
    const input = tuple[1]
    const res = await lnrpc.getClosestProtoVersion(input)
    t.equal(res, expectation, `${input} should map to ${expectation}`)
  })
})
