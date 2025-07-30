const { exec } = require('child_process');

function generatePhoneModel() {
  // List of some real Samsung Galaxy models
  const models = [
    // Samsung Galaxy
    'SM-G991B', // Galaxy S21
    'SM-G996B', // Galaxy S21+
    'SM-G998B', // Galaxy S21 Ultra
    'SM-G973F', // Galaxy S10
    'SM-G975F', // Galaxy S10+
    'SM-G970F', // Galaxy S10e
    'SM-G981B', // Galaxy S20
    'SM-G986B', // Galaxy S20+
    'SM-G988B', // Galaxy S20 Ultra
    'SM-G960F', // Galaxy S9
    'SM-G965F', // Galaxy S9+
    'SM-G950F', // Galaxy S8
    'SM-G955F', // Galaxy S8+
    'SM-N986B', // Galaxy Note20 Ultra
    'SM-N981B', // Galaxy Note20
    'SM-A525F', // Galaxy A52
    'SM-A715F', // Galaxy A71
    'SM-A515F', // Galaxy A51
    'SM-A325F', // Galaxy A32
    'SM-M315F', // Galaxy M31
    'SM-M115F', // Galaxy M11
    'SM-A105F', // Galaxy A10
    'SM-A205F', // Galaxy A20
    'SM-A305F', // Galaxy A30
    'SM-A405F', // Galaxy A40
    'SM-A505F', // Galaxy A50
    'SM-A705F', // Galaxy A70
    'SM-G780F', // Galaxy S20 FE
    'SM-G781B', // Galaxy S20 FE 5G
    'SM-G770F', // Galaxy S10 Lite
    'SM-N970F', // Galaxy Note10
    'SM-N975F', // Galaxy Note10+
    'SM-N960F', // Galaxy Note9
    'SM-N950F', // Galaxy Note8

    // Xiaomi
    'M2012K11AC', // Mi 11X
    'M2101K6G', // Redmi Note 10 Pro
    'M2007J3SG', // Mi 10T Pro
    'M2006C3LG', // Redmi 9A
    'M2102J20SG', // Redmi Note 10S
    'M2101K7AG', // Redmi Note 10
    'M2007J22G', // Redmi Note 9
    'M1901F7G', // Redmi Note 7
    'M1908C3JG', // Redmi 8A
    'M2003J6B2G', // Redmi Note 9S
    'M2004J19C', // Redmi Note 9 Pro

    // Realme
    'RMX3085', // Realme 8
    'RMX2151', // Realme 7
    'RMX2185', // Realme C15
    'RMX2020', // Realme C3
    'RMX1821', // Realme 3
    'RMX1971', // Realme 5 Pro
    'RMX2030', // Realme 5i
    'RMX1941', // Realme C2
    'RMX1851', // Realme 3 Pro
    'RMX3363', // Realme GT Master Edition

    // Vivo
    'V2027', // Vivo Y20
    'V2043', // Vivo Y12s
    'V2026', // Vivo Y12i
    'V2031', // Vivo Y51A
    'V2029', // Vivo Y30
    'V1938T', // Vivo Y11
    'V2024A', // Vivo X50 Pro+
    'V2055A', // Vivo X60 Pro+
    'V2001A', // Vivo iQOO 3
    'V2002A', // Vivo iQOO Neo3

    // Infinix
    'X6816', // Infinix Note 12
    'X6812', // Infinix Hot 12
    'X688B', // Infinix Hot 10 Play
    'X689C', // Infinix Smart 5
    'X682B', // Infinix Note 10
    'X650C', // Infinix Smart 4
    'X680B', // Infinix Hot 10
    'X683',  // Infinix Note 8
    'X606D', // Infinix Hot 8
    'X657',  // Infinix Smart 5 Pro
  ];
  const idx = Math.floor(Math.random() * models.length);
  return models[idx];
}

function generateRandomAndroidId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateRandomIMEI() {
  return '35' + Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateRandomMac() {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':');
}

function execADB(udid, cmd) {
  return new Promise((resolve, reject) => {
    exec(`adb -s ${udid} ${cmd}`, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}

async function randomizeDeviceInfo(udid) {
  try {
    const androidId = generateRandomAndroidId();
    const imei = generateRandomIMEI();
    const mac = generateRandomMac();
    const phoneModel = generatePhoneModel();

    await execADB(udid, `shell settings put secure android_id ${androidId}`);
    console.log(`[${udid}] ✅ Android ID: ${androidId}`);

    await execADB(udid, `shell settings put global device_name android-${androidId}`);
    console.log(`[${udid}] ✅ Device Name: ${androidId}`);

    await execADB(udid, `shell setprop ro.product.model ${phoneModel}`);
    console.log(`[${udid}] ✅ Device Model: ${phoneModel}`);

    //set IMEI and MAC
    // await execADB(udid, `shell service call iphonesubinfo 1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -n 1`);
    // await execADB(udid, `shell service call iphonesubinfo 1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -n 1`);
    // console.log(`[${udid}] ✅ IMEI: ${imei}`);

    // Catatan:
    // - IMEI & MAC hanya bisa diubah kalau LDPlayer support atau pakai module tambahan
    // - Bisa juga inject via `build.prop` (perlu root)
    //console.log(`[${udid}] ⚠️ IMEI/MAC spoofing butuh root/manual method. IMEI: ${imei}, MAC: ${mac}`);

    return {
      androidId,
      samsungModel
    };
  } catch (e) {
    console.error(`[${udid}] ❌ Gagal randomize device info: ${e.message}`);
  }
}

module.exports = {
  randomizeDeviceInfo
};