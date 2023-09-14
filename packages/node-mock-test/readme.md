https://typescriptbook.jp/tutorials/jest

1. package.json作成
```
{
    "name": "js-serial-core",
    "license": "UNLICENSED"
}
```
1. toolinstall
`npm install typescript jest ts-jest @types/jest serialport --save-dev`

1. tsconfig.json生成
`npx tsc --init`

1. jest.config.js生成
`npx ts-jest config:init`
