import {
    AbstructSerialPort
} from "../../js-serial-core/lib/AbstructSerialPort";
import { SerialPort} from 'serialport'

export class NodeSerialPort extends AbstructSerialPort{
    constructor(){
        super();
    }

    getDeviceKeyPortInfos = async ()=> {
        const infos = await SerialPort.list()
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
        return Promise.resolve({id:0, pid:0, vid:0})
    }
    // @ts-ignore
    createPort = (path) => {
        return new SerialPort({path, baudRate:115200, autoOpen:false})
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