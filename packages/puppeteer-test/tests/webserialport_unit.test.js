const {setOptionClickCreate, pidVidFilterParams} = require('./util/create.js')
const {getPortsNum, clickAndWait, deleteAll} = require('./util/common.js')

const openningMessage = [
  "WebSerialPortの単体テストです。",
  "USBの挿抜を含むテストになります。",
  "挿抜対象のポートを登録して、キャンセルを押してください。",
  "テスト開始後、画面指示に従ってUSBの抜き差しを行ってください"
]
/*
test('dummy', () => {
  expect(1).toBe(1);
});
*/
describe("WebSerialPortUnit", () => {
  beforeAll(async () => {
    const url = 'http://localhost:5173/'
//    const url = 'http://127.0.0.1:8080'
    await Promise.all([
        page.goto(url),
        page.waitForSelector('#create')
    ])
    await page.evaluate(() => {
        document.title = "WebSerialPortUnit"
    });
    await deleteAll(page)
    await page.evaluate((openningMessage) => {
      window.alert(openningMessage.join('\n'))
    },openningMessage)
  },3600*1000)

  afterAll(async () => {
    await clickAndWait(page, '#init', 'init', 0)
    await deleteAll(page)
    await clickAndWait(page, '#finalize', 'finalize', 0)
    await page.reload();
  });

  it('RunTest', async () => {
    // cancelが押されるまでrequestPort Dialogを出し続ける。
    await page.evaluate((value) => {document.querySelector('#arg').innerText = value;}, "{}");
    while(true) {
        const createObj = await clickAndWait(page, '#create',"create", 0)
        const currentPortsNum = await getPortsNum(page)
        if (0 < currentPortsNum && createObj.rsp.id === -1){
            break
        }
    }
    const result = await clickAndWait(page, '#run_test',"run_test", 0)
    expect('rsp' in result).toBe(true)
    expect(result.rsp.total.ngCount).toBe(0)
    console.log(JSON.stringify(result.rsp.result, null, 2))
  }, 3600*1000);
});
