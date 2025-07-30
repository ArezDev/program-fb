// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const portfinder = require('portfinder');
const util = require('util');
const Store = require('electron-store');
const store = new Store();
const fs = require('fs');

const settings = store.get('settings') || {};
const { delayDevice } = settings;

const { createFB, getAllCokisFB, verifyFB } = require('./backend/auto/facebook');
const { createThreads } = require('./backend/auto/threads');
const { restartSinyal } = require('./backend/auto/modem');

let appiumProcesses = [];
let deviceConfigs = [];

const execute = util.promisify(require('child_process').exec);

async function getConnectedDevices() {
  // const isDev = !app.isPackaged;
  // const adbPath = isDev
  //   ? path.join(__dirname, 'vendor', 'adb', 'adb.exe')
  //   : path.join(process.resourcesPath, 'vendor', 'adb', 'adb.exe');
  try {
    const { stdout } = await execute('adb devices');
    //const { stdout } = await execute(`"${adbPath}" devices`);
    const lines = stdout.trim().split('\n');

    const devices = lines.slice(1) // skip header
      .map(line => line.trim())
      .filter(line => line && line.includes('\tdevice'))
      .map(line => line.split('\t')[0]);

    return devices;
  } catch (err) {
    console.error('❌ Gagal mengambil daftar device ADB:', err.message);
    return [];
  }
}

function waitForAppiumReady(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const socket = net.createConnection(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Appium not ready within timeout'));
        } else {
          setTimeout(check, 500);
        }
      });
    };

    check();
  });
}

async function startAppiumForDevice(udid, appiumPort, systemPort) {

  //reset output file!
  // Ensure no process is using the log files before deleting
  // try {
  //   // Try to close any open file descriptors if possible (handled by killing node processes above)
  //   await fs.promises.unlink('out.log');
  //   console.log('out.log was deleted');
  // } catch (err) {
  //   if (err.code === 'EPERM') {
  //     console.log('EPERM: out.log is in use, skipping deletion.');
  //   } else if (err.code !== 'ENOENT') {
  //     throw err;
  //   } else {
  //     console.log('out.log does not exist');
  //   }
  // }
  // await delay(2000);
  // try {
  //   await fs.promises.unlink('err.log');
  //   console.log('err.log was deleted');
  // } catch (err) {
  //   if (err.code === 'EPERM') {
  //     console.log('EPERM: err.log is in use, skipping deletion.');
  //   } else if (err.code !== 'ENOENT') {
  //     throw err;
  //   } else {
  //     console.log('err.log does not exist');
  //   }
  // }
  // await delay(2000);

  //Lokal
  const cmd = 'appium';
  const args = [
    '--port', String(appiumPort)
  ];

  const proc = spawn(cmd, args, {
    shell: true,
    stdio: 'ignore' // <== suppress semua log output
    //stdio: ['ignore', fs.openSync('out.log', 'a'), fs.openSync('err.log', 'a')]
  });

  //Build
  // const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
  // const nodePath = path.join(baseDir, 'vendor', 'node.exe');
  // const appiumMain = path.join(baseDir, 'node_modules', 'appium', 'build', 'lib', 'main.js');
  // const args = [appiumMain, '--port', `${appiumPort}`];

  // const proc = spawn(nodePath, args, {
  //   shell: false,
  //   stdio: 'ignore', // atau inherit jika ingin lihat log
  //   windowsHide: true
  // });

  appiumProcesses.push(proc);

  try {
    await waitForAppiumReady(appiumPort);
    console.log(`✅ Appium ready for ${udid} on port ${appiumPort}`);
    deviceConfigs.push({ udid, appiumPort, systemPort });
  } catch (err) {
    console.error(`❌ Appium not ready for ${udid}: ${err.message}`);
  }

  proc.on('exit', code => {
    console.error(`❌ Appium exited for ${udid} with code ${code}`);
  });
}

async function startAllAppiumServers() {
  const devices = await getConnectedDevices();
  // Jika tidak ada perangkat yang terdeteksi, kirim pesan ke window utama
  if (devices.length === 0) {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) win.webContents.send('no-devices-found');
  }
  let baseSystemPort = 8300; // Mulai dari 8300 untuk sistem port
  let baseAppiumPort = 4723; // Mulai dari 4723 untuk Appium port

  const win = BrowserWindow.getAllWindows()[0];
  for (const [index, udid] of devices.entries()) {
    const appiumPort = await portfinder.getPortPromise({ port: baseAppiumPort + index * 10 });
    const systemPort = await portfinder.getPortPromise({ port: baseSystemPort + index * 10 });

    if (win) {
      win.webContents.send('appium-loading', { udid, status: 'starting' });
    }

    await startAppiumForDevice(udid, appiumPort, systemPort);

    if (win) {
      win.webContents.send('appium-loading', { udid, status: 'done' });
    }
  }

  console.log('📱 Device Configs:', deviceConfigs);
}

