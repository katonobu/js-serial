const {getPortsNum, getPorts, clickAndWait, deleteAll} = require('./util/common.js')

const openningMessage = [
    "CreatePortLen",
    "create()のダイアログ選択結果と取得有効ポート数の比較テストです。",
    "キャンセルが押されるまでcreate()を繰り返し実行します。",
    "手動操作によるカバレッジ担保となるため、少なくとも、下記の3パターンの操作を行ってください。",
    "  未登録ポートの選択",
    "  登録済ポートの選択",
    "  キャンセル(create()繰り返し終了)",
]
/*
test('dummy', () => {
  expect(1).toBe(1);
});
*/
describe("CreatePortLen", () => {
    beforeAll(async () => {
        const url = 'http://localhost:5173/'
    //    const url = 'http://127.0.0.1:8080'
        await Promise.all([
            page.goto(url),
            page.waitForSelector('#create')
        ])
        await page.evaluate(() => {
            document.title = "CreatePortLen"
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

    it('just start', async () => {
        const actual = await getPortsNum(page)
        expect(actual).toBe(0)
    }, 30*1000);

    // cancelが押されるまでrequestPort Dialogを出し続ける。
    // cancel,登録済ポートの選択,新規ポートの再選択に応じて、
    // portsの数が増えることを確認する。
    // テスタは登録済ポートの選択,新規ポートの再選択を行い、最後にcancelを押す
    // ここではdeleteは押さない前提なので単調増加。
    it('regis until cancel', async () => {
        let portChange = await getPorts(page)
        let expPortsNum = portChange.rsp.length
        let prevPortChangeId = portChange.rsp.res.changeId
        let cancelled = false
        let newPortSttString = "□"
        let existingPortSttString = "□"
        let cancelSttString = "□"
        await page.evaluate((sttStr) => {
            document.title = sttStr
        }, newPortSttString + existingPortSttString + cancelSttString)

        await page.evaluate((value) => {document.querySelector('#arg').innerText = value;}, "{}");
        do {
            const createObj = await clickAndWait(page, '#create',"create", 0)
            portChange = await getPorts(page)
            const currentPortChangeId = portChange.rsp.res.changeId
            if (prevPortChangeId !== currentPortChangeId) {
                prevPortChangeId = currentPortChangeId
                if (0 < portChange.rsp.res.attached.length){
                    // selected new port
                    expPortsNum += portChange.rsp.res.attached.length
                    newPortSttString = "✔"                    
                }
                if (0 < portChange.rsp.res.detached.length){
                    // delete existing port, but this scenrio may come here.
                    expPortsNum -= portChange.rsp.res.detached.length
                }
            } else {
                if (createObj.rsp.id === -1){
                    // cancel selected
                    cancelled = true
                    cancelSttString = "✔"
                } else {
                    // selected already registrated port
                    existingPortSttString = "✔"
                }
            }
            const currentPortsNum = portChange.rsp.length
            expect(currentPortsNum).toBe(expPortsNum)
            expPortsNum = currentPortsNum
            await page.evaluate((sttStr) => {
                document.title = sttStr
            }, newPortSttString + existingPortSttString + cancelSttString)
        }while(cancelled === false)
        expect(newPortSttString + existingPortSttString + cancelSttString).toBe("✔✔✔")
    }, 3600*1000);
});
