const axios = require('axios');
const { remote } = require('webdriverio');
const { execADB, swipeDevice, clearAppData } = require('../utils/adbHelpers');

// const FB_PASSWORD = process.env.FB_PASSWORD;
// const COOKIE_UPLOAD_URL = process.env.COOKIE_UPLOAD_URL;
const TOKEN_5SIM = process.env.TOKEN_5SIM;
const FB_PASSWORD = 'PAKARL3AD';
const COOKIE_UPLOAD_URL = 'https://fb.balanesohib.eu.org/api/user/upload_akun';

const names = ["Anna","Emma","Elizabeth","Minnie","Margaret","Ida","Alice","Bertha","Sarah","Annie","Clara","Ella","Florence","Cora","Martha","Laura","Nellie","Grace","Carrie","Maude","Mabel","Bessie","Jennie","Gertrude","Julia","Hattie","Edith","Mattie","Rose","Catherine","Lillian","Ada","Lillie","Helen","Jessie","Louise","Ethel","Lula","Myrtle","Eva","Frances","Lena","Lucy","Edna","Maggie","Pearl","Daisy","Fannie","Josephine","Dora","Rosa","Katherine","Agnes","Marie","Nora","May","Mamie","Blanche","Stella","Ellen","Nancy","Effie","Sallie","Nettie","Della","Lizzie","Flora","Susie","Maud","Mae","Etta","Harriet","Sadie","Caroline","Katie","Lydia","Elsie","Kate","Susan","Mollie","Alma","Addie","Georgia","Eliza","Lulu","Nannie","Lottie","Amanda","Belle","Charlotte","Rebecca","Ruth","Viola","Olive","Amelia","Hannah","Jane","Virginia","Emily","Matilda","Irene","Kathryn","Esther","Willie","Henrietta","Ollie","Amy","Rachel","Sara","Estella","Theresa","Augusta","Ora","Pauline","Josie","Lola","Sophia","Leona","Anne","Mildred","Ann","Beulah","Callie","Lou","Delia","Eleanor","Barbara","Iva","Louisa","Maria","Mayme","Evelyn","Estelle","Nina","Betty","Marion","Bettie","Dorothy","Luella","Inez","Lela","Rosie","Allie","Millie","Janie","Cornelia","Victoria","Ruby","Winifred","Alta","Celia","Christine","Beatrice","Birdie","Harriett","Mable","Myra","Sophie","Tillie","Isabel","Sylvia","Carolyn","Isabelle","Leila","Sally","Ina","Essie","Bertie","Nell","Alberta","Katharine","Lora","Rena","Mina","Rhoda","Mathilda","Abbie","Eula","Dollie","Hettie","Eunice","Fanny","Ola","Lenora","Adelaide","Christina","Lelia","Nelle","Sue","Johanna","Lilly","Lucinda","Minerva","Lettie","Roxie","Cynthia","Helena","Hilda","Hulda","Bernice","Genevieve","Jean","Cordelia","Marian","Francis","Jeanette","Adeline","Gussie","Leah","Lois","Lura","Mittie","Hallie","Isabella","Olga","Phoebe","Teresa","Hester","Lida","Lina","Winnie","Claudia","Marguerite","Vera","Cecelia","Bess","Emilie","John","Rosetta","Verna","Myrtie","Cecilia","Elva","Olivia","Ophelia","Georgie","Elnora","Violet","Adele","Lily","Linnie","Loretta","Madge","Polly","Virgie","Eugenia","Lucile","Lucille","Mabelle","Rosalie","Kittie","Meta","Angie","Dessie","Georgiana","Lila","Regina","Selma","Wilhelmina","Bridget","Lilla","Malinda","Vina","Freda","Gertie","Jeannette","Louella","Mandy","Roberta","Cassie","Corinne","Ivy","Melissa","Lyda","Naomi","Norma","Bell","Margie","Nona","Zella","Dovie","Elvira","Erma","Irma","Leota","William","Artie","Blanch","Charity","Lorena","Lucretia","Orpha","Alvina","Annette","Catharine","Elma","Geneva","Janet","Lee","Leora","Lona","Miriam","Zora","Linda","Octavia","Sudie","Zula","Adella","Alpha","Frieda","George","Joanna","Leonora","Priscilla","Tennie","Angeline","Docia","Ettie","Flossie","Hanna","Letha","Minta","Retta","Rosella","Adah","Berta","Elisabeth","Elise","Goldie","Leola","Margret","Adaline","Floy","Idella","Juanita","Lenna","Lucie","Missouri","Nola","Zoe","Eda","Isabell","James","Julie","Letitia","Madeline","Malissa","Mariah","Pattie","Vivian","Almeda","Aurelia","Claire","Dolly","Hazel","Jannie","Kathleen","Kathrine","Lavinia","Marietta","Melvina","Ona","Pinkie","Samantha","Susanna","Chloe","Donnie","Elsa","Gladys","Matie","Pearle","Vesta","Vinnie","Antoinette","Clementine","Edythe","Harriette","Libbie","Lilian","Lue","Lutie","Magdalena","Meda","Rita","Tena","Zelma","Adelia","Annetta","Antonia","Dona","Elizebeth","Georgianna","Gracie","Iona","Lessie","Leta","Liza","Mertie","Molly","Neva","Oma","Alida","Alva","Cecile","Cleo","Donna","Ellie","Ernestine","Evie","Frankie","Helene","Minna","Myrta","Prudence","Queen","Rilla","Savannah","Tessie","Tina","Agatha","America","Anita","Arminta","Dorothea","Ira","Luvenia","Marjorie","Maybelle","Mellie","Nan","Pearlie","Sidney","Velma","Clare","Constance","Dixie","Ila","Iola","Jimmie","Louvenia","Lucia","Ludie","Luna","Metta","Patsy","Phebe","Sophronia","Adda","Avis","Betsy","Bonnie","Cecil","Cordie","Emmaline","Ethelyn","Hortense","June","Louie","Lovie","Marcella","Melinda","Mona","Odessa","Veronica","Aimee","Annabel","Ava","Bella","Carolina","Cathrine","Christena","Clyde","Dena","Dolores","Eleanore","Elmira","Fay","Frank","Jenny","Kizzie","Lonnie","Loula","Magdalene","Mettie","Mintie","Peggy","Reba","Serena","Vida","Zada","Abigail","Celestine","Celina","Claudie","Clemmie","Connie","Daisie","Deborah","Dessa","Easter","Eddie","Emelia","Emmie","Imogene","India","Jeanne","Joan","Lenore","Liddie","Lotta","Mame","Nevada","Rachael","Robert","Sina","Willa","Aline","Beryl","Charles","Daisey","Dorcas","Edmonia","Effa","Eldora","Eloise","Emmer","Era","Gena","Henry","Iris","Izora","Lennie","Lissie","Mallie","Malvina","Mathilde","Mazie","Queenie","Rosina","Salome","Theodora","Therese","Vena","Wanda","Wilda","Altha","Anastasia","Besse","Bird","Birtie","Clarissa","Claude","Delilah","Diana","Emelie","Erna","Fern","Florida","Frona","Hilma","Joseph","Juliet","Leonie","Lugenia","Mammie","Manda","Manerva","Manie","Nella","Paulina","Philomena","Rae","Selina","Sena","Theodosia","Tommie","Una","Vernie","Adela","Althea","Amalia","Amber","Angelina","Annabelle","Anner","Arie","Clarice","Corda","Corrie","Dell","Dellar","Donie","Doris","Elda","Elinor","Emeline","Emilia","Esta","Estell","Etha","Fred","Hope","Indiana","Ione","Jettie","Johnnie","Josiephine","Kitty","Lavina","Leda","Letta","Mahala","Marcia","Margarette","Maudie","Maye","Norah","Oda","Patty","Paula","Permelia","Rosalia","Roxanna","Sula","Vada","Winnifred","Adline","Almira","Alvena","Arizona","Becky","Bennie","Bernadette","Camille","Cordia","Corine","Dicie","Dove","Drusilla","Elena","Elenora","Elmina","Ethyl","Evalyn","Evelina","Faye","Huldah","Idell","Inga","Irena","Jewell","Kattie","Lavenia","Leslie","Lovina","Lulie","Magnolia","Margeret","Margery","Media","Millicent","Nena","Ocie","Orilla","Osie","Pansy","Ray","Rosia","Rowena","Shirley","Tabitha","Thomas","Verdie","Walter","Zetta","Zoa","Zona","Albertina","Albina","Alyce","Amie","Angela","Annis","Carol","Carra","Clarence","Clarinda","Delphia","Dillie","Doshie","Drucilla","Etna","Eugenie","Eulalia","Eve","Felicia","Florance","Fronie","Geraldine","Gina","Glenna","Grayce","Hedwig","Jessica","Jossie","Katheryn","Katy","Lea","Leanna","Leitha","Leone","Lidie","Loma","Lular","Magdalen","Maymie","Minervia","Muriel","Neppie","Olie","Onie","Osa","Otelia","Paralee","Patience","Rella","Rillie","Rosanna","Theo","Tilda","Tishie","Tressa","Viva","Yetta","Zena","Zola","Abby","Aileen","Alba","Alda","Alla","Alverta","Ara","Ardelia","Ardella","Arrie","Arvilla","Augustine","Aurora","Bama","Bena","Byrd","Calla","Camilla","Carey","Carlotta","Celestia","Cherry","Cinda","Classie","Claudine","Clemie","Clifford","Clyda","Creola","Debbie","Dee","Dinah","Doshia","Ednah","Edyth","Eleanora","Electa","Eola","Erie","Eudora","Euphemia","Evalena","Evaline","Faith","Fidelia","Freddie","Golda","Harry","Helma","Hermine","Hessie","Ivah","Janette","Jennette","Joella","Kathryne","Lacy","Lanie","Lauretta","Leana","Leatha","Leo","Liller","Lillis","Louetta","Madie","Mai","Martina","Maryann","Melva","Mena","Mercedes","Merle","Mima","Minda","Monica","Nealie","Netta","Nolia","Nonie","Odelia","Ottilie","Phyllis","Robbie","Sabina","Sada","Sammie","Suzanne","Sybilla","Thea","Tressie","Vallie","Venie","Viney","Wilhelmine","Winona","Zelda","Zilpha","Adelle","Adina","Adrienne","Albertine","Alys","Ana","Araminta","Arthur","Birtha","Bulah","Caddie","Celie","Charlotta","Clair","Concepcion","Cordella","Corrine","Delila","Delphine","Dosha","Edgar","Elaine","Elisa","Ellar","Elmire","Elvina","Ena","Estie","Etter","Fronnie","Genie","Georgina","Glenn","Gracia","Guadalupe","Gwendolyn","Hassie","Honora","Icy","Isa","Isadora","Jesse","Jewel","Joe","Johannah","Juana","Judith","Judy","Junie","Lavonia","Lella","Lemma","Letty","Linna","Littie","Lollie","Lorene","Louis","Love","Lovisa","Lucina","Lynn","Madora","Mahalia","Manervia","Manuela","Margarett","Margaretta","Margarita","Marilla","Mignon","Mozella","Natalie","Nelia","Nolie","Omie","Opal","Ossie","Ottie","Ottilia","Parthenia","Penelope","Pinkey","Pollie","Rennie","Reta","Roena","Rosalee","Roseanna","Ruthie","Sabra","Sannie","Selena","Sibyl","Tella","Tempie","Tennessee","Teressa","Texas","Theda","Thelma","Thursa","Ula","Vannie","Verona","Vertie","Wilma"];
const delay = (ms) => new Promise(res => setTimeout(res, ms));

