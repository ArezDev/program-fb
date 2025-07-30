const { spawn } = require('child_process');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function execADB(device, command) {
  const fullCmd = `adb -s ${device} ${command}`;
  spawn('cmd.exe', ['/c', fullCmd]);
  //const cmd = spawn('cmd.exe', ['/c', fullCmd]);

  //cmd.stdout.on('data', data => console.log(`📥 ${data}`));
  //cmd.stderr.on('data', data => console.error(`❗ ${data}`));
  //cmd.on('close', code => console.log(`🚪 Exited with code ${code}`));
}

function swipeDevice(device, x1, y1, x2, y2, duration) {
  execADB(device, `shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
}

function clickDevice(device, x, y) {
  execADB(device, `shell input tap ${x} ${y}`);
}

function inputText(device, text) {
  execADB(device, `shell input text "${text}"`);
}

function clearText(device) {
  execADB(device, `shell input keyevent 67`); // Simulate backspace to clear text
}

function Enter(device) {
  execADB(device, `shell input keyevent 66`); // Simulate Enter key
}

function openApp(device, appPackage) {
  execADB(device, `shell monkey -p ${appPackage} -c android.intent.category.LAUNCHER 1`);
}

function closeApp(device, appPackage) {
  execADB(device, `shell am force-stop ${appPackage}`);
}

function clearAppData(device, appPackage) {
  execADB(device, `shell pm clear ${appPackage}`);
}

async function resetServerAppiumAPK(device) {
  execADB(device, `uninstall io.appium.uiautomator2.server`);
  await delay(2000);
  execADB(device, `uninstall io.appium.uiautomator2.server.test`);
  await delay(2000);
  execADB(device, `install -r ${path.join(__dirname, 'apk', 'server.apk')}`);
  await delay(5000);
  execADB(device, `install -r ${path.join(__dirname, 'apk', 'test.apk')}`);
  await delay(7000);
}

module.exports = {
  execADB,
  swipeDevice,
  clearAppData,
  clickDevice,
  inputText,
  clearText,
  Enter,
  openApp,
  closeApp,
  resetServerAppiumAPK
};