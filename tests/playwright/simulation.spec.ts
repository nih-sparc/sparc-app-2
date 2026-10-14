import { test, expect } from '@playwright/test'

/**
 * SimulationVuer (libOpenCOR wasm) needs SharedArrayBuffer,
 * which is only available on cross-origin isolated pages (COOP + COEP).
 * Safari used to fail with `Aborted()` because it doesn't support COEP `credentialless`
 * (see server/middleware/crossOriginIsolation.js).
 */
test.describe('Simulation viewer', () => {
  test('runs a simulation in a cross-origin isolated page', async ({ page }, testInfo) => {
    const simulationFileUrl = testInfo.config.metadata.SIMULATION_FILE_URL as string

    const errors: string[] = []
    page.on('console', (message) => {
      if (message.text().includes('Aborted(')) errors.push(message.text())
    })
    page.on('pageerror', (error) => {
      if (error.message.includes('Aborted(')) errors.push(error.message)
    })

    await page.goto(simulationFileUrl)

    expect(await page.evaluate(() => window.crossOriginIsolated), 'crossOriginIsolated').toBe(true)
    expect(await page.evaluate(() => typeof SharedArrayBuffer), 'SharedArrayBuffer').toBe('function')

    const simulation = page.locator('.simulation-vuer-container')
    await expect(simulation).toBeVisible({ timeout: 60000 })
    // The simulation results are plotted with Plotly once the run has finished
    await expect(simulation.locator('.main-svg').first()).toBeVisible({ timeout: 90000 })

    expect(errors, 'libOpenCOR aborted').toEqual([])
  })
})
