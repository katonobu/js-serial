import { NodeMockSerialPort } from '../NodeMockSerial'

describe("NodeMockSerialPort", () => {
    it("getDeviceKeyPortInfos", async () => {
        const paths = [0,1].map((_)=>NodeMockSerialPort.addPort())
        const ns = new NodeMockSerialPort()
        expect(ns).toBeInstanceOf(NodeMockSerialPort)
        const dkpis = await ns.getDeviceKeyPortInfos()
//        console.log(dkpis)
        dkpis.forEach((dkpi)=>{
            expect(dkpi.key).toBe(dkpi.info.portName)
            expect(dkpi.info.id).toBe(-1)
            expect(typeof dkpi.info.pid).toBe('number')
            expect(typeof dkpi.info.vid).toBe('number')
        })
        dkpis.forEach((dkpi, idx)=>{
            expect(dkpi.key).toBe(paths[idx])
        })
        NodeMockSerialPort.reset()
    })
});