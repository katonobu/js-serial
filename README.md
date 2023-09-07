# js-serial

## 特徴
- 複数のシリアルポートを並列に受信可能。
- WebSocketによる非同期通知 + REST-APIでのCRUDアクセス的実装を想定したAPI
- vanilla-ts APIはNode-serial/Node-serial-mockでも共通APIで利用可能
  - データ受信処理の検証はNode-serial/Node-serial-mockで行い、web-Serial環境への移行が可能

## 理解を早めるためのマインドモデル
- 接続済デバイス
- 認証済デバイス

## Application向け
### 非同期通知系(useSyncExternalStore)
#### port増減
subscribePorts(cb: () => void):() => void 
getPorts():portStoreType 

#### port open/close
subscribeOpenStt(id:portIdType, cb:()=>void):()=>void 
getOpenStt(id:portIdType):boolean 

#### 受信データ
subscribeRxLineNum(id:portIdType, cb:()=>void):()=>void 
getRxLineNum(id:portIdType):rxLineNumType 
getRxLines(id:portIdType, start:number, end:number):rxLinesType 
<deleteRxLines(id:portIdType, start:number, end:number) not implemented>

### crud系
async init(opt:{pollingIntervalMs?:number}):Promise<void> (opt is not used in WebSerial)
async promptGrantAccess(option:any/*createOption*/):Promise<portInfoType> (only available for WebSerial)
async deletePort(id:portIdType):Promise<portInfoType> (only available for WebSerial)
async openPort(id:portIdType, option:any/*openOption*/):Promise<string> 
async receivePort(id:portIdType, byteLength: number, timeoutMs: number, option:object): Promise<any> 
async sendPort(id:portIdType, msg: Uint8Array, option:object): Promise<string> 
async closePort(id:portIdType):Promise<string> 
async finalize():Promise<void> 

## Hooks(only available for WebSerial)
### 非同期通知系(useSyncExternalStore)
useSerialPorts():portStoreType 
useIsOpen(id:portIdType):boolean
useRxLieNum(id:portIdType):rxLineNumType 
### CRUD関数系
async useGetPorts():Promise<portStoreType>
async useCreate(option:??):Promise<portInfoType>
async useGetRxLines(id:portIdType, start:number, end:number):Promise<rxLinesType+pageInfo>
async useDelete(id:portIdType):Promise<portInfoType>
async useOpen(id:portIdType, option:??):Promise<string>
async useSend(id:portIdType, msg: Uint8Array):Promise<string>
async useReceieveStart(id:portIdType):Promise<string>
async useClose(id:portIdType):Promise<void>

## Custamize Rx Data Processing
- implement AbstractDataHandler class.
  - example implement is DelimiterDataHandler

# Loadmaps
- more test.
- use worker thread.
- dev server
  - node-serial with REST-API,WebSocket for debugging.

# Testing
