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

        await pm.init({})
        expect(pm.getSubscribeCbLen()).toBe(0)
        let unsubscribe0 = pm.subscribePorts(()=>{})
        expect(pm.getSubscribeCbLen()).toBe(1)
        let unsubscribe1 = pm.subscribePorts(()=>{})
        expect(pm.getSubscribeCbLen()).toBe(2)
        unsubscribe1()
        expect(pm.getSubscribeCbLen()).toBe(1)
        unsubscribe0()
        expect(pm.getSubscribeCbLen()).toBe(0)
        await pm.finalize()
    })

    it("PortManager init", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        const initretval = pm.init({})
        expect(initretval).toBeInstanceOf(Promise)
        expect(await initretval).toBe(undefined)
        await pm.finalize()
    })

    it("PortManager finalize", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        await pm.init({})
        const finalizeRetval = pm.finalize()
        expect(finalizeRetval).toBeInstanceOf(Promise)
        expect(await finalizeRetval).toBe(undefined)
    })

    it("PortManager updateRequest basic", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)
        await pm.init({})
        
        const update = pm.updateRequest()
        expect(update).toBeInstanceOf(Promise)
        expect(await update).toBe(undefined)
        await pm.finalize()
    })

    it("PortManager callback is not called if port is empty ", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        const mockCallbackNotCalled = jest.fn()
        let unsubscribe = pm.subscribePorts(mockCallbackNotCalled)
        await pm.init({})
        expect(mockCallbackNotCalled).toHaveBeenCalledTimes(0);
        unsubscribe()
        await pm.finalize()
    })

    it("PortManager callback is called if port is added ", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = pm.subscribePorts(mockCallbackMayCalledOnce)

        NodeMockSerialPort.addPort()
        await pm.init({})
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        NodeMockSerialPort.addPort()
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(2);

        unsubscribe()
        await pm.finalize()
        NodeMockSerialPort.reset()
    })


    it("PortManager subscribe function called onece even if updateRequest() called twice on ports are not changed", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = pm.subscribePorts(mockCallbackMayCalledOnce)

        NodeMockSerialPort.addPort()
        await pm.init({})
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        // NodeMockSerialPort.addPort() // don't add the port, this skips callback
        await pm.updateRequest()
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        unsubscribe()
        await pm.finalize()
        NodeMockSerialPort.reset()
    })

    it("PortManager Add Port pollig check", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        NodeMockSerialPort.addPort()

        try {
            await new Promise((resolve, reject)=>{
                const pollingIntervalMs = 100
                let callCount = 0
                const timeoutTimeId = setTimeout(()=>{
                    if (addPortTimeId) {
                        clearTimeout(addPortTimeId)
                    }
                    reject("Timeout")
                }, pollingIntervalMs * 10)
                const addPortTimeId = setTimeout(()=>{
                    clearTimeout(addPortTimeId)
                    NodeMockSerialPort.addPort()
                }, pollingIntervalMs * 3)
                const mockCallbackMayCalledTwice = jest.fn()
                mockCallbackMayCalledTwice.mockImplementation(()=>{
                    const ports = pm.getPorts()
//                    console.log("called ", callCount, JSON.stringify(ports))
                    expect(ports.curr.length).toBe(callCount + 1)
                    expect(ports.attached.length).toBe(1)
                    expect(ports.attached[0]).toBe(callCount)
                    expect(ports.detached.length).toBe(0)
                    callCount++
                    if (callCount == 2) {
                        if (addPortTimeId) {
                            clearTimeout(addPortTimeId)
                        }
                        clearTimeout(timeoutTimeId)
                        unsubscribe()
                        resolve(0)
                    }
                })
                const unsubscribe = pm.subscribePorts(mockCallbackMayCalledTwice)
                pm.init({pollingIntervalMs})
            })
        } catch(e) {
            console.log(e)
            expect(e).toBe(undefined)
        }

        await pm.finalize()
        NodeMockSerialPort.reset()
    })
    it("PortManager Delete Port pollig check", async () => {
        const ns = new NodeMockSerialPort()
        const pm = new PortManager(ns)

        const pollingIntervalMs = 100
        await new Promise((resolve) => {
            NodeMockSerialPort.addPort()
            NodeMockSerialPort.addPort()
    
            const mockCallbackMayCalledInit = jest.fn()
            mockCallbackMayCalledInit.mockImplementation(()=>{
                const ports = pm.getPorts()
                expect(ports.curr.length).toBe(2)
                expect(ports.attached.length).toBe(2)
                expect(ports.attached[0]).toBe(0)
                expect(ports.attached[1]).toBe(1)
                expect(ports.detached.length).toBe(0)
                
                unsubscribeInit()
                resolve(0)
            })
            const unsubscribeInit = pm.subscribePorts(mockCallbackMayCalledInit)
            pm.init({pollingIntervalMs})
        })

        try {
            await new Promise((resolve, reject)=>{
                const timeoutTimeId = setTimeout(()=>{
                    if (addPortTimeId) {
                        clearTimeout(addPortTimeId)
                    }
                    reject("Timeout")
                }, pollingIntervalMs * 10)
                const addPortTimeId = setTimeout(()=>{
//                    console.log("Delete")
                    clearTimeout(addPortTimeId)
                    NodeMockSerialPort.reset()
                }, pollingIntervalMs * 3)
                const mockCallbackMayCalledOnce = jest.fn()
                mockCallbackMayCalledOnce.mockImplementation(()=>{
                    const ports = pm.getPorts()
//                    console.log("called ", JSON.stringify(ports))
                    expect(ports.curr.length).toBe(0)
                    expect(ports.attached.length).toBe(0)
                    expect(ports.detached.length).toBe(2)
                    expect(ports.detached[0]).toBe(0)
                    expect(ports.detached[1]).toBe(1)

                    if (addPortTimeId) {
                        clearTimeout(addPortTimeId)
                    }
                    clearTimeout(timeoutTimeId)
                    unsubscribe()
                    resolve(0)
                })
                const unsubscribe = pm.subscribePorts(mockCallbackMayCalledOnce)
            })
        } catch(e) {
            console.log(e)
            console.log("timeout ", JSON.stringify(pm.getPorts()))
            expect(e).toBe(undefined)
        }

        await pm.finalize()
        NodeMockSerialPort.reset()

    })

});