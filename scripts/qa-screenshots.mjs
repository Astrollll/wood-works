/**
 * QA screenshot sweep — captures all 14 desktop routes at 1440px so they can
 * be eyeballed against the rendered Figma exports in `exports/`.
 *
 * Usage:
 *   1. `npm run dev` in a terminal (or background)
 *   2. `node scripts/qa-screenshots.mjs`
 *
 * Uses the system Edge via playwright-core (no browser download needed).
 * Output: .superpowers/sdd/.../shots/<nn>-<name>.png  (gitignored)
 */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE_URL ?? 'http://localhost:5173'
const OUT = '.superpowers/sdd/2026-11-05-wood-works-desktop-ui/shots'

const ROUTES = [
  ['01-login', '/login'],
  ['02-signup', '/signup'],
  ['03-verification-code', '/send-otp'],
  ['04-verify-otp', '/verify-otp'],
  ['05-reset-password', '/reset-password'],
  ['06-signup-success', '/signup-success'],
  ['07-otp-sent', '/otp-sent-success'],
  ['08-verify-otp-page', '/otp-verified'],
  ['09-reset-success', '/reset-success'],
  ['10-home', '/home'],
  ['11-catalog', '/catalog'],
  ['12-product-details', '/product/wooden-dining-table'],
  ['13-custom-orders', '/custom-order'],
  ['14-order-confirmation', '/order-confirmation'],
]

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

for (const [name, route] of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`shot ${name} <- ${route}`)
}

await browser.close()
console.log('done')
