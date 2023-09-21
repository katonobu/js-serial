import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dir = dirname(fileURLToPath(import.meta.url))

function noop() {}

export default defineConfig({
  test: {
    include: ['test/**.test.{ts,js}'],
    browser: {
      enabled: true,
      name: process.env.BROWSER || 'chrome',
      headless: false,
      provider: process.env.PROVIDER || 'webdriverio',
    },
    open: false,
    isolate: false,
    outputFile: './browser.json',
    reporters: ['json', {
      onInit: noop,
      onPathsCollected: noop,
      onCollected: noop,
      onFinished: noop,
      onTaskUpdate: noop,
      onTestRemoved: noop,
      onWatcherStart: noop,
      onWatcherRerun: noop,
      onServerRestart: noop,
      onUserConsoleLog: noop,
    }, 'default'],
    testTimeout:120 * 1000
  },
})
