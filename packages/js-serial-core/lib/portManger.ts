import { 
    portIdType, 
    portInfoType, 
    devicePortType,
    compareKeyType, 
    deviceKeyPortInfoType ,
    GetDeviceKeyPortInfosFunction, 
    PromptGrantAccessFunction, 
    CreatePortFunction,    
    DeletePortFunction, 
    OpenPortFunction, 
    ClosePortFunction,
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

interface idIndexedObjType{
    key:compareKeyType;
    available:boolean;
    port:devicePortType;
    info:portInfoType;
}

export class PortManager{
    private _idToObj:idIndexedObjType[] // 御本尊
    private _currentKeysCache:compareKeyType[] // 変化比較用Cache
    portStore:MicroStore<portStoreType>
    private _getDeviceKeyPortInfos:GetDeviceKeyPortInfosFunction
    private _promptGrantAccess:PromptGrantAccessFunction
    private _createPort:CreatePortFunction
    private _deletePort:DeletePortFunction
    private _openPort:OpenPortFunction
    private _closePort:ClosePortFunction

    constructor(
        serialPort:AbstructSerialPort
    ){
        this._idToObj = []
        this._currentKeysCache  = []
        this.portStore = new MicroStore<portStoreType>({curr:[],attached:[],detached:[],changeId:0})
        this._getDeviceKeyPortInfos = serialPort.getDeviceKeyPortInfos
        this._promptGrantAccess = serialPort.promptGrantAccess
        this._createPort = serialPort.createPort
        this._deletePort = serialPort.deletePort
        this._openPort = serialPort.openPort
        this._closePort = serialPort.closePort
    }

    async init():Promise<void> {
        return Promise.resolve()
    }
    async promptGrantAccess(option:any/*createOption*/):Promise<portInfoType> {
        return this._promptGrantAccess(option)
    }
    async deletePort(id:portIdType):Promise<portInfoType> {
        return this._deletePort(this._idToObj[id].port)
    }
    async openPort(id:portIdType, option:any/*openOption*/):Promise<void> {
        return this._openPort(this._idToObj[id].port, option)
    }
    async closePort(id:portIdType):Promise<void> {
        return this._closePort(this._idToObj[id].port)
    }
    async finalize():Promise<void> {
        return Promise.resolve()
    }

    async updateRequest():Promise<void>{
        const portKeyObjInfos = await this._getDeviceKeyPortInfos()

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
                const matched:idIndexedObjType|undefined = this._idToObj.find((obj)=>obj.key===key)
//                console.log(key, matched)
                if (matched) {
                    // ポート復活。(node時のみ)
                    if (!matched.available) {
                        matched.available = true
                        const portKeyObjInfoFromKey = portKeyObjInfos.find((pkoi)=>pkoi.key===key)
                        if (portKeyObjInfoFromKey && portKeyObjInfoFromKey.portInfo.portName) {
                            matched.port = this._createPort(portKeyObjInfoFromKey.portInfo.portName)
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
                        if(portObjInfoFromKey.portObj) {
                            // web-serial
                            this._idToObj.push({
                                key,
                                available:true,
                                port:portObjInfoFromKey.portObj,
                                info:{
                                    id:newId,
                                    pid:portObjInfoFromKey.portInfo.pid, 
                                    vid:portObjInfoFromKey.portInfo.vid, 
                                    portName:portObjInfoFromKey.portInfo.portName?? ""
                                }
                            })
                            attachedIds.push(newId)
                        } else if (portObjInfoFromKey.portInfo.portName){
                            // node-serial
                            this._idToObj.push({
                                key,
                                available:true,
                                port:this._createPort(portObjInfoFromKey.portInfo.portName),
                                info:{
                                    id:newId,
                                    pid:portObjInfoFromKey.portInfo.pid, 
                                    vid:portObjInfoFromKey.portInfo.vid, 
                                    portName:portObjInfoFromKey.portInfo.portName?? ""
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
                const matched:idIndexedObjType|undefined = this._idToObj.find((obj)=>obj.key===key)
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
            this._currentKeysCache = this._idToObj.filter((obj)=>obj.available).map((obj)=>obj.key)
            this.portStore.update({
                curr:this._idToObj.filter((obj)=>obj.available).map((obj)=>obj.info),
                attached:attachedIds,
                detached:detachedIds,
                changeId:this._idToObj.length
            })
        }
    }

    getPorts():portStoreType {
        return this.portStore.get()
    }
    subscribePorts(cb: () => void):() => void {
        return this.portStore.subscribe(cb)
    }
    subscribeOpenStt(id:portIdType, cb:()=>void):()=>void {
        return cb
    }
    getOpenStt(id:portIdType):boolean {
        return 0 < id
    }
}


