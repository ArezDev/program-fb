const axios = require('axios');

const createTempMail = async () => {
    const random = Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
    try {
        const response = await axios.post(
            'https://api.internal.temp-mail.io/api/v3/email/new',
            {
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'priority': 'u=1, i',
                    'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'x-requested-with': 'XMLHttpRequest'
                },
                data: {
                    min_name_length: 10,
                    max_name_length: 10
                }
            }
        );
        return response.data?.email || null;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getCodeTempMail = async (email) => {
    try {
        const response = await axios.get(
            `https://api.internal.temp-mail.io/api/v3/email/${email}/messages`,
            {
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'content-type': 'application/json; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest'
                },
            }
        );
        //return response.data;
        if (response.data?.length > 0) {
            const code = response.data[0].subject.match(/(\d{5})/);
            if (code) {
                //console.log('Verification code:', code[1]);
                return code[1];
            } else {
                return null;
            }
        }
    } catch (error) {
        console.error('Error fetching code:', error);
        throw error;
    }
}

module.exports = { createTempMail, getCodeTempMail };