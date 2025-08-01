const { default: axios } = require('axios');
const { app } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { BrowserWindow } = require('electron');
const { remote } = require('webdriverio');
const { getCokisFBLite } = require('../utils/getcokis');
const { resetServerAppiumAPK, swipeDevice, clearAppData, clickDevice, inputText, closeApp, openApp, clearText, Enter } = require('../utils/adbHelpers');
const { randomizeDeviceInfo } = require('../utils/randomizerDeviceInfo');
const { LoginFacebook, VerifyFacebook } = require('../utils/fb');
const { generateFemaleNames } = require('../utils/fakename/female');
const { saveAccounts } = require('../utils/saveFB');
const { restartSinyal } = require('../auto/modem');

//Email services
const { createGmail, getCodeGmail } = require('../api/gmailotp');
const { emaildewe } = require('../api/mailku');
const { createFexboxMail, getCodeFexboxMail } = require('../api/fexbox');
const { createHotmail, getCodeHotmail } = require('../api/hotmail');
const { getNumber5sim, getCode5sim } = require('../api/5sim');
const { createTempMail, getCodeTempMail } = require('../api/tempmail_io');
const { createKukulu, getCodeKukulu } = require('../api/kukulu');
const { getNumber_vaksms, getCode_vaksms } = require('../api/vaksms');
const { createFviaEmail, getCodeFviaEmail } = require('../api/fviainboxes');
const fs = require('fs');

//Setting server save akun!
const COOKIE_UPLOAD_URL = 'https://fb.arezdev.eu.org/api/user/upload_akun';
const sendLog = (udid, message) => {const win = BrowserWindow.getAllWindows()[0];if (win) win.webContents.send('fb-log', { udid, message });};
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const generateRandomIndoNumber = (prefix = '+6285', length = 9) => {const randomDigits = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');return prefix + randomDigits;};

//create FB katana account
async function createFB({ udid, appiumPort, systemPort }) {
  let driver;
  let email, gmail_order_id;
  await delay(2000);

// ============= Get settings! ============= //
  const store = new Store();
  const reloadSettings = () => {
      const settings = store.get('settings');
      return {
        appService: settings.appService,
        changeEmail: settings.changeEmail,
        changeEmailConfig: settings.changeEmailConfig,
        gmailotp_access_key: settings.gmailotp_access_key,
        mailService: settings.mailService,
        sohibMailDomain: settings.sohibMailDomain,
        fviainboxesDomain: settings.fviainboxesDomain,
        kukuluDomain: settings.kukuluDomain,
        hotmailConfig: settings.hotmailConfig,
        hotmailApiKey: settings.hotmailApiKey,
        Services_Number: settings.Services_Number,
        use5sim: settings.use5sim,
        use5sim_country: settings.use5sim_country,
        use5sim_operator: settings.use5sim_operator,
        vaksms_country: settings.vaksms_country,
        vaksms_operator: settings.vaksms_operator,
        proxy: settings.proxy,
        waitCode: settings.waitCode,
        passwordFB: settings.passwordFB,
      };
  };
  let settings = reloadSettings();
  store.onDidChange('settings', () => {settings = reloadSettings();});
  let {
      appService,
      changeEmail,
      changeEmailConfig,
      gmailotp_access_key,
      mailService,
      kukuluDomain,
      sohibMailDomain,
      fviainboxesDomain,
      hotmailConfig,
      hotmailApiKey,
      Services_Number,
      use5sim,
      use5sim_country,
      use5sim_operator,
      vaksms_country,
      vaksms_operator,
      proxy,
      waitCode,
      passwordFB
  } = settings;
  await delay(1500);
// ============= Get settings! ============= //

  const caps = {
    "appium:automationName": "uiautomator2",
    "platformName": "android",
    "appium:udid": udid,
    "appium:ensureWebviewsHavePages": true,
    "appium:nativeWebScreenshot": true,
    "appium:newCommandTimeout": 360000,
    "appium:connectHardwareKeyboard": true,
    "appium:noReset": false,
    "appium:dontStopAppOnReset": true,
    "appium:systemPort": systemPort,
  }
  driver = await remote({
    protocol: "http",
    hostname: "localhost",
    port: Number(appiumPort),
    path: "/",
    capabilities: caps
  });
  //wait device ready
  await delay(5000);

  if (proxy) {
    try {
      //close proxy app if exists
      const relogProxy = await driver.terminateApp('net.typeblog.socks');
      if (relogProxy) {
        await driver.activateApp('net.typeblog.socks');
      }
      await delay(15000);
      // switch on proxy...
      let proxyBtn;
      await driver.waitUntil(async () => {
        proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
        return await proxyBtn.isExisting();
      }, { timeout: 10000, timeoutMsg: 'Proxy app did not load' });
      await delay(5000);
      proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
      if (await proxyBtn.isExisting()) {
        await delay(2000);
        await proxyBtn.click();
        sendLog(udid, '📨 Proxy app activated...');
        await delay(5000);
      }
    } catch (error) {
      sendLog(udid, `❌ Error activating proxy app: ${error.message}`);
      throw error;
    }
    await delay(15000); // Tunggu 15 detik untuk memastikan proxy aktif
  }

  //clear app data
  clearAppData(udid, appService);
  await delay(5000);

  await driver.activateApp(appService);
  await delay(75000); // Tunggu untuk memastikan aplikasi terbuka

  // cari tombol buat akun button
  let maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const Mulai = await driver.$("-android uiautomator:new UiSelector().text(\"Mulai\")");
      if (await Mulai.isExisting()){
        await Mulai.click();
        break;
      }
      const BuatAkunBaru = await driver.$("-android uiautomator:new UiSelector().text(\"Buat akun baru\")");
      if (await BuatAkunBaru.isExisting()) {
        await BuatAkunBaru.click();
        break;
      }
      const CreateNewAccount = await driver.$("-android uiautomator:new UiSelector().text(\"Create new account\")");
      if (await CreateNewAccount.isExisting()) {
        await CreateNewAccount.click();
        break;
      }
      //relog app jika tidak ditemukan
      const relogFB = await driver.terminateApp(appService);
      if (relogFB) {
        await delay(5000);
        await driver.activateApp(appService);
      }
      await delay(25000);
    } catch (e) {
      sendLog(udid, `❌ Gagal mendaftar...`);
      await delay(5000);
      await driver.deleteSession(); // Hapus sesi driver
      return;
    }
    attempt++;
  }
  await delay(5000);

  //check if app opened
  // Cek salah satu elemen, jika salah satu ada, lanjutkan

  // let fbOpened = null;
  // try {
  //   await driver.waitUntil(async () => {
  //     const el1 = await driver.$("accessibility id:Facebook dari Meta");
  //     const el2 = await driver.$("accessibility id:Gabung Facebook");
  //     if (await el1.isExisting()) {
  //       fbOpened = el1;
  //       return true;
  //     }
  //     if (await el2.isExisting()) {
  //       fbOpened = el2;
  //       return true;
  //     }
  //     return false;
  //   }, { timeout: 5000, timeoutMsg: 'Facebook not open!' });
  //   await delay(5000);
  //   // Jika elemen ditemukan, lanjutkan
  //   const Mulai = await driver.$("-android uiautomator:new UiSelector().text(\"Mulai\")");
  //   if (await Mulai.isExisting()){
  //     await Mulai.click();
  //   }
  //   const BuatAkunBaru = await driver.$("-android uiautomator:new UiSelector().text(\"Buat akun baru\")");
  //   if (await BuatAkunBaru.isExisting()) {
  //     await BuatAkunBaru.click();
  //   }
  //   const CreateNewAccount = await driver.$("-android uiautomator:new UiSelector().text(\"Create new account\")");
  //   if (await CreateNewAccount.isExisting()) {
  //     await CreateNewAccount.click();
  //   }
  // } catch (error) {
  //   // sendLog(udid, `❌ ${error.message}`);
  //   // await driver.deleteSession(); // Hapus sesi driver
  //   // return;
  //   //relog app jika tidak ditemukan
  //   const relogFB = await driver.terminateApp(appService);
  //   if (relogFB) {
  //     await delay(5000);
  //     await driver.activateApp(appService);
  //   }
  //   await delay(25000);
  // }
  // await delay(5000);

  //cek mulai buat akun baru
  let BergabungFB;
  try {
    await driver.waitUntil(async () => {
      BergabungFB = await driver.$("accessibility id:Bergabung dengan Facebook");
      return await BergabungFB.isExisting();
    }, { timeout: 15000, timeoutMsg: 'Bergabung dengan Facebook not found' });
  } catch (_) {}
  await delay(5000);

