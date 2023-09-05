const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "lib/index.ts"),
      name: "JsSerialWeb",
      fileName: (format) => format==='es'?'js-serial-web.js':`js-serial-web.${format}.js`,
    },
  },
});
