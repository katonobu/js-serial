import { 
    portIdType, 
    devicePortType,    
    portStoreCurrentType,
    compareKeyType, 
    openOptionType,
    deviceKeyPortInfoAvailableType,    
    updateRequestReasonType,
    MicroStore, 
    AbstractSerial,
} from './AbstractSerial'

interface rxLineNumType {
    totalLines:number;
    updatedLines:number
}

interface rxLineUpdateType {
    ts:number,
    data:any,
}

interface rxLineBuffType extends rxLineUpdateType {
    id:number // sequencial id in the buffer
}

interface rxLinesType {
    data:rxLineBuffType[];
    total:number;
}

interface portStoreType{
    curr:portStoreCurrentType[];
    attached:portIdType[];
    detached:portIdType[];
    changeId:number
}

export type AbstractDataHandlerFunction = (data:Uint8Array)=>any[]
export abstract class AbstractDataHandler{
    abstract handler:AbstractDataHandlerFunction
}

export type DelimiterDataHandlerOptions = {
    newLineCode:string | RegExp
}
export class DelimiterDataHandler extends AbstractDataHandler{
    private _lastLine:string
    private _delimiter:string | RegExp
    constructor(options:DelimiterDataHandlerOptions = {newLineCode:"\n"}){
        super()
        this._lastLine = ''
        this._delimiter = options.newLineCode
    }
    handler = (data:Uint8Array):string[] => {
        let lines = (this._lastLine + new TextDecoder().decode(data)).split(this._delimiter)
        const lastItem:string | undefined = lines.pop()
        if (typeof lastItem === 'string') {
          this._lastLine = lastItem
        } else {
          this._lastLine = ""
        }
        return lines
    }
}

export class JsSerialBase{
    private _idToObj:deviceKeyPortInfoAvailableType[]
    private _currentKeysCache:compareKeyType[]
    private _portStore:MicroStore<portStoreType>
    private _openCloseSttStore:MicroStore<boolean>[]
    private _rxLineBuffers:rxLineBuffType[][]
    private _rxLineNumStore:MicroStore<rxLineNumType>[]
    private _serial:AbstractSerial
    private _rxDataHandler:AbstractDataHandler
    private _updateCount:number

    /**
     * JsSerialBaseクラスのコンストラクタ
     * @param serial AbstructSerialクラスを基底クラスとするクラス(WebSerial)のインスタンス。
     */
    constructor(
        serial:AbstractSerial,
    ){
        this._idToObj = []
        this._currentKeysCache  = []
        this._portStore = new MicroStore<portStoreType>({curr:[],attached:[],detached:[],changeId:0})
        this._openCloseSttStore = []
        this._rxLineBuffers = []
        this._rxLineNumStore = []
        this._serial = serial
        this._rxDataHandler = new DelimiterDataHandler()
        this._updateCount = 0
    }

    /**
     * 初期化処理
     * コンストラクタで与えられたクラスの初期化を行い、接続デバイスを検出後、接続デバイスデータの初期化を行います。
     * @param opt pollingIntervalMsメンバでPlug&Play検出インターバルをms単位の数値で指定できますが、WebSerialでは参照されません。
     */
    async init(opt:{pollingIntervalMs?:number} = {}):Promise<void> {
        await this._serial.init({portManager:this, pollingIntervalMs:opt?.pollingIntervalMs})
        await this.updateRequest("Init")
    }

