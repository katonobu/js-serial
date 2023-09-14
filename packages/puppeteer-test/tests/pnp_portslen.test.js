const {getPorts, getPortsNum, clickAndWait, deleteAll, waitEventWithTimeout} = require('./util/common.js')
const devServerPort = 5177


const openningMessage = [
    "PnpPortLen",
    "USB挿抜テストです。",
    "挿抜対象のポートを登録して、キャンセルを押してください。",
]
/*
test('dummy', () => {
    expect(1).toBe(1);
});
*/
describe("PnpPortLen", () => {
    beforeAll(async () => {
        const url = `http://localhost:${devServerPort.toString(10)}/`
    //    const url = 'http://127.0.0.1:8080'
        await Promise.all([
            page.goto(url),
            page.waitForSelector('#create')
        ])
        await page.evaluate(() => {
            document.title = "PnpPortLen"
        });
        await deleteAll(page)
        await clickAndWait(page, '#init', 'init', 0)
        await page.evaluate((openningMessage) => {
          window.alert(openningMessage.join('\n'))
        },openningMessage)
    },3600*1000)
  
    afterAll(async () => {
        await deleteAll(page)
        await clickAndWait(page, '#finalize', 'finalize', 0)
        await page.reload();
    });
  
    it('Plug and play', async () => {
        // cancelが押されるまでrequestPort Dialogを出し続ける。
        await page.evaluate((value) => {document.querySelector('#arg').innerText = value;}, "{}");
        while(true) {
            const createObj = await clickAndWait(page, '#create',"create", 0)
            const currentPortsNum = await getPortsNum(page)
            if (0 < currentPortsNum && createObj.rsp.id === -1){
                break
            }
        }
        
        const initPortLen = await getPortsNum(page)
        const timeoutSec = 10
        await Promise.all([
            await page.evaluate((openningMessage) => {
                window.alert(openningMessage.join('\n'))
            },[
                "本ダイアログを閉じて",
                "登録したUSBシリアルポートを",
                `${timeoutSec}秒以内に抜いてください。`
            ]),
            await waitEventWithTimeout(page, 'changePorts', timeoutSec * 1000)
        ])
        let portChange = await getPorts(page)
        expect(0 < portChange.rsp.res.detached.length).toBe(true)
        expect(0 === portChange.rsp.res.attached.length).toBe(true)
        const detachedPortLen = portChange.rsp.length
        expect(detachedPortLen < initPortLen).toBe(true)
        await Promise.all([
            await page.evaluate((openningMessage) => {
                window.alert(openningMessage.join('\n'))
            },[
                "本ダイアログを閉じて",
                "抜いたUSBシリアルポートを",
                `${timeoutSec}秒以内に接続してください。`
            ]),
            await waitEventWithTimeout(page, 'changePorts', timeoutSec * 1000)
        ])
        portChange = await getPorts(page)
        expect(0 < portChange.rsp.res.attached.length).toBe(true)
        expect(0 === portChange.rsp.res.detached.length).toBe(true)
        const attachedPortLen = portChange.rsp.length
        expect(detachedPortLen < attachedPortLen).toBe(true)
        // 1つずつ増えるので、次の行はすぐには成り立たない。
        // expect(initPortLen).toBe(attachedPortLen)
    }, 3600*1000);
});
