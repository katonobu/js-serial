import BleSerial from './BleSerial'
import {JsSerialBase} from './BaseSerial'

export default class JsSerialBleWeb extends JsSerialBase{
    constructor(){
        const wsp = new BleSerial()
        super(wsp)
    }
}
