import {WebSerialPort} from '../../lib/WebSerialPort'
import {PortManager} from '../../../js-serial-core/lib/portManger'
const wsp = new WebSerialPort()
const pm = new PortManager(wsp)
pm.init()

const logTransaction = (action:string, request:object, response:object, isError=false) => {
  let transactionObj:{action:string, req:object, err?:object, rsp?:object} = {action, req:request}
  if (isError) {
    transactionObj['err'] = response
  } else {
    transactionObj['rsp'] = response
  }
  console.log("Result:" + JSON.stringify(transactionObj))
}

const logEvent = (action:string, payload:object) => {
  const eventObj:{action:string, payload:object} = {action, payload}
  console.log("Event:" + JSON.stringify(eventObj))
}

const argEle = document.querySelector<HTMLPreElement>('#arg')!
const createButtonEle = document.querySelector<HTMLButtonElement>('#create')!
createButtonEle.onclick = ()=>{
//  console.log(argEle.innerText)
  const createPortOption = JSON.parse(argEle.innerText) as SerialPortRequestOptions
//  console.log(createPortOption)
  pm.promptGrantAccess(createPortOption)
  .then((createdPort) => {
    logTransaction("create", createPortOption, createdPort)
  })
  .catch((e)=>{
    logTransaction("create", createPortOption, e.toString(), true)
  })
}

const getPortsEle = document.querySelector<HTMLButtonElement>('#get_ports')!
getPortsEle.onclick = ()=>{
  Promise.resolve(pm.getPorts())
  .then((result)=>{
    logTransaction("get_ports", {}, {length:result.curr.length, res:result})

  })
  .catch((e)=>{
    logTransaction("get_ports", {}, e.toString(), true)
  })
}

const currentPortStrId = document.querySelector<HTMLPreElement>('#current_port_idstr')!
currentPortStrId.innerText = ''

const guiOptionCheck = document.getElementById('use_open_option') as HTMLInputElement
const bufferSize = 8 * 1024; // 8kB
const baudRateSelector = document.getElementById('baudrate') as HTMLSelectElement;
const additionalOptions = document.getElementById('additional-options') as HTMLDivElement

guiOptionCheck.addEventListener('change', () => {
  if (guiOptionCheck.checked) {
    additionalOptions.style.display = 'block';
  } else {
    additionalOptions.style.display = 'none';
  }
});


baudRateSelector.addEventListener('input', () => {
  if (baudRateSelector.value == 'custom') {
    customBaudRateInput.hidden = false;
  } else {
    customBaudRateInput.hidden = true;
  }
});
const customBaudRateInput =
    document.getElementById('custom_baudrate') as HTMLInputElement;
const dataBitsSelector = document.getElementById('databits') as HTMLSelectElement;
const paritySelector = document.getElementById('parity') as HTMLSelectElement;
const stopBitsSelector = document.getElementById('stopbits') as HTMLSelectElement;
const flowControlCheckbox = document.getElementById('rtscts') as HTMLInputElement;

function getSelectedBaudRate(): number {
  if (baudRateSelector.value == 'custom') {
    return Number.parseInt(customBaudRateInput.value);
  }
  return Number.parseInt(baudRateSelector.value);
}
    
const getGuiOpenOptions = ()=>({
  baudRate: getSelectedBaudRate(),
  dataBits: Number.parseInt(dataBitsSelector.value),
  parity: paritySelector.value as ParityType,
  stopBits: Number.parseInt(stopBitsSelector.value),
  flowControl:
      flowControlCheckbox.checked ? <const> 'hardware' : <const> 'none',
  bufferSize,

  // Prior to Chrome 86 these names were used.
  baudrate: getSelectedBaudRate(),
  databits: Number.parseInt(dataBitsSelector.value),
  stopbits: Number.parseInt(stopBitsSelector.value),
  rtscts: flowControlCheckbox.checked,
})

const openEle = document.querySelector<HTMLButtonElement>('#open')!
openEle.onclick = ()=>{
  const openPortIdStr = currentPortStrId.innerText
  let openOption = {baudRate:115200}
  if (guiOptionCheck.checked) {
    openOption = getGuiOpenOptions()
  }
  console.log("open", openPortIdStr, JSON.stringify(openOption))
/* ToDo
  openPort(openPortIdStr, openOption)
  .then((result)=>{
    openResult = result
    logTransaction("open", {openOption, idStr:openPortIdStr}, {openResult})
  })
  .catch((e)=>{
    logTransaction("open", {openOption, idStr:openPortIdStr}, {msg:e.toString()}, true) 
  })
  */
}

const closeEle = document.querySelector<HTMLButtonElement>('#close')!
closeEle.onclick = ()=>{
  const closePortIdStr = currentPortStrId.innerText
  console.log("close", closePortIdStr)
/* ToDo
  closePort(closePortIdStr)
  .then((result)=>{
    logTransaction("close", {idStr:closePortIdStr}, {result})

  })
  .catch((e)=>{
    logTransaction("close", {idStr:closePortIdStr}, { msg:e.toString()}, true)
  })
  */
}


const deleteEle = document.querySelector<HTMLButtonElement>('#delete')!
deleteEle.onclick = ()=>{
  const deletePortIdStr = currentPortStrId.innerText
  const deletePortId = parseInt(deletePortIdStr, 10)
  pm.deletePort(deletePortId)
  .then((result)=>{
    logTransaction("delete", {idStr:deletePortIdStr}, {result})
  })
  .catch((e)=>{
    logTransaction("delete", {idStr:deletePortIdStr}, {msg:e.toString()}, true)
  })
}

