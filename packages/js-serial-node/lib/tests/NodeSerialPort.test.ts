import { NodeSerialPort } from '../NodeSerialPort'

describe("NodeSerialPort", () => {
    it("getDeviceKeyPortInfos", async () => {
        const ns = new NodeSerialPort()
        expect(ns).toBeInstanceOf(NodeSerialPort)
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