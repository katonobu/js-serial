import {
    AbstractSerial,
    startReceiveReturnType,
    devicePortType, 
    receivePortOptionType    
} from "../../js-serial-core/lib/index"
import { SerialPort} from 'serialport'

export class NodeSerial extends AbstractSerial{
    private static intervalId:NodeJS.Timeout | undefined
    private static portManager:{updateRequest:()=>Promise<void>} | undefined

    constructor(){
        super();
    }

    init = async (opt:object) => {
        if (!NodeSerial.intervalId) {
            const {pollingIntervalMs = 1000 * 5, portManager} = opt as {pollingIntervalMs?:number, portManager:{updateRequest:()=>Promise<void>}}
            NodeSerial.portManager = portManager
            NodeSerial.intervalId = setInterval(()=>{
                if (NodeSerial.portManager) {
                    NodeSerial.portManager?.updateRequest()
                }
            }, pollingIntervalMs)
        }
    }

    getDeviceKeyPortInfos = async ()=> {
        const infos = await SerialPort.list()
        const result = infos.map((info)=> ({
            key:info.path,
            info:{
                id:-1,
                pid:parseInt(info.productId??"0", 16),
                vid:parseInt(info.vendorId??"0", 16),
                portName:info.path
            }
        }))
//            console.log(result)
        return result
    }
    promptGrantAccess = ()=>{
        throw(new Error("js-serial-node dosen't support promptGrantAccess()"))
    }
    createPort = (path:string) => {
        return new SerialPort({path, baudRate:115200, autoOpen:false})
    }
    deletePort = ()=>{
        throw(new Error("js-serial-node dosen't support deletePort()"))
    }
    openPort = (
        // @ts-ignore
        dp, opt
    )=> {
        throw (new Error("not implemented yet"))
    }
    startReceivePort = (
        deviePort:devicePortType, option:receivePortOptionType
    ):Promise<startReceiveReturnType> => {
        throw (new Error("not implemented yet"))
    }
    stopReceivePort = ()=>{
        throw (new Error("not implemented yet"))
    }
    sendPort = (
        // @ts-ignore
        deviePort, msg, option
    ) => {
        throw (new Error("not implemented yet"))
    }
    closePort = (
        // @ts-ignore
        dp
    )=>{
        throw (new Error("not implemented yet"))
    }
    finalize = async (opt:object) => {
        if (NodeSerial.intervalId) {
            clearInterval(NodeSerial.intervalId)
            NodeSerial.intervalId = undefined
            NodeSerial.portManager = undefined
        }
    }
}