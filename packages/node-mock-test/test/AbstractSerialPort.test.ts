import { NodeMockSerial } from '../src/NodeMockSerial'
import { JsSerialBase } from '../../js-serial-web/lib/BaseSerial';
import JsSerialNodeMock from '../src/NodeMockSerial'

describe("AbstractSerial", () => {
    it("PortManager instance", async () => {
        const jsnm = new JsSerialNodeMock()
        expect(jsnm).toBeInstanceOf(JsSerialBase)
    })

    it("PortManager portStore subscribe/unsubscribe", async () => {
        const jsnm = new JsSerialNodeMock()

        await jsnm.init({})
        expect(jsnm.getSubscribeCbLen()).toBe(0)
        let unsubscribe0 = jsnm.subscribePorts(()=>{})
        expect(jsnm.getSubscribeCbLen()).toBe(1)
        let unsubscribe1 = jsnm.subscribePorts(()=>{})
        expect(jsnm.getSubscribeCbLen()).toBe(2)
        unsubscribe1()
        expect(jsnm.getSubscribeCbLen()).toBe(1)
        unsubscribe0()
        expect(jsnm.getSubscribeCbLen()).toBe(0)
        await jsnm.finalize()
    })

    it("PortManager init", async () => {
        const jsnm = new JsSerialNodeMock()

        const initretval = jsnm.init({})
        expect(initretval).toBeInstanceOf(Promise)
        expect(await initretval).toBe(undefined)
        await jsnm.finalize()
    })

    it("PortManager finalize", async () => {
        const jsnm = new JsSerialNodeMock()

        await jsnm.init({})
        const finalizeRetval = jsnm.finalize()
        expect(finalizeRetval).toBeInstanceOf(Promise)
        expect(await finalizeRetval).toBe(undefined)
    })

    it("PortManager updateRequest basic", async () => {
        const jsnm = new JsSerialNodeMock()
        await jsnm.init({})
        
        const update = jsnm.updateRequest("Init")
        expect(update).toBeInstanceOf(Promise)
        expect(await update).toBe(undefined)
        await jsnm.finalize()
    })

    it("PortManager callback is not called if port is empty ", async () => {
        const jsnm = new JsSerialNodeMock()

        const mockCallbackNotCalled = jest.fn()
        let unsubscribe = jsnm.subscribePorts(mockCallbackNotCalled)
        await jsnm.init({})
        expect(mockCallbackNotCalled).toHaveBeenCalledTimes(0);
        unsubscribe()
        await jsnm.finalize()
    })

    it("PortManager callback is called if port is added ", async () => {
        const jsnm = new JsSerialNodeMock()

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = jsnm.subscribePorts(mockCallbackMayCalledOnce)

        NodeMockSerial.addPort()
        await jsnm.init({})
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        NodeMockSerial.addPort()
        await jsnm.updateRequest("Init")
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(2);

        unsubscribe()
        await jsnm.finalize()
        NodeMockSerial.reset()
    })


    it("PortManager subscribe function called onece even if updateRequest() called twice on ports are not changed", async () => {
        const jsnm = new JsSerialNodeMock()

        const mockCallbackMayCalledOnce = jest.fn()
        let unsubscribe = jsnm.subscribePorts(mockCallbackMayCalledOnce)

        NodeMockSerial.addPort()
        await jsnm.init({})
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        // NodeMockSerial.addPort() // don't add the port, this skips callback
        await jsnm.updateRequest("Init")
        expect(mockCallbackMayCalledOnce).toHaveBeenCalledTimes(1);

        unsubscribe()
        await jsnm.finalize()
        NodeMockSerial.reset()
    })

    it("PortManager Add Port pollig check", async () => {
        const jsnm = new JsSerialNodeMock()

        NodeMockSerial.addPort()

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
                    NodeMockSerial.addPort()
                }, pollingIntervalMs * 3)
                const mockCallbackMayCalledTwice = jest.fn()
                mockCallbackMayCalledTwice.mockImplementation(()=>{
                    const ports = jsnm.getPorts()
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
                const unsubscribe = jsnm.subscribePorts(mockCallbackMayCalledTwice)
                jsnm.init({pollingIntervalMs})
            })
        } catch(e) {
            console.log(e)
            expect(e).toBe(undefined)
        }

        await jsnm.finalize()
        NodeMockSerial.reset()
    })
    it("PortManager Delete Port pollig check", async () => {
        const jsnm = new JsSerialNodeMock()

        const pollingIntervalMs = 100
        await new Promise((resolve) => {
            NodeMockSerial.addPort()
            NodeMockSerial.addPort()
    
            const mockCallbackMayCalledInit = jest.fn()
            mockCallbackMayCalledInit.mockImplementation(()=>{
                const ports = jsnm.getPorts()
                expect(ports.curr.length).toBe(2)
                expect(ports.curr.filter((port)=>port.available).length).toBe(2)
                expect(ports.attached.length).toBe(2)
                expect(ports.attached[0]).toBe(0)
                expect(ports.attached[1]).toBe(1)
                expect(ports.detached.length).toBe(0)
                
                unsubscribeInit()
                resolve(0)
            })
            const unsubscribeInit = jsnm.subscribePorts(mockCallbackMayCalledInit)
            jsnm.init({pollingIntervalMs})
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
                    NodeMockSerial.reset()
                }, pollingIntervalMs * 3)
                const mockCallbackMayCalledOnce = jest.fn()
                mockCallbackMayCalledOnce.mockImplementation(()=>{
                    const ports = jsnm.getPorts()
//                    console.log("called ", JSON.stringify(ports))
                    expect(ports.curr.length).toBe(2)
                    expect(ports.curr.filter((port)=>port.available).length).toBe(0)
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
                const unsubscribe = jsnm.subscribePorts(mockCallbackMayCalledOnce)
            })
        } catch(e) {
            console.log(e)
            console.log("timeout ", JSON.stringify(jsnm.getPorts()))
            expect(e).toBe(undefined)
        }

        await jsnm.finalize()
        NodeMockSerial.reset()

    })

});