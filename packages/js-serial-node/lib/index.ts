import { NodeSerialPort } from "./NodeSerial";
import {JsSerialBase} from '../../js-serial-core/lib/BaseSerial'

export default class JsSerialNode extends JsSerialBase{
    constructor(){  
        const nsp = new NodeSerialPort()
        super(nsp)
    }
}
