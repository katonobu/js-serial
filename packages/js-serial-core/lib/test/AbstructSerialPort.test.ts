import { NodeMockSerialPort } from './NodeMockSerialPort'
import { PortManager } from '../portManger';

describe("AbstructSerialPort", () => {
    it("PortManager instance", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)
        expect(pm).toBeInstanceOf(PortManager)
    })

    it("PortManager portStore subscribe/unsubscribe", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        expect(pm.portStore.getCallbacksLen()).toBe(0)
        let unsubscribe0 = pm.portStore.subscribe(()=>{})
        expect(pm.portStore.getCallbacksLen()).toBe(1)
        let unsubscribe1 = pm.portStore.subscribe(()=>{})
        expect(pm.portStore.getCallbacksLen()).toBe(2)
        unsubscribe1()
        expect(pm.portStore.getCallbacksLen()).toBe(1)
        unsubscribe0()
        expect(pm.portStore.getCallbacksLen()).toBe(0)
    })

    it("PortManager init", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        const initretval = pm.init()
        expect(initretval).toBeInstanceOf(Promise)
        expect(await initretval).toBe(undefined)
    })

    it("PortManager updateRequest basic", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)
        await pm.init()
        
        const update = pm.updateRequest()
        expect(update).toBeInstanceOf(Promise)
        expect(await update).toBe(undefined)
    })

    it("PortManager callback is not called if port is empty ", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)
        await pm.init()

        const mockCallbackNotCalled = jest.fn()
        let unsubscribe = pm.portStore.subscribe(mockCallbackNotCalled)
        await pm.updateRequest()
        expect(mockCallbackNotCalled).toHaveBeenCalledTimes(0);
        unsubscribe()
    })

    it("PortManager callback is called if port is added ", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)
        await pm.init()

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = pm.portStore.subscribe(mockCallbackMayCalledOnce)

        NodeMockSerialPort.addPort()
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        NodeMockSerialPort.addPort()
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(2);

        unsubscribe()
        NodeMockSerialPort.reset()
    })


    it("PortManager subscribe function called onece even if updateRequest() called twice on ports are not changed", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)
        await pm.init()

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = pm.portStore.subscribe(mockCallbackMayCalledOnce)

        NodeMockSerialPort.addPort()
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        // NodeMockSerialPort.addPort() // don't add the port, this skips callback
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        unsubscribe()
        NodeMockSerialPort.reset()
    })
});