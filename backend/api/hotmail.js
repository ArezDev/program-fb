const axios = require('axios');

const createHotmail = async (type, apiKey) => {
    try {
        //const randomType = Math.random() < 0.5 ? 1 : 2;
        const response = await axios.get(
            `https://api.dongvanfb.net/user/buy?apikey=${apiKey}&account_type=${type}&quality=1&type=full`
        );
        //console.log(response.data);
        if (response?.data && response?.data?.message === 'Buy Success!') {
            const data = response.data?.data?.list_data[0];
            const email = response.data?.data?.list_data[0].split('|')[0];
            const refresh_token = response.data?.data?.list_data[0].split('|')[2];
            const client_id = response.data?.data?.list_data[0].split('|')[3];
            return { email, refresh_token, client_id, data };
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getCodeHotmail = async (email, refresh_token, client_id) => {
    try {
        const response = await axios.post(
            'https://tools.dongvanfb.net/api/get_messages_oauth2',
            {
            email: email,
            refresh_token: refresh_token,
            client_id: client_id
            },
            {
            headers: {
                'Content-Type': 'application/json'
            }
            }
        );
        if (response?.data && response?.data?.code) {
            const code = response?.data?.code;
            console.log(`Code received: ${code}`);
            return code;
        } else {
            console.log('No code found in response:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching code:', error);
        throw error;
    }
}

module.exports = { createHotmail, getCodeHotmail };