//Bergabung dengan Facebook...
  try {
    const Mulai = await driver.$("-android uiautomator:new UiSelector().text(\"Mulai\")");
    if (await Mulai.isExisting()){
      await Mulai.click();
    }
    const BuatAkunBaru = await driver.$("xpath://android.view.View[@content-desc=\"Buat akun baru\"]");
    if (await BuatAkunBaru.isExisting()) {
      await BuatAkunBaru.click();
    }
    const CreateNewAccount = await driver.$("xpath://android.view.View[@text=\"Create new account\"]");
    if (await CreateNewAccount.isExisting()) {
      await CreateNewAccount.click();
    }
  } catch (e) {
    sendLog(udid, `❌ Gagal mendaftar...`);
    await delay(5000);
    await driver.deleteSession(); // Hapus sesi driver
    return;
  }
  await delay(5000);
  
  // fill names;
  const whatIsMyNames = generateFemaleNames(1);
  const firstName = whatIsMyNames[0].name.split(' ')[0];
  const lastName = whatIsMyNames[0].name.split(' ')[1];
  sendLog(udid, `${firstName} ${lastName}`);
  await delay(2000);

  //Android 12 allow kontak!
  // try {
  //   const allowContacts = await driver.$("id:com.android.permissioncontroller:id/permission_deny_button");
  //   if (await allowContacts.isExisting()) await allowContacts.click();
  //   await delay(2000);
  // } catch (__) {}
  // await delay(15000);

  const el3 = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(0)");
  await el3.addValue(firstName);
  await delay(1000);
  const el4 = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(1)");
  await el4.addValue(lastName);
  await delay(3000);
  const el5 = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
  await el5.click();
  await delay(5000);

  //cek Birthday scroll...
  let birthdayScroll;
  try {
    await driver.waitUntil(async () => {
      birthdayScroll = await driver.$("id:android:id/alertTitle");
      return await birthdayScroll.isExisting();
    }, { timeout: 10000, timeoutMsg: 'Birthday scroll not found' });
  } catch (_) {}
  await delay(2000);

  //Birthday scroll...
  // let randomYears = Math.floor(Math.random() * 2) + 3; // between 3 and 4
  // for (let i = 0; i < randomYears; i++) {
  //   swipeDevice(udid, 509, 644, 507, 1243, 500);
  //   await delay(800);
  // }
  // await delay(5000);
  // //set Birthday
  const el6 = await driver.$("id:android:id/button1");
  await el6.click();
  await delay(2000);
  // const cancelBirthdays = await driver.$("id:android:id/button2");
  // await driver.waitUntil(async () => {
  //   return await cancelBirthdays.isExisting();
  // }, { timeout: 10000, timeoutMsg: 'button cancel not found!' });
  const nextBirthdays = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
  await nextBirthdays.click();
  await delay(2000);
  await nextBirthdays.click();
  await delay(5000);

  //gender usia input...
  try {
    const genderFields = await driver.$("accessibility id:Berapakah usia Anda saat ini?");
    if (await genderFields.isExisting()) {
      const randomAge = Math.floor(Math.random() * (28 - 18 + 1)) + 18;
      const el2 = await driver.$("class name:android.widget.EditText");
      await el2.addValue(randomAge.toString());
      await delay(2000);
      const el3 = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
      await el3.click();
      await delay(5000);
      const el4 = await driver.$("-android uiautomator:new UiSelector().text(\"OK\")");
      await el4.click();
      await delay(5000);
    }
  } catch (_) {}
  await delay(5000);

  //gender selections!
  let genderSelector;
  try {
    await driver.waitUntil(async () => {
      genderSelector = await driver.$("accessibility id:Apa jenis kelamin Anda?");
      return await genderSelector.isExisting();
    }, { timeout: 10000, timeoutMsg: 'input gender not found!'});
    await delay(2500);
    genderSelector = await driver.$("-android uiautomator:new UiSelector().text(\"Perempuan\")");
    if (await genderSelector.isExisting()) await genderSelector.click();
    await delay(2000);
  } catch (error) {
    // Jika selector tidak ditemukan, coba dengan selector alternatif
    genderSelector = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.ImageView\").instance(0)");
    if (await genderSelector.isExisting()) await genderSelector.click();
    await delay(2000);
  }
  await delay(5000);
  // Lanjutkan ke langkah berikutnya
  const el9 = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
  await el9.click();
  await delay(5000);

  // ======= Daftar dengan email ======= //
  let daftarDenganEmail;
  try {
    await driver.waitUntil(async () => {
      daftarDenganEmail = await driver.$("-android uiautomator:new UiSelector().text(\"Daftar dengan email\")");
      return await daftarDenganEmail.isExisting();
    }, { timeout: 10000, timeoutMsg: 'Daftar dengan email not found' });
    await delay(2000);
    daftarDenganEmail = await driver.$("-android uiautomator:new UiSelector().text(\"Daftar dengan email\")");
    if (await daftarDenganEmail.isExisting()) await daftarDenganEmail.click();
    await delay(5000);
  } catch (_) {}
  await delay(5000);

