const femaleFirstNames = [
  "Siti", "Dewi", "Rina", "Fitriani", "Ayu", "Nita", "Reni", "Laila", "Desi", "Vina",
  "Nur", "Tika", "Mega", "Yuni", "Dinda", "Dian", "Evi", "Eka", "Nia", "Sari",
  "Putri", "Melati", "Citra", "Indah", "Lestari", "Kartika", "Larissa", "Nabila", "Annisa", "Shinta",
  "Tiara", "Wulan", "Yeni", "Bella", "Rahma", "Azzahra", "Aulia", "Febri", "Yuliana", "Ayunda"
];

const lastNames = [
  "Ramadhani", "Wulandari", "Permatasari", "Anggraeni", "Maharani", "Oktaviani", "Rosalina",
  "Aulia", "Maulida", "Indriyani", "Safitri", "Puspitasari", "Kurniasih", "Sari", "Pratiwi",
  "Handayani", "Amelia", "Andini", "Anjani", "Oktavia", "Prameswari", "Kusuma",
  "Damayanti", "Putri", "Rahmawati", "Herlina", "Khairunnisa", "Wahyuni", "Desyana"
];

// const femaleFirstNames = [
//   "Emily", "Emma", "Olivia", "Sophia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper",
//   "Evelyn", "Abigail", "Ella", "Scarlett", "Grace", "Chloe", "Victoria", "Madison", "Lily", "Hannah",
//   "Addison", "Aubrey", "Natalie", "Sofia", "Brooklyn", "Zoey", "Penelope", "Layla", "Riley", "Aria",
//   "Hailey", "Nora", "Leah", "Savannah", "Audrey", "Claire", "Skylar", "Camila", "Genesis", "Paisley"
// ];

// const lastNames = [
//   "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
//   "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
//   "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
// ];

const emailDomains = [
  "sohibmail.uk"
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sanitize(str) {
  return str.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");
}

function generateFemaleNames(count) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const first = getRandom(femaleFirstNames);
    const last = getRandom(lastNames);
    const third = getRandom(lastNames);
    const fullName = `${first} ${last}`;

    //const emailUser = `${sanitize(first)}.${sanitize(last)}${Math.floor(Math.random() * 100)}`;
    const emailUser = `${sanitize(first)}.${sanitize(last)}.${sanitize(third)}${Math.floor(Math.random() * 100)}`;
    const domain = getRandom(emailDomains);
    //const email = `${emailUser}@${domain}`;
    const email = emailUser;

    results.push({ name: fullName, email });
  }

  return results;
}

module.exports = {
  generateFemaleNames
};