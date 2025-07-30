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
  await delay(35000); // Tunggu 60 detik untuk memastikan aplikasi terbuka

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
  } catch (__) {}
  await delay(5000);

  // Relogin to Facebook
  const reloginFB = await driver.terminateApp(appService);
  if (reloginFB) {
    await driver.activateApp(appService);
    await delay(2500);
  }
  await delay(15000);

  //FBLite error logout helper...
  let checkLoginForm;
  try {
    await driver.waitUntil(async () => {
      checkLoginForm = await driver.$("accessibility id:Facebook Lite from Meta");
      return await checkLoginForm.isExisting();
    }, { timeout: 10000, timeoutMsg: 'Login form not found' });
    await delay(5000);
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
  } catch (error) {
    const relogfblite2 = await driver.terminateApp(appService);
    if (relogfblite2) {
      await delay(5000);
      await driver.activateApp(appService);
    }
    await delay(15000);
  }
  await delay(5000);

  // ====== ✅ Verifikasi akun ====== //
  //new UiSelector().text("Lanjutkan dalam bahasa Inggris (AS)")
  // try {
  //   const IstryAgain = await driver.$("-android uiautomator:new UiSelector().text(\"Coba lagi\")");
  //   if (await IstryAgain.isExisting()) {
  //     await IstryAgain.click();
  //     await delay(5000);
  //   }
  // } catch (_) {}
  // await delay(5000);

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

// ====== Verifikasi pakai proxy ====== //
  // if (proxy) {
  //   try {
  //     await driver.activateApp('net.typeblog.socks')
  //         await driver.waitUntil(async () => {
  //           const proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
  //           return await proxyBtn.isExisting();
  //         }, { timeout: 15000, timeoutMsg: 'Proxy app did not load' });
  //         const proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
  //         if (await proxyBtn.isExisting()) {
  //           await delay(2000);
  //           await proxyBtn.click();
  //           sendLog(udid, '📨 Proxy app activated...');
  //           await delay(5000);
  //         }
  //   } catch (error) {
  //     sendLog(udid, `❌ Error activating proxy app: ${error.message}`);
  //     throw error;
  //   }
  //   await delay(15000); // Tunggu 15 detik untuk memastikan proxy aktif
  // }

//Confirm with code instead...
  let Confirmwithcodeinstead;
  try {
    Confirmwithcodeinstead = await driver.$("-android uiautomator:new UiSelector().text(\"Confirm with code instead\")");
    if (await Confirmwithcodeinstead.isExisting()) await Confirmwithcodeinstead.click();
    await delay(2500);
  } catch (_) {}
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
  await delay(5000);

  // //proxy
  // // if (proxy) {
  // //   await driver.activateApp('net.typeblog.socks');
  // //   await driver.waitUntil(async () => {
  // //     const proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
  // //     return await proxyBtn.isExisting();
  // //   }, { timeout: 15000, timeoutMsg: 'Proxy app did not load' });
  // //   const proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
  // //   if (await proxyBtn.isExisting()) {
  // //     await delay(2000);
  // //     await proxyBtn.click();
  // //     sendLog(udid, '📨 Proxy app activated...');
  // //     await delay(5000);
  // //   } else {
  // //     await driver.terminateApp('net.typeblog.socks');
  // //     await delay(5000);
  // //     await driver.activateApp('net.typeblog.socks');
  // //     await driver.waitUntil(async () => {
  // //       const proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
  // //       return await proxyBtn.isExisting();
  // //     }, { timeout: 15000, timeoutMsg: 'Proxy app did not load' });
  // //   }
  // // }
  // // await delay(15000);

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
  await delay(10000);

  //clear app data and relaunch app
  const relogFB = await driver.terminateApp(appService);
  if (relogFB) {
    await delay(5000);
    await driver.activateApp(appService);
  }
  await delay(20000);

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
      await delay(5000);

      // Cek apakah ada opsi "Confirm with code instead"
      const confirmWithCode = await driver.$("-android uiautomator:new UiSelector().text(\"Confirm with code instead\")");
      if (await confirmWithCode.isExisting()) {
        await confirmWithCode.click();
        await delay(5000);
      }
      await delay(15000);

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
    await delay(15000);
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
  await restartSinyal();
  await delay(15000);

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
  await delay(15000);
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

