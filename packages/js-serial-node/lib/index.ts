import { NodeSerialPort } from "./NodeSerialPort";
import {JsSerialBase, AbstractDataHandler, DelimiterDataHandler} from '../../js-serial-core/lib/BaseSerialPort'

export default class JsSerialNode extends JsSerialBase{
    constructor(
        rxDataHandler:AbstractDataHandler = new DelimiterDataHandler()
    ){  
        const nsp = new NodeSerialPort()
        super(nsp, rxDataHandler)
    }
}