//GUI window utama
function createWindow() {
  const win = new BrowserWindow({
    width: 550,
    height: 500,
    resizable: false,
    autoHideMenuBar: true,
    icon: 'logo.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // Set parent window if index.html is open
  const parentWin = BrowserWindow.getAllWindows().find(w =>
    w.webContents.getURL().includes('index.html')
  );
  if (parentWin) {
    win.setParentWindow(parentWin);
    win.setModal(true);
  }
  win.loadFile('renderer/index.html');
  return win; // <== supaya bisa digunakan di luar
  // setTimeout(() => {
  //   win.webContents.send('ready-to-run');
  // }, 1000); // Kirim pesan ke renderer setelah 1 detik

  //update loading devices...
  // win.loadFile('renderer/index.html');

  // win.webContents.on('did-finish-load', async () => {
  //   spawn('taskkill //IM node.exe //F', { shell: true });
  //   await delay(7000);
  //   await startAllAppiumServers();
  //   console.log('✅ Semua Appium server siap!');
  // });
}
app.whenReady().then(async () => {
  spawn('taskkill //IM node.exe //F', { shell: true });
  await delay(5000); // (opsional) beri delay sedikit agar proses clean selesai

  const win = createWindow();

  // Tunggu sampai index.html selesai dimuat
  win.webContents.on('did-finish-load', async () => {
    await delay(1000); // beri sedikit waktu agar preload siap
    await startAllAppiumServers();
    win.webContents.send('ready-to-run');
  });
});

app.on('before-quit', () => {
  appiumProcesses.forEach(proc => proc.kill());
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//GUI Settings
function createSettingsWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 500,
    title: 'Pengaturan',
    icon: 'logo.ico',
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('renderer/settings.html');
}

// ========== Handle IPC ========= //

//Restart modem
ipcMain.handle('restart-modem', async () => {
  await restartSinyal();
  await delay(15000);
});

//  ====== Setting Window ====== //
ipcMain.on('open-settings', () => {
  createSettingsWindow();
});
ipcMain.handle('get-settings', async () => {
  return store.get('settings', {
    prosesKrit: settings.prosesKrit,
    changeEmail: settings.changeEmail,
    changeEmailConfig: settings.changeEmailConfig,
    serverAkun: settings.serverAkun,
    mailService: settings.mailService,
    sohibMailDomain: settings.sohibMailDomain,
    kukuluDomain: settings.kukuluDomain,
    hotmailConfig: settings.hotmailConfig,
    hotmailApiKey: settings.hotmailApiKey,
    use5sim: settings.use5sim,
    use5sim_operator: settings.use5sim_operator,
    use5sim_country: settings.use5sim_country,
    proxy: settings.proxy,
    waitCode: settings.waitCode,
    passwordFB: settings.passwordFB,
  });
});
ipcMain.on('save-settings', (event, data) => {
  console.log('Data diterima di main:', data);
  store.set('settings', data);
});
//  ====== Setting Window ====== //

// Device Config
ipcMain.handle('get-device-configs', async () => deviceConfigs);

// Get Cokis FB
ipcMain.handle('getcokis-facebook', async () => {
  console.log('📥 start krit fb !!');

  const results = [];

  if (deviceConfigs.length === 0) {
    console.log("⚠️ Tidak ada device tersedia.");
    return results;
  }

  const tasks = deviceConfigs.map((config, index) => {
    return new Promise(async (resolve) => {
      await delay(index * 1000); // optional: delay antar start (bukan blocking)
      const udid = config.udid;

      try {
        const result = await getAllCokisFB(config);
        //sendLog(udid, `✅ Device #${index + 1} (${udid}) success`);
        resolve({ status: 'fulfilled', value: result });
      } catch (err) {
        //sendLog(udid, `❌ Device #${index + 1} (${udid}) failed: ${err.message}`);
        resolve({ status: 'rejected', reason: err.message });
      }
    });
  });

  return await Promise.all(tasks);
});

// Create facebook
ipcMain.handle('auto-create-fb', async () => {
  console.log('Start creating FB...');

  if (deviceConfigs.length === 0) {
    console.log("⚠️ Tidak ada device tersedia.");
    return [];
  }

  const tasks = deviceConfigs.map((config, index) => {
    return new Promise(async (resolve) => {
      await delay(index * parseInt(delayDevice * 1000)); // Jeda per device (tidak blocking global)
      try {
        const result = await createFB(config);
        resolve({ status: 'fulfilled', value: result });
      } catch (err) {
        resolve({ status: 'rejected', reason: err.message });
      }
    });
  });

  const results = await Promise.all(tasks);

  // ✅ Tampilkan ringkasan ke user
  const sukses = results.filter(r => r.status === 'fulfilled').length;
  const gagal = results.length - sukses;
  const pesan = `✅ Selesai: ${sukses} berhasil, ${gagal} gagal.`;

  console.log(pesan);
  return results;
});

// Verify facebook
ipcMain.handle('auto-verify-fb', async () => {
  console.log('Start verifying FB...');
  if (deviceConfigs.length === 0) {
    console.log("⚠️ Tidak ada device tersedia.");
    return [];
  }

  const tasks = deviceConfigs.map((config, index) => {
    return new Promise(async (resolve) => {
      await delay(index * parseInt(delayDevice * 1000)); // Jeda per device (tidak blocking global)
      try {
        const result = await verifyFB(config);
        resolve({ status: 'fulfilled', value: result });
      } catch (err) {
        resolve({ status: 'rejected', reason: err.message });
      }
    });
  });

  const results = await Promise.all(tasks);

  // ✅ Tampilkan ringkasan ke user
  const sukses = results.filter(r => r.status === 'fulfilled').length;
  const gagal = results.length - sukses;
  const pesan = `✅ Selesai: ${sukses} berhasil, ${gagal} gagal.`;

  console.log(pesan);
  return results;
});

function sendLog(udid, message) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('fb-log', { udid, message });
}

ipcMain.handle('auto-create-threads', async () => {
  console.log('start create threads!');

  const results = [];

  if (deviceConfigs.length === 0) {
    console.log("⚠️ Tidak ada device tersedia.");
    return results;
  }

  for (const [index, config] of deviceConfigs.entries()) {
    console.log(`⚙️ Memulai create threads untuk device: ${config.udid}`);

    try {

      setTimeout(async () => {
        const result = await createThreads(config);
        results.push({ status: 'fulfilled', value: result });
      }, index * 5000);
      
    } catch (err) {
      console.error(`❌ Gagal create untuk ${config.udid}:`, err);
      results.push({ status: 'rejected', reason: err });
    }

  }

  return results;
});