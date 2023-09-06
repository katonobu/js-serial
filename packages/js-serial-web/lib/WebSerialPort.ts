import {
    AbstractSerialPort,
    deviceKeyPortInfoAvailableType,
    receivePortOptionType
} from "../../js-serial-core/lib/AbstractSerialPort";

export class WebSerialPort extends AbstractSerialPort{
    // https://ja.stackoverflow.com/questions/2046/javascript%E5%AE%9F%E8%A1%8C%E7%92%B0%E5%A2%83%E3%81%AE%E5%88%A4%E5%AE%9A%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
    // @ts-ignore
    private static isNode:boolean = (typeof process !== "undefined" && typeof require !== "undefined")

    private callUpdateRequest:(()=>void)|undefined
    private _closeReq:boolean
    private _reader:
    | ReadableStreamDefaultReader<Uint8Array>
    | ReadableStreamBYOBReader
    | undefined

    constructor(){
        super();
        this._closeReq = false
        this._reader = undefined
    }

    init = async (opt:object) => {
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

    getDeviceKeyPortInfos = async ()=>{
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
                    port
                }
            })
    //            console.log(result)
            return result
        }
    }
    promptGrantAccess = (opt:object)=> {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const requestOption = opt as SerialPortRequestOptions
            return navigator.serial.requestPort(requestOption)
        }
    }
    createPort = (path:string)=>{
        throw(new Error(`js-serial-web dosen't support createPort : ${path}`))
    }
    deletePort = async (dp:deviceKeyPortInfoAvailableType) => {
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp.port as SerialPort
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
            return dp.info
        }
    }
    openPort = async (dp:object, opt:object)=>{
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as SerialPort
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
    }
    receivePort = async (dp:object, byteLength:number, timeoutMs:number, option: receivePortOptionType) => {
        const port = dp as SerialPort
        if (byteLength === 0 && timeoutMs === 0) {
            // read infinit until close
            const { updateRx, bufferSize = 8 * 1024 /* 8KB */ } = option
            // if try to close, this._closeReq become true
            while (!this._closeReq && port && port.readable) {
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
                } finally {
                    if (this._reader) {
                        this._reader.releaseLock();
                        this._reader = undefined;
                    }
                }
            }

            if (!this._closeReq) {
                try {
                    await this.closePort(port)
                } catch (e) {
                    console.error(e);
                }
            } else {
                this._closeReq = false
            }
        } else {
            // read until specified byte reaches or timeout.
            // ToDo:実装する
        }
    }
    sendPort = async (
        dp:object,
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ) => {
        const port = dp as SerialPort
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
    closePort = async (dp:object)=>{
        if (WebSerialPort.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as SerialPort
            let errStr: string = '';
            if (port) {
                this._closeReq = true
                if (this._reader) {
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
                this._closeReq = false
            } else {
                errStr = 'specified port has been invalid';
            }
            if (errStr) {
                throw(new Error(errStr))
            }
        }
    }
    finalize = async () => {
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