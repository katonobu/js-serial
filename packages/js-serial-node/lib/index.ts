import { NodeSerialPort } from "./NodeSerialPort";
import {PortManager, AbstractDataHandler, DelimiterDataHandler} from '../../js-serial-core/lib/portManger'

export default class JsSerialNode extends PortManager{
    constructor(
        rxDataHandler:AbstractDataHandler = new DelimiterDataHandler()
    ){  
        const nsp = new NodeSerialPort
        super(nsp, rxDataHandler)
    }
}