// ========== Input EMAIL ========== //
  //helper hotmail services;
  let hotmail_token_refresh, hotmail_client_id, hotmail_full_info;
  try {
    const elementEmailFound = await driver.$("accessibility id:Email");
    if (!(await elementEmailFound.isExisting())) {
      sendLog(udid, `❌ Email field not found!`);
      //send failed accounts to server
      //await axios.post(COOKIE_UPLOAD_URL, { cokis: `${firstName}|${lastName}`, userId: 'gagalnoverif' });
      await delay(5000);
      await driver.deleteSession(); // Hapus sesi driver
      return;
      //throw new Error('❌ Input email field not found!');
    }
    await delay(2000);
    if (mailService === 'gmailotp') {
      const getGmail = await createGmail(gmailotp_access_key);
      if (getGmail === null) {
        sendLog(udid, `❌ stok gmail kosong!`);
        //throw new Error('Failed to get email from Gmail OTP');
        return;
      } else {
        email = getGmail.email;
        gmail_order_id = getGmail.order_id;
      }
    } else if (mailService === 'sohibmail') {
          email = `${whatIsMyNames[0].email}@${sohibMailDomain}`;
    } else if (mailService === 'hotmail') {
      //hotmail
      const getHotmailInfo = await createHotmail(hotmailConfig, hotmailApiKey);
      email = getHotmailInfo.email;
      hotmail_token_refresh = getHotmailInfo.refresh_token;
      hotmail_client_id = getHotmailInfo.client_id;
      hotmail_full_info = getHotmailInfo.data;
    } else if (mailService === 'fexplus') {
      email = await createFexboxMail();
    } else if (mailService === 'tempmail') {
      email = await createTempMail();
    } else if (mailService === 'kukulu') {
      email = await createKukulu(whatIsMyNames[0].email, '@' + kukuluDomain);
    } else if (mailService === 'fviainboxes') {
      if (fviainboxesDomain === 'random') {
        email = await createFviaEmail(true);
      } else {
        email = await createFviaEmail(false, fviainboxesDomain);
      }
    }
    sendLog(udid, email);
    await delay(5000);
    const inputEmails = await driver.$("class name:android.widget.EditText");
    // if (await inputEmails.isExisting()) await inputEmails.click();
    // await delay(2000);
    // await inputEmails.clearValue();
    if (await inputEmails.isExisting()) await inputEmails.clearValue();
    await delay(1500);
    await inputEmails.setValue(email);
    await delay(2500);
    const el13 = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
    await el13.click();
  } catch (error) {
    return;
  }
  await delay(5000);

//cek Lanjutkan membuat akun
  try {
      const LanjutkanMembuatAkun = await driver.$('-android uiautomator:new UiSelector().text("Continue creating account")');
      if (await LanjutkanMembuatAkun.isExisting()) {
        await LanjutkanMembuatAkun.click();
        await delay(2000);
      } else {
        const XpathLanjutkanMembuatAkun = await driver.$('xpath://android.view.View[@content-desc="Continue creating account"]');
        if (await XpathLanjutkanMembuatAkun.isExisting()) {
          await XpathLanjutkanMembuatAkun.click();
          await delay(5000);
        }
      }
  } catch (__) {}
  await delay(5000);
  try {
      const LanjutkanMembuatAkun = await driver.$('-android uiautomator:new UiSelector().text("Lanjutkan membuat akun")');
      if (await LanjutkanMembuatAkun.isExisting()) {
        await LanjutkanMembuatAkun.click();
        await delay(2000);
      } else {
        const XpathLanjutkanMembuatAkun = await driver.$('xpath://android.view.View[@content-desc="Lanjutkan membuat akun"]');
        if (await XpathLanjutkanMembuatAkun.isExisting()) {
          await XpathLanjutkanMembuatAkun.click();
          await delay(5000);
        }
      }
  } catch (__) {}
  await delay(5000);
  
  //fill password!
  // const el15 = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.ImageView\").instance(1)"); //checklist infologin save
  // if (await el15.isExisting()) await el15.click();
  // await delay(2000);
  // Input password
  const el16 = await driver.$("class name:android.widget.EditText");
  await el16.addValue(passwordFB);
  await delay(2000);
  const el17 = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
  await el17.click();
  await delay(5000);

  // save device info
  const lainKali = await driver.$("-android uiautomator:new UiSelector().text(\"Lain Kali\")");
  if (await lainKali.isExisting()) await lainKali.click();
  await delay(5000);

  // Terms and conditions
  const el18 = await driver.$("-android uiautomator:new UiSelector().text(\"Saya setuju\")");
  await el18.click();
  await delay(25000);

//cek pilih akun lainnya..
  try {
      const cekError_0 = await driver.$("-android uiautomator:new UiSelector().text(\"Pilih akun lainnya\")");
      if (await cekError_0.isExisting()) await cekError_0.click();
  } catch (_) { }
  await delay(5000);
