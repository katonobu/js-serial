const waitConsoleOutWithTimeout = (page, expStr, timeoutMs=0) => {
    return new Promise((resolve, reject)=>{
        let timerId = 0
        const consoleHandler = (msg)=>{
            const msgText = msg.text()
//            console.log("[waitConsoleOutWithTimeout]",msgText)
            if (msgText.startsWith("Result:{")) {
                if (0 < timerId) {
                    clearTimeout(timerId)
                }
                page.off('console', consoleHandler)
                const resultObj = JSON.parse(msgText.replace("Result:",""))
//                console.log(resultObj)
                if (resultObj.action === expStr) {
                    resolve(resultObj)
                }
            }
        }
        if (0 < timeoutMs) {
            timerId = setTimeout(()=>{
//                console.log("[waitConsoleOutWithTimeout]","Timeout")
                page.off('console', consoleHandler)
                reject("Timeout")
            }, timeoutMs)
        }
        page.on('console', consoleHandler)
    })    
}

const clickAndWait = async (page, clickEleIdStr, expStr, timeoutMs = 0) => {
    const [_,rxObj] = await Promise.all([
        page.click(clickEleIdStr),
        waitConsoleOutWithTimeout(page, expStr, timeoutMs)
    ])
    return rxObj
}

const getPorts = async(page) => {
    return await clickAndWait(page, '#get_ports', "get_ports", 0)
}

const getPortsNum = async(page) => {
    const cw = await getPorts(page)
//    console.log(cw)
    return cw.rsp.length
}

const waitEventWithTimeout = async (page, expStr, timeoutMs=0) => {
    return new Promise((resolve, reject)=>{
        let timerId = 0
        const consoleHandler = (msg)=>{
            const msgText = msg.text()
//            console.log("[waitConsoleOutWithTimeout]",msgText)
            if (msgText.startsWith("Event:{")) {
                const resultObj = JSON.parse(msgText.replace("Event:",""))
//                console.log(resultObj)
                if (resultObj.action === expStr) {
                    if (0 < timerId) {
                        clearTimeout(timerId)
                    }
                    page.off('console', consoleHandler)
                    resolve(resultObj)
                }
            }
        }
        if (0 < timeoutMs) {
            timerId = setTimeout(()=>{
//                console.log("[waitConsoleOutWithTimeout]","Timeout")
                page.off('console', consoleHandler)
                reject("Timeout")
            }, timeoutMs)
        }
        page.on('console', consoleHandler)
    })    
}

const deleteAll = async(page) => {
    let portsNum = await getPortsNum(page)
    for(let count = 0; count < portsNum; count++) {
        await clickAndWait(page, '#delete', "delete", 0)
    }
    return await getPortsNum(page)
}


module.exports = {
    clickAndWait,
    getPorts,
    getPortsNum,
    deleteAll,
    waitEventWithTimeout
}
