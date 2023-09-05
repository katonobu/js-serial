import { NodeMockSerialPort } from './NodeMockSerialPort'

describe("NodeMockSerialPort", () => {
    it("getDeviceKeyPortInfos", async () => {
        const paths = [0,1].map((_)=>NodeMockSerialPort.addPort())
        const ns = new NodeMockSerialPort()
        expect(ns).toBeInstanceOf(NodeMockSerialPort)
        const dkpis = await ns.getDeviceKeyPortInfos()
//        console.log(dkpis)
        dkpis.forEach((dkpi)=>{
            expect(dkpi.key).toBe(dkpi.portInfo.portName)
            expect(dkpi.portInfo.id).toBe(-1)
            expect(typeof dkpi.portInfo.pid).toBe('number')
            expect(typeof dkpi.portInfo.vid).toBe('number')
        })
        dkpis.forEach((dkpi, idx)=>{
            expect(dkpi.key).toBe(paths[idx])
        })
        NodeMockSerialPort.reset()
    })
});