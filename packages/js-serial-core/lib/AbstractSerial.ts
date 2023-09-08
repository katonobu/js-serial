export type portIdType = number
export type portInfoType = {
    id:portIdType,
    pid:number,
    vid:number,
    portName?:string
}
export type devicePortType = object /* SerialPort */
export type compareKeyType = string | devicePortType
export type deviceKeyPortInfoType = {
    key:compareKeyType,
    info:portInfoType,
    port?:devicePortType
}

export type deviceKeyPortInfoAvailableType = {
    key:compareKeyType;
    info:portInfoType;
    port:devicePortType;
    available:boolean;
}

export type openOptionType = {
    baudRate:number
}

export type receivePortOptionType = {
    updateRx:(arg0: Uint8Array)=>boolean;
    bufferSize?: number
}

export type startReceiveReturnType = 
    "Close" |
    "Stop" |
    "UsbDetached" |
    "InvalidId" |
    "NotOpen" |
    "AlreadyStartReceive"

export class MicroStore<T> {
    private obj: T;
    private callbacks: Set<() => void>;

    constructor(initObj: T) {
        this.obj = initObj
        this.callbacks = new Set<() => void>();
    }
    subscribe(cb: () => void): () => void {
        this.callbacks.add(cb);
        return () => {
            this.callbacks.delete(cb)
            return
        };
    }
    update(newObj: T) {
        this.obj = newObj
        this.callbacks.forEach(cb => cb())
    }
    get(): T {
        return this.obj
    }
    getCallbacksLen():number{
        return this.callbacks.size
    }
}

type InitFunction = (opt:object) => Promise<void>
type GetDeviceKeyPortInfosFunction = () => Promise<deviceKeyPortInfoType[]>
type PromptGrantAccessFunction = (option:object/*createOption*/)=>Promise<devicePortType>
type CreatePortFunction = (path:string)=>devicePortType
type DeletePortFunction = (devicePort:deviceKeyPortInfoAvailableType)=>Promise<portInfoType>
type OpenPortFunction = (devicePort:devicePortType, option:openOptionType)=>Promise<string>
type StartReceivePortFunction = (deviePort:devicePortType, option:receivePortOptionType)=>Promise<startReceiveReturnType>
type StopReceivePortFunction = (deviePort:devicePortType)=>Promise<string>
type SendPortFunction = (deviePort:devicePortType, msg: Uint8Array, option:object)=>Promise<string>
type ClosePortFunction = (devicePort:devicePortType)=>Promise<string>
type FinalizeFunction = (opt:object) => Promise<void>

export abstract class AbstractSerial{
    abstract init:InitFunction
    abstract getDeviceKeyPortInfos:GetDeviceKeyPortInfosFunction
    abstract promptGrantAccess:PromptGrantAccessFunction
    abstract createPort:CreatePortFunction
    abstract deletePort:DeletePortFunction
    abstract openPort:OpenPortFunction
    abstract startReceivePort:StartReceivePortFunction
    abstract stopReceivePort:StopReceivePortFunction
    abstract sendPort:SendPortFunction
    abstract closePort:ClosePortFunction
    abstract finalize:FinalizeFunction
}
