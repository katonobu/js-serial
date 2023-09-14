import WebSerial from './WebSerial'
import {JsSerialBase} from './BaseSerial'

export default class JsSerialWeb extends JsSerialBase{
    constructor(){
        const wsp = new WebSerial()
        super(wsp)
    }
}
