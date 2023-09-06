import {
    AbstractSerialPort
} from "./AbstractSerialPort";
import { SerialPortMock } from 'serialport'
import { MockBinding } from '@serialport/binding-mock'

export class NodeMockSerialPort extends AbstractSerialPort{
    private static portCount = 0
    private static intervalId:NodeJS.Timeout | undefined
    private static portManager:{updateRequest:()=>Promise<void>} | undefined


    static addPort = (vid:string ="0", pid:string="0"):string => {
        const path = `/dev/MOCK${NodeMockSerialPort.portCount}`
        MockBinding.createPort(path, { echo: true, record: true, vendorId:vid, productId:pid })        
        NodeMockSerialPort.portCount++
        return path
    }
    static reset = ():void => {
        MockBinding.reset()
    }

    constructor(){
        super();
    }

    init = async (opt:object) => {
        if (!NodeMockSerialPort.intervalId) {
            const {pollingIntervalMs = 1000 * 5, portManager} = opt as {pollingIntervalMs?:number, portManager:{updateRequest:()=>Promise<void>}}
            NodeMockSerialPort.portManager = portManager
            NodeMockSerialPort.intervalId = setInterval(()=>{
                if (NodeMockSerialPort.portManager) {
                    NodeMockSerialPort.portManager?.updateRequest()
                }
            }, pollingIntervalMs)
        }
    }

    getDeviceKeyPortInfos = async ()=> {
        const infos = await SerialPortMock.list()
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
        throw(new Error("js-serial-nodeMock dosen't support promptGrantAccess()"))
    }
    createPort = (path:string) => {
        return new SerialPortMock({path, baudRate:115200, autoOpen:false})
    }
    deletePort = ()=>{
        throw(new Error("js-serial-nodeMock dosen't support deletePort()"))
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
        if (NodeMockSerialPort.intervalId) {
            clearInterval(NodeMockSerialPort.intervalId)
            NodeMockSerialPort.intervalId = undefined
            NodeMockSerialPort.portManager = undefined
        }
    }
}