const getRandomName = () => names[Math.floor(Math.random() * names.length)];
const getRandomEmail = () => `${getRandomName()}${getRandomName()}${Math.floor(Math.random() * 9999)}@meadowbe.com`;

async function getCodeMail(mail) {
  try {
    const { data } = await axios.get(`https://balanesohib.email/api/messages/${mail}/zo3EgePhjbYnmSZdFkpa`);
    return data?.[0]?.subject?.split(' ')[0] || '';
  } catch (e) {
    console.error('❌ Error getting mail code:', e.message);
    return '';
  }
}

async function getNumber() {
  const { data } = await axios.get('https://5sim.net/v1/user/buy/activation/indonesia/virtual53/', {
    headers: {
      Authorization: `Bearer ${TOKEN_5SIM}`,
      Accept: 'application/json'
    }
  });
  return `${data?.phone}|${data?.id}`;
}

async function getCodeSMS(id) {
  const { data } = await axios.get(`https://5sim.net/v1/user/check/${id}`, {
    headers: {
      Authorization: `Bearer ${TOKEN_5SIM}`,
      Accept: 'application/json'
    }
  });
  return data?.sms?.[0]?.code;
}

function makeCookieString(result) {
  return ['c_user', 'xs', 'fr', 'datr']
    .filter(key => result[key])
    .map(key => `${key}=${result[key]}`)
    .join('; ');
}

