import {
    AbstructSerialPort
} from "../../js-serial-core/lib/AbstructSerialPort";

export class WebSerialPort extends AbstructSerialPort{
    constructor(){
        super();
    }
    getDeviceKeyPortInfos = ()=>Promise.resolve([])
    // @ts-ignore
    promptGrantAccess = (opt)=>Promise.resolve({id:0, pid:0, vid:0})
    // @ts-ignore
    createPort = (path)=>({})
    // @ts-ignore
    deletePort = (dp)=>Promise.resolve({id:0, pid:0, vid:0})
    // @ts-ignore
    openPort = (dp, opt)=>Promise.resolve()
    // @ts-ignore
    closePort = (dp)=>Promise.resolve()
}