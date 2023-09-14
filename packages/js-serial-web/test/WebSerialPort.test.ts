import { startReceiveReturnType } from "../lib/AbstractSerial";
import WebSerailPort from "../lib/WebSerialPort";
import { expect, it, describe } from 'vitest'

const requestDetachUsb = async()=>{
    let messagePre:HTMLPreElement | undefined
    let ports = await navigator.serial.getPorts()
    const vitestUiEle = document.getElementById('vitest-ui')!
    const orgHeight = vitestUiEle.style.height
    if(0 < ports.length){
        vitestUiEle.style.height="90vh"

        messagePre = document.createElement('pre')
        messagePre.textContent = 'Detach USB!'
        messagePre.id = 'detach-usb-request'
        vitestUiEle.before(messagePre)
    }
    while(0 < ports.length){
        await new Promise((resolve)=>setTimeout(resolve, 100))
        ports = await navigator.serial.getPorts()
    }
    if (messagePre) {
        document.body.removeChild(messagePre)
    }
    vitestUiEle.style.height=orgHeight
}

const getPort = async ()=>{
    let button:HTMLButtonElement | undefined
    let ports = await navigator.serial.getPorts()
    const vitestUiEle = document.getElementById('vitest-ui')!
    const orgHeight = vitestUiEle.style.height
    if(ports.length === 0){
        vitestUiEle.style.height="90vh"

        button = document.createElement('button')
        button.textContent = 'requestPort({})'
        button.onclick = ()=>navigator.serial.requestPort({})
        button.id = 'request-port'
        vitestUiEle.before(button)
    }
    while(ports.length === 0){
        await new Promise((resolve)=>setTimeout(resolve, 300))
        ports = await navigator.serial.getPorts()
    }
    if (button) {
        document.body.removeChild(button)
    }
    vitestUiEle.style.height=orgHeight

    return ports[ports.length - 1]
}

let newRxOpenStt:boolean | null = null
let newTxOpenStt:boolean | null = null
const dummyUpdateRx = (data:Uint8Array)=>{return 0<data.length?false:true}
const dummyRxUpdateOpenStt = (newStt:boolean)=>{newRxOpenStt = newStt}
const dummyTxUpdateOpenStt = (newStt:boolean)=>{newTxOpenStt = newStt}
const validStartRxOption = {
    updateRx:dummyUpdateRx,
    updateOpenStt:dummyRxUpdateOpenStt
}
const validSendPortOption = {
    updateOpenStt:dummyTxUpdateOpenStt
}
const validPortOption = {baudRate:115200} as SerialOptions
const slowPortOption = {baudRate:1200} as SerialOptions

describe.sequential('initWithNull throws Error', () => {
    const invalidPort = null as unknown as SerialPort
    const wsp = new WebSerailPort(invalidPort)
    it('deletePort', async () => {
        await expect(() => wsp.deletePort()).rejects.toThrowError(/deletePort/)
    })
    it('openPort', async ()=>{
        await expect(() => wsp.openPort(validPortOption)).rejects.toThrowError(/openPort/)
    })
    it('startReceivePort', async ()=>{
        await expect(() => wsp.startReceivePort(validStartRxOption)).rejects.toThrowError(/startReceivePort/)
    })
    it('stopReceivePort', async ()=>{
        await expect(() => wsp.stopReceivePort()).rejects.toThrowError(/stopReceive/)
    })
    it('sendPort', async ()=>{
        await expect(() => wsp.sendPort(new Uint8Array, validSendPortOption)).rejects.toThrowError(/sendPort/)
    })
    it('closePort', async ()=>{
        await expect(() => wsp.closePort()).rejects.toThrowError(/closePort/)
    })
})

