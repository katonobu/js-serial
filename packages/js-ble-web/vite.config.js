const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "lib/index.ts"),
      name: "JsBleWeb",
      fileName: (format) => `js-ble-web.${format}.js`,
    },
  },
});
