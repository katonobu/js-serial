
const bleUtilConsoleLog = (
    // @ts-ignore
    arg:string
)=>{
//    console.log(arg)
}


const ble_getDescriptors = async (
    descriptors_to_add:any[],
    characteristic:BluetoothRemoteGATTCharacteristic
) => {
    bleUtilConsoleLog('          Getting descriptors');
    try {
        const descriptors = await characteristic.getDescriptors()
        try {
            bleUtilConsoleLog('          Got ' + descriptors.length + ' descriptors');
            for (let i = 0; i < descriptors.length; i++) {
                const item:{
                    descriptor?:BluetoothRemoteGATTDescriptor,
                    uuid?:string
                    value?:any,
                    userDescription?:string,
                    clientCharacteristicConfiguration?:string
                } = {}
                const descriptor = descriptors[i];
                bleUtilConsoleLog('            Descriptor[' + i + ']');
                bleUtilConsoleLog('              UUID:' + descriptor.uuid)
                item.descriptor = descriptor
                item.uuid = descriptor.uuid

                let value = null;
                try{
                    value = await descriptor.readValue();
                } catch (error:any) {
                    bleUtilConsoleLog("                " + error.toString());
                    continue
                }
                item.value = value
                if (descriptor.uuid === "00002901-0000-1000-8000-00805f9b34fb"){
                    let decoder = new TextDecoder('utf-8');
                    const decoded = decoder.decode(value)
                    bleUtilConsoleLog('              Value:' + decoded);
                    item.userDescription = decoded
                } else {
                    let data = [];
                    for (let i = 0; i < value.byteLength; i++) {
                        data.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
                    }
                    if (descriptor.uuid === "00002902-0000-1000-8000-00805f9b34fb"){
                        bleUtilConsoleLog('              Value:' + data.join(', '));
                        item.clientCharacteristicConfiguration = data.join(', ')
                        let notificationsBit = value.getUint8(0) & 0b01;
                        bleUtilConsoleLog('              Notifications: ' + (notificationsBit ? 'ON' : 'OFF'));
                        let indicationsBit = value.getUint8(0) & 0b10;
                        bleUtilConsoleLog('              Indications: ' + (indicationsBit ? 'ON' : 'OFF'));                    
                    }
                }
                descriptors_to_add.push(item)
            }
        } catch (error:any) {
            bleUtilConsoleLog("    " + error.toString());
            console.error(error.toString())
        }
    } catch (error) {
        bleUtilConsoleLog('          Got 0 descriptors');
    }
}

const ble_setupCharacteristic = async (
    characteristics:any[],
    characteristic:BluetoothRemoteGATTCharacteristic
) => {
    var item = {
        uuid: characteristic.uuid,
        characteristic: characteristic,
        properties: "",
        descriptors: []
    };
    item.properties = "Properties:";
    if (characteristic.properties.broadcast)
        item.properties += " broadcast";
    if (characteristic.properties.read)
        item.properties += " read";
    if (characteristic.properties.writeWithoutResponse)
        item.properties += " writeWithoutResponse";
    if (characteristic.properties.write)
        item.properties += " write";
    if (characteristic.properties.notify)
        item.properties += " notify";
    if (characteristic.properties.indicate)
        item.properties += " indicate";
    if (characteristic.properties.authenticatedSignedWrites)
        item.properties += " authenticatedSignedWrites";
    bleUtilConsoleLog('          UUDI: ' + item.uuid);
    bleUtilConsoleLog('          ' + item.properties);
    await ble_getDescriptors(item.descriptors, characteristic);
    characteristics.push(item);
}    


export const ble_setService = async(service:BluetoothRemoteGATTService)=>{
    var item = {
        uuid: service.uuid,
        service: service,
        characteristics: []
    };
    try {
        bleUtilConsoleLog('      Geting Characteristics');
        var characteristics = await service.getCharacteristics();
        bleUtilConsoleLog('      Got ' + characteristics.length + ' Characteristics');
        for (var i = 0; i < characteristics.length; i++){
            bleUtilConsoleLog('        Characteristic[' + i + ']');
            await ble_setupCharacteristic(item.characteristics, characteristics[i]);
        }
    } catch (error:any) {
        bleUtilConsoleLog("        " + error.toString());
        console.error(error.toString())
    }
    return item;
}

export const ble_setNotify = async(characteristic:BluetoothRemoteGATTCharacteristic, isStart:boolean, onValueChanged:(event:Event)=>void):Promise<void>=>{
    if(characteristic.properties.notify) {
        bleUtilConsoleLog('    Request starting Notification..');
        bleUtilConsoleLog('      UUDI:' + characteristic.uuid);
        if (isStart) {
            characteristic.addEventListener('characteristicvaluechanged', onValueChanged);
            try{
                await characteristic.startNotifications();
            } catch (error:any) {
                bleUtilConsoleLog("    at characteristic.startNotifications()");
                bleUtilConsoleLog("      " + error.toString());
                characteristic.removeEventListener('characteristicvaluechanged', onValueChanged);
                throw(error)
            }
        } else {
            try{
                characteristic.removeEventListener('characteristicvaluechanged', onValueChanged);
                await characteristic.stopNotifications();
            } catch (error:any) {
                bleUtilConsoleLog("    at characteristic.stopNotifications()");
                bleUtilConsoleLog("      " + error.toString());
                throw(error)
            }
        }
        //const tmp = navigator.BluetoothUUID.getDescriptor('gatt.client_characteristic_configuration');
        const tmp = "00002902-0000-1000-8000-00805f9b34fb";
        const descriptor = await characteristic.getDescriptor(tmp);
        const value = await descriptor.readValue();
        if (isStart) {
            if((value.getUint8(0) & 0b01) !== 0){
                bleUtilConsoleLog('    Notification started');
            } else {
                bleUtilConsoleLog('    Notification start failed');
                throw(new Error("Notification start failed"))
            }
        } else {
            if((value.getUint8(0) & 0b01) === 0){
                bleUtilConsoleLog('    Notification stoped');
            } else {
                bleUtilConsoleLog('    Notification stop failed');
                throw(new Error("Notification stop failed"))
            }
        }
    }
}
