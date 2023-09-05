describe("Sample", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:5173/");
  });
  afterAll(async () => {
  });

  it('check title', async () => {
    await page.waitForSelector('#init')
    const title = await page.title();
    expect(title).toBe('js-serial-web test client');    
  }, 10 * 1000);
});