import {
    AbstractSerialPort,
    portInfoType,
    devicePortType,
    deviceKeyPortInfoType,
    deviceKeyPortInfoAvailableType,
    openOptionType,
    receivePortOptionType,
    startReceiveReturnType
} from "../../js-serial-core/lib/AbstractSerialPort";

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
    deletePort = async ():Promise<void> => {    
        const port = this._port
        let errStr: string = '';
        if (port) {
            try {
                await port.forget();
            } catch (e) {
                if (e instanceof Error) {
                    errStr = e.message;
                } else {
                    errStr = 'Error at forget';
                }
            }
        } else {
            errStr = 'specified port has been invalid';
        }
        if (errStr) {
            throw(new Error(errStr))
        }
    }
    openPort = async (opt:SerialOptions):Promise<void>=>{
        const port = this._port
        let errStr: string = '';
        if (port) {
            try {
                const openOption = opt as SerialOptions
                await port.open(openOption)
            } catch (e) {
                if (e instanceof Error) {
                    errStr = e.message;
                } else {
                    errStr = 'Open Error';
                }
            }
        } else {
            errStr = 'specified port has been invalid';
        }
        if (errStr) {
            throw(new Error(errStr))
        }
    }
    startReceivePort = async (option: receivePortOptionType):Promise<startReceiveReturnType> => {
        const port = this._port
        let result:startReceiveReturnType | undefined = undefined
        if (!port) {
            result = "InvalidId"
        } else if (!port.readable) {
            result = "NotOpen"
        } else if (port.readable.locked) {
            result = "AlreadyStartReceive"
        } else {
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
                    console.error(e);
                    if (10 < errorCount++) {
                        console.error("Too many error")
                        result = "TooManyRecoverbleError"
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
                    console.error(e);
                }
                result = result?result:"UsbDetached"
            }
        }
        return result
    }
    stopReceivePort = async ():Promise<void> => {
        if (this._port) {
            this._stopReadReq = true
            this._closeReq = false
            if (this._reader) {
                await this._reader.cancel()
            }
        }
    }
    sendPort = async (
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<string> => {
        const port = this._port
        let errStr: string = '';
        if (port) {
            if (port.writable) {
                try {
                    const writer = port.writable.getWriter();
                    await writer.write(msg);
                    writer.releaseLock();
                } catch (e) {
                    errStr = 'Error while writing message.';
                }
            } else {
                errStr = 'port is not writable';
            }
        }
        return errStr;
    }    
    closePort = async ():Promise<void>=>{
        const port = this._port
        let errStr: string = '';
        if (port) {
            if (this._reader) {
                this._stopReadReq = true
                this._closeReq = true
                await this._reader.cancel()
            }
            try {
                await port.close()
            } catch (e) {
                if (e instanceof Error) {
                    errStr = e.message;
                } else {
                    errStr = 'Close Error';
                }
            }
        } else {
            errStr = 'specified port has been invalid';
        }
        if (errStr) {
            throw(new Error(errStr))
        }
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
    openPort = async (dp:devicePortType, opt:openOptionType):Promise<void>=>{
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as Port
            return port.openPort(opt)
        }
    }
    startReceivePort = async (dp:devicePortType, option: receivePortOptionType):Promise<startReceiveReturnType> => {
        const port = dp as Port
        return port.startReceivePort(option)
    }
    stopReceivePort = async (dp:devicePortType):Promise<void> => {
        const port = dp as Port
        return port.stopReceivePort()
    }
    sendPort = async (
        dp:devicePortType,
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<string> => {
        const port = dp as Port
        return port.sendPort(msg, option)
    }
    closePort = async (dp:object):Promise<void>=>{
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