import { NodeSerialPort } from '../NodeSerialPort'
import { PortManager } from '../../../js-serial-core/lib/portManger';

describe("AbstructSerialPort", () => {
    it("PortManager instance", async () => {
        const ns = new NodeSerialPort()
        const pm = new PortManager(ns)
        expect(pm).toBeInstanceOf(PortManager)
    })

    it("PortManager portStore subscribe/unsubscribe", async () => {
        const ns = new NodeSerialPort()
        const pm = new PortManager(ns)

        expect(pm.getSubscribeCbLen()).toBe(0)
        let unsubscribe0 = pm.subscribePorts(()=>{})
        expect(pm.getSubscribeCbLen()).toBe(1)
        let unsubscribe1 = pm.subscribePorts(()=>{})
        expect(pm.getSubscribeCbLen()).toBe(2)
        unsubscribe1()
        expect(pm.getSubscribeCbLen()).toBe(1)
        unsubscribe0()
        expect(pm.getSubscribeCbLen()).toBe(0)
    })

    it("PortManager init", async () => {
        const ns = new NodeSerialPort()
        const pm = new PortManager(ns)

        const initretval = pm.init()
        expect(initretval).toBeInstanceOf(Promise)
        expect(await initretval).toBe(undefined)
    })

    it("PortManager updateRequest basic", async () => {
        const ns = new NodeSerialPort()
        const pm = new PortManager(ns)
        await pm.init()
        
        const update = pm.updateRequest()
        expect(update).toBeInstanceOf(Promise)
        expect(await update).toBe(undefined)
    })

    it("PortManager check portStore value on subscribe function called ", async () => {
        const ns = new NodeSerialPort()
        const pm = new PortManager(ns)
        await pm.init()

        // just after instanciat PortManager, 
        // result of ns.getDeviceKeyPortInfos() is newly added, if updateRequest()is called.
        const dkpis = await ns.getDeviceKeyPortInfos()
        const mockCallbackMayCalledOnce = jest.fn()
        mockCallbackMayCalledOnce.mockImplementation(()=>{
            const portStore = pm.getPorts()
            portStore.curr.forEach((obj, idx)=> {
                expect(obj.id).toBe(idx)
                const matchedDkpi = dkpis.filter((dkpi)=>dkpi.info.portName === obj.portName)
                expect(matchedDkpi.length).toBe(1)
                expect(matchedDkpi[0].info.pid).toBe(obj.pid)
                expect(matchedDkpi[0].info.vid).toBe(obj.vid)
                expect(portStore.attached.length).toBe(portStore.curr.length)
                expect(portStore.attached[idx]).toBe(idx)
                expect(portStore.detached.length).toBe(0)
            })
        })
        let unsubscribe = pm.subscribePorts(mockCallbackMayCalledOnce)
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);
        unsubscribe()
    })

    it("PortManager subscribe function called onece even if updateRequest() called twice on ports are not changed", async () => {
        const ns = new NodeSerialPort()
        const pm = new PortManager(ns)
        await pm.init()

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = pm.subscribePorts(mockCallbackMayCalledOnce)
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);
        unsubscribe()

        // connected number of ports is same, so callback is called on updateRequest()
        const mockCallbackNotCalled = jest.fn();        
        unsubscribe = pm.subscribePorts(mockCallbackNotCalled)
        await pm.updateRequest()
        expect(mockCallbackNotCalled).toHaveBeenCalledTimes(0);
        unsubscribe()
    })
});