    /**
     * ユーザーに対してシリアルポートのアクセス要求ダイアログを表示させます。
     * WebSerialで有効です。
     * @param option フィルタさせたいpid,vidを指定します。
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Serial/requestPort#parameters
     * @returns 新たにアクセス許可されたデバイスが追加された場合、そのデバイスのid,pid,vidを返します。
     *     ユーザーがキャンセルした場合はthrowせず、id,vid,pidとも-1の値を返します。
     *     ユーザーが既存デバイスを選択した場合、id,vid,pidとも-1の値を返します。
     * @throws ユーザーアクション由来でこの関数が呼ばれていない場合DOMException.SecurityErrorをthrowします。
     *     vidしか指定しなかった場合TypeErrorをthrowします。
     * @todo 既存デバイス選択時とキャンセルした時を分けるか?
     */
    async promptGrantAccess(option:any/*createOption*/ = {}):Promise<portStoreCurrentType> {
        try {
            const newPort = await this._serial.promptGrantAccess(option) as BluetoothDevice
            await this.updateRequest("GrantReq", newPort)
            const matched:deviceKeyPortInfoAvailableType|undefined = this._idToObj.find((obj)=>obj.key===newPort.id)
            if (matched) {
                return {...matched.info, available:matched.available}
            } else {
                return {id:-1, pid:-1, vid:-1, available:false, reason:'GrantReq'}
            }
        }catch(e) {
            if (e instanceof TypeError) {
                throw e
            } else if (e instanceof DOMException) {
                if (e.name === "NotFoundError") {
                    // user cancel
                    return {id:-1, pid:-1, vid:-1, name:"", deviceId:"", available:false, reason:'GrantReq'}
                } else if (e.name === 'SecurityError') {
                    // not user gesture
                } else {
                    // unknown
                }
                throw e
            } else {
                throw e
            }
        }
    }
    /**
     * 引数で指定されたシリアルポートのアクセス許可を取り消します。
     * @param id getPorts()で得られるポートのidを指定します。
     * @returns 取り消したポートのid,pid,vidを返します。異常発生時はid=pid=vid=-1を返します。
     */
    async deletePort(id:portIdType):Promise<portStoreCurrentType> {
        try {
            const ret = await this._serial.deletePort(this._idToObj[id])
            await this.updateRequest("Deleted")
            return ret
        } catch (e) {
            console.log(e)
            return {id:-1, pid:-1, vid:-1, name:"", deviceId:"", available:false, reason:"Deleted"}
        }
    }
    /**
     * 引数で指定されたシリアルポートをopenします。
     * @param id getPorts()で得られるポートのidを指定します。
     * @param option baudRate(必須),bufferSize,dataBits,flowControl,parity,stopBits を指定します。 
     * @see https://developer.mozilla.org/en-US/docs/Web/API/SerialPort/open#parameters
     * @returns openに成功した場合"OK"を返します。
     * @throws すでにopenしているポートが指定された場合、DOMException.InvalidStateErrorをthrowします。
     *     optionで指定した値が不適切な場合、TypeErrorをthrowします。
     *     そのポートがほかのアプリケーションで使われていた場合、DOMException.NetworkErrorをthrowします。
     */
    async openPort(id:portIdType, option:openOptionType = {baudRate:115200}):Promise<string> {
        try {
            const ret = await this._serial.openPort(
                this._idToObj[id].port, 
                {...option,updateOpenStt:(updateStt:boolean):void => this._openCloseSttStore[id].update(updateStt)}
            )
            this._openCloseSttStore[id].update(true)
            return ret
        }catch (e){
            if (e instanceof Error){
                return 'ERROR :'+e.toString()
            } else {
                throw e
            }
        }
    }
    
    async startReceivePort(id:portIdType, option:{rxDataHandler?:AbstractDataHandler}={}): Promise<string> {
        try {
            if (option.rxDataHandler){
                this._rxDataHandler = option.rxDataHandler
            }
            return this._serial.startReceivePort(
                this._idToObj[id].port,
                {...option, 
                    updateRx:(updateData:Uint8Array):boolean => this.updateRx(id, updateData),
                    updateOpenStt:(updateStt:boolean):void => this._openCloseSttStore[id].update(updateStt)
                }
            )
        }catch (e){
            if (e instanceof Error){
                return 'ERROR :'+e.toString()
            } else {
                throw e
            }
        }
    }
    async stopReceivePort(id:portIdType): Promise<string> {
        try {
            return this._serial.stopReceivePort(this._idToObj[id].port)
        }catch (e){
            if (e instanceof Error){
                return 'ERROR :'+e.toString()
            } else {
                throw e
            }
        }
    }

