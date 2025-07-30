const axios = require("axios");
const wrapper = require("axios-cookiejar-support").default;
const tough = require("tough-cookie");
const { getUserAgent } = require("./ua/useragent");

const LoginFacebook = async (uid, pass) => {
  // const wrapperModule = require("axios-cookiejar-support");
  // console.log("axios-cookiejar-support export:", wrapperModule);
  // console.log("typeof wrapper:", typeof wrapperModule.wrapper);

  const cookieJar = new tough.CookieJar();
  //const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));
  const client = wrapper(axios.create({
    jar: cookieJar,
    withCredentials: true
  }));

  try {
    // Step 1: Ambil halaman login
    const loginPage = await client.get(`https://m.facebook.com/login/device-based/password/?uid=${uid}&flow=login_no_pin&skip_api_login=1&_rdr`);

    const html = loginPage.data;

    const jazoest = html.match(/name="jazoest" value="(\d+)"/)?.[1];
    const lsd = html.match(/name="lsd" value="([^"]+)"/)?.[1];

    if (!jazoest || !lsd) {
      throw new Error("❌ Tidak dapat menemukan jazoest atau lsd.");
    }

    // Step 2: Kirim POST login
    const data = new URLSearchParams({
        jazoest: jazoest,
        lsd: lsd,
        email: uid,
        pass: pass,
        timezone: '-420',
        lgndim: 'eyJ3IjoxOTIwLCJoIjoxMDgwLCJhdyI6MTkyMCwiYWgiOjEwNDAsImMiOjI0fQ==',
        lgnrnd: '085415_9AKj',
        lgnjs: Math.floor(Date.now() / 1000).toString(),
        locale: 'id_ID',
        login_source: 'login_bluebar',
        prefill_contact_point: uid,
        prefill_source: 'browser_dropdown',
        prefill_type: 'contact_point'
    });

    const loginRes = await client.post(
      "https://web.facebook.com/login/device-based/regular/login/",
      data.toString(),
      {
        headers: {
            'Host': 'web.facebook.com',
            'cache-control': 'max-age=0',
            'sec-ch-ua': '"Android WebView";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'origin': 'https://web.facebook.com',
            'content-type': 'application/x-www-form-urlencoded',
            'upgrade-insecure-requests': '1',
            'User-Agent': getUserAgent(),
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'x-requested-with': 'mark.via.gp',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            'referer': `https://m.facebook.com/login/device-based/password/?uid=${uid}&flow=login_no_pin&skip_api_login=1`,
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'cookie': cookieJar.getCookieStringSync("https://web.facebook.com"),
        },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400, // biar redirect (302) tidak dianggap error
      }
    );

    // return {
    //   success: true,
    //   cookies: cookieJar.getCookieStringSync("https://web.facebook.com"),
    //   data: loginRes.data,
    // };

    // Ambil cookies dari cookieJar
    const cookies = await cookieJar.getCookies("https://web.facebook.com");
    const cookieString = cookies.map(c => `${c.key}=${c.value}`).join("; ");
    console.log(cookies);

    // Cek apakah login berhasil
    const c_user = cookies.find(c => c.key === "c_user");
    const xs = cookies.find(c => c.key === "xs");

    if (c_user && xs) {
      console.log("✅ Login berhasil.");
      return {
        success: true,
        cookies: cookieString,
        c_user: c_user.value,
        xs: xs.value,
      };
    } else {
      console.warn("⚠️ Login gagal: tidak ditemukan c_user/xs. Mungkin kena checkpoint atau salah password.");
      return {
        success: false,
        cookies: cookieString,
        data: loginRes.data,
      };
    }
  } catch (err) {
    console.error("❌ Error saat login:", err.message || err);
    return { success: false, error: err };
  }
};

