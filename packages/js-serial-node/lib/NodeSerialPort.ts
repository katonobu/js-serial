import {
    AbstructSerialPort
} from "../../js-serial-core/lib/AbstructSerialPort";
import { SerialPort} from 'serialport'

export class NodeSerialPort extends AbstructSerialPort{
    private static intervalId:NodeJS.Timeout

    constructor(){
        super();
    }

    init = async (opt:object) => {
        if (!NodeSerialPort.intervalId) {
            const {pollingIntervalMs = 1000 * 5, updateReq} = opt as {pollingIntervalMs?:number, updateReq:()=>Promise<void>}
            NodeSerialPort.intervalId = setInterval(()=>{
                updateReq()
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
    // @ts-ignore
    openPort = (dp, opt)=>Promise.resolve()
    // @ts-ignore
    closePort = (dp)=>Promise.resolve()
    finalize = async (opt:object) => {
        if (NodeSerialPort.intervalId) {
            clearInterval(NodeSerialPort.intervalId)
        }
    }

}