import {
    AbstractSerialPort
} from "../../js-serial-core/lib/AbstractSerialPort";
import { SerialPort} from 'serialport'

export class NodeSerialPort extends AbstractSerialPort{
    private static intervalId:NodeJS.Timeout | undefined
    private static portManager:{updateRequest:()=>Promise<void>} | undefined

    constructor(){
        super();
    }

    init = async (opt:object) => {
        if (!NodeSerialPort.intervalId) {
            const {pollingIntervalMs = 1000 * 5, portManager} = opt as {pollingIntervalMs?:number, portManager:{updateRequest:()=>Promise<void>}}
            NodeSerialPort.portManager = portManager
            NodeSerialPort.intervalId = setInterval(()=>{
                if (NodeSerialPort.portManager) {
                    NodeSerialPort.portManager?.updateRequest()
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
    )=>Promise.resolve()
    receivePort = (
        // @ts-ignore
        deviePort, byteLength, timeoutMs, option
    ) => {
        return Promise.resolve()
    }
    sendPort = (
        // @ts-ignore
        deviePort, msg, option
    ) => {
        return Promise.resolve()
    }

    closePort = (
        // @ts-ignore
        dp
    )=>Promise.resolve()
    finalize = async (opt:object) => {
        if (NodeSerialPort.intervalId) {
            clearInterval(NodeSerialPort.intervalId)
            NodeSerialPort.intervalId = undefined
            NodeSerialPort.portManager = undefined
        }
    }
}