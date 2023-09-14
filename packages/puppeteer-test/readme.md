# インストール
`cd js-serial-trial\package\test`
`npm create vite@latest jest-puppeteer -- --template vanilla-ts`
`cd jest-puppeteer`
`npm install`
`npm run dev`
`npm install jest jest-puppeteer puppeteer --save-dev`

# jest-puppeteerの設定
## jest.config.js
https://github.com/argos-ci/jest-puppeteer#update-your-jest-configuration
```
/** @type {import('jest').Config} */
module.exports = {
  "preset": "jest-puppeteer",
};
```
## jest-puppeteer.config.js
https://github.com/argos-ci/jest-puppeteer#update-your-jest-configuration
```
/** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
module.exports = {
    launch: {
        dumpio: true,
        headless: false,
    }
};
```
## package.json
```
  "scripts": {
    "test": "jest --runInBand",
```
## tests\sample.test.js
```
describe("Sample", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:5174/");
  });
  afterAll(async () => {
  });

  it('sample test', async () => {
    await page.waitForSelector('#counter')
    let countValue = -1
    countValue = parseInt((await page.$eval('#counter',(ele)=>ele.textContent)).replace('"','').split(" ")[2], 10)
    expect(countValue).toBe(0)
    await page.click('#counter')
    countValue = parseInt((await page.$eval('#counter',(ele)=>ele.textContent)).replace('"','').split(" ")[2], 10)
    expect(countValue).toBe(1)
  }, 10 * 1000);
});
```