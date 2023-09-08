import {
    AbstractSerial,
    portInfoType,
    devicePortType,
    deviceKeyPortInfoType,
    deviceKeyPortInfoAvailableType,
    openOptionType,
    receivePortOptionType,
    startReceiveReturnType
} from "../../js-serial-core/lib/AbstractSerial";
import WebSerailPort from "./WebSerialPort";

export class WebSerial extends AbstractSerial{
    // https://ja.stackoverflow.com/questions/2046/javascript%E5%AE%9F%E8%A1%8C%E7%92%B0%E5%A2%83%E3%81%AE%E5%88%A4%E5%AE%9A%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
    // @ts-ignore
    private static isNode:boolean = (typeof process !== "undefined" && typeof require !== "undefined")
    private callUpdateRequest:(()=>void)|undefined

    constructor(){
        super();
    }

    init = async (opt:object):Promise<void> => {
        const option = opt as {portManager:{updateRequest:()=>Promise<void>}}
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            if (this.callUpdateRequest !== undefined){
                throw(new Error("Already Initialized WebSerial, but init() is called again."))
            } else {
                this.callUpdateRequest = () => option.portManager.updateRequest()
                navigator.serial.addEventListener('connect', this.callUpdateRequest)
                navigator.serial.addEventListener('disconnect', this.callUpdateRequest)
            }
        }
    }

    getDeviceKeyPortInfos = async ():Promise<deviceKeyPortInfoType[]>=>{
        if (WebSerial.isNode) {
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
            return navigator.serial.requestPort(requestOption)
        }
    }
    createPort = (path:string):devicePortType=>{
        throw(new Error(`js-serial-web dosen't support createPort : ${path}`))
    }
    deletePort = async (dp:deviceKeyPortInfoAvailableType):Promise<portInfoType> => {
        if (WebSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp.port as WebSerailPort
            port.deletePort()
            return dp.info
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
    ):Promise<string> => {
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
            if (this.callUpdateRequest === undefined){
                throw(new Error("Already finalized of not initialized WebSerial, but finalize() is called."))
            } else {
                navigator.serial.removeEventListener('connect', this.callUpdateRequest)
                navigator.serial.removeEventListener('disconnect', this.callUpdateRequest)
                this.callUpdateRequest = undefined
            }
        }
    }
}