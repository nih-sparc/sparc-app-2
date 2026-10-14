import { test } from 'node:test'
import assert from 'node:assert/strict'
import { needsIsolation, supportsCredentialless } from '../../utils/crossOriginIsolation.js'

test('isolates the routes that host SimulationVuer', () => {
  assert.equal(needsIsolation('/apps/maps'), true)
  assert.equal(needsIsolation('/apps/maps?type=ac'), true)
  assert.equal(needsIsolation('/datasets/simulationviewer'), true)
  assert.equal(needsIsolation('/datasets/file/135/8?path=files/primary/simulation.omex'), true)
  assert.equal(needsIsolation(new URL('https://sparc.science/datasets/file/135/8?path=files%2Fprimary%2Fsimulation.OMEX')), true)
})

test('does not isolate other routes', () => {
  assert.equal(needsIsolation('/'), false)
  assert.equal(needsIsolation('/apps/maps/extra'), false)
  assert.equal(needsIsolation('/datasets/135'), false)
  assert.equal(needsIsolation('/datasets/file/135/8?path=files/primary/image.jpg'), false)
  assert.equal(needsIsolation('/datasets/file/135/8'), false)
})

test('detects browsers that support COEP credentialless', () => {
  assert.equal(supportsCredentialless('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'), true)
  assert.equal(supportsCredentialless('Mozilla/5.0 (Macintosh; rv:131.0) Gecko/20100101 Firefox/131.0'), true)
  assert.equal(supportsCredentialless('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'), false)
  assert.equal(supportsCredentialless('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1'), false)
})
