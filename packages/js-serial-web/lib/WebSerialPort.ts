import {
    receivePortOptionType,
    startReceiveReturnType
} from "../../js-serial-core/lib/AbstractSerial";

export default class WebSerailPort {
    private readonly _port:SerialPort
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
            let errorCount = 0
            let errorCounts:{bo:number, bk:number, fr:number, pe:number, uk:number, ot:number} = {bo:0, bk:0, fr:0, pe:0, uk:0, ot:0}

            // read infinit until close
            const { 
                updateRx,
                recoverableErrorCountMax = 10,
                bufferSize = 8 * 1024 /* 8KB */ 
            } = option
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
                    if (e instanceof DOMException) {
                        if (e.name === "NetworkError") {
                            // USB Disconnected
                        } else if (e.name === "BufferOverrunError"){
                            errorCounts.bo++
                            errorCount++                            
                        } else if (e.name === "BreakError"){
                            errorCounts.bk++
                            errorCount++                            
                        } else if (e.name === "FramingError"){
                            errorCounts.fr++
                            errorCount++                            
                        } else if (e.name === "ParityError"){
                            errorCounts.pe++
                            errorCount++
                        } else if (e.name === "UnknownError"){
                            errorCounts.uk++
                            errorCount++
                        } else {
                            errorCounts.ot++
                            errorCount++
                        }
                    }
                    if (recoverableErrorCountMax < errorCount) {
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
                if (recoverableErrorCountMax < errorCount) {
                    throw new Error(`Too many recoverble errors:${JSON.stringify(errorCounts)}`)
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
