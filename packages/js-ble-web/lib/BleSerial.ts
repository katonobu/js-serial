import {
    AbstractSerial,
    portStoreCurrentType,
    devicePortType,
    openOptionType,
    deviceKeyPortInfoType,
    deviceKeyPortInfoAvailableType,
    initOptionType,    
    receivePortOptionType,
    startReceiveReturnType,
    sendPortReturnType
} from "./AbstractSerial";
import BleSerailPort from "./BleSerialPort";

export default class BleSerial extends AbstractSerial{
    // https://ja.stackoverflow.com/questions/2046/javascript%E5%AE%9F%E8%A1%8C%E7%92%B0%E5%A2%83%E3%81%AE%E5%88%A4%E5%AE%9A%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
    // @ts-ignore
    private static isNode:boolean = false//(typeof process !== "undefined" && typeof require !== "undefined")
    private callUpdateRequestConnect:(()=>void)|undefined
    private callUpdateRequestDisconnect:(()=>void)|undefined

    constructor(){
        super();
    }

    init = async (option:initOptionType):Promise<void> => {
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            if (this.callUpdateRequestConnect !== undefined || this.callUpdateRequestDisconnect !== undefined){
                throw(new Error("Already Initialized WebSerial, but init() is called again."))
            } else {
                const updateRequest = option?.portManager?.updateRequest
                if (updateRequest) {
                    // BLEでは、availabilitychangedに対応するか、、、
                    this.callUpdateRequestConnect = () => option?.portManager?.updateRequest("USB Attached")
                    this.callUpdateRequestDisconnect = () => option?.portManager?.updateRequest("USB Detached")
                } else {
                    // ToDoここ未テスト
                    throw(new Error("updateRequest dosen't exist in option.portManager"))
                }
            }
            return Promise.resolve()
        }
    }

    getDeviceKeyPortInfos = async (newPort?:object):Promise<deviceKeyPortInfoType[]>=>{
        const available = await navigator.bluetooth.getAvailability()
        if (available === false){
            throw(new Error("Web Bluetooth function is not available in your browser"))
        } else {
            let currentPorts = [] as BluetoothDevice[]
            try {
                // if the floag enable-experimental-web-platform-features is disabled,
                // Error:xxxx is issued.
                // chrome://flags/#enable-experimental-web-platform-features
                currentPorts = await navigator.bluetooth.getDevices()
            } catch (e) {
                console.log(e)
                if (newPort) {
                    currentPorts = [newPort as BluetoothDevice]
                }
            }
            const result = currentPorts.map((port)=>{
                return {
                    key:port.id,
                    info:{
                        id:-1,
                        deviceId:port.id,
                        name:port.name??"",
                        reason:"Init"
                    },
                    port:new BleSerailPort(port)
                }
            })
    //            console.log(result)
            return result
        }
    }
    promptGrantAccess = async (
        // @ts-ignore
        opt:object
    ):Promise<devicePortType>=> {
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const requestOption = {
                filters:[
                    {
                        services: [
                            "0000180a-0000-1000-8000-00805f9b34fb", // Device Information
                        ]
                    },{
                        services: [
                            "ae880180-3336-4b92-8269-f978b9d4b5db", // proprietary service
                        ]
                    },
                ],
                optionalServices:[
                ]
            }
            return navigator.bluetooth.requestDevice(requestOption)
        }
    }
    createPort = (path:string):devicePortType=>{
        throw(new Error(`js-serial-web dosen't support createPort : ${path}`))
    }
    deletePort = async (dp:deviceKeyPortInfoAvailableType):Promise<portStoreCurrentType> => {
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp.port as BleSerailPort
            port.deletePort()
            return {...dp.info, available:dp.available}
        }
    }
    openPort = async (
        dp:devicePortType,
        opt:openOptionType,
    ):Promise<string>=>{
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as BleSerailPort
            return port.openPort(opt)
        }
    }
    startReceivePort = async (
        dp:devicePortType,
        option: receivePortOptionType
    ):Promise<startReceiveReturnType> => {
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as BleSerailPort
            return port.startReceivePort({updateRx:option.updateRx})
        }
    }
    stopReceivePort = async (dp:devicePortType):Promise<string> => {
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as BleSerailPort
            return port.stopReceivePort()
        }
    }
    sendPort = async (
        dp:devicePortType,
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<sendPortReturnType> => {
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as BleSerailPort
            return port.sendPort(msg, option)
        }
    }
    closePort = async (dp:object):Promise<string>=>{
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp as BleSerailPort
            return port.closePort()
        }
    }
    finalize = async ():Promise<void> => {
        if (BleSerial.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            if (this.callUpdateRequestConnect === undefined || this.callUpdateRequestDisconnect === undefined){
                throw(new Error("Already finalized of not initialized WebSerial, but finalize() is called."))
            } else {
                this.callUpdateRequestConnect = undefined
                this.callUpdateRequestDisconnect = undefined
            }
        }
    }
}
