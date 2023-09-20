import { SerialPortMock } from 'serialport'
import { MockBinding } from '@serialport/binding-mock'
import { JsSerialBase } from '../../js-serial-web/lib/BaseSerial'
import {
    AbstractSerial,
    startReceiveReturnType,
    devicePortType, 
    receivePortOptionType,
    updateRequestReasonType
} from '../../js-serial-web/lib/AbstractSerial'

export class NodeMockSerial extends AbstractSerial{
    private static portCount = 0
    private static intervalId:NodeJS.Timeout | undefined
    private static portManager:{updateRequest:(reason:updateRequestReasonType)=>Promise<void>} | undefined


    static addPort = (vid:string ="0", pid:string="0"):string => {
        const path = `/dev/MOCK${NodeMockSerial.portCount}`
        MockBinding.createPort(path, { echo: true, record: true, vendorId:vid, productId:pid })        
        NodeMockSerial.portCount++
        return path
    }
    static reset = ():void => {
        MockBinding.reset()
    }

    constructor(){
        super();
    }

    init = async (opt:object) => {
        if (!NodeMockSerial.intervalId) {
            const {pollingIntervalMs = 1000 * 5, portManager} = opt as {pollingIntervalMs?:number, portManager:{updateRequest:()=>Promise<void>}}
            NodeMockSerial.portManager = portManager
            NodeMockSerial.intervalId = setInterval(()=>{
                if (NodeMockSerial.portManager) {
                    NodeMockSerial.portManager?.updateRequest("Init")
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
                portName:info.path,
                reason:"Init"
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
        if (NodeMockSerial.intervalId) {
            clearInterval(NodeMockSerial.intervalId)
            NodeMockSerial.intervalId = undefined
            NodeMockSerial.portManager = undefined
        }
    }
}
export default class JsSerialNodeMock extends JsSerialBase{
    constructor(){
        const nsp = new NodeMockSerial()
        super(nsp)
    }
}
