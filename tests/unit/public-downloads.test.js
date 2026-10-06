// Unit tests for the download-service utils: node --test (yarn test).
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  createPublicArchive,
  datasetIdOf,
  filePathOf,
  publicDownloadsBase,
  publicFileUrl,
  rememberArchive,
  rememberedArchives,
} from '../../utils/publicDownloads.js'
import { agentPublicCommand, awsCommands, createPublicSelection } from '../../utils/agentDownload.js'

function respond(status, body) {
  return mock.fn(async () => ({ status, ok: status < 400, json: async () => body }))
}

describe('publicDownloadsBase', () => {
  it('uses the anonymous host beside api2 without a token', () => {
    assert.equal(
      publicDownloadsBase({ api2Host: 'https://api2.pennsieve.io', publicHost: '' }),
      'https://downloads.pennsieve.io/public'
    )
  })

  it('uses download_public_host when set', () => {
    assert.equal(
      publicDownloadsBase({ api2Host: 'https://api2.pennsieve.io', publicHost: 'https://dl.example.org/' }),
      'https://dl.example.org/public'
    )
  })

  it('uses api2 with a token', () => {
    assert.equal(
      publicDownloadsBase({ api2Host: 'https://api2.pennsieve.io/', token: 't' }),
      'https://api2.pennsieve.io/downloads/public'
    )
  })
})

describe('download-service requests', () => {
  it('names the SPARC Portal as the client and sends no token anonymously', async () => {
    const fetchFn = respond(200, { url: 'https://s3/x' })
    const base = 'https://downloads.pennsieve.io/public'
    await publicFileUrl({ base, token: '', datasetId: '12', version: '3', path: 'files/a.txt', purpose: 'view' }, fetchFn)

    const [url, init] = fetchFn.mock.calls[0].arguments
    assert.equal(url, `${base}/files/url`)
    assert.equal(init.headers['X-Pennsieve-Client'], 'sparc-portal')
    assert.equal(init.headers.Authorization, undefined)
    assert.deepEqual(JSON.parse(init.body), { datasetId: 12, version: 3, paths: ['files/a.txt'], purpose: 'view' })
  })

  it("sends the signed-in visitor's token", async () => {
    const fetchFn = respond(200, { url: 'https://s3/x' })
    await publicFileUrl({ base: 'https://api2/downloads/public', token: 'tok', datasetId: 1, path: 'files/a.txt' }, fetchFn)
    assert.equal(fetchFn.mock.calls[0].arguments[1].headers.Authorization, 'Bearer tok')
  })

  it("sends the archive's paths and name", async () => {
    const fetchFn = respond(202, { id: 'pa_x', status: 'QUEUED' })
    await createPublicArchive(
      { base: 'https://d/public', datasetId: 1, version: 2, paths: ['files/x', 'manifest.json'], archiveName: 'mine' },
      fetchFn
    )
    assert.deepEqual(JSON.parse(fetchFn.mock.calls[0].arguments[1].body), {
      datasetId: 1,
      version: 2,
      paths: ['files/x', 'manifest.json'],
      archiveName: 'mine',
    })
  })

  it("raises download-service's message with its status", async () => {
    const fetchFn = respond(413, { message: 'too large' })
    await assert.rejects(createPublicArchive({ base: 'https://d/public', datasetId: 1 }, fetchFn), {
      status: 413,
      message: 'too large',
    })
  })

  it('saves selections as the SPARC Portal', async () => {
    const fetchFn = respond(201, { id: 'sel_1' })
    await createPublicSelection({ url: 'https://d/public/selections', datasetId: 1, version: 2, paths: ['x'] }, fetchFn)
    assert.equal(fetchFn.mock.calls[0].arguments[1].headers['X-Pennsieve-Client'], 'sparc-portal')
  })
})

describe('paths from S3 URIs', () => {
  it('prefers the path, else reads it from the S3 URI', () => {
    assert.equal(filePathOf({ path: 'files/a.xlsx' }), 'files/a.xlsx')
    assert.equal(filePathOf({ uri: 's3://prd-sparc-discover50-use1/123/files/primary/2/a.xlsx' }), 'files/primary/2/a.xlsx')
    assert.equal(filePathOf({}), '')
  })

  it('reads the dataset id after the bucket, whatever folders follow', () => {
    assert.equal(datasetIdOf({ uri: 's3://prd-sparc-discover50-use1/123/files/primary/2/a.xlsx' }), '123')
    assert.equal(datasetIdOf({}), '')
  })
})

describe('remembered archives', () => {
  it('keeps unexpired archives per dataset version', () => {
    const store = new Map()
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
    const now = Date.parse('2026-10-06T12:00:00Z')
    rememberArchive({ id: 'pa_a', datasetId: 1, version: 2, whole: true, expiresAt: '2026-10-07T00:00:00Z' }, storage, now)
    rememberArchive({ id: 'pa_b', datasetId: 1, version: 2, expiresAt: '2026-10-06T00:00:00Z' }, storage, now)
    rememberArchive({ id: 'pa_c', datasetId: 9, version: 1, expiresAt: '2026-10-07T00:00:00Z' }, storage, now)

    assert.deepEqual(rememberedArchives({ datasetId: '1', version: '2' }, storage, now).map((a) => a.id), ['pa_a'])
    assert.ok(store.has('sparc-portal.archives'))
  })
})

describe('agent and AWS commands', () => {
  it('names the version and quotes paths', () => {
    assert.equal(
      agentPublicCommand({ datasetId: 123, version: 2, paths: ['files/sub 1/a.txt'], folderName: 'Vagus: Study #1' }),
      "pennsieve download public 123 ./Vagus-Study-1 --version 2 --path 'files/sub 1/a.txt'"
    )
  })

  it('reads AWS Open Data without signing, the other buckets as requester pays', () => {
    assert.deepEqual(awsCommands({ uri: 's3://prd-sparc-aod-discover50-use1/123/', folderName: 'x' }), [
      'aws s3 sync s3://prd-sparc-aod-discover50-use1/123/ ./x --no-sign-request',
    ])
    assert.deepEqual(
      awsCommands({ uri: 's3://prd-sparc-discover50-use1/456/', items: [{ path: 'files/a.txt' }], folderName: 'x' }),
      ['aws s3 cp s3://prd-sparc-discover50-use1/456/files/a.txt ./x/files/a.txt --request-payer requester']
    )
  })
})
