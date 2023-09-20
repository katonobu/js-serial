import {
    AbstractSerial,
    portStoreCurrentType,
    devicePortType,
    deviceKeyPortInfoType,
    deviceKeyPortInfoAvailableType,
    initOptionType,    
    openOptionType,
    receivePortOptionType,
    startReceiveReturnType,
    sendPortReturnType
} from "./AbstractSerial";
import WebSerailPort from "./WebSerialPort";

export default class WebSerial extends AbstractSerial{
    // https://ja.stackoverflow.com/questions/2046/javascript%E5%AE%9F%E8%A1%8C%E7%92%B0%E5%A2%83%E3%81%AE%E5%88%A4%E5%AE%9A%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
    // @ts-ignore
    private static isNode:boolean = false//(typeof process !== "undefined" && typeof require !== "undefined")
    private callUpdateRequestConnect:(()=>void)|undefined
    private callUpdateRequestDisconnect:(()=>void)|undefined

    constructor(){
        super();
    }

    init = async (option:initOptionType):Promise<void> => {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            if (this.callUpdateRequestConnect !== undefined || this.callUpdateRequestDisconnect !== undefined){
                throw(new Error("Already Initialized WebSerial, but init() is called again."))
            } else {
                const updateRequest = option?.portManager?.updateRequest
                if (updateRequest) {
                    // this.callUpdateRequest = () => updateRequest() だと、callback時うまくthisが伝わらない
                    this.callUpdateRequestConnect = () => option?.portManager?.updateRequest("USB Attached")
                    navigator.serial.addEventListener('connect', this.callUpdateRequestConnect)
                    this.callUpdateRequestDisconnect = () => option?.portManager?.updateRequest("USB Detached")
                    navigator.serial.addEventListener('disconnect', this.callUpdateRequestDisconnect)
                } else {
                    // ToDoここ未テスト
                    throw(new Error("updateRequest dosen't exist in option.portManager"))
                }
            }
            return Promise.resolve()
        }
    }

    getDeviceKeyPortInfos = async ():Promise<deviceKeyPortInfoType[]>=>{
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            /// 3.2.2 not allowed to use the policy-controlled feature =>"SecurityError" DOMException
            const currentPorts = await navigator.serial.getPorts()
            const result = currentPorts.map((port)=>{
                const portInfo = port.getInfo()
                return {
                    key:port,
                    info:{
                        id:-1,
                        pid:portInfo.usbProductId ?? 0,
                        vid:portInfo.usbVendorId ?? 0,
                        reason:"Init"
                    },
                    port:new WebSerailPort(port)
                }
            })
    //            console.log(result)
            return result
        }
    }
    promptGrantAccess = async (opt:object):Promise<devicePortType>=> {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const requestOption = opt as SerialPortRequestOptions
            /// 3.1.2 not allowed to use the policy-controlled feature =>"SecurityError" DOMException
            /// 3.1.3 does not have transient activation =>"SecurityError" DOMException
            /// 3.1.4 filter["usbVendorId"] is not present => TypeError 
            /// 3.1.5.5 user does not choose a port =>"NotFoundError" DOMException
            return navigator.serial.requestPort(requestOption)
        }
    }
    createPort = (path:string):devicePortType=>{
        throw(new Error(`js-serial-web dosen't support createPort : ${path}`))
    }
    deletePort = async (dp:deviceKeyPortInfoAvailableType):Promise<portStoreCurrentType> => {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp.port as WebSerailPort
            port.deletePort()
            return {...dp.info, available:dp.available}
        }
    }
    openPort = async (dp:devicePortType, opt:openOptionType):Promise<string>=>{
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as WebSerailPort
            return port.openPort(opt)
        }
    }
    startReceivePort = async (dp:devicePortType, option: receivePortOptionType):Promise<startReceiveReturnType> => {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as WebSerailPort
            return port.startReceivePort(option)
        }
    }
    stopReceivePort = async (dp:devicePortType):Promise<string> => {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as WebSerailPort
            return port.stopReceivePort()
        }
    }
    sendPort = async (
        dp:devicePortType,
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<sendPortReturnType> => {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as WebSerailPort
            return port.sendPort(msg, option)
        }
    }
    closePort = async (dp:object):Promise<string>=>{
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as WebSerailPort
            return port.closePort()
        }
    }
    finalize = async ():Promise<void> => {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            if (this.callUpdateRequestConnect === undefined || this.callUpdateRequestDisconnect === undefined){
                throw(new Error("Already finalized of not initialized WebSerial, but finalize() is called."))
            } else {
                navigator.serial.removeEventListener('connect', this.callUpdateRequestConnect)
                navigator.serial.removeEventListener('disconnect', this.callUpdateRequestDisconnect)
                this.callUpdateRequestConnect = undefined
                this.callUpdateRequestDisconnect = undefined
            }
        }
    }
}
