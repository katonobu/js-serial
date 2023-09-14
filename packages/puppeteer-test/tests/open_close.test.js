const {getPortsNum, clickAndWait, deleteAll} = require('./util/common.js')
const devServerPort = 5177


const openningMessage = [
    "OpenClose",
    "Open/Closeのテストです。",
    "ほかのプロセスでopenしていないポートを選択してください。"
]
/*
test('dummy', () => {
  expect(1).toBe(1);
});
*/
describe("OpenClose", () => {
    beforeAll(async () => {
        const url = `http://localhost:${devServerPort.toString(10)}/`
    //    const url = 'http://127.0.0.1:8080'
        await Promise.all([
            page.goto(url),
            page.waitForSelector('#create')
        ])
        await page.evaluate(() => {
            document.title = "OpenClose"
        });        
        await deleteAll(page)
        await clickAndWait(page, '#init', 'init', 0)
        await page.evaluate((openningMessage) => {
          window.alert(openningMessage.join('\n'))
        },openningMessage)
        let actual = await getPortsNum(page)
        while (actual < 1) {
            await clickAndWait(page, '#create',"create", 0)
            actual = await getPortsNum(page)
        }
    }, 3600 * 1000);
  
    afterAll(async () => {
        await deleteAll(page)
        await clickAndWait(page, '#finalize', 'finalize', 0)
        await page.reload();
    });
  
    it('open/close normal', async () => {
        const actual = await getPortsNum(page)
        expect(actual).toBe(1)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
        expect((await clickAndWait(page, '#open',"open", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('OPEN')
        expect((await clickAndWait(page, '#close',"close", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
    }, 5*1000);

    it('over open/close', async () => {
        const actual = await getPortsNum(page)
        expect(actual).toBe(1)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
        expect((await clickAndWait(page, '#open',"open", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('OPEN')

        // open already opened port.
        expect((await clickAndWait(page, '#open',"open", 0)).rsp.result.startsWith("ERROR")).toBe(true)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('OPEN')

        expect((await clickAndWait(page, '#close',"close", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
    }, 5*1000);

    it('open/over close', async () => {
        const actual = await getPortsNum(page)
        expect(actual).toBe(1)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
        expect((await clickAndWait(page, '#open',"open", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('OPEN')
        expect((await clickAndWait(page, '#close',"close", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')

        // close already closeded port.
        expect((await clickAndWait(page, '#close',"close", 0)).rsp.result.startsWith("ERROR")).toBe(true)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
    }, 5*1000);

    it('force close using reload', async () => {
        const actual = await getPortsNum(page)
        expect(actual).toBe(1)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
        expect((await clickAndWait(page, '#open',"open", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('OPEN')
        // リロード/init()でで、openしたままのポートが強制的にcloseされる
        await await page.reload();
        await clickAndWait(page, '#init', 'init', 0)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
    }, 5*1000);
});
