describe("Sample", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:5173/");
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