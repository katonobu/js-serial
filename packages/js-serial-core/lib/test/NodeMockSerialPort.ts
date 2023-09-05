import {
    AbstructSerialPort
} from "../AbstructSerialPort";
import { SerialPortMock } from 'serialport'
import { MockBinding } from '@serialport/binding-mock'

export class NodeMockSerialPort extends AbstructSerialPort{
    private static portCount = 0
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

    getDeviceKeyPortInfos = async ()=> {
        const infos = await SerialPortMock.list()
        const result = infos.map((info)=> ({
            key:info.path,
            portInfo:{
                id:-1,
                pid:parseInt(info.productId??"0", 16),
                vid:parseInt(info.vendorId??"0", 16),
                portName:info.path
            }
        }))
//            console.log(result)
        return result
    }
    // @ts-ignore
    promptGrantAccess = (opt)=>{
        // throw error
        throw(new Error("promptGrantAccess is not available in NodeMockSerialPort"))
        return Promise.resolve({id:0, pid:0, vid:0})
    }
    // @ts-ignore
    createPort = (path) => {
        return new SerialPortMock({path, baudRate:115200, autoOpen:false})
    }
    // @ts-ignore
    deletePort = (dp)=>{
        // throw error
        return Promise.resolve({id:0, pid:0, vid:0})
    }
    // @ts-ignore
    openPort = (dp, opt)=>Promise.resolve()
    // @ts-ignore
    closePort = (dp)=>Promise.resolve()

}