const VerifyFacebook = async (kuki, uid, email, code) => {

  // Use axios-cookiejar-support client
  const cookieJar = new tough.CookieJar();
  const client = wrapper(axios.create({
    jar: cookieJar,
    withCredentials: true
  }));

  //get LSD fb_dtsg
  const loginPage = await client.get(`https://m.facebook.com/login/device-based/password/?uid=${uid}&flow=login_no_pin&skip_api_login=1&_rdr`);

    const html = loginPage.data;

    //return html;

    const jazoest = html.match(/name="jazoest" value="(\d+)"/)?.[1];
    const lsd = html.match(/name="lsd" value="([^"]+)"/)?.[1];

    if (!jazoest || !lsd) {
      throw new Error("❌ Tidak dapat menemukan jazoest atau lsd.");
    }

  // Set cookies from input
  if (kuki) {
    const cookiesArr = kuki.split(";").map(c => c.trim());
    // cookiesArr.forEach(cookieStr => {
    //   cookieJar.setCookieSync(cookieStr, "https://www.facebook.com");
    // });
    cookiesArr.forEach(cookieStr => {
      try {
        cookieJar.setCookieSync(`${cookieStr}; Domain=facebook.com; Path=/`, "https://www.facebook.com");
      } catch (e) {
        console.warn("❌ Gagal parsing cookie:", cookieStr);
      }
    });
  }

  //get DTSG Value
  const getDTSG = await client.get('https://www.facebook.com/profile.php');

  const dtsgku = getDTSG.data?.match(/name="fb_dtsg" value="([^"]+)"/)?.[1];
  if (!dtsgku) {
    throw new Error("❌ Tidak dapat menemukan fb_dtsg!");
  }

  //return {dtsg: getDTSG.data?.match(/name="fb_dtsg" value="([^"]+)"/)?.[1]}

  try {
    const res = await client.post(
      `https://www.facebook.com/confirm_code/dialog/submit/?next=https%3A%2F%2Fwww.facebook.com%2Fprofile.php&cp=${email}&from_cliff=1&conf_surface=hard_cliff&event_location=cliff`,
      `jazoest=${jazoest}&fb_dtsg=${dtsgku}&code=${code}&source_verified=www_reg&confirm=1&__user=${uid}&__a=1&__req=4&__hs=20266.BP%3ADEFAULT.2.0...0&dpr=1&__ccg=EXCELLENT&__rev=1024258380&__s=keka9b%3A2vsv96%3Ah8bq42&__hsi=7520662987384153393&__dyn=7xeUmBwjbg7ebwKBAg5S3G2O5U4e1Fx-ewSwMxW0DUS2S0im4E9ohwem0nCq1ew8y11wdu0FE5-2G1Qw5Mx61vwnE2PwBgao6C0lW0H83bwdq1iwmE2ewnE2Lw6OyES0gq0Lo6-1Fw63w7zwtU5K0UE&__hsdp=gT78l6Eh28MkoIoyoCz1y9BKl4zawlODwKUiy99oW1i5wlEcEhwIU1cU14k0j7wrEd81787eU-2a4tw&__hblp=0Vw9u2u1rx20nu225o37w2wqwoo0mww6CwNwHw1Ei08aw0h-o9U4a0cpwNwp86e06n9GwgU3uwoEyEozod81mobVWyFo&lsd=CIu5SQ3mexQQz9ofApX0Cj&__spin_r=1024258380&__spin_b=trunk&__spin_t=1751040804`,
      {
        headers: {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded",
          "priority": "u=1, i",
          "sec-ch-prefers-color-scheme": "dark",
          "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
          "sec-ch-ua-full-version-list": "\"Not)A;Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"138.0.7204.49\", \"Google Chrome\";v=\"138.0.7204.49\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-model": "\"\"",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-ch-ua-platform-version": "\"10.0.0\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-asbd-id": "359341",
          "x-fb-lsd": lsd,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.84 Safari/537.36",
          "Referer": "https://www.facebook.com/confirmemail.php?next=https%3A%2F%2Fwww.facebook.com%2Fprofile.php"
        }
      }
    );
    return res.data;
  } catch (err) {
    return { success: false, error: err.message || err };
  }

};

// VerifyFacebook('datr=k8ZeaLSveOJlttOoI1y35oZ1; c_user=61578033711497; fr=09zbWBOy05Lohe9Ht.AWdl_yFQdhkaLMT0s8_dFuzRTZAPwbi3sT-VOD0eqRuoyj9J3gE.BoXsaT..AAA.0.0.BoXsaT.AWdoutYrT6lbSapDCrJxa6Md5bs; sb=k8ZeaD8wW4pYvnA9V-H2uHFr; xs=43%3Aiv1rF3RAlx0pUQ%3A2%3A1751041684%3A-1%3A-1;',
//   '61578033711497', 'nvcs5hkdzpgv0ti@mrotzis.com', '49017'
// ).then(d=>{
//   console.log(d)
// });

module.exports = {
  LoginFacebook,
  VerifyFacebook
};