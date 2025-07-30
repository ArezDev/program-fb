const { default: axios } = require('axios');

const createGmail = async (apikey) => {
    try {
        const response = await axios.get(
            `http://gmail66.shop/api/v1/rent-mail?api_key=${apikey}&service=facebook`
        );
        //console.log(response.data);
        if (response?.data && response?.data?.success) {
            const email = response.data?.mail;
            const order_id = response.data?.order_id;
            return { email, order_id };
        } else {
            return null;
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        } else if (error.response && error.response.status === 400) {
            return null;
        }
        //console.error(error);
        //throw error;
    }
};

const getCodeGmail = async (order_id, apikey) => {
    try {
        const response = await axios.get(
            `http://gmail66.shop/api/v1/check-otp/${order_id}?api_key=${apikey}`
        );
        if (response?.data && response?.data?.success) {
            const code = response.data?.otp;
            if (code) {
                return code;
            } else {
                return null;
            }
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            return null;
        }
        //console.error('Error fetching code:', error);
        //throw error;
    }
}

module.exports = { createGmail, getCodeGmail };