//auto create facebook!
async function createFB_appium({ udid, appiumPort, systemPort }) {
    sendLog(udid, `Reset server appium...`);
    //reset Appium server APK
    await resetServerAppiumAPK(udid);
    sendLog(udid, `✅ Reset server appium done!`);
  
  const caps = {
    "appium:automationName": "UiAutomator2",
    "platformName": "Android",
    "appium:udid": udid,
    "appium:systemPort": systemPort,
    "appium:noReset": false,
    "appium:dontStopAppOnReset": true,
    "appium:ensureWebviewsHavePages": true,
    "appium:nativeWebScreenshot": true,
    "appium:newCommandTimeout": 3600,
    "appium:connectHardwareKeyboard": true
  };

  const driver = await remote({
    protocol: 'http',
    hostname: '127.0.0.1',
    port: appiumPort,
    path: '/',
    capabilities: caps
  });

  try {
    await delay(5000);

    //Initial settings
    const store = new Store();
    const reloadSettings = () => {
      const settings = store.get('settings');
      return {
        changeEmail: settings.changeEmail,
        changeEmailConfig: settings.changeEmailConfig,
        gmailotp_access_key: settings.gmailotp_access_key,
        mailService: settings.mailService,
        sohibMailDomain: settings.sohibMailDomain,
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

    // Reload settings!
    let settings = reloadSettings();
    store.onDidChange('settings', () => {
      settings = reloadSettings();
    });
    //console.log('Reloaded settings:', settings);
    let {
      changeEmail,
      changeEmailConfig,
      gmailotp_access_key,
      mailService,
      kukuluDomain,
      sohibMailDomain,
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
    await delay(5000);

    let noverify_code = false;
    let confirm_api = false;
    let email = '';
    let gmail_order_id = '';
    let hotmail_token_refresh = '';
    let hotmail_client_id = '';
    let fivesim_number = '';
    let fivesim_order_id = '';
    let whatIsMyNames = '';
    whatIsMyNames = generateFemaleNames(1);
    const firstName = whatIsMyNames[0].name.split(' ')[0];
    const lastName = whatIsMyNames[0].name.split(' ')[1];

    if (Services_Number === '0') {
      await getNumber5sim(use5sim_country, use5sim_operator).then(async data => {
        if (data === null) {
          await driver.deleteSession();
          await delay(3000);
          sendLog(udid, `❌ Nomer 5sim kosong atau stok habis !`);
          throw new Error('Failed to get number from 5sim');
        }
        fivesim_number = data.split('|')[0];
        fivesim_order_id = data.split('|')[1];
      });
      await delay(5000);
    } else if (Services_Number === '1') {
      await getNumber_vaksms(vaksms_country, vaksms_operator).then(async data => {
        if (data === null) {
          await driver.deleteSession();
          await delay(3000);
          sendLog(udid, `❌ Nomer 5sim kosong atau stok habis !`);
          throw new Error('Failed to get number from 5sim');
        }
        fivesim_number = data.tel;
        fivesim_order_id = data.idNum;
      });
      await delay(5000);
    }
    
    await delay(5000);

    // clear app data
    // await delay(5000);
    // clearAppData (udid, appService);
    // await delay(5000);
    clearAppData(udid, appService);
    await delay(5000);

    //set proxy untuk daftar akun
    if (proxy) {
      //await driver.terminateApp('net.typeblog.socks');
      closeApp(udid, 'net.typeblog.socks');
      await delay(7000);
      sendLog(udid, '📨 open proxy app...');
      //await driver.activateApp('net.typeblog.socks');
      openApp(udid, 'net.typeblog.socks');
      await delay(8000);
      sendLog(udid, '📨 waiting for proxy app to load...');
      //const proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
      //await proxyBtn.waitForExist({ timeout: 15000 });
      //await proxyBtn.click();
      clickDevice(udid, 619, 76); // Click on the proxy switch button
      await delay(15000);
      sendLog(udid, '📨 proxy app activated...');
    }

    //start Random devices!
    // await randomizeDeviceInfo(udid);
    // await delay(2000);

    //await driver.removeApp(appService);

    //const findAPK = path.join(__dirname, 'apk');
    //await driver.installApp(path.join(findAPK, 'lite.apk'));
    //const findAPK = path.join(process.resourcesPath, 'apk');

    // const apkPath = path.join(
    //   app.isPackaged ? process.resourcesPath : __dirname,
    //   'apk',
    //   'lite.apk'
    // );
    // await driver.installApp(apkPath);
    // await delay(7000);

    // =========== CHECK IF ALREADY OPEN =============== //
    sendLog(udid, `Membuka aplikasi facebook...`);
    await driver.activateApp(appService);
    //openApp(udid, appService);
    await delay(15000);

    const reg = await driver.$("-android uiautomator:new UiSelector().text(\"Buat akun baru\")");
    if (await reg.isExisting()) await reg.click();
    await delay(5000);
    if (!(await reg.isExisting())) {
      sendLog(udid, `❌ Gagal mendaftar...`);
      await delay(5000);
      await driver.deleteSession();
      await delay(7000);
    } else {
      sendLog(udid, '📩 Loading...');
      if (await reg.isExisting()) await reg.click();
      await delay(5000);
    }

    // const AllowBtn = await driver.$("id:com.android.packageinstaller:id/permission_deny_button");
    // await AllowBtn.waitForExist({ timeout: 30000 });

    // // =========== ALLOW PERMISSIONS =============== //
    // if (await AllowBtn.isExisting()) {
    //   await AllowBtn.click();
    //   await delay(2000);
    // }
    // await delay(5000);

    // =========== GET STARTED =============== //
    // const startTexts = [
    //   "Get started",
    //   "Mulai",
    //   "Create New Account",
    //   "Buat akun baru"
    // ];
    // for (const text of startTexts) {
    //   try {
    //     const btn = await driver.$(`-android uiautomator:new UiSelector().text("${text}")`);
    //     await btn.waitForExist({ timeout: 5000 });
    //     if (await btn.isExisting()) {
    //       sendLog(udid, `📩 Click: ${text}`);
    //       await btn.click();
    //       await delay(2000);
    //     } else {
    //       sendLog(udid, `❌ Gagal mendaftar...`);
    //       await delay(5000);
    //       await driver.deleteSession();
    //       await delay(7000);
    //     }
    //   } catch (_) {}
    //   await delay(2000);
    // }

    // =========== NAME =============== //
    sendLog(udid, `Nama: ${firstName} ${lastName}`);
    const firstNameField = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(0)");
    await firstNameField.setValue(firstName);

    const lastNameField = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(1)");
    await lastNameField.setValue(lastName);

    //sendLog(udid, `next..`);
    const nextBtn0 = await driver.$("-android uiautomator:new UiSelector().className(\"android.view.ViewGroup\").instance(18)");
    await nextBtn0.click();
    await delay(15000);

    // =========== Birthday =============== //
    //let randomYears = Math.floor(Math.random() * 5) + 5;
    let randomYears = Math.floor(Math.random() * 2) + 3; // between 3 and 4
    for (let i = 0; i < randomYears; i++) {
      swipeDevice(udid, 509, 644, 507, 1243, 500);
      await delay(800);
    }
    const confirmDateBtn = await driver.$("id:android:id/button1");
    if (!(await confirmDateBtn.isExisting())) {
      sendLog(udid, `❌ Gagal mendaftar...`);
      await delay(5000);
      await driver.deleteSession();
      await delay(7000);
    }
    await confirmDateBtn.click();
    await delay(2000);
    sendLog(udid, 'Pilih Tahun...');

    //sendLog(udid, `Next...`);
    let nextBtn;
    try {
      nextBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
      if (!(await nextBtn.isExisting())) {
        nextBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
      }
    } catch (e) {
      // fallback in case of error
      nextBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
    }
    const isNextBtnFound = await nextBtn.isExisting();
    if (isNextBtnFound) await nextBtn.click();
    await delay(5000);

    // =========== GENDER =============== //
    let genderSelector;
    try {
      genderSelector = await driver.$("-android uiautomator:new UiSelector().description(\"Female\")");
      if (!(await genderSelector.isExisting())) {
        genderSelector = await driver.$("-android uiautomator:new UiSelector().description(\"Perempuan\")");
      }
      await genderSelector.waitForExist({timeout:35000});
      sendLog(udid, 'Memilih jenis kelamin...');
      const isGenderSelectorFound = await genderSelector.isExisting();
      if (isGenderSelectorFound) await genderSelector.click();
    } catch (__) {}
    await delay(3000);

    if (isNextBtnFound) await nextBtn.click();
    await delay(5000);

    // ========== Izinkan ========== //
    const allowSelectors = [
      'id:com.android.packageinstaller:id/permission_allow_button',
      '-android uiautomator:new UiSelector().resourceId("com.android.packageinstaller:id/permission_allow_button")',
      'xpath://android.widget.Button[@resource-id="com.android.packageinstaller:id/permission_allow_button"]'
    ];
    for (const selector of allowSelectors) {
      try {
      const btn = await driver.$(selector);
      if (await btn.isExisting()) {
        await btn.click();
        await delay(1000);
      }
      } catch (_) {}
      await delay(1000);
    }
    await delay(2000);

    // =========== EMAIL =============== //
    if (use5sim) {
      //sendLog(udid, `Memakai 5sim number: ${fivesim_number}`);
    } else {
      let signupWithEmail;
        try {
          signupWithEmail = await driver.$('-android uiautomator:new UiSelector().text("Sign up with email")');
          if (!(await signupWithEmail.isExisting())) {
            signupWithEmail = await driver.$('-android uiautomator:new UiSelector().text("Daftar dengan email")');
          }
        } catch (__) {}
        const isSignupWithEmail = await signupWithEmail.isExisting();
        if (isSignupWithEmail) await signupWithEmail.click();
    }
    await delay(5000);

    // ================= Email INPUT ==============//
    const emailInput = await driver.$("class name:android.widget.EditText");
    await emailInput.clearValue();
    if (changeEmail) {
      // generate email untuk konfirm change email nanti.
      //email = await getMail();
      if ( changeEmailConfig === '0' ) {
        await emailInput.setValue(generateRandomIndoNumber());
      } else if ( changeEmailConfig === '1' ) {
        await emailInput.setValue(`${whatIsMyNames[0].email}@gmail.com`);
      }

    } else {

      // =================== generate reg services =================== //
        if (mailService === 'gmailotp') {
          const getGmail = await createGmail(gmailotp_access_key);
          if (getGmail === null) {
            sendLog(udid, `❌ stok gmail kosong!`);
            throw new Error('Failed to get email from Gmail OTP');
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
          await emailInput.setValue(email);
        } else if (mailService === 'fexplus') {
          email = await createFexboxMail();
        } else if (mailService === 'tempmail') {
          email = await createTempMail();
        } else if (mailService === 'kukulu') {
          email = await createKukulu(whatIsMyNames[0].email, '@' + kukuluDomain);
        }
        await delay(5000);
        sendLog(udid, `📩 ${use5sim ? fivesim_number : email}`);
        await emailInput.setValue(use5sim ? fivesim_number : email);
      // =================== generate reg services =================== //
    }

    if (isNextBtnFound) await nextBtn.click();
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

    // =========== PASSWORD =============== //
    const passwordInput = await driver.$("class name:android.widget.EditText");
    await passwordInput.waitForExist({ timeout: 5000 });
    if (await passwordInput.isExisting()) await passwordInput.setValue(passwordFB);
    await delay(2000);
    
    if (isNextBtnFound) await nextBtn.click();
    await delay(5000);

    //const saveDevices = await driver.$("-android uiautomator:new UiSelector().className(\"android.view.ViewGroup\").instance(8)");
    const saveDevices = await driver.$("-android uiautomator:new UiSelector().text(\"Lain Kali\")");
    await saveDevices.click();
    await delay(5000);

    const agreeBtn = await driver.$("-android uiautomator:new UiSelector().className(\"android.view.ViewGroup\").instance(14)");
    await agreeBtn.click();
    await delay(35000);

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
    } catch (__) {}
    await delay(5000);

    //cek nomer code via sms
    if (use5sim) {
      try {
        const sendCodeViaSMS = await driver.$("-android uiautomator:new UiSelector().text(\"Send code via SMS\")");
        if (await sendCodeViaSMS.isExisting()) {
          await sendCodeViaSMS.click();
          await delay(5000);
          const continueBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Continue\")");
          if (await continueBtn.isExisting()) {
            await continueBtn.click();
            await delay(5000);
          } else {
            console.log(`${udid}::❌ Continue button not found!`);
          }
        } else {
          console.log(`${udid}::❌ Send code via SMS button not found!`);
          const sendSMS = await driver.$("accessibility id:Send code via SMS");
          if (await sendSMS.isExisting()) {
            await sendSMS.click();
            await delay(5000);
          } else {
            console.log(`${udid}::❌ Send code via SMS accessibility not found!`);
          }
          const continueBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Continue\")");
          if (await continueBtn.isExisting()) {
            await continueBtn.click();
            await delay(5000);
          } else {
            console.log(`${udid}::❌ Continue button not found!`);
          }
        }
      } catch (_) {}
    }
    await delay(5000);

    // =========== Change Email =============== //
    if (changeEmail) {
      //resend and change!
      const resendAndChange = async (text) => {
        const IdidntGetCode = driver.$("-android uiautomator:new UiSelector().text(\"I didn’t get the code\")");
        if (await IdidntGetCode.isExisting()) await IdidntGetCode.click();
        await delay(7000);
        const ChangeEmailBtn = driver.$("-android uiautomator:new UiSelector().description(\""+text+"\")");
        if (await ChangeEmailBtn.isExisting()) await ChangeEmailBtn.click();
        await delay(5000);
      };
      if (changeEmailConfig==='0'){
        try {
          const sendCodeViaSMS = await driver.$("-android uiautomator:new UiSelector().text(\"Send code via SMS\")");
          if (await sendCodeViaSMS.isExisting()) {
            await sendCodeViaSMS.click();
            await delay(5000);
            const continueBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Continue\")");
            if (await continueBtn.isExisting()) {
              await continueBtn.click();
              await delay(5000);
            } else {
              console.log(`${udid}::❌ Continue button not found!`);
            }
          } else {
            console.log(`${udid}::❌ Send code via SMS button not found!`);
            const sendSMS = await driver.$("accessibility id:Send code via SMS");
            if (await sendSMS.isExisting()) {
              await sendSMS.click();
              await delay(5000);
            } else {
              console.log(`${udid}::❌ Send code via SMS accessibility not found!`);
            }
            const continueBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Continue\")");
            if (await continueBtn.isExisting()) {
              await continueBtn.click();
              await delay(5000);
            } else {
              console.log(`${udid}::❌ Continue button not found!`);
            }
          }
        } catch (_) {}
        await delay(5000);
      // =================== generate reg services =================== //
        if (use5sim) {
          await resendAndChange('Change mobile number');
          await delay(5000);
        }
        if (mailService === 'sohibmail') {
          await resendAndChange('Change email');
          email = `${whatIsMyNames[0].email}@${sohibMailDomain}`;
        } else if (mailService === 'hotmail') {
          await resendAndChange('Change email');
          //hotmail
          const getHotmailInfo = await createHotmail(parseInt(hotmailConfig), hotmailApiKey);
          email = getHotmailInfo.email;
          hotmail_token_refresh = getHotmailInfo.refresh_token;
          hotmail_client_id = getHotmailInfo.client_id;
          hotmail_full_info = getHotmailInfo.data;
          await emailInput.setValue(email);
        } else if (mailService === 'fexplus') {
          await resendAndChange('Change email');
          email = await createFexboxMail();
        } else if (mailService === 'tempmail') {
          await resendAndChange('Change email');
          email = await createTempMail();
        } else if (mailService === 'kukulu') {
          await resendAndChange('Change email');
          email = await createKukulu(whatIsMyNames[0].email, '@' + kukuluDomain);
        }

        await delay(5000);
        sendLog(udid, `Change: ${use5sim ? fivesim_number : email}`);
        await emailInput.clearValue();
        await emailInput.setValue(use5sim ? fivesim_number : email);
        await delay(5000);
        const next = driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
        if (next.isExisting())  await next.click();
        await delay(2000);
        const next2 = driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
        if (next2.isExisting())  await next2.click();
        await delay(5000);

      // =================== generate reg services =================== //
      } else if (changeEmailConfig==='1') {

        // =================== generate reg services =================== //
        if (use5sim) {
          await resendAndChange('Change mobile number');
          await delay(5000);
        }
        if (mailService === 'sohibmail') {
          await resendAndChange('Change email');
          email = `${whatIsMyNames[0].email}@${sohibMailDomain}`;
        } else if (mailService === 'hotmail') {
          await resendAndChange('Change email');
          //hotmail
          const getHotmailInfo = await createHotmail(parseInt(hotmailConfig), hotmailApiKey);
          email = getHotmailInfo.email;
          hotmail_token_refresh = getHotmailInfo.refresh_token;
          hotmail_client_id = getHotmailInfo.client_id;
          hotmail_full_info = getHotmailInfo.data;
          await emailInput.setValue(email);
        } else if (mailService === 'fexplus') {
          await resendAndChange('Change email');
          email = await createFexboxMail();
        } else if (mailService === 'tempmail') {
          await resendAndChange('Change email');
          email = await createTempMail();
        } else if (mailService === 'kukulu') {
          await resendAndChange('Change email');
          email = await createKukulu(whatIsMyNames[0].email, '@' + kukuluDomain);
        }

        await delay(5000);
        sendLog(udid, `Change: ${use5sim ? fivesim_number : email}`);
        await emailInput.clearValue();
        await emailInput.setValue(use5sim ? fivesim_number : email);
        await delay(5000);
        const next = driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
        if (next.isExisting())  await next.click();
        await delay(2000);
        const next2 = driver.$("-android uiautomator:new UiSelector().text(\"Berikutnya\")");
        if (next2.isExisting())  await next2.click();
        await delay(5000);
        
      }
    }

    //set proxy untuk konfirmasi akun
    if (proxy) {
      //await driver.terminateApp('net.typeblog.socks');
      closeApp(udid, 'net.typeblog.socks');
      await delay(7000);
      sendLog(udid, '📨 open proxy app...');
      //await driver.activateApp('net.typeblog.socks');
      openApp(udid, 'net.typeblog.socks');
      await delay(8000);
      sendLog(udid, '📨 waiting for proxy app to load...');
      //const proxyBtn = await driver.$("id:net.typeblog.socks:id/switch_action_button");
      //await proxyBtn.waitForExist({ timeout: 15000 });
      //await proxyBtn.click();
      clickDevice(udid, 619, 76); // Click on the proxy switch button
      await delay(15000);
      sendLog(udid, '📨 proxy app activated...');
    }

    // =========== VERIFY FB KATANA =============== //
    clearAppData(udid, appService);
    await delay(5000);
    await driver.activateApp(appService);
    await delay(15000);

    //relogfb
    closeApp(udid, appService);
    await delay(5000);
    await driver.activateApp(appService);
    await delay(15000);

    // =========== LOGIN FB KATANA =============== //
    const LanjutFBkatana = await driver.$("-android uiautomator:new UiSelector().text(\"Lanjut\")");
    if (await LanjutFBkatana.isExisting()) await LanjutFBkatana.click();
    await delay(5000);
    const inputPass = await driver.$("class name:android.widget.EditText");
    if (await inputPass.isExisting()) await inputPass.setValue(passwordFB);
    await delay(2000);
    const LoginFBkatana = await driver.$("-android uiautomator:new UiSelector().text(\"Login\")");
    if (await LoginFBkatana.isExisting()) await LoginFBkatana.click();
    await delay(15000);

    //relogfb 2
    closeApp(udid, appService);
    await delay(5000);
    await driver.activateApp(appService);
    await delay(15000);
    
    // clickDevice(udid, 360, 710); // Click Login
    // await delay(5000);
    // clickDevice(udid, 135, 587); // email
    // inputText(udid, use5sim ? fivesim_number : email);
    // await delay(2000);
    // clickDevice(udid, 130, 678); // email
    // inputText(udid, passwordFB);
    // await delay(2000);

    // //Login
    // clickDevice(udid, 355, 768); // Click Login
    // await delay(15000);
    

    // ================ Verify ================ //

      const verifAndDeleteSession = async (code) => {

        // =========== VERIFY FB LITE =============== //
        sendLog(udid, `📩 Verifying account...`);
        // const codeInput = driver.$("class name:android.widget.EditText");
          // if (await codeInput.isExisting()) await codeInput.setValue(code);
          // //Verify
          // const confirmBtn = driver.$("-android uiautomator:new UiSelector().className(\"android.view.ViewGroup\").instance(12)");
          // if (await confirmBtn.isExisting()) await confirmBtn.click();
          // await delay(15000);
        // =========== VERIFY FB KATANA =============== //
        //const codeInput = await driver.$("class name:android.widget.EditText");
        //if (await codeInput.isExisting()) await codeInput.addValue(code);
        clickDevice(udid, 360, 710); // input code
        inputText(udid, ' ');
        await delay(1000);
        inputText(udid, ' ');
        await delay(1000);
        clearText(udid);
        await delay(1000);
        inputText(udid, code);
        await delay(2000);
        clickDevice(udid, 352, 475); // Click Verify
        await delay(15000);
        // const next = await driver.$("-android uiautomator:new UiSelector().description(\"Berikutnya\")");
        // if (await next.isExisting()) await next.click();
        await delay(5000);

        //Save akun!
        await saveAccounts(udid, '', use5sim ? fivesim_number : email, 'katana');
        await delay(15000);
        await driver.removeApp(appService);
        await delay(5000);
        //end session!
        await driver.deleteSession();
        return;
      };

      const resendCode = async () => {
        const IdidntGetCode = driver.$("-android uiautomator:new UiSelector().text(\"I didn’t get the code\")");
        if (await IdidntGetCode.isExisting()) await IdidntGetCode.click();
        await delay(7000);
        const ResendCode = driver.$("-android uiautomator:new UiSelector().description(\"Resend confirmation code\")");
        if (await ResendCode.isExisting()) await ResendCode.click();
      };

      sendLog(udid, `⏳ Waiting code...`);
      await delay(waitCode * 1000);

      let code = null;
      let attempts = 0;
      const maxAttempts = 10; // Maximum attempts to get the code
      const getCode = setInterval(async () => {
        try {
          attempts++;
          if (attempts > maxAttempts) {
            clearInterval(getCode);
            sendLog(udid, `❌ Failed to get code after ${maxAttempts} attempts.`);
            await driver.deleteSession();
            return;
          }
            // =================== getcode 5sim/vaksms =================== //
            if (Services_Number === '0') {
              sendLog(udid, `📩 ${fivesim_number}`);
              code = await getCode5sim(fivesim_order_id, 'check');
              await delay(2000);
              if (code === null) {
                const code_failed = await getCode5sim(fivesim_order_id, 'cancel');
                sendLog(udid, `❌ ${JSON.stringify(code_failed)}`);
              } else {
                const code_success = await getCode5sim(fivesim_order_id, 'finish');
                sendLog(udid, `✅ Code received: ${JSON.stringify(code_success)}`);
                await delay(5000);
                await verifAndDeleteSession(code);
              }
            } else if (Services_Number === '1') {
              sendLog(udid, `📩 ${fivesim_number}`);
              code = await getCode_vaksms(fivesim_order_id);
              await delay(2000);
              if (code === null) {
                sendLog(udid, `❌ ${fivesim_number}`);
                await delay(2000);
                sendLog(udid, 'Mencoba mendapatkan kode lagi');
                await delay(7000);
                code = await getCode5sim(fivesim_order_id);
                sendLog(udid, `✅ Code received: ${code} !`);
                await delay(5000);
                await verifAndDeleteSession(code);
              } else {
                const code_success = await getCode5sim(fivesim_order_id, 'finish');
                sendLog(udid, `✅ Code received: ${JSON.stringify(code_success)}`);
                await delay(5000);
                await verifAndDeleteSession(code);
              }
            }
            // =================== getcode mail services =================== //
            if (mailService === 'gmailotp') {
              const c = await getCodeGmail(gmail_order_id, gmailotp_access_key);
              if (c === null) {
                sendLog(udid, `⏳ ${email}`);
              } else {
                clearInterval(getCode);
                sendLog(udid, `✅ Code received: ${c}`);
                await delay(5000);
                await verifAndDeleteSession(c);
              }
            } else if (mailService === 'hotmail') {
              code = await getCodeHotmail(email, hotmail_token_refresh, hotmail_client_id);
              sendLog(udid, `✅ Code received: ${code}`);
              await delay(5000);
              await verifAndDeleteSession(code);
            } else if (mailService === 'kukulu') {
              code = await getCodeKukulu(email);
              sendLog(udid, `✅ Code received: ${code}`);
              await delay(5000);
              await verifAndDeleteSession(code);
            } else if (mailService === 'tempmail') {
              code = await getCodeTempMail(email);
              sendLog(udid, `✅ Code received: ${code}`);
              await delay(5000);
              await verifAndDeleteSession(code);
            } else if (mailService === 'fexplus') {
              await getCodeFexboxMail(email).then(async (c) => {
                if (c === null) {
                  sendLog(udid, `❌ ${email}`);
                  await delay(5000);
                  await driver.deleteSession();
                } else {
                  sendLog(udid, `✅ Code received: ${c}`);
                  await delay(2000);
                  await verifAndDeleteSession(c);
                }
              });
            } else if (mailService === 'sohibmail') {
              emaildewe(email, driver, async (c) => {
                if (c && c.code) {
                  sendLog(udid, `✅ Code received: ${JSON.stringify(c.code)}`);
                  await verifAndDeleteSession(c.code);
                }
              });
            }
        } catch (err) {
          console.error(`[ERROR] getCode interval failed:`, err);
        }
      }, 25000); // Check every 15 seconds

      if (noverify_code) {
        sendLog(udid, '📩 Create fb noverify code...');
        await delay(2000);
      }

      if (confirm_api) {
          const data = await getCokisFBLite(udid);
          console.log(data.c_user);
          if (data.c_user) {
            try {
              const result = await LoginFacebook(data.c_user, FB_PASSWORD);
              if (result.success) {
                VerifyFacebook(result.cookies, data.c_user, email, code).then(async d=>{

                  if (d) {
                    console.log(d);
                    console.log("Akun COOKIE:", result.cookies);
                    //const cookieStr = `${code ? code + '|' : ''}${result.c_user}|${FB_PASSWORD}| ;${result.cookies};`;
                    const cookieStr = `${result.c_user}|${FB_PASSWORD}| ;${result.cookies}; |${email}`;
                    const savecokis = await axios.post(COOKIE_UPLOAD_URL, { cokis: cookieStr, userId: 'AKU' });
                    if (savecokis.status === 200) {
                      console.log('Account saved:', result.c_user);
                      sendLog(udid, `✅ Akun berhasil disimpan: ${result.c_user}`);
                    }
                  }

                });
                
              } else {
                console.log(result);
                console.error("Gagal login:", result.error || "akun mungkin checkpoint.");
              }
            } catch (error) {
              console.log(error);
            }
          
        }
      }

    //khusus FB gede
    // const skipBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Skip\")");
    // await skipBtn.waitForExist({ timeout: 10000 });
    // await skipBtn.click();
    // await delay(15000);
    //return 'Akun berhasil dibuat: ' + (use5sim ? fivesim_number : email);

  } catch (err) {
    console.error('❌ Error:', err.message);
    //await driver.saveScreenshot(`./error/error-${Date.now()}.png`);
    await driver.deleteSession();
    return 'Terjadi kesalahan: ' + err.message;
  }
}

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