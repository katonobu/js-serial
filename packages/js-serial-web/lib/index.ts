import {WebSerialPort} from './WebSerialPort'
import {PortManager, AbstractDataHandler, DelimiterDataHandler} from '../../js-serial-core/lib/portManger'

export default class JsSerialWeb extends PortManager{
    constructor(
        rxDataHandler:AbstractDataHandler = new DelimiterDataHandler()
    ){  
        const wsp = new WebSerialPort()
        super(wsp, rxDataHandler)
    }
}
