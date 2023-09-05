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

export type GetDeviceKeyPortInfosFunction = () => Promise<deviceKeyPortInfoType[]>
export type PromptGrantAccessFunction = (option:object/*createOption*/)=>Promise<devicePortType>
export type CreatePortFunction = (path:string)=>devicePortType
export type DeletePortFunction = (devicePort:deviceKeyPortInfoAvailableType)=>Promise<portInfoType>
export type OpenPortFunction = (devicePort:devicePortType, option:any/*openOption*/)=>Promise<void>
export type ClosePortFunction = (devicePort:devicePortType)=>Promise<void>

export abstract class AbstructSerialPort{
    abstract getDeviceKeyPortInfos:GetDeviceKeyPortInfosFunction
    abstract promptGrantAccess:PromptGrantAccessFunction
    abstract createPort:CreatePortFunction
    abstract deletePort:DeletePortFunction
    abstract openPort:OpenPortFunction
    abstract closePort:ClosePortFunction
}
