import { initOptionType } from "../lib/AbstractSerial";
import WebSerail from "../lib/WebSerial";
import { expect, it, describe, vi, beforeEach, beforeAll } from 'vitest'

describe.sequential('Init/finish', () => {
    let conenctCallbackAdded:EventListenerOrEventListenerObject | null = null
    let disconnectCallbackAdded:EventListenerOrEventListenerObject | null = null
    let conenctCallbackRemoved:EventListenerOrEventListenerObject  | null = null
    let disconnectCallbackRemoved:EventListenerOrEventListenerObject | null = null
    const updateRequest = ()=>Promise.resolve()
    const validInitOption:initOptionType = {portManager:{updateRequest}, pollingIntervalMs:0}

    beforeEach(()=>{
        conenctCallbackAdded = null
        disconnectCallbackAdded = null
        conenctCallbackRemoved = null
        disconnectCallbackRemoved = null
    })
    beforeAll(()=>{
        vi.spyOn(navigator.serial, 'addEventListener').mockImplementation((act,cb) => {
            if (act === 'connect'){
                conenctCallbackAdded = cb
            } else if (act === 'disconnect') {
                disconnectCallbackAdded = cb
            } else {
                expect('never').toBe('come here')
            }
        })
        vi.spyOn(navigator.serial, 'removeEventListener').mockImplementation((act,cb) => {
            if (act === 'connect'){
                conenctCallbackRemoved = cb
            } else if (act === 'disconnect') {
                disconnectCallbackRemoved = cb
            } else {
                expect('never').toBe('come here')
            }
        })
    })

    it('init/finish success.', async () => {
        const ws = new WebSerail()

        expect(conenctCallbackAdded).toBe(null)
        expect(disconnectCallbackAdded).toBe(null)
        expect(await ws.init(validInitOption)).toBe(undefined)
        expect(conenctCallbackAdded).toBeTruthy()
        expect(disconnectCallbackAdded).toBeTruthy()

        expect(conenctCallbackRemoved).toBe(null)
        expect(disconnectCallbackRemoved).toBe(null)
        expect(await ws.finalize()).toBe(undefined)
        expect(conenctCallbackRemoved).toBeTruthy()
        expect(disconnectCallbackRemoved).toBeTruthy()
    })
    it('init twice', async () => {
        const ws = new WebSerail()

        expect(await ws.init(validInitOption)).toBe(undefined)

        conenctCallbackAdded = null
        disconnectCallbackAdded = null
        expect(() => ws.init(validInitOption)).rejects.toThrowError(/Initialized/)
        expect(conenctCallbackAdded).toBe(null)
        expect(disconnectCallbackAdded).toBe(null)

        expect(await ws.finalize()).toBe(undefined)
    })
    it('finalize twice', async () => {
        const ws = new WebSerail()

        expect(await ws.init(validInitOption)).toBe(undefined)
        expect(await ws.finalize()).toBe(undefined)

        conenctCallbackRemoved = null
        disconnectCallbackRemoved = null
        await expect(() => ws.finalize()).rejects.toThrowError(/finalized/)
        expect(conenctCallbackRemoved).toBe(null)
        expect(disconnectCallbackRemoved).toBe(null)
    })
    it('init without portManager in opt', async () => {
        const ws = new WebSerail()

        const invalidInitOption:initOptionType = {portManager:{}, pollingIntervalMs:0} as initOptionType

        expect(conenctCallbackAdded).toBe(null)
        expect(disconnectCallbackAdded).toBe(null)
        await expect(() => ws.init(invalidInitOption)).rejects.toThrowError(/portManager/)        
        expect(conenctCallbackAdded).toBe(null)
        expect(disconnectCallbackAdded).toBe(null)

        await expect(() => ws.finalize()).rejects.toThrowError(/finalized/)
        expect(conenctCallbackRemoved).toBe(null)
        expect(disconnectCallbackRemoved).toBe(null)
    })
    it('init without updateRequest in opt', async () => {
        const ws = new WebSerail()

        const invalidInitOption:initOptionType = {pollingIntervalMs:0} as initOptionType

        expect(conenctCallbackAdded).toBe(null)
        expect(disconnectCallbackAdded).toBe(null)
        await expect(() => ws.init(invalidInitOption)).rejects.toThrowError(/updateRequest/)        
        expect(conenctCallbackAdded).toBe(null)
        expect(disconnectCallbackAdded).toBe(null)

        await expect(() => ws.finalize()).rejects.toThrowError(/finalized/)
        expect(conenctCallbackRemoved).toBe(null)
        expect(disconnectCallbackRemoved).toBe(null)

    })
})
describe.sequential('promptGrantAccess', () => {
    it('does not have transient activation', async () => {
        const ws = new WebSerail()
        await expect(() => ws.promptGrantAccess({})).rejects.toThrowError(/user gesture/)
    })
    it('Invalid Filter', async () => {
        const ws = new WebSerail()
        let button:HTMLButtonElement | undefined
        let messagePre:HTMLPreElement | undefined
        const vitestUiEle = document.getElementById('vitest-ui')!
        vitestUiEle.style.height="90vh"
        await new Promise((resolve)=>{
            button = document.createElement('button')
            button.textContent = 'Push me!'
            const invalidSerialportRequestOptions = {"filters":[{"usbProductId": 1155 }]} as SerialPortRequestOptions
            button.id = 'request-port'
            vitestUiEle.before(button)

            messagePre = document.createElement('pre')
            messagePre.textContent = 'Push button'
            vitestUiEle.before(messagePre)

            button.onclick = async ()=>{
                await expect(() => ws.promptGrantAccess(invalidSerialportRequestOptions)).rejects.toThrowError(/usbProductId/)
                resolve(undefined)
            }
        })

        if (button){
            document.body.removeChild(button)
        }
        if (messagePre) {
            document.body.removeChild(messagePre)
        }
        vitestUiEle.style.height="100vh"
    })
    it('Cancel', async () => {
        const ws = new WebSerail()
        let button:HTMLButtonElement | undefined
        let messagePre:HTMLPreElement | undefined
        const vitestUiEle = document.getElementById('vitest-ui')!
        vitestUiEle.style.height="90vh"
        await new Promise((resolve)=>{
            button = document.createElement('button')
            button.textContent = 'Push and selec Cancel'
            button.id = 'request-port'
            vitestUiEle.before(button)

            messagePre = document.createElement('pre')
            messagePre.textContent = 'Push requestPort() button, and select "Cancel"'
            vitestUiEle.before(messagePre)

            button.onclick = async ()=>{
                await expect(() => ws.promptGrantAccess({})).rejects.toThrowError(/selected/)
                resolve(undefined)
            }
        })

        if (button){
            document.body.removeChild(button)
        }
        if (messagePre) {
            document.body.removeChild(messagePre)
        }
        vitestUiEle.style.height="100vh"
    })
})
describe.sequential('invalid methods', () => {
    it('createPort', async () => {
        const ws = new WebSerail()
        expect(() => ws.createPort('COM1')).toThrowError(/createPort/)        
    })
})
