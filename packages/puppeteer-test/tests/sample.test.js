const devServerPort = 5177

describe("Sample", () => {
  beforeAll(async () => {
    const url = `http://localhost:${devServerPort.toString(10)}/`
    console.log(url)
    await page.goto(url)
  });
  afterAll(async () => {
  });

  it('check title', async () => {
    await page.waitForSelector('#init')
    const title = await page.title();
    expect(title).toBe('js-serial-web test client');    
  }, 10 * 1000);
});