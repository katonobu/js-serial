import {WebSerialPort} from './WebSerialPort'
import {JsSerialBase} from '../../js-serial-core/lib/BaseSerialPort'

export default class JsSerialWeb extends JsSerialBase{
    constructor(){
        const wsp = new WebSerialPort()
        super(wsp)
    }
}
