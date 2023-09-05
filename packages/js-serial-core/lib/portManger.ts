import { 
    portIdType, 
    portInfoType, 
    compareKeyType, 
    deviceKeyPortInfoType ,
    deviceKeyPortInfoAvailableType,    
    MicroStore, 
    AbstructSerialPort
} from './AbstructSerialPort'


export interface portStoreType{
    curr:portInfoType[];
    attached:portIdType[];
    detached:portIdType[];
    changeId:portIdType
}
export interface keyCompResultType{
    latest:deviceKeyPortInfoType[];
    attached:compareKeyType[];
    detached:compareKeyType[];
}

export class PortManager{
    private _idToObj:deviceKeyPortInfoAvailableType[] // 御本尊
    private _currentKeysCache:compareKeyType[] // 変化比較用Cache
    private _portStore:MicroStore<portStoreType>
    private _serialPort:AbstructSerialPort
    private _updateCount:number

    constructor(
        serialPort:AbstructSerialPort
    ){
        this._idToObj = []
        this._currentKeysCache  = []
        this._portStore = new MicroStore<portStoreType>({curr:[],attached:[],detached:[],changeId:0})
        this._serialPort = serialPort
        this._updateCount = 0
    }

    async init(opt:{pollingIntervalMs?:number}):Promise<void> {
        await this._serialPort.init({updateReq:this.updateRequest, pollingIntervalMs:opt?.pollingIntervalMs})
        await this.updateRequest()
    }
    async promptGrantAccess(option:any/*createOption*/):Promise<portInfoType> {
        try {
            const newPort = await this._serialPort.promptGrantAccess(option)
            await this.updateRequest()
            const matched:deviceKeyPortInfoAvailableType|undefined = this._idToObj.find((obj)=>obj.key===newPort)
            return matched?.info ?? {id:-1, pid:-1, vid:-1}
        }catch(e) {
            console.log(e)
            return {id:-1, pid:-1, vid:-1}
        }
    }
    async deletePort(id:portIdType):Promise<portInfoType> {
        const ret = await this._serialPort.deletePort(this._idToObj[id])
        this.updateRequest()
        return ret
    }
    async openPort(id:portIdType, option:any/*openOption*/):Promise<void> {
        return this._serialPort.openPort(this._idToObj[id].port, option)
    }
    async closePort(id:portIdType):Promise<void> {
        return this._serialPort.closePort(this._idToObj[id].port)
    }
    async finalize():Promise<void> {
        return this._serialPort.finalize({updateReq:this.updateRequest})
    }

    async updateRequest():Promise<void>{
        const portKeyObjInfos = await this._serialPort.getDeviceKeyPortInfos()

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
                    // ポート復活。(node時のみ)
                    if (!matched.available) {
                        matched.available = true
                        const portKeyObjInfoFromKey = portKeyObjInfos.find((pkoi)=>pkoi.key===key)
                        if (portKeyObjInfoFromKey && portKeyObjInfoFromKey.info.portName) {
                            matched.port = this._serialPort.createPort(portKeyObjInfoFromKey.info.portName)
                            attachedIds.push(matched.info.id)
                        } else {
                            // キーに対応するポートがない or port名が設定されていない
                        }
                    } else {
                        // 増えたはずなのにデータ有効
                    }
                } else {
                    // ポート追加
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
                                    portName:portObjInfoFromKey.info.portName?? ""
                                }
                            })
                            attachedIds.push(newId)
                        } else if (portObjInfoFromKey.info.portName){
                            // node-serial
                            this._idToObj.push({
                                key,
                                available:true,
                                port:this._serialPort.createPort(portObjInfoFromKey.info.portName),
                                info:{
                                    id:newId,
                                    pid:portObjInfoFromKey.info.pid, 
                                    vid:portObjInfoFromKey.info.vid, 
                                    portName:portObjInfoFromKey.info.portName?? ""
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
            /*ToDo*/
            // port追加処理:portOpenStt等
        }
        if (0 < detachedKeys.length) {
            detachedKeys.forEach((key)=>{
                const matched:deviceKeyPortInfoAvailableType|undefined = this._idToObj.find((obj)=>obj.key===key)
                if (matched) {
                    matched.available = false
                    detachedIds.push(matched.info.id)
                } else {
                    // deleteとマークされたのにすでにdelete済
                }
                /*ToDo*/
                // port削除処理(callbackの無効化関数への置き換え等)
            })
        }
        // update related variables from idToObj
        if (0 < attachedKeys.length || 0 < detachedKeys.length) {
            this._updateCount++
            this._currentKeysCache = this._idToObj.filter((obj)=>obj.available).map((obj)=>obj.key)
            this._portStore.update({
                curr:this._idToObj.filter((obj)=>obj.available).map((obj)=>obj.info),
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
        return cb
    }
    getOpenStt(id:portIdType):boolean {
        return 0 < id
    }
}


