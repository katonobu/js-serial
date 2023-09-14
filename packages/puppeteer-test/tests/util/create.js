const {clickAndWait} = require('./common.js')

const setOptionClickCreate = async(page, option) => {
    await page.evaluate((value) => {document.querySelector('#arg').innerText = value;}, option);
    return await clickAndWait(page, '#create',"create", 0)
}

const pidVidFilterParams = [
    {name:"No filter", value:"{}"},
    {name:"FTDI", value:'{"filters":[{"usbVendorId": 1027 }] }'},
    {name:"ST-Micro", value:'{"filters":[{"usbVendorId": 1155 }]}'}
]

module.exports = {
    setOptionClickCreate,
    pidVidFilterParams
}