async function withRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`⚠️ Gagal attempt ${i + 1}, retrying...`);
      await delay(2000);
    }
  }
}

async function saveAccounts(device, mail, pass) {
  const cookieStr = `${mail}|${pass}`;
  await axios.post(COOKIE_UPLOAD_URL, { cokis: cookieStr, userId: 'AKU' });
}

async function createThreads({ udid, appiumPort, systemPort }) {
  
  const caps = {
    platformName: "Android",
    "appium:udid": udid,
    "appium:automationName": "UiAutomator2",
    "appium:noReset": false,
    "appium:dontStopAppOnReset": true,
    "appium:systemPort": systemPort
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
    const firstName = getRandomName();
    const lastName = getRandomName();
    const email = getRandomEmail();
    await delay(5000);

    await driver.terminateApp('net.typeblog.socks');
    await delay(5000);
    clearAppData(udid, 'com.instagram.barcelona');
    await delay(5000);

    await driver.activateApp('net.typeblog.socks');
    await delay(15000);

    if (!driver.sessionId) {
        throw new Error("Session belum terbentuk. Mungkin Appium belum siap.");
    }

    const proxyBtn = await withRetry(() => driver.$('id:net.typeblog.socks:id/switch_action_button'));
    await proxyBtn.waitForExist({ timeout: 15000 });
    await proxyBtn.click();
    await delay(7000);

    await driver.activateApp('com.instagram.barcelona');
    await delay(25000);

    const createWithEmail = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.Button\").instance(1)");
    await createWithEmail.waitForExist({ timeout: 5000 });
    await createWithEmail.click();
    await delay(5000);

    const confirm = await driver.$("-android uiautomator:new UiSelector().text(\"Confirm\")");
    const isConfirm = await confirm.isExisting();
    if (isConfirm) await confirm.click();
    await delay(5000);

    const fullNameField = await driver.$("class name:android.widget.EditText");
    //await fullNameField.setValue(`${firstName} ${lastName}`);
    await fullNameField.setValue(firstName);

    const nextBtn = await driver.$("-android uiautomator:new UiSelector().text(\"Next\")");
    await nextBtn.click();
    await delay(5000);

    //next usernames!
    await nextBtn.click();
    await delay(5000);

    const passField = await driver.$("class name:android.widget.EditText");
    passField.setValue(FB_PASSWORD);
    await delay(5000);

    await nextBtn.click();
    await delay(5000);

    const notNow = await driver.$("-android uiautomator:new UiSelector().text(\"Not now\")");
    await notNow.click();
    await delay(5000);

    const signupWithEmail = await driver.$("-android uiautomator:new UiSelector().text(\"Sign up with email\")");
    await signupWithEmail.click();
    await delay(5000);

    const emailField = await driver.$("class name:android.widget.EditText");
    emailField.setValue(email);
    await delay(5000);

    await nextBtn.click();
    await delay(5000);

    console.log('wait code....');
    const codeToConfirm = await getCodeMail(email);
    await delay(10000);
    if (codeToConfirm.length > 0) {
      console.log('get code success!..', codeToConfirm);
    }

    const codeField = await driver.$("class name:android.widget.EditText");
    await codeField.waitForExist({ timeout: 15000 });
    codeField.setValue(codeToConfirm);
    await delay(5000);

    //next
    await nextBtn.click();
    await delay(5000);

    let randomYears = Math.floor(Math.random() * 7);
    for (let i = 0; i < randomYears; i++) {
      swipeDevice(udid, 514, 645, 512, 1098, 500);
      await delay(1000);
    }

    const confirmDateBtn = await driver.$("id:android:id/button1");
    await confirmDateBtn.click();
    await delay(5000);

    await nextBtn.waitForExist({ timeout: 10000 });
    await nextBtn.click();
    await delay(5000);

    const continueBtn = driver.$("-android uiautomator:new UiSelector().text(\"Continue\")");
    await continueBtn.click();
    await delay(5000);

    const joinThreadsBtn = driver.$("-android uiautomator:new UiSelector().text(\"Join Threads\")");
    await joinThreadsBtn.click();
    await driver.pause(35000);

    //await driver.deleteSession();
    await saveAccounts(udid, email, FB_PASSWORD);

    return '✅ Facebook account created!';
  } catch (err) {
    return 'Terjadi kesalahan: ' + err.message;
  }
}

module.exports = { createThreads };