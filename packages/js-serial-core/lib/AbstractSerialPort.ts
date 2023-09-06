export type portIdType = number
export type portInfoType = {
    id:portIdType,
    pid:number,
    vid:number,
    portName?:string
}
type devicePortType = object /* SerialPort */
export type compareKeyType = string | devicePortType
type deviceKeyPortInfoType = {
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

export type receivePortOptionType = {
    updateRx:(arg0: Uint8Array)=>boolean;
    bufferSize?: number
}

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
type OpenPortFunction = (devicePort:devicePortType, option:any/*openOption*/)=>Promise<void>
type ReceivePortFunction = (deviePort:devicePortType, byteLength: number, timeoutMs: number, option:receivePortOptionType)=>Promise<any>
type SendPortFunction = (deviePort:devicePortType, msg: Uint8Array, option:object)=>Promise<any>
type ClosePortFunction = (devicePort:devicePortType)=>Promise<void>
type FinalizeFunction = (opt:object) => Promise<void>

export abstract class AbstractSerialPort{
    abstract init:InitFunction
    abstract getDeviceKeyPortInfos:GetDeviceKeyPortInfosFunction
    abstract promptGrantAccess:PromptGrantAccessFunction
    abstract createPort:CreatePortFunction
    abstract deletePort:DeletePortFunction
    abstract openPort:OpenPortFunction
    abstract receivePort:ReceivePortFunction
    abstract sendPort:SendPortFunction
    abstract closePort:ClosePortFunction
    abstract finalize:FinalizeFunction
}