const receiveEle = document.querySelector<HTMLButtonElement>('#receive')!
const rxOptionEle = document.querySelector<HTMLButtonElement>('#rx_option')!
receiveEle.onclick = ()=>{
  const receivePortIdStr = currentPortStrId.innerText
  const rxOption = JSON.parse(rxOptionEle.innerText)
  const length = rxOption.byteLength
  const timeout = rxOption.timeoutMs
  if (length === 0 && timeout === 0) {
    /* ToDo
    receievePort(receivePortIdStr, length, timeout)
    */
    logTransaction("receive", {idStr:receivePortIdStr, length, timeout},{})
  } else {
    /* ToDo
    receievePort(receivePortIdStr, length, timeout)
    .then((result)=>{
      logTransaction("receive",{idStr:receivePortIdStr, length, timeout},{result})
    })
    .catch((e)=>{
      logTransaction("receive", {idStr:receivePortIdStr}, {msg:e.toString()}, true)
    })
    */
  }
}

const receiveLinesEle = document.querySelector<HTMLButtonElement>('#receive_lines')!
const rxLinesOptionEle = document.querySelector<HTMLButtonElement>('#rx_lines_option')!
receiveLinesEle.onclick = ()=>{
  /* ToDo
  const receiveLinesIdStr = currentPortStrId.innerText
  const rxLinesOption = JSON.parse(rxLinesOptionEle.innerText)
  const start = rxLinesOption.start
  const end = rxLinesOption.end
  receieveLines(receiveLinesIdStr, start, end)
  .then((result) => {
    logTransaction("receive_lines", {idStr:receiveLinesIdStr, start, end}, result)
  })
  .catch((e)=>{
    logTransaction("receive_lines", {idStr:receiveLinesIdStr, start, end}, {msg:e.toString()}, true)
  })
    */
}

const sendPortDataStr = document.querySelector<HTMLPreElement>('#last_tx')!
sendPortDataStr.innerText = "Hello world\r\n"
const sendEle = document.querySelector<HTMLButtonElement>('#send')!
sendEle.onclick = ()=>{
  const sendPortIdStr = currentPortStrId.innerText
  const encoder = new TextEncoder();
  const sendStr = sendPortDataStr.innerText
  /* ToDo
  sendPort(sendPortIdStr, encoder.encode(sendStr))
  .then((result)=>{
    sendResult = result
    logTransaction("send", {idStr:sendPortIdStr, sendStr},{result})
  })
  .catch((e)=>{
    logTransaction("send", {idStr:sendPortIdStr, sendStr}, {msg:e.toString()}, true)
  })
  */
}

const lastRxStr = document.querySelector<HTMLPreElement>('#last_rx')!
lastRxStr.innerText = " "
const portStoreResult = document.querySelector<HTMLPreElement>('#port_store_result')!
portStoreResult.innerText = "[]"
const portslenResult = document.querySelector<HTMLPreElement>('#portslen')!
portslenResult.innerText = '0'
const openSttStr = document.querySelector<HTMLPreElement>('#open_stt')!
openSttStr.innerText = ''
let unsubscribeOpenSttStore = ()=>{}
let unsubscribeRxStore = ()=>{}
pm.subscribePorts(()=>{
  console.log("portStoreSubscriber <-")
  Promise.resolve(pm.getPorts())
  .then((ports)=>{
    portslenResult.innerText = ports.curr.length.toString(10)
    portStoreResult.innerText = JSON.stringify(ports,null, 2)
    if (0 < ports.curr.length) {
      const maxPortId = ports.curr.length-1
      currentPortStrId.innerText = ports.curr[maxPortId].id.toString(10)
      /* ToDo
      unsubscribeOpenSttStore()
      unsubscribeOpenSttStore = openSttStore[maxPortId].subscribe(()=>{
        openSttStr.innerText = openSttStore[maxPortId].get()?'OPEN':'CLOSE'
      })
      const currentOpenStt = openSttStore[maxPortId].get()
//      console.log(currentOpenStt)
      openSttStr.innerText = currentOpenStt === true ?'OPEN':'CLOSE'

      unsubscribeRxStore()
      unsubscribeRxStore = rxLineNumStore[maxPortId].subscribe(()=>{
        const rxLineNum = rxLineNumStore[maxPortId].get()
        logEvent('rxLineNum', rxLineNum)
        receieveLines(maxPortId.toString(10), rxLineNum.totalLines - 1,rxLineNum.totalLines - 0)
        .then((rxLines)=>{
          if (0 < rxLines.data.length){
            logEvent('rxLines', rxLines)
            lastRxStr.innerText = rxLines.data[0].data
          }
        })
      })
      */
    } else {
      currentPortStrId.innerText = ' '
      /*
      unsubscribeOpenSttStore()
      unsubscribeOpenSttStore = ()=>{}
      */
      openSttStr.innerText = ' '
    }
    console.log("portStoreSubscriber ->")
    logEvent('changePorts', ports)
  })
  .catch((e)=>{
    console.log(e)
    console.log("portStoreSubscriber ->")
    logEvent('changePorts', {})
  })
})
pm.updateRequest()

