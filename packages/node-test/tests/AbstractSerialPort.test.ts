import JsSerialNode from '../src/index'

describe("AbstractSerial", () => {
    it("PortManager instance", async () => {
        const jsn = new JsSerialNode()
        expect(jsn).toBeInstanceOf(JsSerialNode)
    })

    it("PortManager portStore subscribe/unsubscribe", async () => {
        const jsn = new JsSerialNode()

        await jsn.init({})
        expect(jsn.getSubscribeCbLen()).toBe(0)
        let unsubscribe0 = jsn.subscribePorts(()=>{})
        expect(jsn.getSubscribeCbLen()).toBe(1)
        let unsubscribe1 = jsn.subscribePorts(()=>{})
        expect(jsn.getSubscribeCbLen()).toBe(2)
        unsubscribe1()
        expect(jsn.getSubscribeCbLen()).toBe(1)
        unsubscribe0()
        expect(jsn.getSubscribeCbLen()).toBe(0)
        await jsn.finalize()
    })

    it("PortManager init", async () => {
        const jsn = new JsSerialNode()

        const initretval = jsn.init({})
        expect(initretval).toBeInstanceOf(Promise)
        expect(await initretval).toBe(undefined)
        await jsn.finalize()
    })

    it("PortManager finalize", async () => {
        const jsn = new JsSerialNode()

        await jsn.init({})
        const finalizeRetval = jsn.finalize()
        expect(finalizeRetval).toBeInstanceOf(Promise)
        expect(await finalizeRetval).toBe(undefined)
    })

    it("PortManager updateRequest basic", async () => {
        const jsn = new JsSerialNode()
        await jsn.init({})
        
        const update = jsn.updateRequest()
        expect(update).toBeInstanceOf(Promise)
        expect(await update).toBe(undefined)
        await jsn.finalize()
    })

    /*
    it("PortManager check portStore value on subscribe function called ", async () => {
        const ns = new NodeSerialPort()
        const pm = new PortManager(ns)

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

        await pm.init({})
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);
        unsubscribe()
        await pm.finalize()
    })
*/
    it("PortManager subscribe function called onece even if updateRequest() called twice on ports are not changed", async () => {
        const jsn = new JsSerialNode()

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = jsn.subscribePorts(mockCallbackMayCalledOnce)

        await jsn.init({})
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);
        unsubscribe()

        // connected number of ports is same, so callback is called on updateRequest()
        const mockCallbackNotCalled = jest.fn();        
        unsubscribe = jsn.subscribePorts(mockCallbackNotCalled)
        await jsn.updateRequest()
        expect(mockCallbackNotCalled).toHaveBeenCalledTimes(0);
        unsubscribe()
        await jsn.finalize()
    })
});