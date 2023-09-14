import { NodeSerial } from '../src/NodeSerial'

describe("NodeSerial", () => {
    it("getDeviceKeyPortInfos", async () => {
        const ns = new NodeSerial()
        expect(ns).toBeInstanceOf(NodeSerial)
        const dkpis = await ns.getDeviceKeyPortInfos()
        //  console.log(dkpis)
        dkpis.forEach((dkpi)=>{
            expect(dkpi.key).toBe(dkpi.info.portName)
            expect(dkpi.info.id).toBe(-1)
            expect(typeof dkpi.info.pid).toBe('number')
            expect(typeof dkpi.info.vid).toBe('number')
        })
    })
});