    async sendPort(id:portIdType, msg: Uint8Array, option:object = {}): Promise<string> {
        try {
            return await this._serial.sendPort(this._idToObj[id].port, msg, 
                {...option,
                    updateOpenStt:(updateStt:boolean):void => this._openCloseSttStore[id].update(updateStt)
                }
            )
        }catch (e){
            if (e instanceof Error){
                return 'ERROR :'+e.toString()
            } else {
                throw e
            }
        }
    }
    async closePort(id:portIdType):Promise<string> {
        try {
            const ret = await this._serial.closePort(this._idToObj[id].port)
            this._openCloseSttStore[id].update(false)
            return ret
        }catch (e){
            if (e instanceof Error){
                return 'ERROR :'+e.toString()
            } else {
                throw e
            }
        }
    }
    async finalize():Promise<void> {
        return this._serial.finalize({})
    }

    async updateRequest(reason:updateRequestReasonType, newPort?:devicePortType):Promise<void>{
        const portKeyObjInfos = await this._serial.getDeviceKeyPortInfos(newPort)

        const latestKeys = portKeyObjInfos.map((pkoi)=>pkoi.key)
        const currentKeys = this._currentKeysCache
//        console.log(latestKeys, currentKeys)
        const attachedKeys = latestKeys.filter((lkey)=>!currentKeys.some((ckey)=>ckey===lkey))
        const detachedKeys = currentKeys.filter((ckey)=>!latestKeys.some((lkey)=>ckey===lkey))

//        console.log(attachedKeys, detachedKeys)

        // update idToObj
        let attachedIds:portIdType[] = []
        let detachedIds:portIdType[] = []
        if (0 < attachedKeys.length){
            attachedKeys.forEach((key)=>{
                const matched:deviceKeyPortInfoAvailableType|undefined = this._idToObj.find((obj)=>obj.key===key)
//                console.log(key, matched)
                if (matched) {
                    // ポート復活。
                    /// delete(forget)後、USB抜き差しを挟まずに再度登録した場合ここを通る。
                    if (!matched.available) {
                        matched.available = true
                        matched.info.reason = reason
                        const portKeyObjInfoFromKey = portKeyObjInfos.find((pkoi)=>pkoi.key===key)
                        if (portKeyObjInfoFromKey){
                            if (portKeyObjInfoFromKey.info.name && portKeyObjInfoFromKey.info.name !== "") {
                                // node
                                matched.port = this._serial.createPort(portKeyObjInfoFromKey.info.name)
                            } else {
                                // web-serial
                            }
                        } else {
                            // キーに対応するポートがない
                        }
                    } else {
                        // 増えたはずなのにデータ有効
                    }
                } else {
                    // ポート追加
                    /// 同じデバイスであっても、USB抜き差し後の登録は新規登録扱いとなる。
                    /// Windowsでは、登録されていたUSBの抜き差しで、自動追加されるが、その時は新規登録扱いとなる。
                    const newId = this._idToObj.length
                    const portObjInfoFromKey = portKeyObjInfos.find((port)=>port.key===key)
                    // console.log(portObjInfoFromKey, newId)
                    if (portObjInfoFromKey){
                        if(portObjInfoFromKey.port) {
                            // web-serial
                            this._idToObj.push({
                                key,
                                available:true,
                                port:portObjInfoFromKey.port,
                                info:{
                                    id:newId,
                                    pid:portObjInfoFromKey.info.pid, 
                                    vid:portObjInfoFromKey.info.vid, 
                                    deviceId:portObjInfoFromKey.info.deviceId,
                                    name:portObjInfoFromKey.info.name,
                                    reason:reason
                                }
                            })
                            attachedIds.push(newId)
                        } else if (portObjInfoFromKey.info.name){
                            // node-serial
                            this._idToObj.push({
                                key,
                                available:true,
                                port:this._serial.createPort(portObjInfoFromKey.info.name),
                                info:{
                                    id:newId,
                                    pid:portObjInfoFromKey.info.pid, 
                                    vid:portObjInfoFromKey.info.vid, 
                                    name:portObjInfoFromKey.info.name,
                                    reason:reason
                                }
                            })
                            attachedIds.push(newId)
                        } else {
                            // .portObjがfalsyかつ、.portInfo.portNameもfalsy
                        }
                    } else {
                        //　キーに対応するポートがない
                    }
                }
            })
            attachedIds.forEach((id)=> {
                this._openCloseSttStore[id] = new MicroStore(false)
                this._rxLineBuffers[id] = []
                this._rxLineNumStore[id] = new MicroStore({totalLines:0, updatedLines:0})

            })
        }
        if (0 < detachedKeys.length) {
            detachedKeys.forEach((key)=>{
                const matched:deviceKeyPortInfoAvailableType|undefined = this._idToObj.find((obj)=>obj.key===key)
                if (matched) {
                    matched.available = false
                    matched.info.reason = reason
                    detachedIds.push(matched.info.id)
                } else {
                    // deleteとマークされたのにすでにdelete済
                }
            })
            detachedIds.forEach((id)=> this._openCloseSttStore[id].update(false))
        }
        // update related variables from idToObj
        if (0 < attachedKeys.length || 0 < detachedKeys.length) {
            this._updateCount++
            this._currentKeysCache = this._idToObj.filter((obj)=>obj.available).map((obj)=>obj.key)
            this._portStore.update({
                curr:this._idToObj.map((obj)=>({...obj.info, available:obj.available})),
                attached:attachedIds,
                detached:detachedIds,
                changeId:this._updateCount
            })
        }
    }