//cek tidak buat akun baru..
  try {
      const cekError_1 = await driver.$("-android uiautomator:new UiSelector().text(\"Tidak, buat akun baru\")");
      if (await cekError_1.isExisting) await cekError_1.click();
  } catch (_) {}
  await delay(5000);

  //FBLite error logout helper...
  if (appService === 'com.facebook.lite') {
    // Relogin to Facebook
    const reloginFB = await driver.terminateApp(appService);
    if (reloginFB) {
      await driver.activateApp(appService);
      await delay(2500);
    }
    await delay(25000);
      let checkLoginForm;
      try {
        await driver.waitUntil(async () => {
          checkLoginForm = await driver.$("accessibility id:Facebook Lite from Meta");
          return await checkLoginForm.isExisting();
        }, { timeout: 8000, timeoutMsg: 'Login form not found' });
        await delay(2000);
        const el3 = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(0)");
        el3.clearValue();
        await el3.addValue(email);
        await delay(2000);
        const el4 = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(1)");
        el4.clearValue();
        await el4.addValue(passwordFB);
        await delay(2000);
        const el5 = await driver.$("-android uiautomator:new UiSelector().text(\"Login\")");
        await el5.click();
        await delay(15000);
        // relog setelah login..
        const relogfblite = await driver.terminateApp(appService);
        if (relogfblite) {
          await delay(5000);
          await driver.activateApp(appService);
        }
        await delay(15000);
        // Cek apakah sudah login
        const el6 = await driver.$("-android uiautomator:new UiSelector().className(\"android.view.ViewGroup\").instance(7)");
        if (await el6.isExisting()) await el6.click();
        await delay(2000);
        const el7 = await driver.$("-android uiautomator:new UiSelector().className(\"android.view.View\").instance(8)");
        if (await el7.isExisting()) await el7.click();
        await delay(4000);
        const el9 = await driver.$("-android uiautomator:new UiSelector().className(\"android.view.View\").instance(4)");
        if (await el9.isExisting()) await el9.click();
        await delay(7000);

        // Cek apakah ada opsi "Confirm with code instead"
        // relog 2
        const relogfblite2 = await driver.terminateApp(appService);
        if (relogfblite2) {
          await delay(5000);
          await driver.activateApp(appService);
        }
        await delay(15000);
      } catch (_) {}
      await delay(5000);
  }

// ====== Verifikasi akun ====== //
  //new UiSelector().text("Lanjutkan dalam bahasa Inggris (AS)")
  if (appService === 'com.facebook.katana') {
    try {
      const tryagainBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Coba lagi\")");
      if (await tryagainBtn.isExisting()) {
        await tryagainBtn.click();
        await delay(5000);
      }
    } catch (_) {}
    await delay(5000);
  }

// ===== get konfirmasi kode email ===== //
async function waitForCode(order_id, access_key, maxAttempts = 15, delayMs = waitCode * 1000, udid) {
  for (let i = 1; i <= maxAttempts; i++) {
    sendLog(udid, `⏳ [${i}/${maxAttempts}] menunggu OTP...`);
    try {
      let code = null;

      if (mailService === 'gmailotp') {
        code = await getCodeGmail(order_id, access_key);
        if (code) sendLog(udid, `✅ OTP Gmail diterima: ${code}`);

      } else if (mailService === 'hotmail') {
        code = await getCodeHotmail(email, hotmail_token_refresh, hotmail_client_id);
        if (code) sendLog(udid, `✅ Kode Hotmail diterima: ${code}`);

      } else if (mailService === 'kukulu') {
        code = await getCodeKukulu(email);
        if (code) sendLog(udid, `✅ Kode Kukulu diterima: ${code}`);

      } else if (mailService === 'tempmail') {
        code = await getCodeTempMail(email);
        if (code) sendLog(udid, `✅ Kode TempMail diterima: ${code}`);

      } else if (mailService === 'fexplus') {
        code = await getCodeFexboxMail(email);
        if (code) sendLog(udid, `✅ Kode Fexbox diterima: ${code}`);

      } else if (mailService === 'sohibmail') {
        // Dibatasi timeout max 30 detik untuk menghindari hang
        code = await new Promise((resolve, reject) => {
          // let timeout = setTimeout(() => {
          //   sendLog(udid, `⚠️ Sohibmail timeout.`);
          //   resolve(null);
          // }, 7000);

          emaildewe(email, async (c) => {
            if (c && c.code) {
              clearTimeout(timeout);
              sendLog(udid, `✅ Kode Sohibmail diterima: ${c.code}`);
              await delay(2000);
              resolve(c.code);
            } else if (c && c.code === null) {
              //sendLog(udid, `⚠️ Kode Sohibmail belum ditemukan.`);
              resolve(null);
            }
          });
        });

      } else if (mailService === 'fviainboxes') {
        code = await getCodeFviaEmail(email);
        if (code) sendLog(udid, `✅ Kode FviaInboxes diterima: ${code}`);
      }

      if (code) {
        await delay(2000);
        return code;
      }

    } catch (err) {
      sendLog(udid, `⚠️ Error saat cek OTP: ${err.message}`);
    }

    await delay(delayMs);
  }

  throw new Error(`[${maxAttempts}/${maxAttempts}] OTP ${mailService} timeout.`);
}

// ===== Cek kode verifikasi ===== //
  let code;
  try {
    code = await waitForCode(gmail_order_id, gmailotp_access_key, 7, waitCode * 1000, udid);
  } catch (err) {
    sendLog(udid, `❌ ${err.message}`);
    throw err;
  }
  await delay(5000);

  //Helper fb katana
  if (appService === 'com.facebook.katana') {
    // Cek apakah ada opsi "Confirm with code instead"
    try {
      const confirmWithCode = await driver.$("-android uiautomator:new UiSelector().text(\"Confirm with code instead\")");
      if (await confirmWithCode.isExisting()) {
        await confirmWithCode.click();
        await delay(5000);
      }
    } catch (_) {}
    await delay(5000);
  }
           
  