describe.sequential('OpenPort Parameter error', async () => {
    const port = await getPort()
    const vwsp = new WebSerailPort(port)
    it('success open/close', async ()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('undefined baudRate throws TypeError', async()=>{
        const invalidPortOption = {} as unknown as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/baudRate/)
    })
    it('baudRate===0 throws TypeError', async()=>{
        const invalidPortOption = {baudRate:0} as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/baud rate/)
    })
    it('dataBits===6 throws TypeError', async()=>{
        /// 4.4 open() method The open() method steps 3
        const invalidPortOption = {baudRate:115200, dataBits:6} as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/data bits/)
    })
    it('stopBits===3 throws TypeError', async()=>{
        /// 4.4 open() method The open() method steps 4
        const invalidPortOption = {baudRate:115200, stopBits:3} as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/stop bits/)
    })
    it('bufferSize===0 throws TypeError', async()=>{
        /// 4.4 open() method The open() method steps 5
        const invalidPortOption = {baudRate:115200, bufferSize:0} as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/buffer size/)
    })
    it('bufferSize===16M+1 throws TypeError', async()=>{
        /// 4.4 open() method The open() method steps 6
        const invalidPortOption = {baudRate:115200, bufferSize:16 * 1024 * 1024 + 1} as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/buffer size/)
    })
    it('parity==="stick0" throws TypeError', async()=>{
        /// must be "none"|"even"|"odd"
        const invalidPortOption = {baudRate:115200,  parity:'stick0'} as unknown as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/parity/)
    })
    it('flowControl==="software" throws TypeError', async()=>{
        /// must be "none"|"hardware"
        const invalidPortOption = {baudRate:115200,  flowControl:'software'} as unknown as SerialOptions
        await expect(() => vwsp.openPort(invalidPortOption)).rejects.toThrowError(/flowControl/)
    })
    it('at last open/close successfully', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
})

