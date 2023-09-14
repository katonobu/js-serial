import { expect, it, describe, vi, beforeEach, beforeAll } from 'vitest'
import JsSerialWeb from "../lib/index"

describe.sequential('Init/finish', () => {
    it('init/finish success.', async () => {
        const jsw = new JsSerialWeb()
        expect(await jsw.init()).toBe(undefined)
        expect(await jsw.finalize()).toBe(undefined)
    })
    it('init twice', async () => {
        const jsw = new JsSerialWeb()

        expect(await jsw.init()).toBe(undefined)
        expect(() => jsw.init()).rejects.toThrowError(/Initialized/)
        expect(await jsw.finalize()).toBe(undefined)
    })
    it('finalize twice', async () => {
        const jsw = new JsSerialWeb()

        expect(await jsw.init()).toBe(undefined)
        expect(await jsw.finalize()).toBe(undefined)
        expect(() => jsw.finalize()).rejects.toThrowError(/finalized/)
    })
})

describe.sequential('promptGrantAccess', () => {
    it('does not have transient activation', async () => {
        const jsw = new JsSerialWeb()
        expect(() => jsw.promptGrantAccess({})).rejects.toThrowError(/user gesture/)
    })
    it('Invalid Filter', async () => {
        const jsw = new JsSerialWeb()
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
                expect(() => jsw.promptGrantAccess(invalidSerialportRequestOptions)).rejects.toThrowError(/usbVendorId/)
                resolve(undefined)
/*
                try {
                    const result = await jsw.promptGrantAccess(invalidSerialportRequestOptions)
                    console.log(result)
                } catch (e) {
                    console.log(e)
                } finally {
                    resolve(undefined)
                }
                */
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
        const jsw = new JsSerialWeb()
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
                try {
                    const result = await jsw.promptGrantAccess({})
                    expect(result.id).toBe(-1)
                    expect(result.pid).toBe(-1)
                    expect(result.vid).toBe(-1)
//                    console.log(result)
                } catch (e) {
                    console.log(e)
                    expect('expected').toBe('Not come here')
                } finally {
                    resolve(undefined)
                }
/*
                expect(await jsw.promptGrantAccess({})).toBe({id:-1,vid:-1,pid:-1})
                resolve(undefined)
                */
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