    getPorts():portStoreType {
        return this._portStore.get()
    }
    subscribePorts(cb: () => void):() => void {
        return this._portStore.subscribe(cb)
    }
    getSubscribeCbLen():number {
        return this._portStore.getCallbacksLen()
    }
    subscribeOpenStt(id:portIdType, cb:()=>void):()=>void {
        if (id < this._openCloseSttStore.length) {
            return this._openCloseSttStore[id].subscribe(cb)
        } else {
            return ()=>{}
        }
    }
    getOpenStt(id:portIdType):boolean {
        if (id < this._openCloseSttStore.length) {
            return this._openCloseSttStore[id].get()
        } else {
            return false
        }
    }

    subscribeRxLineNum(id:portIdType, cb:()=>void):()=>void {
        if (id < this._rxLineNumStore.length) {
            return this._rxLineNumStore[id].subscribe(cb)
        } else {
            return ()=>{}
        }
    }

    updateRx(id:portIdType, updateData:Uint8Array):boolean {
        if (id < this._rxLineBuffers.length) {
            const updatedLines = this._rxDataHandler.handler(updateData)
            if (0 < updatedLines.length) {
                const ts:number = (new Date()).getTime()
                const buff = this._rxLineBuffers[id]
                const prevLen = buff.length
                const addLines = updatedLines.map((data, idx)=>({data, ts, id:idx+prevLen}))
//                console.log(id, ts, buff.length, updateData.length)
//                console.log(JSON.stringify(addLines))
                this._rxLineBuffers[id] = buff.concat(addLines)
                this._rxLineNumStore[id].update({totalLines:this._rxLineBuffers[id].length, updatedLines:updatedLines.length})
            }
            return true
        } else {
            return false
        }
    }
    getRxLineNum(id:portIdType):rxLineNumType {
        if (id < this._rxLineNumStore.length){
            return this._rxLineNumStore[id].get()
        } else {
            return { totalLines:0, updatedLines:0}
        }
    }    
    getRxLines(id:portIdType, start:number, end:number):rxLinesType {
        if (id < this._rxLineBuffers.length) {
            const buff = this._rxLineBuffers[id]
            const len = buff.length
            const startIndex = start
            const endIndex = end === 0 ? len:end
            const slicedData = buff.slice(startIndex, endIndex)
            return { data:slicedData, total:buff.length}
        } else {
            return { data:[], total:0}
        }
    }

}


