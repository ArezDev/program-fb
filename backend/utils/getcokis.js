const { app } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function getCokisFB(device) {
    return new Promise((resolve, reject) => {

        const suffix = device.includes(':') ? device.split(':')[1] : device;
        const dir = path.join(__dirname, 'cookies'); // ./backend/cookies/
        const filename = `cookie-fb-${suffix}.txt`;
        const filepath = path.join(dir, filename);

        // ✅ Pastikan folder ada
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const cmd = spawn('cmd.exe', ['/c',
            `adb -s ${device} pull /data/data/com.facebook.katana/app_light_prefs/com.facebook.katana/authentication ${filepath}`
        ]);
        
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
                const allData = readCookiesFromFile(filepath);
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

async function getCokisFBLite(device) {
    return new Promise((resolve, reject) => {

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

        const cmd = spawn('cmd.exe', ['/c',
            `adb -s ${device} root && adb -s ${device} pull /data/data/com.facebook.lite/files/PropertiesStore_v02 ${filepath}`
        ]);
        
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
                const allData = readCookiesFBLite(filepath);
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

function readCookiesFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Ambil access_token secara manual dari raw text
        const tokenMatch = content.match(/access_token.*?([A-Za-z0-9]{50,})/);
        const access_token = tokenMatch ? tokenMatch[1] : null;

        // Ambil cookies (JSON) dari session_cookies_string
        const jsonMatch = content.match(/session_cookies_string.*?(\[.*?\])/s);
        if (!jsonMatch) throw new Error("Session cookies not found");

        const cookies = JSON.parse(jsonMatch[1]);

        return { cookies, access_token };
    } catch (err) {
        console.error("Failed to read or parse cookies:", err.message);
        return null;
    }
}

function readCookiesFBLite(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Cari access_token jika ada
        const tokenMatch = content.match(/access_token.*?([A-Za-z0-9]{50,})/);
        const access_token = tokenMatch ? tokenMatch[1] : null;
        //const jsonMatch = content.match(/\{[^}]*"expires"[^}]*\}/g);
        const jsonMatch = content.match(/\{[^{}]*"expires":[^{}]*?\}/g); // Ambil JSON array dari file
        //return jsonMatch;
        if (!jsonMatch) throw new Error("Session cookies not found");
        const cookies = JSON.parse(`[${jsonMatch.join(',')}]`);

        return { cookies, access_token };
        
    } catch (err) {
        console.error("Failed to read or parse cookies:", err.message);
        return null;
    }
}

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

module.exports = { getCokisFB, getCokisFBLite };