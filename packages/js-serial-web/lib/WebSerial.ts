import {
    AbstractSerialPort,
    portInfoType,
    devicePortType,
    deviceKeyPortInfoType,
    deviceKeyPortInfoAvailableType,
    openOptionType,
    receivePortOptionType,
    startReceiveReturnType
} from "../../js-serial-core/lib/AbstractSerial";

class Port {
    private _port:SerialPort
    private _stopReadReq:boolean
    private _closeReq:boolean
    private _reader:
    | ReadableStreamDefaultReader<Uint8Array>
    | ReadableStreamBYOBReader
    | undefined
    constructor(serialPort:SerialPort) {
        this._port = serialPort
        this._stopReadReq = false
        this._closeReq = false
        this._reader = undefined
    }
    deletePort = async ():Promise<string> => {    
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to deletePort()")
        } else {
            await port.forget();
        }
        return "OK"
    }
    openPort = async (opt:SerialOptions):Promise<string>=>{
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to openPort()")
        } else {
            const openOption = opt as SerialOptions
            await port.open(openOption)
        }
        return "OK"
    }
    startReceivePort = async (option: receivePortOptionType):Promise<startReceiveReturnType> => {
        let result:startReceiveReturnType | undefined = undefined
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to startReceivePort()")
        } else if (!port.readable) {
            throw new Error("Port is not opened but try to startReceivePort()")
        } else if (port.readable.locked) {
            throw new Error("Already receive started, but try to startReceivePort()")
        } else {
            let tooManyError = false
            let errorCount = 0
            // read infinit until close
            const { updateRx, bufferSize = 8 * 1024 /* 8KB */ } = option
            while (!this._stopReadReq && port.readable) {
                try {
                    try {
                        this._reader = port.readable.getReader({ mode: 'byob' });
                    } catch {
                        this._reader = port.readable.getReader();
                    }

                    let buffer = null;
                    for (; ;) {
                        // eslint-disable-next-line
                        const { value, done } = await (async () => {
                            if (this._reader instanceof ReadableStreamBYOBReader) {
                                if (!buffer) {
                                    buffer = new ArrayBuffer(bufferSize);
                                }
                                const { value, done } = await this._reader.read(
                                    new Uint8Array(buffer, 0, bufferSize)
                                );
                                buffer = value?.buffer;
                                return { value, done };
                            } else {
                                if (this._reader) {
                                    return await this._reader.read();
                                } else {
                                    return { value: null, done: true };
                                }
                            }
                        })();

                        if (value) {
                            updateRx(value)
                        }
                        if (done) {
                            break;
                        }
                    }
                } catch (e) {
                    console.warn(e)
                    if (10 < errorCount++) {
                        tooManyError = true
                        break
                    }
                } finally {
                    if (this._reader) {
                        this._reader.releaseLock();
                        this._reader = undefined;
                    }
                }
            }

            if (this._stopReadReq === true) {
                this._stopReadReq = false
                if (this._closeReq === true) {
                    this._closeReq = false
                    result = "Close"
                } else {
                    result = "Stop"
                }
            } else {
                try {
                    await this.closePort()
                } catch (e) {
                    throw e
                }
                if (tooManyError) {
                    throw new Error("Too many errors in receiver loop")
                }
                result = "UsbDetached"
            }
        }
        return result
    }
    stopReceivePort = async ():Promise<string> => {
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to stopReceivePort()")
        } else if (!port.readable) {
            throw new Error("Port is not opened but try to stopReceivePort()")
        } else if (!port.readable.locked) {
            throw new Error("Receive may not started, but try to stopReceivePort()")
        } else if (this._reader === undefined) {
            throw new Error("Receive may not started, but try to stopReceivePort()")
        } else {
            this._stopReadReq = true
            this._closeReq = false
            await this._reader.cancel()
        }
        return "OK"
    }
    sendPort = async (
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<string> => {
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to sendPort()")
        } else if (!port.writable) {
            throw new Error("Port is not opened but try to sendPort()")
        } else if (port.writable.locked) {
            throw new Error("Writeter is locked, but try to sendPort()")
        } else {
                const writer = port.writable.getWriter();
                await writer.write(msg);
                writer.releaseLock();
        }
        return "OK"
    }    
    closePort = async ():Promise<string>=>{
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to closePort()")
        } else {
            if (this._reader) {
                this._stopReadReq = true
                this._closeReq = true
                await this._reader.cancel()
            }
            await port.close()
        }
        return "OK"
    }
}


export class WebSerialPort extends AbstractSerialPort{
    // https://ja.stackoverflow.com/questions/2046/javascript%E5%AE%9F%E8%A1%8C%E7%92%B0%E5%A2%83%E3%81%AE%E5%88%A4%E5%AE%9A%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
    // @ts-ignore
    private static isNode:boolean = (typeof process !== "undefined" && typeof require !== "undefined")
    private callUpdateRequest:(()=>void)|undefined

    constructor(){
        super();
    }

    init = async (opt:object):Promise<void> => {
        const option = opt as {portManager:{updateRequest:()=>Promise<void>}}
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            if (this.callUpdateRequest === undefined){
                this.callUpdateRequest = () => option.portManager.updateRequest()
                navigator.serial.addEventListener('connect', this.callUpdateRequest)
                navigator.serial.addEventListener('disconnect', this.callUpdateRequest)
            }
        }
    }

    getDeviceKeyPortInfos = async ():Promise<deviceKeyPortInfoType[]>=>{
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const currentPorts = await navigator.serial.getPorts()
            const result = currentPorts.map((port)=>{
                const portInfo = port.getInfo()
                return {
                    key:port,
                    info:{
                        id:-1,
                        pid:portInfo.usbProductId ?? 0,
                        vid:portInfo.usbVendorId ?? 0,
                    },
                    port:new Port(port)
                }
            })
    //            console.log(result)
            return result
        }
    }
    promptGrantAccess = async (opt:object):Promise<devicePortType>=> {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const requestOption = opt as SerialPortRequestOptions
            return navigator.serial.requestPort(requestOption)
        }
    }
    createPort = (path:string):devicePortType=>{
        throw(new Error(`js-serial-web dosen't support createPort : ${path}`))
    }
    deletePort = async (dp:deviceKeyPortInfoAvailableType):Promise<portInfoType> => {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp.port as Port
            port.deletePort()
            return dp.info
        }
    }
    openPort = async (dp:devicePortType, opt:openOptionType):Promise<string>=>{
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as Port
            return port.openPort(opt)
        }
    }
    startReceivePort = async (dp:devicePortType, option: receivePortOptionType):Promise<startReceiveReturnType> => {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as Port
            return port.startReceivePort(option)
        }
    }
    stopReceivePort = async (dp:devicePortType):Promise<string> => {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as Port
            return port.stopReceivePort()
        }
    }
    sendPort = async (
        dp:devicePortType,
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<string> => {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as Port
            return port.sendPort(msg, option)
        }
    }
    closePort = async (dp:object):Promise<string>=>{
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as Port
            return port.closePort()
        }
    }
    finalize = async ():Promise<void> => {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            if (this.callUpdateRequest) {
                navigator.serial.removeEventListener('connect', this.callUpdateRequest)
                navigator.serial.removeEventListener('disconnect', this.callUpdateRequest)
                this.callUpdateRequest = undefined
            }
        }
    }
}