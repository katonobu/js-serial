import { NodeSerialPort } from "./NodeSerialPort";
import {JsSerialBase} from '../../js-serial-core/lib/BaseSerialPort'

export default class JsSerialNode extends JsSerialBase{
    constructor(){  
        const nsp = new NodeSerialPort()
        super(nsp)
    }
}
