import JsBleWeb from '../../js-ble-web/lib/index'
import JsSerialWeb from '../../js-serial-web/lib/index'
let jsw:JsSerialWeb | JsBleWeb | undefined

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

let unsubscribeOpenSttStore = ()=>{}
let unsubscribeRxStore = ()=>{}
let unsubscribePorts = ()=>{}

const targetEle = document.getElementById('target') as HTMLSelectElement;

const initEle = document.querySelector<HTMLButtonElement>('#init')!
initEle.onclick = ()=>{
  if (jsw === undefined) {
    if (targetEle.value === "JsSerialWeb") {
      jsw = new JsSerialWeb()
    } else {
      jsw = new JsBleWeb()
    }
  }
  unsubscribePorts = jsw.subscribePorts(()=>{
    if (jsw) {
      Promise.resolve(jsw.getPorts())
      .then((ports)=>{
        portslenResult.innerText = ports.curr.length.toString(10)
        portStoreResult.innerText = JSON.stringify(ports,null, 2)
        const availablePorts = ports.curr.filter((port)=>port.available)
        if (0 < availablePorts.length){
          const maxPortId = availablePorts[availablePorts.length-1].id
          currentPortStrId.innerText = ports.curr[maxPortId].id.toString(10)
          unsubscribeOpenSttStore()
          if (jsw) {
            unsubscribeOpenSttStore = jsw.subscribeOpenStt(maxPortId, ()=>{
              if (jsw) {
                openSttStr.innerText = jsw.getOpenStt(maxPortId)?'OPEN':'CLOSE'
              } else {
                console.error("jsw is undefined")
              }
            })
            openSttStr.innerText = jsw.getOpenStt(maxPortId)?'OPEN':'CLOSE'
            unsubscribeRxStore()
            unsubscribeRxStore = jsw.subscribeRxLineNum(maxPortId,()=>{
              if (jsw) {
                const rxLineNum = jsw.getRxLineNum(maxPortId)
                logEvent('rxLineNum', rxLineNum)
                Promise.resolve(jsw.getRxLines(maxPortId, rxLineNum.totalLines - 1,rxLineNum.totalLines - 0))
                .then((rxLines)=>{
                  if (0 < rxLines.data.length){
                    logEvent('rxLines', rxLines)
                    lastRxStr.innerText = rxLines.data[0].data
                  }
                })
              } else {
                console.error("jsw is undefined")
              }
            })
          } else {
            console.error("jsw is undefined")
          }
        } else {
          currentPortStrId.innerText = ' '
          unsubscribeOpenSttStore()
          unsubscribeOpenSttStore = ()=>{}
          openSttStr.innerText = ' '
        }
        logEvent('changePorts', ports)
      })
      .catch((e)=>{
        console.log(e)
        logEvent('changePorts', {})
      })
    } else {
      console.error("jsw is undefined")
    }
  })
  targetEle.disabled = true
  Promise.resolve(jsw.init({}))
  .then(()=>{
    logTransaction("init", {}, {})

  })
  .catch((e)=>{
    logTransaction("init", {}, e.toString(), true)
  })
}

const argEle = document.querySelector<HTMLPreElement>('#arg')!
const createButtonEle = document.querySelector<HTMLButtonElement>('#create')!
createButtonEle.onclick = ()=>{
//  console.log(argEle.innerText)
  const createPortOption = JSON.parse(argEle.innerText) as SerialPortRequestOptions
//  console.log(createPortOption)
  if (jsw) {
    jsw.promptGrantAccess(createPortOption)
    .then((createdPort) => {
      logTransaction("create", createPortOption, createdPort)
    })
    .catch((e)=>{
      logTransaction("create", createPortOption, e.toString(), true)
    })
  } else {
    console.error("jsw is undefined")
  }
}

const getPortsEle = document.querySelector<HTMLButtonElement>('#get_ports')!
getPortsEle.onclick = ()=>{
  if (jsw) {
    Promise.resolve(jsw.getPorts())
    .then((result)=>{
      logTransaction("get_ports", {}, {length:result.curr.length, res:result})

    })
    .catch((e)=>{
      logTransaction("get_ports", {}, e.toString(), true)
    })
  } else {
    console.error("jsw is undefined")
  }
}

const finEle = document.querySelector<HTMLButtonElement>('#finalize')!
finEle.onclick = ()=>{
  if (jsw) {
    Promise.resolve(jsw.finalize())
    .then(()=>{
      logTransaction("finalize", {}, {})
      jsw = undefined
      targetEle.disabled = false
      unsubscribePorts()
    })
    .catch((e)=>{
      logTransaction("finalize", {}, e.toString(), true)
    })
  } else {
    console.error("jsw is undefined")
  }
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
  if (jsw) {
    const openPortIdStr = currentPortStrId.innerText
    let openOption = {baudRate:115200}
    if (guiOptionCheck.checked) {
      openOption = getGuiOpenOptions()
    }
    console.log("open", openPortIdStr, JSON.stringify(openOption))
    jsw.openPort(parseInt(openPortIdStr), {serialOptions:openOption})
    .then((result)=>{
      logTransaction("open", {openOption, idStr:openPortIdStr}, {result})
    })
    .catch((e)=>{
      logTransaction("open", {openOption, idStr:openPortIdStr}, {msg:e.toString()}, true) 
    })
  } else {
    console.error("jsw is undefined")
  }
}

