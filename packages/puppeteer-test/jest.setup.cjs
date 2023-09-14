const { exec } = require('child_process');

// 開発サーバーを起動するスクリプトを指定
const startServerScript = 'npm run dev'; // または 'yarn start-server'

// 開発サーバーを起動する
const serverProcess = exec(startServerScript, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error starting the development server: ${error}`);
  } else {
    console.log(`Development server started:\n${stdout}`);
  }
});

// Jestが終了したら開発サーバーも終了
process.on('exit', () => {
  serverProcess.kill();
});