// ====== ✅ Input OTP ke emulator ====== //
  try {
    const inputCode = await driver.$("class name:android.widget.EditText");
    if (await inputCode.isExisting()) {
      await inputCode.clearValue();
      await inputCode.setValue(code);
    }
    await delay(15000); // Tunggu 15 detik sebelum mengonfirmasi
    const nextBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
    if (await nextBtn.isExisting()) await nextBtn.click();
    await delay(5000);
    const nextBtn2 = await driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
    if (await nextBtn2.isExisting()) await nextBtn2.click();
    await delay(7000);
  } catch (_) {}
  await delay(15000);
  sendLog(udid, `Menyimpan akun...`);
  // 💾 Simpan Akun
  if (mailService === 'hotmail') {
    await saveAccounts(udid, '', hotmail_full_info, passwordFB, appService.split('com.facebook.')[1]);
  } else {
    await saveAccounts(udid, '', email, passwordFB, appService.split('com.facebook.')[1]);
  }
  await delay(5000);
  await driver.terminateApp(appService); // Hentikan aplikasi Facebook
  await delay(5000);
  clearAppData(udid, appService); // Hapus data aplikasi Facebook
  await delay(5000);
  await driver.deleteSession(); // Hapus sesi driver
  return `✅ FB berhasil dibuat: ${email}`;
};

// Verify Facebook account
async function verifyFB({ udid, appiumPort, systemPort }) {
  let driver;
  let email, gmail_order_id;
  await delay(2000);

// ============= Get settings! ============= //
  const store = new Store();
  const reloadSettings = () => {
      const settings = store.get('settings');
      return {
        appService: settings.appService,
        changeEmail: settings.changeEmail,
        changeEmailConfig: settings.changeEmailConfig,
        gmailotp_access_key: settings.gmailotp_access_key,
        mailService: settings.mailService,
        sohibMailDomain: settings.sohibMailDomain,
        fviainboxesDomain: settings.fviainboxesDomain,
        kukuluDomain: settings.kukuluDomain,
        hotmailConfig: settings.hotmailConfig,
        hotmailApiKey: settings.hotmailApiKey,
        Services_Number: settings.Services_Number,
        use5sim: settings.use5sim,
        use5sim_country: settings.use5sim_country,
        use5sim_operator: settings.use5sim_operator,
        vaksms_country: settings.vaksms_country,
        vaksms_operator: settings.vaksms_operator,
        proxy: settings.proxy,
        waitCode: settings.waitCode,
        passwordFB: settings.passwordFB,
      };
  };
  let settings = reloadSettings();
  store.onDidChange('settings', () => {settings = reloadSettings();});
  let {
      appService,
      changeEmail,
      changeEmailConfig,
      gmailotp_access_key,
      mailService,
      kukuluDomain,
      sohibMailDomain,
      fviainboxesDomain,
      hotmailConfig,
      hotmailApiKey,
      Services_Number,
      use5sim,
      use5sim_country,
      use5sim_operator,
      vaksms_country,
      vaksms_operator,
      proxy,
      waitCode,
      passwordFB
  } = settings;
  await delay(1500);
// ============= Get settings! ============= //

  const caps = {
    "appium:automationName": "uiautomator2",
    "platformName": "android",
    "appium:udid": udid,
    "appium:ensureWebviewsHavePages": true,
    "appium:nativeWebScreenshot": true,
    "appium:newCommandTimeout": 360000,
    "appium:connectHardwareKeyboard": true,
    "appium:noReset": false,
    "appium:dontStopAppOnReset": true,
    "appium:systemPort": systemPort,
  }
  driver = await remote({
    protocol: "http",
    hostname: "localhost",
    port: Number(appiumPort),
    path: "/",
    capabilities: caps
  });
  //wait device ready
  await delay(5000);

  //Fix input text
  async function fixInput(){
    inputText(udid, ' '); // input
    await delay(1000);
    inputText(udid, ' '); // input
    await delay(1000);
    clearText(udid); // clear text
    await delay(1000);
    clearText(udid); // clear text
    await delay(3000);
  }
  //Login function!!
  async function loginFB(uid, pass) {
    sendLog(udid, `⏳ Login FB...`);
    const IhaveAccount = await driver.$("-android uiautomator:new UiSelector().text(\"Saya sudah punya akun\")");
    if (await IhaveAccount.isExisting()) await IhaveAccount.click();
    await delay(2000);
    if (!(await IhaveAccount.isExisting())) {
      const IhaveAccount2 = await driver.$("xpath://android.view.View[@content-desc=\"Saya sudah punya akun\"]");
      if (await IhaveAccount2.isExisting()) await IhaveAccount2.click();
      await delay(2000);
    }
    // Input UID and Password
    const inputUid = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(0)");
    await inputUid.waitForExist({ timeout: 5000, timeoutMsg: 'Input UID field did not appear' });
    await inputUid.click();
    await delay(500);
    await inputUid.addValue(uid);
    await delay(2000);
    const inputPass = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(1)");
    await inputPass.waitForExist({ timeout: 5000, timeoutMsg: 'Input Password field did not appear' });
    await inputPass.click();
    await delay(500);
    await inputPass.addValue(pass);
    await delay(5000);
    let btnMasuk;
    try {
      btnMasuk = await driver.$("-android uiautomator:new UiSelector().text(\"Login\")");
      if (!(await btnMasuk.isExisting())) {
        btnMasuk = await driver.$("-android uiautomator:new UiSelector().text(\"Masuk\")");
        await btnMasuk.click();
      }
      await btnMasuk.click();
    } catch (e) {
      // fallback in case of error
      btnMasuk = await driver.$("-android uiautomator:new UiSelector().text(\"Log In\")");
      if (await btnMasuk.isExisting()) {
        await btnMasuk.click();
      } else {
        btnMasuk = await driver.$("-android uiautomator:new UiSelector().text(\"Log in\")");
        if (await btnMasuk.isExisting()) {
          await btnMasuk.click();
        }
      }
    }
    await delay(28000);
  };

  //clear app data
  clearAppData(udid, appService);
  await delay(7000);

// ===== start get account noverify from servers ===== //
  const noverify = await axios.get('https://fb.arezdev.eu.org/api/user/get_akun?user=noverifku&total=1');
  if (noverify?.status !== 200 || !noverify?.data?.akun) {
    sendLog(udid, `❌ tidak ada akun noverify!`);
    throw new Error(noverify.data);
  }
  let [uid, pass] = noverify?.data?.akun.split('|');
  if (!uid || !pass) {
    sendLog(udid, `❌ Tidak ada akun noverify!`);
    throw new Error('No accounts available');
  }
  sendLog(udid, `${uid}|${pass}`);
  await delay(2000);
// =========== end get account noverify from servers =============== //
  
// =========== open FB KATANA =============== //
  await driver.activateApp(appService);
  await delay(25000);

  // //clear app data and relaunch app
  // const relogFB = await driver.terminateApp(appService);
  // if (relogFB) {
  //   await delay(5000);
  //   await driver.activateApp(appService);
  // }
  // await delay(25000);

// =========== start LOGIN FB KATANA =============== //
    // ====== LOGIN PAGE 1 ====== //
    try {
      const loginPage2 = await driver.$("-android uiautomator:new UiSelector().text(\"Cari akun saya\")");
      if (await loginPage2.isExisting()) {
        // Input UID
        const loginPage2Uid = await driver.$("class name:android.widget.EditText");
        if (await loginPage2Uid.isExisting()) {
          await loginPage2Uid.clearValue();
          await delay(500);
          await loginPage2Uid.setValue(uid);
          await delay(1500);
        }
        // Click "Lanjutkan" (Continue)
        const lanjutkanBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Lanjutkan\")");
        if (await lanjutkanBtn.isExisting()) {
          await lanjutkanBtn.click();
          await delay(5000);
        }
        // Input password
        const loginPage2Pass = await driver.$("class name:android.widget.EditText");
        if (await loginPage2Pass.isExisting()) {
          await loginPage2Pass.clearValue();
          await delay(500);
          await loginPage2Pass.setValue(pass);
          await delay(1500);
        }
        // Click "Masuk" (Login)
        const btnLoginPage2 = await driver.$("-android uiautomator:new UiSelector().text(\"Masuk\")");
        if (await btnLoginPage2.isExisting()) {
          await btnLoginPage2.click();
          await delay(25000);
        }
        // Click "Lanjutkan" if exists
        const btnLanjutkan = await driver.$("-android uiautomator:new UiSelector().text(\"Lanjutkan\")");
        if (await btnLanjutkan.isExisting()) {
          await btnLanjutkan.click();
          await delay(25000);
        }
      } else {
        // ====== LOGIN PAGE 2 ====== //
        const sayaSudahPunyaAkun = await driver.$("-android uiautomator:new UiSelector().text(\"Saya sudah punya akun\")");
        if (await sayaSudahPunyaAkun.isExisting()) {
          await sayaSudahPunyaAkun.click();
          await delay(5000);
          await loginFB(uid, pass);
        }
      }
    } catch (_) {}
    await delay(15000);
    // ====== LOGIN PAGE 3 ====== //
    try {
      const lookInput = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(0)");
      if (await lookInput.isExisting()) {
        await lookInput.clearValue();
        await delay(500);
        await loginFB(uid, pass);
      }
    } catch (e) {
      // If the input field is not found, continue
    }
    await delay(15000);
