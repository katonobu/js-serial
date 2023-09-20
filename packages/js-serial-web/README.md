# Release History
## Ver 0.0.1
- Initial commit

## Ver 0.0.2
- Full Function is implemented.
- Basic validation is checked & PASS.
- Release to Git-HUB npm repository
------------
# GitHub Packageを使ったnpmリポジトリ登録
## 参照情報
- [npmレジストリの利用](https://docs.github.com/ja/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- 

## 手順
- [personal access token (classic) の作成](https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#personal-access-token-classic-%E3%81%AE%E4%BD%9C%E6%88%90)

- `New personal access token (classic)`のページに行く
  - `Settings`-`Developer settings`-`Personal access tokens`から入る。
- `write:packages`にチェックを入れる
- `package.json`を修正
  - name
  - repository
  - publishConfig
- `.npmrc`の作成
  - `//npm.pkg.github.com/:_authToken=gh......................OU`の1行
- `.gitignore`の修正
  - `.npmrc`をコミット対象外にする
- 事前ビルド確認
  - `npm run build`でちゃんとbuildが通ることを確認
- npm publish
  - gitリポジトリのTOPページに、パッケージ情報が出るようになる。

# web-serial-worker
worker thread for web-serial port access with main thread adapter.

# 環境
## モチベーション
- [create-react-library](https://github.com/transitive-bullshit/create-react-library)が使いいい。
  - ライブラリコードを修正すると、生成物がビルドされ、更新され、それがサンプルアプリに反映する。
- 残念ながらcreate-react-libraryは、2022/4でメンテ中止となった。
- create-react-libraryの作者による[Library Development](https://transitivebullsh.it/javascript-dev-tools-in-2022#823feddaa1bb4edea19042852b0a5b54)をベースにライブラリ環境を選択。
- tsdxが、9,500Star集めてたので、まずはtsdxから、、、、で、メンテされてない。
- Viteのlibrary modeがよさそうだったので、こいつで行く。
  - [viteでパッケージをライブラリに公開する（TypeScript対応）](https://zenn.dev/drop_table_user/articles/7b043bef6cec29)に、[coder-ka
/vite-ts-lib-starter](https://github.com/coder-ka/vite-ts-lib-starter)というスターターがあるので、こいつをベースにすることとした。
  - /lib のmain.tsを/distにumd,es形式で吐き出してくれる。
  - `npm run watch`で/lib下がwatchされる。
  - vanilla-ts,react-swc-tsのexampleもviteで作れるので、exampleから/lib下の.jsを参照すれば、exampleアプリもwatchで更新されるはず。
  - テスト環境はこれから調査。

## tsdxによる環境構築(結局アレだった。)
- tsdxでファイル生成
  - `npx tsdx create web-serial-worker`
    - reactを選択
  - これで生成さえれた./web-serial-woker以下を一階層上にコピー
  - `mv ./web-serial-worker .`

- exampleディレクトリの名前変更
  - `example`を`react-example`に変更

- vanilla-ts用サンプル生成
  - `npm create vite@latest vanilla-ts-example -- --template vanilla-ts`

- react用サンプル生成
  - `npm create vite@latest react-ts-example -- --template react-swc-ts`

- ** 結局tsdxはメンテされてないみたいで、React18の環境に適応できていないので撤退。

## vite-ts-lib-starter
- vanilla-ts用サンプル生成
  - `npm create vite@latest vanilla-ts-example -- --template vanilla-ts`

- react用サンプル生成
  - `npm create vite@latest react-ts-example -- --template react-swc-ts`

- vanilla-ts用サンプル生成ディレクトリの中身を、[GoogleChromeLabs/serial-terminal](https://github.com/GoogleChromeLabs/serial-terminal)に置き換えた。

### これで、気持ちよく開発できる！！
- `/`,`/vanilla-ts-example`,`/react-ts-example`をルートとして3つのvs-codeを開く
- `/`のvs-codeでは、`/lib`下のライブラリコードを修正する。
- `/vanilla-ts-example`,`/react-ts-example`のコードからは、`/lib`下のファイルをimportするようにしておく。
- `/vanilla-ts-example`のvs-codeでは、`npm run dev`を走らせ、ブラウザで対応するポートを開く。
- `/react-ts-example`のvs-codeでは、`npm run dev`を走らせ、ブラウザで対応するポートを開く。
- この状態で`/lib`下のライブラリコードを修正すると、vanilla,reactの内容がHotReloadで更新される!!
  - リビルドに時間がかかるので、/dist下を参照するようにすると、app修正時にエラーになるので`/lib`下のファイルをimportするようにしておく。
  - 開発ビルドは`/lib`、リリースビルドは`/dist`下とかって切り替えられるといいのかも。
### 課題
- 各example直下のtsconfig.jsonを修正したが、`/types/main.d.ts`の型情報を参照できていない。
  - /dest下で.jsと同じ名前のd.tsを生成させることで認識されるようになった。
  - tsconfig.jsonの設定ではうまく効かなかった。
- バンドルが重くてでかい
  - react,MUIがバンドルされてるっぽい。
    - webSerialWorkerAdapter.ts から先のreactなしで成り立つ条件でまずはサイズを確認する。
    - [ライブラリモード](https://ja.vitejs.dev/guide/build.html#%E3%83%A9%E3%82%A4%E3%83%95%E3%82%99%E3%83%A9%E3%83%AA%E3%83%A2%E3%83%BC%E3%83%88%E3%82%99)の記述によれば、
      - `ライブラリにバンドルしたくない依存関係、例えば vue や react などは必ず外部化してください:`とあるので、
        ```
            rollupOptions: {
              // ライブラリにバンドルされるべきではない依存関係を
              // 外部化するようにします
              external: ['vue'],
              output: {
                // 外部化された依存関係のために UMD のビルドで使用する
                // グローバル変数を提供します
                globals: {
                  vue: 'Vue',
                },
              }
            }
        ```        
        って感じでreact,MUIは外部化しないとなのかも。
      - build.lib.entryは配列指定で複数のエントリを指定できるみたいなので、vanilla用とreact用で分けたほうがいいかも。

- favicon
  - [ファビコン（favicon）とは？作成方法と設定方法について](https://digital-marketing.jp/creative/what-is-favicon/)
  - 生成
    - [iconifier.net](https://iconifier.net/)

- build結果がブラウザに反映しない
  - buildの結果、`dist/assets`にバンドルファイルが生成される。
  - 各バンドルファイルは(おそらく)hash値がファイル名に付加されているので、中身が変わるとhash値が変わり、ブラウザ側でキャッシュが効かず読み込まれる。
  - workerスレッドのコードは、`assets/webSerialWorker.xxxx.js`として生成される。
  - メインスレッドのコードは、`assets/index.xxxx.js`として生成される。
  - index.htmlには、メインスレッドを読み込むscript文が埋め込まれ、index.html生成時にハッシュ値の整合の取れる値が反映する。
  - メインスレッドのコード(`vanilla-ts-example\src\index.ts`)の実行に影響を与える変更(空行を増やすとかではダメ)はindex.htmlを更新させる。
  - workerスレッドのコード(`lib\worker\webSerialWorker.ts`)の実行に影響を与える変更(空行を増やすとかではダメ)は`assets/index.xxxx.js`を更新させ、副次的にindex.htmlを更新させる。
  - ブラウザの再読み込み3種
    - [Chromeには3種類の「再読み込み」があるって知ってた？ Webページ上の画像などを最新の状態にするテク](https://forest.watch.impress.co.jp/docs/serial/chrometips/1152903.html)
      - 通常の再読み込み:キャッシュから取ってくる
      - ハード再読み込み:サーバーから取ってくる
      - キャッシュの消去とハード再読み込み:サーバーから取ってくる、かつ、キャッシュを消去
    - よってファイル名が変わらないindex.htmlは通常の再読み込みではサーバーの情報が反映しない。

-------

# web-serial-ports

[Edit on StackBlitz ⚡️](https://stackblitz.com/edit/vitejs-vite-6dvfgw)

# WebSerial の進化

## 現状の課題

- 現状、1 つのページで 1 つのシリアルポートからしか開けない。

## 課題が解決された状態

- 複数のシリアルポートを異なるページで開いて、ページを行き来してもポートが閉じず、ログも残っている。
  - ページをまたいでも過去のログを残す。
  - ページの unmount でポートを閉じない。
- 同じページで複数のポートを開き両方の入出力を同時に観測できる。

## Link

- [本家仕様](https://wicg.github.io/serial/)
- [mdn Web Serial API](https://developer.mozilla.org/ja/docs/Web/API/Web_Serial_API)
- [Read from and write to a serial port](https://developer.chrome.com/articles/serial/)

## 参考になるコード

- [Web Serial Thermal Print Test](https://stackblitz.com/edit/typescript-web-serial)
  - pid/vid から name-lookup して表示させてる。
- [GoogleChromeLabs/serial-terminal](https://github.com/GoogleChromeLabs/serial-terminal)
  - TS の型の参考になる。
  - PWA 対応してる

## 開発環境

- [stackblitz](https://stackblitz.com/)
  - github アカウント登録済

## 開発状況

### 2023/06/25

- 2 つの端末での並列受信/表示うまくいった。
  - Vite Valinlla-ts を起点として作成
  - コードは、[GoogleChromeLabs/serial-terminal](https://github.com/GoogleChromeLabs/serial-terminal)をコピーしてベースとした。
- 基本設計
  - navigator.SerialPort クラスと、付随情報をメンバーとする`WebSerialPort`クラスを定義
  - `WebSerialPort`インスタンスを要素とする配列、`portObjs`を定義
    - 要素の増減
      - 下記記載の、要素の増減発生時は、サブスクライバにパブリッシュする
      - 初期化時に`navigator.serial.getPorts()`で取得した SerialPort クラスインスタンスを portObjs 要素に追加
      - ユーザー操作を起点として呼び出される`navigator.serial.requestPort()`で得られた navigator.SerialPort から WebSerialPort インスタンスを生成し portObjs 要素に追加
      - 登録済みデバイス削除関数が呼び出されたとき、対応する WebSerialPort インスタンスを portObjs 要素から削除
      - シリアルデバイスの挿抜
  - 外部インターフェース
    - portObjs
    - portObjs の要素増減をサブスクライブ(subscribePortObjs)
    - 新デバイス認証処理(createAndAdd)

# ロードマップ

## [webserial-wrap](https://github.com/katonobu/webserial-wrap)

### 改善 Item

- 「同じページで複数のポートを開き両方の入出力を同時に観測できる。」の実装
- これを機会に TS 対応
- react 対応時を見据えて useState/callback ベースで実装する。
- navigator.serial に対応するシングルトン
  - requestNewPort
    - ユーザーに利用可能な SerialPort の一覧を表示し、接続したい SerialPort を選択してもらう。
  - ports
    - 要素は下記を要素とするオブジェクト
      - port:SerialPort のインスタンス
      - pid:USB の ProductId を示す整数
      - vid:USB の VenderId を示す整数
      - name:pid,vid からテーブルルックアップで求めた文字列
      - isOpen:当該ポートが Open しているとき True
      - signals:制御信号の状態
      - error:発生したエラー
      - rx:受信した文字列
    - 初期値は[]
    - 初期化時に await navigator.serial.getPorts()で取ってきた各 port から付加要素を求めて追加
    - 要素追加時、port.getInfo()で pid/vid を取得、テーブルから名前文字列生成
    - navigator.serial の connect イベント発火で要素追加
    - navigator.serial の disconnect イベント発火で要素削除
    - 新ポート要求成功時、多重チェックして要素追加
    - open 成功時当該要素を open 済に
    - close 時当該要素を close 済に
- SerialPort に対応するクラス

  - コンストラクタ(port)
    - 引数に SerialPort のインスタンスを取る
    - メンバ変数に入れておく。
  - async open(requestPortFilters, options)
    - open する
    - open 完了で resolve する
  - async startReading(onRx, rxBufferByteSize)
    - stopReading() or close()まで読み出しを継続する。
    - stopReading() or close()まで resolve しない。
  - async stopReading()
    - startReading()で開始した非同期読み込み処理を停止させる。
    - 非同期読み込み処理が実行されていない場合はエラーとなる。
  - async readBytes(rxBuffer, byteSize, timeoutMs)
    - 非同期読み込み処理中の呼び出しはエラー
  - async write(Uint8Array)
  - async close()
  - async setSignal()
  - forget()

- [React TypeScript での型指定された useState フックの使い方](https://dev-k.hatenablog.com/entry/types-in-react-and-typescript-usestate-hooks)

## [use-react-webserial](https://github.com/katonobu/use-react-webserial)

jotai によるミクロな状態管理

Serial

- 有効な Port リストの管理/提供
- シリアルの有効/無効

SerialPort

- Port の選択

  - getPort() -> SerialPort[]
  - requestPort() -> SerialPort

- Port のオープン

- 現状 open でポート選択/オープンが一体化
  → ポート選択とオープンを分離。
  SerialPort Object を open()の引数に与える。
  → 既接続ポートが 1 つしかないときは自動接続可能。
  auto open if connected port is only 1.

# 責務分担

use 系は ReactWorld との I/F に専念

- 素の js の open/write/close の wrap
- 素の js の callback,serial 系イベントと react 状態管理ライブラリとの結合
- 状態管理ライブラリとの結合処理はライブラリ変わっても使いまわせるように別ファイルにした方がいいかも。

# webSerialIo

- ポート選択とオープンを分離
  updatecallback は廃止。open 引数で与えればよさそう
  制御信号の set/get 追加は use 系に任せる(ポーリング処理は状態管理ライブラリに任せる)
  serial 関連メソッド追加

# useWebSerial

型定義
w3c-web-serial:@types/w3c-web-serial

interface SerialSignals {
dataTerminalReady:boolean;
requestToSend:boolean;
dataCarrierDetect:boolean;
clearToSend:boolean;
ringIndicator:boolean;
dataSetReady:boolean;
}

# 想定する使い方

```js
{
  open,
  ports:SerialPort[]
} = useWebSerial()
{
  rx,
  isOpen,
  signals,
  error,
  send:(msg: Uint8Array)=>void
  close:(void)=> Promise<void>
  set_signal:(SerialOutputSeignals)=>Promise<void>
  forget:(void)=> Promise<void>
} = open(
  port:SerialPort | null,
  requestPortFilters:SerialPortRequestOptions,
  options:SerialOptions
)
```

# useWebSerialCmdRsp

```js
{
  open,
  ports:SerialPort[]
} = useWebSerialCmdRsp()
{
  rx,
  rxRsp
  rxNonRsp,
  sendCmdWaitRsp:(msg: Uint8Array | String)=>Promise<void>,
  cmdBusy
  isOpen,
  signals,
  error,
  close:(void)=> Promise<void>
  set_signal:(SerialOutputSeignals)=>Promise<void>
  forget:(void)=> Promise<void>
} = open(
  port:SerialPort | null,
  isRsp:(Uint8Array)=>boolean
  requestPortFilters:SerialPortRequestOptions,
  openOptions:SerialOptions
)
```

# 現時点での状態管理ライブラリ使い分け案

Promise 関数 call の結果を state にするなら reactQuery

- sendCmdWaitRsp
  定期的なポーリングが必要なら reactQuery
- getSignal
  外部からの情報をパースして(SerialRx,WebSocket)オブジェクトに変換したのが状態なら jotai
- rxNonRsp をパース
  イベントリスナで情報を更新する系は jotai
- ports

# AbortController による Promise のキャンセル

https://leanylabs.com/blog/cancel-promise-abortcontroller/
が参考になる。
reactQuery で signal を受け取れるのでキャンセルボタンによるキャンセルが可能。
https://tanstack.com/query/v4/docs/react/guides/query-cancellation

# Serial/REST 共通 I/F 案

- Connect/Disconnect

  - Serial:getPorts()の戻り値配列の要素 or null(=open()内で requestPort()を呼ぶ)
  - WS:url(Token 付)→Host 共通なので、login に成功したら WebSocket オープンしちゃうのが良い?

- デバイス選択
  - Serial:接続後デバイス情報取得
  - WS:接続後 REST-API

# MaterialUI + 管理画面かな。

# Next.js + PWS は比較的サクっといけそう。

- https://zenn.dev/tns_00/articles/next-pwa-install

# REST-API+WS での AppLifeCycle

## LocalStrage への保存対象情報案

- SerialOpen 時の AttachMode
- デバイス一覧でのフィルタ設定
  - only available device
- ValidDeviceList
  - まずは ValidDeviceList を使って/device/{deviceId}で情報を取ってくる
  - その後/device で全デバイス取ってきて有効なデバイス情報を更新
    - このタイミングで LocalStrage を更新
  - post/delete 系でデバイス追加したら、or reload でデバイス情報取ってきて増減してたら更新

## Load 完了

- ターゲットツリーからターゲットを選択
  - LocalSerialConnection
    (- DeviceId)
    - new connection
  - Server[]
    - ビルド時に決定されるサーバーリスト

## LocalSerialConnection が選択されたら

- ConnectedHistoryList or NewConnection 選択画面で Open
  - ConnectionMode
    - ResetAfterConnect
    - Attach
- デバイス制御/観測画面に遷移
- デバイス制御/観測画面タブにデバイス Id 追加
- ターゲットツリーにデバイス Id 追加

## Server が選択されたら

- ログイン画面に遷移
  - ログインしたら
    - デバイス一覧画面に遷移
- デバイス一覧でスピナー
  - REST-API でデバイス一覧取得
    - さらにデバイス State で有効なデバイスのみフィルター
    - 有効なデバイス一覧を画面に反映してスピナー解除
    - スピナー解除したら WS 接続
  - ターゲットツリーにデバイス Id 追加
  - ターゲットデバイス一覧画面でテーブル表示

## 制御できなくても Viewer として意味がありそうな仕様

- デバイス一覧
  - xxxId でホバーしてその中身を表示
  - 各種条件でソート、フィルタ

## デバイス制御/観測画面 Ver 0.1

- 操作系ボタン
  - SYS.MODE=0 ボタン
  - シャットダウンボタン
  - リセットボタン
- SerialTxRx Terminal
  - マニュアルログダウンロードボタン
  - 自動間隔ログダウンロードチェックボックス
  - Terminal 入力/送信可能
- 状態表示
  - バージョン表示
  - SYS.MODE,SYS.STT,GNSS.STT 表示
  - GNSS 各種 Visualize
  - EEPROM 解釈表示
- その他
  - デバイス動作タイミング Emuration

## Next.js

- リバースプロキシ設定
  - https://future-architect.github.io/articles/20230530a/
- [Next.js] API リクエストの CORS エラーを回避する
  - https://zenn.dev/yoshio25/articles/9a27d4c75e3a16