describe.sequential('Over Open/Close error', async () => {
    const port = await getPort()
    const vwsp = new WebSerailPort(port)
    it('success open/close', async ()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('open during open', async()=>{
        /// 4.4 open() method The open() method steps 2
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        await expect(() => vwsp.openPort(validPortOption)).rejects.toThrowError(/open/)
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('close during close', async()=>{
        /// 4.9 close() method The close() method steps 2
        await expect(() => vwsp.closePort()).rejects.toThrowError(/close/)
    })
    it('at last open/close successfully', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
})

describe.sequential('readPort error', async () => {
    const port = await getPort()
    const vwsp = new WebSerailPort(port)
    it('success open/close', async ()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('startReceivePort before open, throw exception', async()=>{
        /// 4.5 readable attribute The readable getter steps 2
        await expect(() => vwsp.startReceivePort(validStartRxOption)).rejects.toThrowError(/startReceivePort/)
    })
    it('port.readable.getReader() throws exception if readable is locked.', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        let receivePromise:Promise<startReceiveReturnType> = vwsp.startReceivePort(validStartRxOption);        
        expect(port.readable).toBeTruthy()
        expect(() => port.readable && port.readable.getReader()).toThrowError(/getReader/)
        expect(await vwsp.stopReceivePort()).toBe('OK')
        expect(await receivePromise).toBe('Stop')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('call startReceivePort() during receiving, throw exception', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        let receivePromise:Promise<startReceiveReturnType> = vwsp.startReceivePort(validStartRxOption);
        await expect(() => vwsp.startReceivePort(validStartRxOption)).rejects.toThrowError(/startReceivePort/)
        expect(await vwsp.stopReceivePort()).toBe('OK')
        expect(await receivePromise).toBe('Stop')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('at last open/close successfully', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
})

describe.sequential('readPort success', async () => {
    const port = await getPort()
    const vwsp = new WebSerailPort(port)
    it('success open/close', async ()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('start/stop successfully', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        let receivePromise:Promise<startReceiveReturnType> = vwsp.startReceivePort(validStartRxOption);        
        expect(await vwsp.stopReceivePort()).toBe('OK')
        expect(await receivePromise).toBe('Stop')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('call closePort() during reading, returns "Close"', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        let receivePromise:Promise<startReceiveReturnType> = vwsp.startReceivePort(validStartRxOption);        
        expect(await vwsp.closePort()).toBe('OK')
        expect(await receivePromise).toBe('Close')
    })
    it('at last open/close successfully', async()=>{
        const port = await getPort()
        const vwsp = new WebSerailPort(port)
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    }, 30 * 1000)
})

describe.sequential('writePort', async () => {
    const port = await getPort()
    const vwsp = new WebSerailPort(port)
    it('success open/close', async ()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('send returns "OK" if data has sent', async()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        const sizeInBytes = 16
        const msg = new Uint8Array(sizeInBytes);
        expect(await vwsp.sendPort(msg,validSendPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('close duaring sending, returns "Close"', async()=>{
        /// 4.6 writable attribute The writable getter steps 7.abortAlgorithm 
        expect(await vwsp.openPort(slowPortOption)).toBe('OK')
        const sizeInBytes = 120 * 1024 * 1024
        const msg = new Uint8Array(sizeInBytes);
        let writePromise = vwsp.sendPort(msg,validSendPortOption)
        expect(await vwsp.closePort()).toBe('OK')
        expect(await writePromise).toBe('Close')
    })
    it('send non Uint8Array, throw Exception', async()=>{
        /// 4.6 writable attribute The writable getter steps 6.writeAlgorithm 3
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        const invalidMsg = 1.234 as unknown as Uint8Array        
        await expect(() => vwsp.sendPort(invalidMsg,validSendPortOption)).rejects.toThrowError(/Uint8Array/)
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('at last open/close successfully', async()=>{
        const port = await getPort()
        const vwsp = new WebSerailPort(port)
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    }, 30 * 1000)
})

describe.sequential('USB attach/detach', async () => {
//describe.skip('USB attach/detach', async () => {
        let port = await getPort()
    let vwsp = new WebSerailPort(port)
    it('success open/close', async ()=>{
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    })
    it('Usb detach during reading, returns "UsbDetached"', async()=>{
        /// 4.5 readable attribute The readable getter steps 5.pullAlgorithm 3.2.7.2
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        let receivePromise:Promise<startReceiveReturnType> = vwsp.startReceivePort(validStartRxOption);        
        await requestDetachUsb()
        expect(await receivePromise).toBe('UsbDetached')
        expect(newRxOpenStt).toBe(false)
        newRxOpenStt = null
        await expect(() => vwsp.closePort()).rejects.toThrowError(/close/)
    }, 30 * 1000)
    it('check environment recovery', async()=>{
        port = await getPort()
        vwsp = new WebSerailPort(port)
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    }, 30 * 1000)
    it('Usb detach during writing, returns "UsbDetached"', async()=>{
        /// 4.6 writable attribute The writable getter steps 6.writeAlgorithm 5.2.3.2
        expect(await vwsp.openPort(slowPortOption)).toBe('OK')
        const sizeInBytes = 120 * 1024 * 1024
        const msg = new Uint8Array(sizeInBytes);
        let writePromise = vwsp.sendPort(msg,validSendPortOption)
        await requestDetachUsb()
        expect(await writePromise).toBe('UsbDetached')
        expect(newTxOpenStt).toBe(false)
        newTxOpenStt = null
        await expect(() => vwsp.closePort()).rejects.toThrowError(/close/)
    }, 30 * 1000)
    it('check environment recovery', async()=>{
        port = await getPort()
        vwsp = new WebSerailPort(port)
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    }, 30 * 1000)
    it('Usb detach during both reading/writing, returns "UsbDetached"', async()=>{
        /// 4.5 readable attribute The readable getter steps 5.pullAlgorithm 3.2.7.2
        /// 4.6 writable attribute The writable getter steps 6.writeAlgorithm 5.2.3.2
        expect(await vwsp.openPort(slowPortOption)).toBe('OK')
        const sizeInBytes = 120 * 1024 * 1024
        const msg = new Uint8Array(sizeInBytes);
        let writePromise = vwsp.sendPort(msg,validSendPortOption)
        let receivePromise:Promise<startReceiveReturnType> = vwsp.startReceivePort(validStartRxOption);        
        await requestDetachUsb()
        expect(await writePromise).toBe('UsbDetached')
        expect(await receivePromise).toBe('UsbDetached')
        expect(newRxOpenStt).toBe(false)
        expect(newTxOpenStt).toBe(false)
        newRxOpenStt = null
        newTxOpenStt = null
        await expect(() => vwsp.closePort()).rejects.toThrowError(/close/)
    }, 30 * 1000)
    it('check environment recovery', async()=>{
        port = await getPort()
        vwsp = new WebSerailPort(port)
        expect(await vwsp.openPort(validPortOption)).toBe('OK')
        expect(await vwsp.closePort()).toBe('OK')
    }, 30 * 1000)
})

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