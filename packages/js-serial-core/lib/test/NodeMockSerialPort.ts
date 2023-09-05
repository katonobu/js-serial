import {
    AbstructSerialPort
} from "../AbstructSerialPort";
import { SerialPortMock } from 'serialport'
import { MockBinding } from '@serialport/binding-mock'

export class NodeMockSerialPort extends AbstructSerialPort{
    private static portCount = 0
    private static intervalId:NodeJS.Timeout

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
            const {pollingIntervalMs = 1000 * 5, updateReq} = opt as {pollingIntervalMs?:number, updateReq:()=>Promise<void>}
            NodeMockSerialPort.intervalId = setInterval(()=>{
                updateReq()
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
    // @ts-ignore
    openPort = (dp, opt)=>Promise.resolve()
    // @ts-ignore
    closePort = (dp)=>Promise.resolve()
    finalize = async (opt:object) => {
        if (NodeMockSerialPort.intervalId) {
            clearInterval(NodeMockSerialPort.intervalId)
        }
    }
}