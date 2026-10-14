import { test, expect } from '@playwright/test'

/**
 * COEP applies to every subresource on a cross-origin isolated page, not just SimulationVuer's.
 * With Safari's `require-corp`, a cross-origin image whose host sends no CORS headers is blocked
 * unless public/coi-sw.js can load it (CORS re-request, or server/api/coi-proxy.get.js for allowlisted hosts).
 * This checks that no image (e.g. footer logos, CFDE wheel) is broken or blocked on isolated pages.
 */
test.describe('Images on cross-origin isolated pages', () => {
  // SIMULATION_FILE_URL is resolved from the config metadata inside the test
  for (const route of ['/apps/maps', 'SIMULATION_FILE_URL']) {
    test(`all images load on ${route}`, async ({ page }, testInfo) => {
      const url = route === 'SIMULATION_FILE_URL'
        ? testInfo.config.metadata.SIMULATION_FILE_URL as string
        : route

      // Let the Safari service worker take control on a non-isolated page first,
      // so the isolated page is not loaded once without it (and then reloaded).
      await page.goto('/')
      await page.evaluate(() =>
        /(Chrome|Chromium|Firefox)\/\d/.test(navigator.userAgent) || navigator.serviceWorker.ready.then(() => true)
      )

      const blocked: string[] = []
      page.on('console', (message) => {
        if (/Cross-Origin-(Resource|Embedder)-Policy/.test(message.text())) blocked.push(message.text())
      })

      await page.goto(url)
      expect(await page.evaluate(() => window.crossOriginIsolated), 'crossOriginIsolated').toBe(true)

      const footer = page.locator('.footer')
      await footer.scrollIntoViewIfNeeded()
      // The CFDE wheel is rendered by a third-party script after load
      await page.locator('.cfde-wheel-wrapper img').first().waitFor({ timeout: 15000 }).catch(() => {})
      await expect.poll(
        () => footer.locator('img').evaluateAll((images: HTMLImageElement[]) => images.every((img) => img.complete)),
        { message: 'Footer images finished loading', timeout: 30000 }
      ).toBe(true)

      const broken = await page.locator('img').evaluateAll((images: HTMLImageElement[]) =>
        images.filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src')).map((img) => img.src)
      )
      expect(broken, 'Broken images').toEqual([])
      expect(blocked, 'Subresources blocked by COEP/CORP').toEqual([])
    })
  }
})
