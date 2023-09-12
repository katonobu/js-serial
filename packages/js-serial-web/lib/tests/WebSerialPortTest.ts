import { startReceiveReturnType } from "../../../js-serial-core/lib/AbstractSerial";
import WebSerailPort from "../WebSerialPort";

let newOpenStt:boolean | null = null
const validPortOption = {baudRate:115200} as SerialOptions
const dummyUpdateRx = (data:Uint8Array)=>{return 0<data.length?false:true}
const dummyUpdateOpenStt = (newStt:boolean)=>{newOpenStt = newStt}
const validStartRxOption = {
    updateRx:dummyUpdateRx,
    updateOpenStt:dummyUpdateOpenStt
}

const initWithNull = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    const invalidPort = null as unknown as SerialPort
    const wsp = new WebSerailPort(invalidPort)
    try {
        await wsp.deletePort()
        ngCount++
    }catch (e){
        console.log(e)
        okCount++
    }
    try {
        await wsp.openPort({baudRate:115200})
        ngCount++
    }catch (e){
        console.log(e)
        okCount++
    }
    try {
        await wsp.startReceivePort(validStartRxOption)
        ngCount++
    }catch (e){
        console.log(e)
        okCount++
    }
    try {
        await wsp.stopReceivePort()
        ngCount++
    }catch (e){
        console.log(e)
        okCount++
    }
    try {
        await wsp.sendPort(new Uint8Array(),{})
        ngCount++
    }catch (e){
        console.log(e)
        okCount++
    }
    try {
        await wsp.closePort()
        ngCount++
    }catch (e){
        console.log(e)
        okCount++
    }

    // check open/close successfully
    const vwsp = new WebSerailPort(validPort)
    try {
        if ((await vwsp.openPort(validPortOption)) === 'OK') { 
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    try {
        if ((await vwsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }

    return {okCount, ngCount}
}

const openError = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    const wsp = new WebSerailPort(validPort)
    // open option
    /// .baudRate===undefined
    try {
        const invalidPortOption = {} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    /// .baudRate===0
    try {
        const invalidPortOption = {baudRate:0} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    /*
    /// *** This test affect other tests ***
    /// 4.4 open() method The open() method steps 8.2
    /// .baudRate===HugeNumber
    /// operating system error=>"NetworkError" DOMException
    try {
        const invalidPortOption = {baudRate:1024*1024*1024} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    */
    /// 4.4 open() method The open() method steps 3
    /// .dataBits===6
    try {
        const invalidPortOption = {baudRate:115200, dataBits:6} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    /// 4.4 open() method The open() method steps 4
    /// .stopBits===3
    try {
        const invalidPortOption = {baudRate:115200, stopBits:3} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    /// 4.4 open() method The open() method steps 5
    /// .bufferSize===0
    try {
        const invalidPortOption = {baudRate:115200, bufferSize:0} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    /// 4.4 open() method The open() method steps 6
    /// .bufferSize===8M+1
    /// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/serial/serial_port.cc;l=45
    try {
        const invalidPortOption = {baudRate:115200, bufferSize:16 * 1024 * 1024 + 1} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    /// .parity==='stick0'
    /// must be "none"|"even"|"odd"
    try {
        const invalidPortOption = {baudRate:115200,  parity:'hoge'} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    /// .flowControl==='software'
    /// must be "none"|"hardware"    
    try {
        const invalidPortOption = {baudRate:115200,  flowControl:'software'} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }

    // check open/close successfully
    const vwsp = new WebSerailPort(validPort)
    try {
        if ((await vwsp.openPort(validPortOption)) === 'OK') { 
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    try {
        if ((await vwsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    return {okCount, ngCount}
}

const openClose = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    const wsp = new WebSerailPort(validPort)

    // open during open
    /// 4.4 open() method The open() method steps 2
    try {
        if ((await wsp.openPort(validPortOption)) === 'OK') { 
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    try {
        await wsp.openPort(validPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    try {
        if ((await wsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }

    // close during close
    /// 4.9 close() method The close() method steps 2
    try {
        await wsp.closePort()
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }

    // check open/close successfully
    const vwsp = new WebSerailPort(validPort)
    try {
        if ((await vwsp.openPort(validPortOption)) === 'OK') { 
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    try {
        if ((await vwsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    return {okCount, ngCount}
}
const readPort = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    const wsp = new WebSerailPort(validPort)

    // startReceivePort before open, throw exception
    /// 4.5 readable attribute The readable getter steps 2
    try {
        await wsp.startReceivePort(validStartRxOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }

    // start/stop returns 'Stop'
    if((await wsp.openPort(validPortOption)) === 'OK'){
        okCount++
    }else {
        ngCount++
    }
    let receivePromise:Promise<startReceiveReturnType> = wsp.startReceivePort(validStartRxOption);
    if((await wsp.stopReceivePort()) === 'OK'){
        okCount++
    }else{
        ngCount++
    }
    if((await receivePromise) === 'Stop'){
        okCount++
    }else{
        ngCount++
    }
    if((await wsp.closePort()) === 'OK'){
        okCount++
    } else {
        ngCount++
    }

    // port.readable.getReader() throws exception if readable is locked.
    if((await wsp.openPort(validPortOption)) === 'OK'){
        okCount++
    } else {
        ngCount++
    }
    receivePromise = wsp.startReceivePort(validStartRxOption);
    try{
        if (validPort.readable){
            validPort.readable.getReader()
        }
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    if ((await wsp.stopReceivePort()) === 'OK'){
        okCount++
    } else {
        ngCount++
    }
    if(await receivePromise === 'Stop'){
        okCount++
    } else {
        ngCount++
    }        
    if((await wsp.closePort()) === 'OK'){
        okCount++
    } else {
        ngCount++
    }        

    // call startReceivePort() during receiving, throw exception
    if((await wsp.openPort(validPortOption)) === 'OK'){
        okCount++
    } else {
        ngCount++
    }
    receivePromise = wsp.startReceivePort(validStartRxOption);
    try {
        await wsp.startReceivePort(validStartRxOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    if((await wsp.stopReceivePort()) === 'OK'){
        okCount++
    } else {
        ngCount++
    }        
    if((await receivePromise) === 'Stop'){
        okCount++
    } else {
        ngCount++
    }
    if ((await wsp.closePort()) === 'OK'){
        okCount++
    } else {
        ngCount++
    }

    // call closePort() during reading, returns 'Close'
    if ((await wsp.openPort(validPortOption)) === 'OK') {
        okCount++
    } else {
        ngCount++
    }
    receivePromise = wsp.startReceivePort(validStartRxOption);
    if ((await wsp.closePort()) === 'OK') {
        okCount++
    } else {
        ngCount++
    }
    if ((await receivePromise) === 'Close') {
        okCount++
    } else {
        ngCount++
    }

    // check open/close successfully
    const vwsp = new WebSerailPort(validPort)
    try {
        if ((await vwsp.openPort(validPortOption)) === 'OK') { 
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    try {
        if ((await vwsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    return {okCount, ngCount}
}

const detachAttachUsb = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    let wsp = new WebSerailPort(validPort)

    // Usb detach during reading, returns 'UsbDetached'
    /// 4.5 readable attribute The readable getter steps 5.pullAlgorithm 3.2.7.2
    try{
        if ((await wsp.openPort(validPortOption)) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
        let receivePromise:Promise<startReceiveReturnType> = wsp.startReceivePort(validStartRxOption);
        const prevPortCount = (await navigator.serial.getPorts()).length
        window.alert("USBを取り外してください");
        if ((await receivePromise) === 'UsbDetached') {
            okCount++
        } else {
            ngCount++
        }
        if (newOpenStt === false) {
            okCount++
        } else {
            ngCount++
        }
        newOpenStt = null
        window.alert("USBを接続してください")
        let currentPortCount = (await navigator.serial.getPorts()).length
        while(prevPortCount != currentPortCount) {
            await new Promise((resolve)=>setTimeout(resolve, 100))
            currentPortCount = (await navigator.serial.getPorts()).length
        }
    }catch (e) {
        ngCount++
        console.error(e)
    }

    // Usb detach during writing, returns 'UsbDetached'
    /// 4.6 writable attribute The writable getter steps 6.writeAlgorithm 5.2.3.2
    let ports = await navigator.serial.getPorts()
    wsp = new WebSerailPort(ports[ports.length - 1])
    const slowPortOption = {baudRate:1200} as SerialOptions
    try{
        if ((await wsp.openPort(slowPortOption)) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
        const sizeInBytes = 120 * 1024 * 1024
        const msg = new Uint8Array(sizeInBytes);
        let writePromise = wsp.sendPort(msg,{})
        const prevPortCount = (await navigator.serial.getPorts()).length
        window.alert("USBを取り外してください");
        if ((await writePromise) === 'UsbDetached') {
            okCount++
        } else {
            ngCount++
        }
        /*
        if (newOpenStt === false) {
            okCount++
        } else {
            ngCount++
        }
        newOpenStt = null
        */
        window.alert("USBを接続してください")
        let currentPortCount = (await navigator.serial.getPorts()).length
        while(prevPortCount != currentPortCount) {
            await new Promise((resolve)=>setTimeout(resolve, 100))
            currentPortCount = (await navigator.serial.getPorts()).length
        }
    }catch (e) {
        ngCount++
        console.error(e)
    }

    // Usb detach during both reading/writing, returns 'UsbDetached'
    /// 4.5 readable attribute The readable getter steps 5.pullAlgorithm 3.2.7.2
    /// 4.6 writable attribute The writable getter steps 6.writeAlgorithm 5.2.3.2
    ports = await navigator.serial.getPorts()
    wsp = new WebSerailPort(ports[ports.length - 1])
    try{
        if ((await wsp.openPort(slowPortOption)) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
        const sizeInBytes = 120 * 1024 * 1024
        const msg = new Uint8Array(sizeInBytes);
        let writePromise = wsp.sendPort(msg,{})
        let receivePromise:Promise<startReceiveReturnType> = wsp.startReceivePort(validStartRxOption);
        const prevPortCount = (await navigator.serial.getPorts()).length
        window.alert("USBを取り外してください");
        if ((await writePromise) === 'UsbDetached') {
            okCount++
        } else {
            ngCount++
        }
        if ((await receivePromise) === 'UsbDetached') {
            okCount++
        } else {
            ngCount++
        }
        if (newOpenStt === false) {
            okCount++
        } else {
            ngCount++
        }
        newOpenStt = null
        window.alert("USBを接続してください")
        let currentPortCount = (await navigator.serial.getPorts()).length
        while(prevPortCount != currentPortCount) {
            await new Promise((resolve)=>setTimeout(resolve, 100))
            currentPortCount = (await navigator.serial.getPorts()).length
        }
    }catch (e) {
        ngCount++
        console.error(e)
    }
    return {okCount, ngCount}
}

const writeError = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    const wsp = new WebSerailPort(validPort)
    const slowPortOption = {baudRate:1200} as SerialOptions

    // send non Uint8Array, throw Exception
    /// 4.6 writable attribute The writable getter steps 6.writeAlgorithm 3
    try {
        if ((await wsp.openPort(slowPortOption)) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        ngCount++
        console.error(e)
    }
    const invalidMsg = 1.234 as unknown as Uint8Array
    try {
        await wsp.sendPort(invalidMsg,{})
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    try {
        if ((await wsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }

    // send returns "OK", it takes about 6.5sec
    try {
        if ((await wsp.openPort(slowPortOption)) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        ngCount++
        console.error(e)
    }
    // baud=1200 => 1200bit/sec
    // 1BytePayload = 1(start)+8(data)+1(stop) = 10[bits]
    // 120[byte/sec]
    // 120 * 35:  1.9861999998092652[sec]
    // 120 * 40:  6.2355999999046325[sec]
    // 120 * 50: 16.86109999990463[sec]
    // 120 * 60: 27.486299999713896[sec]
    let sizeInBytes = 120 * 40// at least 10sec is needed to send.
    let msg = new Uint8Array(sizeInBytes);
    try {
        const startTime = performance.now();        
        await wsp.sendPort(msg,{})
        const endTime = performance.now();
        console.log(`Duration of sending ${sizeInBytes}Bytes is ${(endTime - startTime)/1000}[sec]`)
        okCount++
    }catch (e) {
        console.log(e)
        ngCount++
    }
    try {
        if ((await wsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }

    // close duaring sending, returns "Close"
    /// 4.6 writable attribute The writable getter steps 7.abortAlgorithm 
    try {
        if ((await wsp.openPort(slowPortOption)) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        ngCount++
        console.error(e)
    }
    sizeInBytes = 120 * 60
    msg = new Uint8Array(sizeInBytes);
    const sendPromise = wsp.sendPort(msg,{})
    try {
        if ((await wsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    if ((await sendPromise) === "Close") {
        okCount++
    } else {
        ngCount++
    }

    // check open/close successfully
    const vwsp = new WebSerailPort(validPort)
    try {
        if ((await vwsp.openPort(validPortOption)) === 'OK') { 
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }
    try {
        if ((await vwsp.closePort()) === 'OK') {
            okCount++
        } else {
            ngCount++
        }
    }catch (e) {
        console.log(e)
        ngCount++
    }

    return {okCount, ngCount}
}



const  webSerailPortTest = async (validSerialPort:SerialPort)=>{
    const initWithNullResult = {...(await initWithNull(validSerialPort)),test:"initWithNull"}
    console.log(JSON.stringify(initWithNullResult))

    const openCloseResult = {...(await openClose(validSerialPort)), test:"openClose"}
    console.log(JSON.stringify(openCloseResult))

    const readPortResult = {...(await readPort(validSerialPort)), test:"readPort"}
    console.log(JSON.stringify(readPortResult))

    const openErrorResult = {...(await openError(validSerialPort)), test:"openError"}
    console.log(JSON.stringify(openErrorResult))

    const writeErrorResult = {...(await writeError(validSerialPort)), test:"writeError"}
    console.log(JSON.stringify(writeErrorResult))

    const detachAttachUsbResult = {...(await detachAttachUsb(validSerialPort)), test:"detachAttachUsbResult"}
    console.log(JSON.stringify(detachAttachUsbResult))

    return [
        initWithNullResult,
        openCloseResult,
        openErrorResult,
        readPortResult,
        writeErrorResult,
        detachAttachUsbResult        
    ]
}

export default webSerailPortTest


/*
エラー仕様
3.1 requestPort()
3.1.2 ポリシー制御で許可されていない=>"SecurityError" DOMException
3.1.3 ユーザーアクションではない=>"SecurityError" DOMException
3.1.4 Filterオプションが指定されたが、usbVendorIdがない。=> TypeError 
3.1.5.5 ユーザーがポートを選択しなかった、=>"NotFoundError" DOMException

3.2 getPorts()
3.2.2 ポリシー制御で許可されていない=>"SecurityError" DOMException

4.4 open()
4.4.8.2 operating system error発生=>"NetworkError" DOMException

4.5 readable
4.5 readable.5.pullAlgorithm
4.5.5.3.2.2. buffer overrun発生=>"BufferOverrunError" DOMException
4.5.5.3.2.3. break発生=>"BreakError" DOMException
4.5.5.3.2.4. framing error発生=>"FramingError" DOMException
4.5.5.3.2.5. parity error発生=>"ParityError" DOMException
4.5.5.3.2.6. operating system error発生=>"UnknownError" DOMException
4.5.5.3.2.7. portが抜かれた=>"NetworkError" DOMException


4.6.writable
6 writeAlgorithm 
6.5.2.2 operating system error発生=>"UnknownError" DOMException

4.7 setSignals()
4.7.2. openedではない状態でopenが呼ばれた=>"InvalidStateError" DOMException
4.7.3. 引数に適切なメンバがない=> TypeError
4.7.4. operating system error発生=>"NetworkError" DOMException

4.8 getSignals() 
4.8.2. openedではない状態でopenが呼ばれた=>"InvalidStateError" DOMException
4.8.3.2. operating system error発生=>"NetworkError" DOMException

4.9 close()

//////////////////
[[readable]]
readable.getReader()
1. this.[[readable]]がnullでなければ、this.[[readable]]
2. stateがopenedでなければnull
3. readFataleならnull
9. new ReadableStream.
readable.close()
1. this.[[readable]] to null


[[writable]]
writable.getter()
1. this.[[writable]]がnullでなければ、this.[[writable]]
2. stateがopenedでなければnull
3. writeFataleならnull
11. new WritableStream.
writable.close()
1. Set this.[[writable]] to null.

[[readfatal]]
set true
  4.5.The readable getter steps 5.3.2.7.1
   If the port was disconnected
     Set this.[[readFatal]] to true,

set false
  4.9 The close() method steps 10.1.3
   read/writeともclose()処理が完了したら
     Set this.[[readFatal]] to false
*/