// =========== end LOGIN FB KATANA =============== //

  // Check if the login was successful
  try {
    if (appService === 'com.facebook.katana') {
      //relog app
        const relaunch = await driver.terminateApp(appService);
        if (relaunch) {
          await delay(5000);
          await driver.activateApp(appService);
          await delay(25000);
        }

      // =========== CHECK IF ALREADY LOGGED IN =============== //
        //selectors element
        const selectors = [
          { desc: "Lanjut", type: "description" },
          { desc: "Saya tidak mendapatkan kode", type: "description" },
          { desc: "Kirim kode melalui SMS", type: "description" },
          { desc: "Kirim kode melalui WhatsApp", type: "description" },
          { desc: "Saya tidak mendapatkan kode", type: "description" },
          { desc: "Lanjut", type: "text" },
          { desc: "Ubah email", type: "text" },
          { desc: "Konfirmasi melalui email", type: "text" },
          { desc: "Daftar dengan email", type: "text" }
        ];
        // check login success?
        let foundSelector = false;
        for (const sel of selectors) {
          try {
            await driver.waitUntil(async () => {
              let el;
              if (sel.type === "description") {
                el = await driver.$(`-android uiautomator:new UiSelector().description("${sel.desc}")`);
              } else {
                el = await driver.$(`-android uiautomator:new UiSelector().text("${sel.desc}")`);
              }
              return await el.isExisting();
            }, { timeout: 5000, timeoutMsg: `Selector "${sel.desc}" not found in time` });
            foundSelector = true;
            break; // Stop at the first found selector
          } catch (_) {}
        }
        if (!foundSelector) {
          try {
            //relog app
            const closeAppThis = await driver.terminateApp(appService);
            if (closeAppThis) {
              await driver.activateApp(appService);
            }
            await delay(25000);
            //Check Login again to ensure we are logged in
            const lookInput = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(0)");
            if (await lookInput.isExisting()) {
              await lookInput.clearValue();
              await delay(500);
              await loginFB(uid, pass);
            }
          } catch (_) {}
        }
        await delay(5000);
        for (const sel of selectors) {
          let el;
          try {
            if (sel.type === "description") {
              el = await driver.$(`-android uiautomator:new UiSelector().description("${sel.desc}")`);
            } else {
              el = await driver.$(`-android uiautomator:new UiSelector().text("${sel.desc}")`);
            }
            if (await el.isExisting()) {
              await el.click();
              await delay(2500);
            }
          } catch (e) {
            // Ignore if not found, continue to next
            //send failed accounts to server
            await axios.post(COOKIE_UPLOAD_URL, { cokis: `${uid}|${pass}`, userId: 'gagalnoverif' });
            await delay(5000);
            await driver.deleteSession(); // Hapus sesi driver
            return;
          }
        }
        await delay(5000);
      // =========== CHECK IF ALREADY LOGGED IN =============== //
    } else if (appService === 'com.facebook.lite') {
      // Cek apakah sudah login
      const el9 = await driver.$("-android uiautomator:new UiSelector().className(\"android.view.View\").instance(4)");
      if (await el9.isExisting()) {
        await el9.click();
        await delay(5000);
      } else {
        const el10 = await driver.$("xpath://android.widget.FrameLayout[@resource-id=\"com.facebook.lite:id/main_layout\"]/android.widget.FrameLayout/android.view.ViewGroup[3]/android.view.ViewGroup[1]/android.view.View");
        if (await el10.isExisting()) {
          await el10.click();
          await delay(5000);
        }
      }
      await delay(7000);

      // Cek apakah ada opsi "Confirm with code instead"
      const confirmWithCode = await driver.$("-android uiautomator:new UiSelector().text(\"Confirm with code instead\")");
      if (await confirmWithCode.isExisting()) {
        await confirmWithCode.click();
        await delay(5000);
      }
      await delay(7000);

      // Cek apakah ada opsi Signup with email
      let signupWithEmail;
      signupWithEmail = await driver.$("-android uiautomator:new UiSelector().text(\"Sign up with email\")");
      if (await signupWithEmail.isExisting()) {
        await signupWithEmail.click();
        await delay(5000);
      } else {
      const signupWithEmail = await driver.$("-android uiautomator:new UiSelector().text(\"Daftar dengan email\")");
      if (await signupWithEmail.isExisting()) {
        await signupWithEmail.click();
        await delay(5000);
      }
    }
    await delay(7000);
  }
  } catch (_) {}
  await delay(5000);
  
