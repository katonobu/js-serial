import { NodeSerialPort } from '../NodeSerialPort'

describe("NodeSerialPort", () => {
    it("getDeviceKeyPortInfos", async () => {
        const ns = new NodeSerialPort()
        expect(ns).toBeInstanceOf(NodeSerialPort)
        const dkpis = await ns.getDeviceKeyPortInfos()
        //  console.log(dkpis)
        dkpis.forEach((dkpi)=>{
            expect(dkpi.key).toBe(dkpi.portInfo.portName)
            expect(dkpi.portInfo.id).toBe(-1)
            expect(typeof dkpi.portInfo.pid).toBe('number')
            expect(typeof dkpi.portInfo.vid).toBe('number')
        })
    })
});