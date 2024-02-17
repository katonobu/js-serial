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
```
subscribePorts(cb: () => void):() => void
getPorts():portStoreType
```
#### port open/close
```
subscribeOpenStt(id:portIdType, cb:()=>void):()=>void
getOpenStt(id:portIdType):boolean
```

#### 受信データ
```
subscribeRxLineNum(id:portIdType, cb:()=>void):()=>void 
getRxLineNum(id:portIdType):rxLineNumType 
getRxLines(id:portIdType, start:number, end:number):rxLinesType 
<deleteRxLines(id:portIdType, start:number, end:number) not implemented>
```

### crud系
```
async init(opt:{pollingIntervalMs?:number}):Promise<void> (opt is not used in WebSerial)
async promptGrantAccess(option:any/*createOption*/):Promise<portInfoType> (only available for WebSerial)
async deletePort(id:portIdType):Promise<portInfoType> (only available for WebSerial)
async openPort(id:portIdType, option:any/*openOption*/):Promise<string> 
async receivePort(id:portIdType, byteLength: number, timeoutMs: number, option:object): Promise<any> 
async sendPort(id:portIdType, msg: Uint8Array, option:object): Promise<string> 
async closePort(id:portIdType):Promise<string> 
async finalize():Promise<void> 
```
## Hooks(only available for WebSerial)
### 非同期通知系(useSyncExternalStore)
```
useSerialPorts():portStoreType 
useIsOpen(id:portIdType):boolean
useRxLieNum(id:portIdType):rxLineNumType 
```
### CRUD関数系
```
async useGetPorts():Promise<portStoreType>
async useCreate(option:??):Promise<portInfoType>
async useGetRxLines(id:portIdType, start:number, end:number):Promise<rxLinesType+pageInfo>
async useDelete(id:portIdType):Promise<portInfoType>
async useOpen(id:portIdType, option:??):Promise<string>
async useSend(id:portIdType, msg: Uint8Array):Promise<string>
async useReceieveStart(id:portIdType):Promise<string>
async useClose(id:portIdType):Promise<void>
```
## Custamize Rx Data Processing
- implement AbstractDataHandler class.
  - example implement is DelimiterDataHandler

# Loadmaps
- more test.
- use worker thread.
- dev server
  - node-serial with REST-API,WebSocket for debugging.

# Testing
- 下記不具合を検出できるテストパターン追加
  - `packages\js-serial-core\lib\BaseSerialPort.ts`
    ```
    this._rxLineNumStore[id].update({totalLines:this._rxLineBuffers[id].length, updatedLines:updateData.length})
    to
    this._rxLineNumStore[id].update({totalLines:this._rxLineBuffers[id].length, updatedLines:updatedLines.length})
    ```
- recabable error 多発させる。

## receivePort読み解き
### 設計上の仮定
  - close中はport.readableはfalsy
  - open中はport.readableはtruely
  - USB取り外ししてもportはTruly.{onconnect: null, ondisconnect: null, readable: null, writable: null}
  - startReadPort前はport.readable.locked === false
  - startReadPort中はport.readable.locked === true
  - stopReadPort後はport.readable.locked === false
  - port.readable.locked === true中のport.readable.getReader()は例外が発生する。
  - 通信エラー発生時の挙動は?=>例外投げる.詳細は、[readable attribute](https://wicg.github.io/serial/#readable-attribute)に記載あり。
### まとめ
- receivePortをキャンセルさせるためには、下記の両方を満たす必要がある
  - whileループ継続条件のいずれかを満たさなくする
  - this._reader.read()の処理を止める
- receivePortをキャンセルしたとき、
  - this._reader.releaseLock()を呼び出してロックを解放させ無ければならない。
  - close()由来ではなく、close()処理が必要な場合(USB取り外し)、close()を呼び出す。
- 通信エラー
  - this._reader.read()で例外がthrowされると想定される。(要裏どり)
  - ノイズ由来のリカバリ可能と想定している(と思われる)ので、一旦ロックを解放して、再度read処理を繰り返す
- this._reader = port.readable.getReader();での例外発生
  - 一般的なreadableStreamでは、lock取得失敗で例外は発生しないようだが、SerialPortだと、lock取得失敗で例外を投げている模様。
  - ここで例外が発生すると、リカバリ可能エラー扱いになり無限ループする

### close時の脱出
  - this._closeReqをtrueにしてwhileLoopから抜ける(this._reader.read()中でない場合)
  - this._reader.cancel()を呼び出して、for(;;)のthis._reader.read()を終了させる
  - finally()でthis._reader.releaseLock()を呼び出してロックを解放させる
  - this._closeReqをfalseに戻す

### USB取り外し時の脱出
  - port.readableがfalseになりwhileループから抜ける
    - [SerialPort.readable](https://developer.mozilla.org/ja/docs/Web/API/SerialPort/readable)によれば、「SerialPort の読み取り専用プロパティ readable は、、、、ポートが開かれており、かつ致命的なエラーが起きていない限り、null にはなりません。」とのこと。
    - this._reader.read()はシステム側でキャンセルされ、例外DOMException.NetworkErrorが送出される。
      - 例外でループを抜けるのでdone,valueは評価されない。
  - finally()でthis._reader.releaseLock()を呼び出してロックを解放させる
  - close()処理を呼び出す