// ========== Input EMAIL ========== //
  //helper hotmail services;
  let hotmail_token_refresh, hotmail_client_id, hotmail_full_info;
  try {
    const elementEmailFound = await driver.$("accessibility id:Email");
    if (!(await elementEmailFound.isExisting())) {
      sendLog(udid, `❌ Email field not found!`);
      //send failed accounts to server
      await axios.post(COOKIE_UPLOAD_URL, { cokis: `${firstName}|${lastName}`, userId: 'gagalnoverif' });
      await delay(5000);
      await driver.deleteSession(); // Hapus sesi driver
      return;
      //throw new Error('❌ Input email field not found!');
    }
    await delay(2000);
    if (mailService === 'gmailotp') {
      const getGmail = await createGmail(gmailotp_access_key);
      if (getGmail === null) {
        sendLog(udid, `❌ stok gmail kosong!`);
        //throw new Error('Failed to get email from Gmail OTP');
        return;
      } else {
        email = getGmail.email;
        gmail_order_id = getGmail.order_id;
      }
    } else if (mailService === 'sohibmail') {
          email = `${whatIsMyNames[0].email}@${sohibMailDomain}`;
    } else if (mailService === 'hotmail') {
      //hotmail
      const getHotmailInfo = await createHotmail(hotmailConfig, hotmailApiKey);
      email = getHotmailInfo.email;
      hotmail_token_refresh = getHotmailInfo.refresh_token;
      hotmail_client_id = getHotmailInfo.client_id;
      hotmail_full_info = getHotmailInfo.data;
    } else if (mailService === 'fexplus') {
      email = await createFexboxMail();
    } else if (mailService === 'tempmail') {
      email = await createTempMail();
    } else if (mailService === 'kukulu') {
      email = await createKukulu(whatIsMyNames[0].email, '@' + kukuluDomain);
    } else if (mailService === 'fviainboxes') {
      if (fviainboxesDomain === 'random') {
        email = await createFviaEmail(true);
      } else {
        email = await createFviaEmail(false, fviainboxesDomain);
      }
    }
    sendLog(udid, email);
    await delay(5000);
    const inputEmails = await driver.$("class name:android.widget.EditText");
    if (await inputEmails.isExisting()) await inputEmails.click();
    await delay(2000);
    await inputEmails.clearValue();
    await delay(1000);
    await inputEmails.setValue(email);
    await delay(2000);
    const nextBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
    if (await nextBtn.isExisting()) await nextBtn.click();
    await delay(2000);
    const nextBtn2 = await driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
    if (await nextBtn2.isExisting()) await nextBtn2.click();
    await delay(4000);
  } catch (error) {
    return;
  }
  await delay(5000);

// ========== Reset IP untuk verifikasi ========== //
  const lockFilePath = path.join(__dirname, 'restartSinyal.lock');

  async function acquireLock() {
    while (fs.existsSync(lockFilePath)) {
      // Tunggu lock dilepas
      await delay(1000);
    }
    fs.writeFileSync(lockFilePath, String(Date.now()));
  }

  async function releaseLock() {
    if (fs.existsSync(lockFilePath)) {
      fs.unlinkSync(lockFilePath);
    }
  }

  await acquireLock();
  try {
    await restartSinyal();
    await delay(15000);
  } finally {
    await releaseLock();
  }

  // Check if connection is OK by pinging a reliable server Google
  let isConnected = false;
  while (!isConnected) {
    try {
      const response = await axios.get('https://www.google.co.id', { timeout: 5000 });
      if (response.status === 200) {
        isConnected = true;
        sendLog(udid, '🌐 Koneksi internet terdeteksi.')
        };
    } catch (error) {
      sendLog(udid, `❌ Koneksi internet tidak terdeteksi, mencoba lagi...`);
      await delay(5000); // Tunggu 5 detik sebelum mencoba lagi
    }
  }
// ========== Reset IP untuk verifikasi ========== //

