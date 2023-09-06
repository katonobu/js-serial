import {WebSerialPort} from './WebSerialPort'
import {JsSerialBase, AbstractDataHandler, DelimiterDataHandler} from '../../js-serial-core/lib/BaseSerialPort'

export default class JsSerialWeb extends JsSerialBase{
    constructor(
        rxDataHandler:AbstractDataHandler = new DelimiterDataHandler()
    ){  
        const wsp = new WebSerialPort()
        super(wsp, rxDataHandler)
    }
}
