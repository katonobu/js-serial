# Serial Terminal

This repository contains a Progressive Web App that allows the user to
communicate with a locally connected serial device through an interactive
terminal. This provides a demonstration of the [Serial
API](https://wicg.github.io/serial/).

This API is available starting with Chrome 89, Edge 89, and Opera 76.

## Privacy

This application is served statically and is cached for offline use. No
analytics are collected. All communication with the serial device happens
locally.

## Building

This project is written in TypeScript and uses npm and Vite to manage
dependencies and automate the build process. To get started clone the
repository and install dependencies by running,

```sh
npm install
```

To create a production build in the `dist` folder run,

```sh
npm run build
```

To start a local development server run,

```sh
npm run dev
```

# change history by katonobu
## 2023/09/07
- `serial-terminal\.github\workflows\build_and_deploy.yml`
    - delete 
- `serial-terminal\README.md`    
    - add this section 
- `src\index.ts`,`index.html`
    - Delete polyfill functions.
## 2023/09/08
- `src\index.ts`
    - Chagen to use JsSerialWeb
- `vite.config.ts`
    - Don't check ESLint(to PASS lib), this may revert in future.

----
function findPortOption(port: SerialPort):
指定されたSerialPortのPortOptionオブジェクトを返す

function addNewPort(port: SerialPort): PortOption



変数関係
portSelector: HTMLSelectElement
+- options:HTMLOptionsCollection 
   +- textContent = `Port ${portCounter++}`;
   +- port:SerialPort

HTMLSelectElement.selectedOptions 読取専用
HTMLCollection で、選択されているすべての <option> 要素を反映します。
→なので、[0]   

function findPortOption(port: SerialPort):
+- function maybeAddNewPort(port: SerialPort): PortOption
|  +- async function getSelectedPort(): Promise<void>
|  |  +- async function connectToPort(): Promise<void>
+- navigator.serial.addEventListener('disconnect'...)
