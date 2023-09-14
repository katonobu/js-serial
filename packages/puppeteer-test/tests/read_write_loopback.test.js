const {getPortsNum, clickAndWait, deleteAll} = require('./util/common.js')

const openningMessage = [
    "ReadWriteWithLoopback",
    "Loopback結線を仮定したRead/Writeのテストです。",
    "Loopback結線されたポートを選択してください。"
]

const multiLineTxStrs = [
    "1",
    " 2",
    "  3",
    "   4",
    "    5",
    "     6",
    "      7",
    "       8",
    "        9",
    "         0",
    "          1",
    "           2",
    "            3",
    "             4",
    "              5",
    "               6",
    "                7",
    "                 8",
    "                  9",
    "                   0",
    "                   0",
    "                  9",
    "                 8",
    "                7",
    "               6",
    "              5",
    "             4",
    "            3",
    "           2",
    "          1",
    "         0",
    "        9",
    "       8",
    "      7",
    "     6",
    "    5",
    "   4",
    "  3",
    " 2",
    "1",
    ""
]
/*
test('dummy', () => {
    expect(1).toBe(1);
});
*/
describe("ReadWriteLoopback", () => {
    beforeAll(async () => {
        const url = 'http://localhost:5173/'
    //    const url = 'http://127.0.0.1:8080'
        await Promise.all([
            page.goto(url),
            page.waitForSelector('#create')
        ])
        await page.evaluate(() => {
            document.title = "ReadWriteLoopback"
        });        
        await deleteAll(page)
        await clickAndWait(page, '#init', 'init', 0)
        await page.evaluate((openningMessage) => {
            window.alert(openningMessage.join('\n'))
        },openningMessage)
    },  3600 * 1000);
  
    afterAll(async () => {
        await deleteAll(page)
        await clickAndWait(page, '#finalize', 'finalize', 0)
        await page.reload();
    });
  
    it('read/write one line', async () => {
        let actual = await getPortsNum(page)
        while (actual < 1) {
            await clickAndWait(page, '#create',"create", 0)
            actual = await getPortsNum(page)
        }
        expect(actual).toBe(1)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
        expect((await clickAndWait(page, '#open',"open", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('OPEN')

        // 受信処理を開始させる
        await clickAndWait(page, '#start_receive', 'start_receive', 100)
        const sendData = (new Date()).toLocaleString()
        // 送信文字列を設定する。
        await page.$eval('#last_tx', (preElement, value)=>preElement.innerText = value, sendData+'\n')
        // 受信文字列をクリアしておく
        await page.$eval('#last_rx', (preElement, value)=>preElement.innerText = value, "")
        // 文字列送信
        await clickAndWait(page, '#send',"send", 100)
        // 受信文字列照合
        let rxStr = await page.$eval('#last_rx', preElement => preElement.innerText)
        for (let count = 0; count < 10; count++) {
            if (rxStr !== "") {
                break
            }
            rxStr = await page.$eval('#last_rx', preElement => preElement.innerText)
        }
        expect(rxStr).toBe(sendData)

        // 後始末
        await clickAndWait(page, '#stop_receive', 'stop_receive', 100)
        expect((await clickAndWait(page, '#close',"close", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
    }, 10*1000);
    it('read/write multi line', async () => {
        // 前準備
        let actual = await getPortsNum(page)
        while (actual < 1) {
            await clickAndWait(page, '#create',"create", 0)
            actual = await getPortsNum(page)
        }
        expect(actual).toBe(1)
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
        expect((await clickAndWait(page, '#open',"open", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('OPEN')

        // 受信処理を開始させる
        await clickAndWait(page, '#start_receive', 'start_receive', 100)
        const sendData = multiLineTxStrs.join("\n")
        // 送信文字列を設定する。
        await page.$eval('#last_tx', (preElement, value)=>preElement.innerText = value, sendData+'\n')
        // 受信文字列をクリアしておく
        await page.$eval('#last_rx', (preElement, value)=>preElement.innerText = value, "")
        // 受信文字表示位置までスクロールさせる
//        await page.$eval('#receive', (ele)=>ele.scrollIntoView({ block: 'start' }))

        // 送信前にたまっているデータ位置を確認しておく
        const prevReceiveLinesData = await clickAndWait(page, '#receive_lines',"receive_lines", 100)
        const prevDataStartIndex = prevReceiveLinesData.rsp.data.length

        // 文字列送信
        await clickAndWait(page, '#send',"send", 100)

        // 念のため100ms待つ
        await new Promise((resolve)=>setTimeout(resolve, 100))
        // 今回受信したデータ列を抽出
        const newReceiveLinesData = await clickAndWait(page, '#receive_lines',"receive_lines", 100)
//        console.log(JSON.stringify(newReceiveLinesData, null, 2))
        const newDataLength = newReceiveLinesData.rsp.data.length
        const actDatas = []
        for (let idx = prevDataStartIndex; idx < newDataLength; idx++) {
            actDatas.push(newReceiveLinesData.rsp.data[idx])
        }
//        console.log(JSON.stringify(actDatas, null, 2))

        expect(actDatas.length).toBe(multiLineTxStrs.length)
        // 送信期待文字列と比較
        actDatas.forEach((act,index)=>{expect(act.data).toBe(multiLineTxStrs[index])})
        // タイムスタンプが単調増加(同値OK)していること
        actDatas.reduce((prev, current)=>{
            expect(prev <= current.ts).toBe(true)
            return current.ts
        }, actDatas[0].ts)
        // idが単調増加していること
        actDatas.reduce((prev, current, idx)=>{
//            console.log(idx, current.id, prev)
            expect(prev < current.id).toBe(true)
            return current.id
        }, actDatas[0].id-1)

        // 後始末
        await clickAndWait(page, '#stop_receive', 'stop_receive', 100)
        expect((await clickAndWait(page, '#close',"close", 0)).rsp.result).toBe('OK')
        expect(await page.$eval('#open_stt', preElement => preElement.innerText)).toBe('CLOSE')
    }, 100*1000);
});