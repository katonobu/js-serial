import {
    receivePortOptionType,
    startReceiveReturnType,
    sendPortReturnType,
    openOptionType
} from "./AbstractSerial";

export default class WebSerailPort {
    private readonly _port:SerialPort
    private _stopReadReq:boolean
    private _stopReqFromClose:boolean
    private _reader: ReadableStreamDefaultReader<Uint8Array>
    | ReadableStreamBYOBReader
    | undefined
    private _writer: WritableStreamDefaultWriter<Uint8Array> | undefined
    constructor(serialPort:SerialPort) {
        this._port = serialPort
        this._stopReadReq = false
        this._stopReqFromClose = false
        this._reader = undefined
        this._writer = undefined
    }
    deletePort = async ():Promise<string> => {    
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to deletePort()")
        } else {
            // not reject described in https://wicg.github.io/serial/#forget-method
            await port.forget();
        }
        return "OK"
    }
    openPort = async (opt:openOptionType):Promise<string>=>{
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to openPort()")
        } else {
            const openOption = opt.serialOptions
            // rejected if (described in https://wicg.github.io/serial/#open-method)
            //   not closed:"InvalidStateError" DOMException
            //   options["dataBits"] is not 7 or 8: TypeError 
            //   options["stopBits"] is not 1 or 2: TypeError 
            //   options["bufferSize"] is 0: TypeError 
            //   options["bufferSize"] is larger than the implementation is able to support: TypeError 
            //     16 * 1024 * 1024; /* 16 MiB */ https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/serial/serial_port.cc;l=45;bpv=0;bpt=1
            //   fail to invoke the operating system to open the serial port:"NetworkError" DOMException
            // rejected if
            //     not described in https://wicg.github.io/serial/#open-method)
            //     but coded in https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/serial/
            //   options["baudRate"] is not exist: TypeError 
            //   options["baudRate"] is 0: TypeError 
            //   options["parity"] is not 'none','even' or 'odd':  NOTREACHED()
            // not rejected if
            //   options["flowControl"] is not 'hardware': ignored?

            await port.open(openOption)
        }
        return "OK"
    }
    startReceivePort = async (option: receivePortOptionType):Promise<startReceiveReturnType> => {
        let result:startReceiveReturnType | undefined = undefined
        let getLockFailed:boolean = false
        let usbDisconnected:boolean = false
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to startReceivePort()")
        } else if (!port.readable) {
            throw new Error("Port is not opened but try to startReceivePort()")
        } else if (port.readable.locked) {
            throw new Error("Already receive started, but try to startReceivePort()")
        } else {
            let errorCount = 0
            let errorCounts:{nw:number, bo:number, bk:number, fr:number, pe:number, uk:number, ot:number}
             = {nw:0, bo:0, bk:0, fr:0, pe:0, uk:0, ot:0}

            // read infinit until close
            const { 
                updateRx,
                updateOpenStt,
                recoverableErrorCountMax = 10,
                bufferSize = 8 * 1024 /* 8KB */ 
            } = option
            while (!this._stopReadReq && port.readable) {
                try {
                    // port.readable.getReader() returns
                    // If this.[[readable]] is not null, return this.[[readable]].
                    //   In experimental result,
                    //   reject if port.readable.locked
                    //     TypeError
                    //     message: "Failed to execute 'getReader' on 'ReadableStream': ReadableStreamDefaultReader constructor can only accept readable streams that are not yet locked to a reader"
                    //   -> this will be protected if (port.readable.locked)
                    // If this.[[state]] is not "opened", return null. -> this will be protect by `if (!port.readable)`
                    // If this.[[readFatal]] is true, return null. -> this will be protect by `while (port.readable)`
                    // Return new ReadableStream.
                    try {
                        this._reader = port.readable.getReader({ mode: 'byob' });
                    } catch {
                        this._reader = port.readable.getReader();
                    }

                    let buffer = null;
                    for (;;) {
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
                                    // this._reader.read() reject
                                    //   If a buffer overrun condition was encountered: "BufferOverrunError" DOMException
                                    //   If a break condition was encountered: "BreakError" DOMException
                                    //   If a framing error was encountered: "FramingError" DOMException
                                    //   If a parity error was encountered: "ParityError" DOMException
                                    //   If an operating system error was encountered: "UnknownError" DOMException
                                    //   If the port was disconnected: "NetworkError" DOMException
                                    return await this._reader.read();
                                } else {
                                    // assuming never come here, but just in case.
                                    return { value: null, done: true };
                                }
                            }
                        })();

                        if (value) {
                            updateRx(value)
                        }
                        if (done) {
                            // in this situation, port.readable is truly
                            // but this._stopReadReq is true, so break `while (!this._stopReadReq && port.readable)`
                            break; // for(;;)
                        }
                    }
                } catch (e) {
                    if (e instanceof TypeError) {
                        // Not described in spec, but
                        // port.readable.getReader() throws TypeError.
                        // This is protected by `if (port.readable.locked)`
                        // But just in case, and prevent to infinit loop
                        // break this loop
                        getLockFailed = true
                        break // while (!this._stopReadReq && port.readable)
                    } else if (e instanceof DOMException) {
                        if (e.name === "NetworkError") {
                            // USB Disconnected
                            // this makes port.readable to be null, so break `while (!this._stopReadReq && port.readable)`
                            errorCounts.nw++
                            usbDisconnected = true
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
                            // uncategorized error.
                            errorCounts.ot++
                            errorCount++
                        }
                    }
                    if (recoverableErrorCountMax < errorCount) {
                        break // while (!this._stopReadReq && port.readable)
                    }
                } finally {
                    if (this._reader) {
                        this._reader.releaseLock();
                        this._reader = undefined;
                    }
                }
            }

            if (getLockFailed || (recoverableErrorCountMax < errorCount) || usbDisconnected){
                // invoke closePort()
                let closeError = undefined
                try {
                    await this.closePort()
                    updateOpenStt(false)
                } catch (e) {
                    closeError = e
                }
                if (getLockFailed) {
                    throw new Error('Fail to get lock ReadableStream in startReceivePort()')
                } else if (recoverableErrorCountMax < errorCount) {
                    throw new Error(`Too many recoverble errors:${JSON.stringify(errorCounts)}`)
                } else if (this._stopReadReq === false) {
                    if (closeError) {
                        throw closeError
                    } else {
                        result = "UsbDetached"
                    }
                } else {
                    if (closeError) {
                        throw closeError
                    } else {
                        throw new Error('Unexpected error in startReceivePort()')
                    }
                }
            } else {
                // break by stopReceivePort() is called or closePort() is called
                this._stopReadReq = false
                if (this._stopReqFromClose === true) {
                    this._stopReqFromClose = false
                    result = "Close"
                } else {
                    result = "Stop"
                }
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
            this._stopReqFromClose = false
            // this._reader.cancel() makes this._reader to be null
            await this._reader.cancel()
        }
        return "OK"
    }
    sendPort = async (
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<sendPortReturnType> => {
        let retStr:sendPortReturnType = "OK"
        const port = this._port
        const { 
            updateOpenStt,
        } = option

        if (!port) {
            throw new Error("Invalid Id is specified to sendPort()")
        } else if (!port.writable) {
            throw new Error("Port is not opened but try to sendPort()")
        } else if (port.writable.locked) {
            throw new Error("Writeter is locked, but try to sendPort()")
        } else if (!(msg instanceof Uint8Array)) {
            // if invalid type is used, can't close port, so protect here.
            throw new Error("msg to send must be instance of Uint8Array")
        } else {
            let usbDisconnected:boolean = false
            this._writer = port.writable.getWriter();
            try {
                await this._writer.write(msg);
            } catch (e) {
                if (e instanceof DOMException) {
                    if (e.name === "NetworkError") {
                        // USB Disconnected
                        // this makes port.readable to be null, so break `while (!this._stopReadReq && port.readable)`
                        usbDisconnected = true
                        retStr = "UsbDetached"
                    } else {
                        throw e
                    }
                } else if (typeof e === 'string') {
                    // e is reason of this._write.abort(reason)
                    // maybe "Close"
                    if (e === "Close") {
                        retStr = "Close"
                    } else {
                        throw e
                    }
                } else {
                    throw e
                }
            } finally {
                if (this._writer) {
                    this._writer.releaseLock();
                    this._writer = undefined
                }
            }
            if (usbDisconnected) {
                if (this._reader === undefined) {
                    try {
                        await this.closePort()
                    } catch (e) {
                        throw e
                    }
                }
                updateOpenStt(false)
            }
        }
        return retStr
    }    
    closePort = async ():Promise<string>=>{
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to closePort()")
        } else {
            if (this._writer) {
                await this._writer.abort("Close")
            }
            if (this._reader) {
                this._stopReadReq = true
                this._stopReqFromClose = true
                // this._reader.cancel() makes this._reader to be null
                await this._reader.cancel("Close")
            }
            await port.close()
        }
        return "OK"
    }
}