const closeEle = document.querySelector<HTMLButtonElement>('#close')!
closeEle.onclick = ()=>{
  if (jsw) {
    const closePortIdStr = currentPortStrId.innerText
    console.log("close", closePortIdStr)
    jsw.closePort(parseInt(closePortIdStr))
    .then((result)=>{
      logTransaction("close", {idStr:closePortIdStr}, {result})

    })
    .catch((e)=>{
      logTransaction("close", {idStr:closePortIdStr}, { msg:e.toString()}, true)
    })
  } else {
    console.error("jsw is undefined")
  }
}


const deleteEle = document.querySelector<HTMLButtonElement>('#delete')!
deleteEle.onclick = ()=>{
  if (jsw) {
    const deletePortIdStr = currentPortStrId.innerText
    const deletePortId = parseInt(deletePortIdStr, 10)
    jsw.deletePort(deletePortId)
    .then((result)=>{
      logTransaction("delete", {idStr:deletePortIdStr}, {result})
    })
    .catch((e)=>{
      logTransaction("delete", {idStr:deletePortIdStr}, {msg:e.toString()}, true)
    })
  } else {
    console.error("jsw is undefined")
  }
}

const startReceiveEle = document.querySelector<HTMLButtonElement>('#start_receive')!
startReceiveEle.onclick = ()=>{
  if (jsw) {
    const receivePortIdStr = currentPortStrId.innerText
    jsw.startReceivePort(parseInt(receivePortIdStr, 10))
    .then((result)=>{
      logEvent("start_receive", {idStr:receivePortIdStr, result})
    })
    .catch((e)=>{
      logEvent("start_receive", {idStr:receivePortIdStr, error:e.toString()})
    })
    logTransaction("start_receive", {idStr:receivePortIdStr},{result:"Started"})
  } else {
    console.error("jsw is undefined")
  }
}

const stopReceiveEle = document.querySelector<HTMLButtonElement>('#stop_receive')!
stopReceiveEle.onclick = ()=>{
  if (jsw) {
    const receivePortIdStr = currentPortStrId.innerText
    jsw.stopReceivePort(parseInt(receivePortIdStr, 10))
    .then((result)=>{
      logTransaction("stop_receive", {idStr:receivePortIdStr},{result})
    })
    .catch((e)=>{
      logTransaction("stop_receive", {idStr:receivePortIdStr},{msg:e.toString()}, true)
    })
  } else {
    console.error("jsw is undefined")
  }
}

const receiveLinesEle = document.querySelector<HTMLButtonElement>('#receive_lines')!
const rxLinesOptionEle = document.querySelector<HTMLButtonElement>('#rx_lines_option')!
receiveLinesEle.onclick = ()=>{
  if (jsw) {
    const receiveLinesIdStr = currentPortStrId.innerText
    const rxLinesOption = JSON.parse(rxLinesOptionEle.innerText)
    const start = rxLinesOption.start
    const end = rxLinesOption.end
    Promise.resolve(jsw.getRxLines(parseInt(receiveLinesIdStr, 10), start, end))
    .then((result) => {
      logTransaction("receive_lines", {idStr:receiveLinesIdStr, start, end}, result)
    })
    .catch((e)=>{
      logTransaction("receive_lines", {idStr:receiveLinesIdStr, start, end}, {msg:e.toString()}, true)
    })
  } else {
    console.error("jsw is undefined")
  }
}

const sendPortDataStr = document.querySelector<HTMLPreElement>('#last_tx')!
sendPortDataStr.innerText = "Hello world\r\n"
const sendEle = document.querySelector<HTMLButtonElement>('#send')!
sendEle.onclick = ()=>{
  if (jsw) {
    const sendPortIdStr = currentPortStrId.innerText
    const encoder = new TextEncoder();
    const sendStr = sendPortDataStr.innerText
    jsw.sendPort(parseInt(sendPortIdStr, 10), encoder.encode(sendStr),{})
    .then((result)=>{
      logTransaction("send", {idStr:sendPortIdStr, sendStr},{result})
    })
    .catch((e)=>{
      logTransaction("send", {idStr:sendPortIdStr, sendStr}, {msg:e.toString()}, true)
    })
  } else {
    console.error("jsw is undefined")
  }
}

const lastRxStr = document.querySelector<HTMLPreElement>('#last_rx')!
lastRxStr.innerText = " "
const portStoreResult = document.querySelector<HTMLPreElement>('#port_store_result')!
portStoreResult.innerText = "[]"
const portslenResult = document.querySelector<HTMLPreElement>('#portslen')!
portslenResult.innerText = '0'
const openSttStr = document.querySelector<HTMLPreElement>('#open_stt')!
openSttStr.innerText = ''
