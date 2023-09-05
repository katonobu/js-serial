// jest-puppeteer.config.cjs

/** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
module.exports = {
    launch: {
        // https://pptr.dev/api/puppeteer.launchoptions
        // boolean
        // If true, pipes the browser process stdout and stderr to process.stdout and process.stderr.
        dumpio: true,
        // https://pptr.dev/api/puppeteer.browserlaunchargumentoptions
        // boolean | 'new'
        // Whether to run the browser in headless mode.
        headless: false,
    }
};

