import { startReceiveReturnType } from "../../js-serial-core/lib/AbstractSerial";
import WebSerailPort from "./WebSerialPort";

const validPortOption = {baudRate:115200} as SerialOptions
const dummyUpdateRx = (data:Uint8Array)=>{console.log(data);return false}
const validStartRxOption = {updateRx:dummyUpdateRx}

const initWithNull = async ()=> {
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
    return {okCount, ngCount}
}

const openClose = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    const wsp = new WebSerailPort(validPort)

    // open引数異常
    try {
        const invalidPortOption = {} as unknown as SerialOptions
        await wsp.openPort(invalidPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }

    // open多重発行
    (await wsp.openPort(validPortOption) === 'OK')?okCount++:ngCount++
    try {
        await wsp.openPort(validPortOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    (await wsp.closePort() === 'OK')?okCount++:ngCount++

    // close多重発行
    try {
        await wsp.closePort()
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    return {okCount, ngCount}
}
const readPort = async (validPort:SerialPort)=> {
    let okCount = 0
    let ngCount = 0
    const wsp = new WebSerailPort(validPort)

    // openしないでstartReceivePort
    try {
        await wsp.startReceivePort(validStartRxOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }

    // start/stop
    ((await wsp.openPort(validPortOption)) === 'OK')?okCount++:ngCount++
    let receivePromise:Promise<startReceiveReturnType> = wsp.startReceivePort(validStartRxOption);
    ((await wsp.stopReceivePort()) === 'OK')?okCount++:ngCount++
    (await receivePromise === 'Stop')?okCount++:ngCount++
    ((await wsp.closePort()) === 'OK')?okCount++:ngCount++

    // readableがロックされているときにport.readable.getReader()したら例外が発生する
    ((await wsp.openPort(validPortOption)) === 'OK')?okCount++:ngCount++
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
    ((await wsp.stopReceivePort()) === 'OK')?okCount++:ngCount++
    (await receivePromise === 'Stop')?okCount++:ngCount++
    ((await wsp.closePort()) === 'OK')?okCount++:ngCount++

    // startReceivePortの多重発行
    ((await wsp.openPort(validPortOption)) === 'OK')?okCount++:ngCount++
    receivePromise = wsp.startReceivePort(validStartRxOption);
    try {
        await wsp.startReceivePort(validStartRxOption)
        ngCount++
    }catch (e) {
        console.log(e)
        okCount++
    }
    ((await wsp.stopReceivePort()) === 'OK')?okCount++:ngCount++
    ((await receivePromise) === 'Stop')?okCount++:ngCount++
    ((await wsp.closePort()) === 'OK')?okCount++:ngCount++

    // read中のclose
    ((await wsp.openPort(validPortOption)) === 'OK')?okCount++:ngCount++
    receivePromise = wsp.startReceivePort(validStartRxOption);
    ((await wsp.closePort()) === 'OK')?okCount++:ngCount++
    ((await receivePromise) === 'Close')?okCount++:ngCount++

    // read中のUSB取り外し
    try{
        ((await wsp.openPort(validPortOption)) === 'OK')?okCount++:ngCount++
        receivePromise = wsp.startReceivePort(validStartRxOption);
        const prevPortCount = (await navigator.serial.getPorts()).length
        window.alert("USBを取り外してください");
        ((await receivePromise) === 'UsbDetached')?okCount++:ngCount++
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

const  webSerailPortTest = async (validSerialPort:SerialPort)=>{
    const initWithNullResult = {...(await initWithNull()),test:"initWithNull"}
    console.log(JSON.stringify(initWithNullResult))

    const openCloseResult = {...(await openClose(validSerialPort)), test:"openClose"}
    console.log(JSON.stringify(openCloseResult))

    // readPortは与えられたvalidSerialPortを外すので最後にテストすること
    const readPortResult = {...(await readPort(validSerialPort)), test:"readPort"}
    console.log(JSON.stringify(readPortResult))
    return [initWithNullResult, openCloseResult, readPortResult]
}

export default webSerailPortTest