// ===== get konfirmasi kode email ===== //
async function waitForCode(order_id, access_key, maxAttempts = 15, delayMs = waitCode * 1000, udid) {
  for (let i = 1; i <= maxAttempts; i++) {
    sendLog(udid, `⏳ [${i}/${maxAttempts}] menunggu OTP...`);
    try {
      let code = null;

      if (mailService === 'gmailotp') {
        code = await getCodeGmail(order_id, access_key);
        if (code) sendLog(udid, `✅ OTP Gmail diterima: ${code}`);

      } else if (mailService === 'hotmail') {
        code = await getCodeHotmail(email, hotmail_token_refresh, hotmail_client_id);
        if (code) sendLog(udid, `✅ Kode Hotmail diterima: ${code}`);

      } else if (mailService === 'kukulu') {
        code = await getCodeKukulu(email);
        if (code) sendLog(udid, `✅ Kode Kukulu diterima: ${code}`);

      } else if (mailService === 'tempmail') {
        code = await getCodeTempMail(email);
        if (code) sendLog(udid, `✅ Kode TempMail diterima: ${code}`);

      } else if (mailService === 'fexplus') {
        code = await getCodeFexboxMail(email);
        if (code) sendLog(udid, `✅ Kode Fexbox diterima: ${code}`);

      } else if (mailService === 'sohibmail') {
        // Dibatasi timeout max 30 detik untuk menghindari hang
        code = await new Promise((resolve, reject) => {
          // let timeout = setTimeout(() => {
          //   sendLog(udid, `⚠️ Sohibmail timeout.`);
          //   resolve(null);
          // }, 7000);

          emaildewe(email, async (c) => {
            if (c && c.code) {
              clearTimeout(timeout);
              sendLog(udid, `✅ Kode Sohibmail diterima: ${c.code}`);
              await delay(2000);
              resolve(c.code);
            } else if (c && c.code === null) {
              //sendLog(udid, `⚠️ Kode Sohibmail belum ditemukan.`);
              resolve(null);
            }
          });
        });

      } else if (mailService === 'fviainboxes') {
        code = await getCodeFviaEmail(email);
        if (code) sendLog(udid, `✅ Kode FviaInboxes diterima: ${code}`);
      }

      if (code) {
        await delay(2000);
        return code;
      }

    } catch (err) {
      sendLog(udid, `⚠️ Error saat cek OTP: ${err.message}`);
    }

    await delay(delayMs);
  }

  throw new Error(`[${maxAttempts}/${maxAttempts}] OTP ${mailService} timeout.`);
}

// ===== Cek kode verifikasi ===== //
  let code;
  try {
    code = await waitForCode(gmail_order_id, gmailotp_access_key, 5, waitCode * 1000, udid);
  } catch (err) {
    sendLog(udid, `❌ ${err.message}`);
    throw err;
  }
  await delay(5000);
  
  // ====== ✅ Input OTP ke emulator ====== //
  try {
    const inputCode = await driver.$("class name:android.widget.EditText");
    if (await inputCode.isExisting()) {
      await inputCode.clearValue();
      await inputCode.setValue(code);
    }
    await delay(15000); // Tunggu 15 detik sebelum mengonfirmasi
    const nextBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
    if (await nextBtn.isExisting()) await nextBtn.click();
    await delay(2000);
    const nextBtn2 = await driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
    if (await nextBtn2.isExisting()) await nextBtn2.click();
    await delay(4000);
  } catch (_) {}
  await delay(7500);
  sendLog(udid, `Menyimpan akun...`);
  // 💾 Simpan akun
  if (mailService === 'hotmail') {
    await saveAccounts(udid, '', hotmail_full_info, pass, appService.split('com.facebook.')[1]);
  } else {
    await saveAccounts(udid, '', email, pass, appService.split('com.facebook.')[1]);
  }
  await delay(5000);
  await driver.terminateApp(appService); // Hentikan aplikasi Facebook
  await delay(5000);
  clearAppData(udid, appService); // Hapus data aplikasi Facebook
  await delay(5000);
  await driver.deleteSession(); // Hapus sesi driver
  return `✅ FB berhasil dibuat: ${email}`;
  // clickDevice(udid, 81, 379); // Fokus input
  // await fixInput();
  // inputText(udid, code);
  // await delay(2000);
  // Enter(udid);
  
  //   //Login ADB method!
  //   // clickDevice(udid, 360, 710); // Click Login
  //   // await delay(15000);

  //   // //input uid
  //   // clickDevice(udid, 135, 587); // email
  //   // await fixInput();
  //   // inputText(udid, uid); // input uid
  //   // await delay(2000);

  //   // //input password
  //   // clickDevice(udid, 130, 678); // password
  //   // await fixInput();
  //   // inputText(udid, pass); // input password
  //   // await delay(2000);
  //   // //Login
  //   // clickDevice(udid, 355, 768); // Click Login
  //   // await delay(25000);

  //   //relogfb


  //   //cek Konfirmasi whatsApp
  //   // clickDevice(udid, 351, 809); // Click Kirim kode melalui sms
  //   // await delay(1500);
  //   // clickDevice(udid, 360, 580); // Lanjut
  //   // await delay(2000);
  //   // clickDevice(udid, 351, 809); // Click Saya tidak mendapatkan kode
  //   // await delay(7000);
};

//getcokis all manual
async function getAllCokisFB({ udid, appiumPort, systemPort }) {
  try {
    // ============= Get settings! ============= //
  const store = new Store();
  const reloadSettings = () => {
      const settings = store.get('settings');
      return {
        appService: settings.appService,
        changeEmail: settings.changeEmail,
        changeEmailConfig: settings.changeEmailConfig,
        gmailotp_access_key: settings.gmailotp_access_key,
        mailService: settings.mailService,
        sohibMailDomain: settings.sohibMailDomain,
        fviainboxesDomain: settings.fviainboxesDomain,
        kukuluDomain: settings.kukuluDomain,
        hotmailConfig: settings.hotmailConfig,
        hotmailApiKey: settings.hotmailApiKey,
        Services_Number: settings.Services_Number,
        use5sim: settings.use5sim,
        use5sim_country: settings.use5sim_country,
        use5sim_operator: settings.use5sim_operator,
        vaksms_country: settings.vaksms_country,
        vaksms_operator: settings.vaksms_operator,
        proxy: settings.proxy,
        waitCode: settings.waitCode,
        passwordFB: settings.passwordFB,
      };
  };
  let settings = reloadSettings();
  store.onDidChange('settings', () => {settings = reloadSettings();});
  let {
      appService,
      changeEmail,
      changeEmailConfig,
      gmailotp_access_key,
      mailService,
      kukuluDomain,
      sohibMailDomain,
      fviainboxesDomain,
      hotmailConfig,
      hotmailApiKey,
      Services_Number,
      use5sim,
      use5sim_country,
      use5sim_operator,
      vaksms_country,
      vaksms_operator,
      proxy,
      waitCode,
      passwordFB
  } = settings;
  await delay(1500);
// ============= Get settings! ============= //
    await delay(2000);
    await saveAccounts(udid, '', '', 'Diablo2026', appService.split('com.facebook.')[1]);
    await delay(5000);
    clearAppData(udid, appService);
    await delay(7000);
  } catch (err) {
    console.error('❌ Error:', err.message);
    //await driver.deleteSession();
    return 'Terjadi kesalahan: ' + err.message;
  }
}

module.exports = { createFB, getAllCokisFB, verifyFB };