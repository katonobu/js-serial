import {
    receivePortOptionType,
    startReceiveReturnType,
    sendPortReturnType,
    openOptionType
} from "./AbstractSerial";

import {
    ble_setService,
    ble_setNotify
} from './bleUtil'

const bleSerialPortLog = (
    // @ts-ignore
    arg:string
)=>{
//    console.log(arg)
}

export default class BleSerailPort {
    private readonly _port:BluetoothDevice
    private _services: any[]
    private _onRxCb:(event:any)=>void
    private _updateOpenStt:(arg0:boolean)=>void
    private _uartService: {characteristics:{characteristic:BluetoothRemoteGATTCharacteristic,uuid:string}[]} | undefined
    private _rxCharacteristic:BluetoothRemoteGATTCharacteristic | undefined
    private _txCharacteristic:BluetoothRemoteGATTCharacteristic | undefined
    constructor(serialPort:BluetoothDevice) {
        this._port = serialPort
        this._services = []
        this._onRxCb = ()=>{}
        this._updateOpenStt = ()=>{}
    }

    deletePort = async ():Promise<string> => {    
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to deletePort()")
        } else {
            // not reject described in https://wicg.github.io/serial/#forget-method
            await port.forget();
        }
        return "OK"
    }
    openPort = async (opt:openOptionType):Promise<string>=>{
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to openPort()")
        } else if ( port.gatt && port.gatt.connected) {
            throw new Error("Already opened")
        } else {
            if (opt.updateOpenStt) {
                bleSerialPortLog("    Device.Name:" + port.name);
                bleSerialPortLog("    Device.Id:"   + port.id);
                this._updateOpenStt = opt.updateOpenStt
                const disconnectCb = ()=>{
                    bleSerialPortLog("DisconnectedEvent")
                    this._updateOpenStt(false)
                    this._onRxCb = ()=>{}
                    this._rxCharacteristic = undefined
                    this._txCharacteristic = undefined
                    this._uartService = undefined
                    this._services = []
                    port.removeEventListener('gattserverdisconnected',disconnectCb)
                }
                port.addEventListener('gattserverdisconnected', disconnectCb)
                bleSerialPortLog('  Connecting GATT service..')
                if (port.gatt) {
                    const server = await port.gatt.connect()
                    if (server) {
                        bleSerialPortLog('  GATT connected.')
                        bleSerialPortLog('  Getting PrimaryServices');
                        const timeoutReject = new Promise((_, reject)=>{
                            setTimeout(()=>{
                                reject(new Error("Get Service Failed, timeout"))
                            }, 10 * 1000)
                        })
                        try {
                            const services = await Promise.race([timeoutReject, server.getPrimaryServices()])
                            if (services && Array.isArray(services)) {
                                bleSerialPortLog('  Got ' + services.length.toString(10) + ' services');
                                for (var i = 0; i < services.length; i++) {
                                    bleSerialPortLog('    Service[' + i + ']');
                                    bleSerialPortLog('      UUID:'+services[i].uuid);
                                    var service = await ble_setService(services[i]);
                                    this._services.push(service);
                                    this._uartService = this._services.find((svc:{uuid:string})=>svc.uuid === "ae880180-3336-4b92-8269-f978b9d4b5db")
                                    if (this._uartService){
                                        this._txCharacteristic = this._uartService.characteristics.find((ch:{uuid:string})=>ch.uuid === "ae882c80-3336-4b92-8269-f978b9d4b5db")?.characteristic
                                        this._rxCharacteristic = this._uartService.characteristics.find((ch:{uuid:string})=>ch.uuid === "ae882c81-3336-4b92-8269-f978b9d4b5db")?.characteristic
                                    }
                                }
                                bleSerialPortLog('  Try to Notification Enable');
                                bleSerialPortLog(JSON.stringify(this._services, null, 2))
                            } else {
                                await port.gatt.disconnect()
                                throw(new Error("Get Service Failed"))
                            }
                        } catch(e){
                            await port.gatt.disconnect()
                            throw(e)
                        }
                    } else {
                        await port.gatt.disconnect()
                        throw(new Error("Connection Failed"))
                    }
                } else {
                    throw(new Error("Gatt is empty"))
                }
            }
        }
        return "OK"
    }
    getOnRx = (cb:(updateData:Uint8Array)=>boolean)=> (event:any) => {
        bleSerialPortLog('Receive Notify');
        bleSerialPortLog('  SerivceUUID:' + event?.target?.service?.uuid);
        bleSerialPortLog('  CharacteristicUUID:' + event?.target?.uuid);
        let value = event?.target?.value;
        let data = [];
        for (let i = 0; i < value.byteLength; i++) {
            data.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
        }        
        bleSerialPortLog('  Value:' + data.join(', '))
        bleSerialPortLog('  TimeStamp:' + event.timeStamp);
        const len = event.target.value.getUint8(0);
        cb(event.target.value.buffer.slice(1, 1+len))
    }
    startReceivePort = async (option: receivePortOptionType):Promise<startReceiveReturnType> => {
        const {updateRx} = option
        this._onRxCb = this.getOnRx(updateRx)
        if (this._uartService && this._rxCharacteristic){
            ble_setNotify(this._rxCharacteristic, true, this._onRxCb)
            return Promise.resolve("OK")
        } else {
            throw(new Error("Not opened"))
        }
    }
    stopReceivePort = async ():Promise<string> => {
        if (this._uartService && this._rxCharacteristic){
            ble_setNotify(this._rxCharacteristic, false, this._onRxCb)
            this._onRxCb = ()=>{}
        }
        return Promise.resolve("OK")
    }
    sendPort = async (
        msg:Uint8Array,
        // @ts-ignore
        option:any
    ):Promise<sendPortReturnType> => {
        if (this._txCharacteristic) {
            const max_tx_size = 16
            const fullTxCount = Math.trunc(msg.byteLength / max_tx_size)
    
            const tx_bytes = []
            for(let i = 0; i < fullTxCount; i++) {
                const tmp = new Uint8Array(max_tx_size + 1) 
                tmp[0] = max_tx_size
                tmp.set(msg.slice(i * max_tx_size, (i + 1) * max_tx_size), 1)
                tx_bytes.push(tmp)
            }
            const tmp = new Uint8Array(max_tx_size + 1).fill(0)
            tmp[0] = msg.byteLength - max_tx_size * fullTxCount
            tmp.set(msg.slice(fullTxCount * max_tx_size), 1)
            tx_bytes.push(tmp)
            for(const msg of tx_bytes) {
                await this._txCharacteristic.writeValueWithResponse(msg)
            }
            return Promise.resolve("OK")
        } else {
            return Promise.resolve("Close")
        }
    }    
    closePort = async ():Promise<string>=>{
        const port = this._port
        if (!port) {
            throw new Error("Invalid Id is specified to closePort()")

        } else if ( port.gatt && port.gatt.connected) {
            await port.gatt?.disconnect()
        } else {
            throw new Error("Not opened")
        }
        return "OK"
    }
}

