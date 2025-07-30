const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require("axios");
const Store = require('electron-store');
const fs = require('fs');
const COOKIE_UPLOAD_URL = 'https://fb.arezdev.eu.org/api/user/upload_akun';
const sendLog = (udid, message) => {const win = BrowserWindow.getAllWindows()[0];if (win) win.webContents.send('fb-log', { udid, message });};
const makeCookieString = (result) => {return ['c_user', 'xs', 'fr', 'datr'].filter(key => result[key]).map(key => `${key}=${result[key]}`).join('; ');};

// Function to get cookies from Facebook Lite or Katana app using ADB
async function getCokisFB(device, appType) {
    return new Promise((resolve, reject) => {
        let cmd;

        const suffix = 
        device.includes(':') && device.split(':').length > 1 ? device.split(':')[1] : 
        device.includes('-') && device.split('-').length > 1 ? device.split('-')[1] : 
        device;
        const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
        const dir = path.join(baseDir, 'cookies');
        const filename = `cookie-fb-${suffix}.txt`;
        const filepath = path.join(dir, filename);

        // ✅ Pastikan folder ada
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (appType === 'lite') {
            // Jalankan perintah ADB untuk mengambil cookies FB Lite
            cmd = spawn('cmd.exe', ['/c',
            `adb -s ${device} root && adb -s ${device} pull /data/data/com.facebook.lite/files/PropertiesStore_v02 ${filepath}`
            ]);
        } else if (appType === 'katana') {
            // Jalankan perintah ADB untuk mengambil cookies FB Katana
            cmd = spawn('cmd.exe', ['/c',
            `adb -s ${device} root && adb -s ${device} pull /data/data/com.facebook.katana/app_light_prefs/com.facebook.katana/authentication ${filepath}`
            ]);
        }
        
        let output = '';
        let errorOutput = '';

        cmd.stdout.on('data', (data) => {
            output += data.toString();
        });

        cmd.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        cmd.on('close', (code) => {
            if (code === 0) {
                const allData = readCookies(filepath, appType);
                if (allData) {
                    const filtered = filterCookies(allData);
                    resolve(filtered);
                } else {
                    reject(new Error("Gagal membaca cookies dari file."));
                }
            } else {
                console.error("ADB Error Output:", errorOutput);
                reject(new Error(`ADB process exited with code ${code}.\n\nOutput:\n${output}\n\nError:\n${errorOutput}`));
            }
        });

    });
}
// reads cookies from the file and returns them in a structured format
function readCookies(filePath, appType) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let cookies;
        let access_token;
        // FB Lite cookies format
        if (appType === 'lite') {
            const tokenMatch = content.match(/access_token.*?([A-Za-z0-9]{50,})/);
            access_token = tokenMatch ? tokenMatch[1] : null;
            //const jsonMatch = content.match(/\{[^}]*"expires"[^}]*\}/g);
            const jsonMatch = content.match(/\{[^{}]*"expires":[^{}]*?\}/g); // Ambil JSON array dari file
            //return jsonMatch;
            if (!jsonMatch) throw new Error("Session cookies not found");
            cookies = JSON.parse(`[${jsonMatch.join(',')}]`);
        } else if (appType === 'katana') {
            // FB Katana cookies format
            const tokenMatch = content.match(/access_token.*?([A-Za-z0-9]{50,})/);
            access_token = tokenMatch ? tokenMatch[1] : null;
            const jsonMatch = content.match(/\{[^{}]*"expires":[^{}]*?\}/g); // Ambil JSON array dari file
            if (!jsonMatch) throw new Error("Session cookies not found");
            cookies = jsonMatch.map(json => JSON.parse(json));
        }

        return { cookies, access_token };
        
    } catch (err) {
        console.error("Failed to read or parse cookies:", err.message);
        return null;
    }
}
// filters the cookies to only include the ones we need
function filterCookies({ cookies, access_token }) {
    const neededNames = ['c_user', 'xs', 'fr', 'datr'];
    const filtered = {};

    cookies.forEach(c => {
        if (neededNames.includes(c.name)) {
            filtered[c.name] = c.value;
        }
    });

    if (access_token) {
        filtered['access_token'] = access_token;
    }

    return filtered;
}
// Function to save Facebook accounts
const saveAccounts = async (device, code, email, pass, apptype) => {
const store = new Store();
const reloadSettings = () => {
  const settings = store.get('settings');
  return {
    serverAkun: settings.serverAkun,
    passwordFB: settings.passwordFB,
  };
};
let { serverAkun, passwordFB } = reloadSettings();
store.onDidChange('settings', () => {
  ({ serverAkun, passwordFB } = reloadSettings());
});
const data = await getCokisFB(device, apptype);
sendLog(device, `Checking: ${data.c_user}`);
if (data.c_user) {
  try {
    //cek Live FB
    const res = await axios.get(`https://graph.facebook.com/${data.c_user}/picture?type=normal`, { maxRedirects: 0, validateStatus: null });
    // Get the redirect URL (profile picture URL)
    const href = res.headers.location || res.request?.res?.headers?.location || res?.request?.responseURL;
    if (href.includes("C5yt7Cqf3zU")) {
      sendLog(device, `❌ ${data.c_user}: checkpoint!`);
      // Hapus file cookie jika akun checkpoint
      const suffix = 
        device.includes(':') && device.split(':').length > 1 ? device.split(':')[1] : 
        device.includes('-') && device.split('-').length > 1 ? device.split('-')[1] : 
        device;
      const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
      var cookieFilePath = path.join(baseDir, 'cookies', `cookie-fb-${suffix}.txt`);
      fs.unlink(cookieFilePath, (err) => {
      if (err) throw err;
      //console.log('cookie file was deleted!');
      });
    } else {
      sendLog(device, 'Akun OK!');
      //console.log(data);
      const cookieStr = `${code ? code + '|' : ''}${data.c_user}|${pass}| ;${makeCookieString(data)};|${data.access_token}${email ? '|' + email : ''}`;
      const savecokis = await axios.post(COOKIE_UPLOAD_URL, { cokis: cookieStr, userId: serverAkun });
      if (savecokis.status === 200) {
        console.log('Account saved:', data.c_user);
        sendLog(device, `✅ ${data.c_user}: OK!`);
        // Hapus file cookie setelah berhasil upload
        const suffix = 
        device.includes(':') && device.split(':').length > 1 ? device.split(':')[1] : 
        device.includes('-') && device.split('-').length > 1 ? device.split('-')[1] : 
        device;
        const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
        var cookieFilePath = path.join(baseDir, 'cookies', `cookie-fb-${suffix}.txt`);
        fs.unlink(cookieFilePath, (err) => {
        if (err) throw err;
        //console.log('cookie file was deleted!');
        });
      }
    }
  } catch (__) {}
}
};

module.exports = { saveAccounts };