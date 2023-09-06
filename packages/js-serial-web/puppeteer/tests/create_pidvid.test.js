const {setOptionClickCreate, pidVidFilterParams} = require('./util/create.js')
const {clickAndWait, deleteAll} = require('./util/common.js')

const openningMessage = [
  "PidVidFilter",
  "create()の引数のテストです。",
  "create()の引数を変化させて繰り返しcreate()を実行します。",
  "目視で期待通りのフィルタが効いていることを確認し、Cancelで抜けてください。",
  "portを選択することでFailさせることができます。",
  "3回port登録のDialogが出ます。",
  "  1回目はPidVidフィルタなし",
  "  2回目はFTDIフィルタ",
  "  3回目はST-Microフィルタ",
  "です。"
]
/*
test('dummy', () => {
  expect(1).toBe(1);
});
*/
describe("PidVidFilter", () => {
  beforeAll(async () => {
    const url = 'http://localhost:5173/'
//    const url = 'http://127.0.0.1:8080'
    await Promise.all([
        page.goto(url),
        page.waitForSelector('#create')
    ])
    await page.evaluate(() => {
        document.title = "PidVidFilter"
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
  });

  it('NoFilter', async () => {
    const nameValue = pidVidFilterParams[0]
    const actual = await setOptionClickCreate(page, nameValue.value)
    expect(actual.rsp.id).toBe(-1)
    expect(actual.rsp.pid).toBe(-1)
    expect(actual.rsp.vid).toBe(-1)
  }, 3600*1000);

  it('FTDI', async () => {
    const nameValue = pidVidFilterParams[1]
    const actual = await setOptionClickCreate(page, nameValue.value)
    expect(actual.rsp.id).toBe(-1)
    expect(actual.rsp.pid).toBe(-1)
    expect(actual.rsp.vid).toBe(-1)
  }, 3600*1000);

  it('ST Micro', async () => {
    const nameValue = pidVidFilterParams[2]
    const actual = await setOptionClickCreate(page, nameValue.value)
    expect(actual.rsp.id).toBe(-1)
    expect(actual.rsp.pid).toBe(-1)
    expect(actual.rsp.vid).toBe(-1)
  }, 3600*1000);

});
