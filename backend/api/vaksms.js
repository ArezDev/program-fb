const { default: axios } = require("axios");

const API_KEY = '5cf1603f1abd4204a243cfa1e5a2c51b';

const getNumber_vaksms = async (country, operator) => {

    const operator_id = [
        'axis',
        'indosat',
        'smartfren',
        'telkomsel',
        'three'
    ];

    const operator_ru = [
        'beeline',
        'lycamobile',
        'megafon',
        'mts',
        'mtt',
        'patriot',
        'rostelecom',
        'sbermobile',
        'tele2',
        'tinkoff',
        'vector',
        'vtbmobile',
        'win mobile',
        'yota'
    ];

    const operator_uk = [
        'ee',
        'giffgaff',
        'lycamobile',
        'o2',
        'orange',
        'three',
        'tmobile',
        'vodafone'
    ];

    const operator_kenya = [
        'airtel',
        'econet',
        'orange',
        'safaricom',
        'telkom'
    ];

    const ro = Math.floor(Math.random() * operator_id.length);

    const url = `https://vak-sms.com/api/getNumber/?apiKey=${API_KEY}&service=fb&country=${country}&operator=${operator}&softId=fb`;
    const response = await axios.get(url);
    if ( response.data && response.data?.tel ) {
        const tel = '+' + response.data.tel;
        const idNum = response.data.idNum;
        return { tel, idNum };
    } else {
        return null;
    }
};

const getCode_vaksms = async (idNum) => {
    const url = `https://vak-sms.com/api/getSmsCode/?apiKey=${API_KEY}&idNum=${idNum}&all`;
    const response = await axios.get(url);
    if (response?.data && response?.data?.smsCode) {
        return response?.data?.smsCode;
    } else {
        return null;
    }
};

module.exports = {
    getNumber_vaksms,
    getCode_vaksms
};