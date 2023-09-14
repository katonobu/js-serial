const { defineConfig } = require("vite");
const devServerPort = 5177

module.exports = defineConfig({
  server:{
    port:devServerPort,
    strictPort:true
  }
});
