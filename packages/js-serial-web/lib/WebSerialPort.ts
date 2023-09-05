import {
    AbstructSerialPort, deviceKeyPortInfoAvailableType
} from "../../js-serial-core/lib/AbstructSerialPort";

export class WebSerialPort extends AbstructSerialPort{
    isNode:boolean
    constructor(){
        super();
        // https://ja.stackoverflow.com/questions/2046/javascript%E5%AE%9F%E8%A1%8C%E7%92%B0%E5%A2%83%E3%81%AE%E5%88%A4%E5%AE%9A%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
        // @ts-ignore
        this.isNode = (typeof process !== "undefined" && typeof require !== "undefined")
    }
    getDeviceKeyPortInfos = async ()=>{
        if (this.isNode) {
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
                    port
                }
            })
    //            console.log(result)
            return result
        }
    }
    promptGrantAccess = (opt:object)=> {
        if (this.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const requestOption = opt as SerialPortRequestOptions
            return navigator.serial.requestPort(requestOption)
        }
    }
    createPort = (path:string)=>{
        throw(new Error(`js-serial-web dosen't support createPort : ${path}`))
    }
    deletePort = async (dp:deviceKeyPortInfoAvailableType) => {
        if (this.isNode) {
            throw(new Error("js-serial-web exected in node environment"))
        } else {
            const port = dp.port as SerialPort
            let errStr: string = '';
            if (port) {
                try {
                    await port.forget();
                } catch (e) {
                    if (e instanceof Error) {
                        errStr = e.message;
                    } else {
                        errStr = 'Error at forget';
                    }
                }
            } else {
                errStr = 'specified port has been invalid';
            }
            if (errStr) {
                console.error(errStr);
            }
            return dp.info
        }
    }
    // @ts-ignore
    openPort = (dp, opt)=>Promise.resolve()
    // @ts-ignore
    closePort = (dp)=>Promise.resolve()
}