import { NodeMockSerial } from '../lib/NodeMockSerial'

describe("NodeMockSerial", () => {
    it("getDeviceKeyPortInfos", async () => {
        const paths = [0,1].map((_)=>NodeMockSerial.addPort())
        const ns = new NodeMockSerial()
        expect(ns).toBeInstanceOf(NodeMockSerial)
        const dkpis = await ns.getDeviceKeyPortInfos()
        expect(dkpis.length).toBe(2)
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
        NodeMockSerial.reset()
    })
});