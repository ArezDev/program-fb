const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const proxy = 'socks5h://user-zdevnet:mJ4r98VHY6FHgsC@pr.lunaproxy.com:12233';
const agent = new SocksProxyAgent(proxy);

const createFviaEmail = async (randomDomain = false, domains) => {
    let createMail = '';
    const random = Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
    createMail = `${random}@${domains || 'fviainboxes.com'}`;
    try {
        const response = await axios.get(
            "https://fviainboxes.com/domains",
            {
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,id;q=0.8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "Referer": "https://fviainboxes.com/"
            },
            }
        );
        if (response?.data && response?.data?.result) {
            if (randomDomain) {
                return `${random}@${response.data.result[Math.floor(Math.random() * response.data.result.length)]}`;
            } else {
                return createMail;
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getCodeFviaEmail = async (email) => {
    try {
        const response = await axios.get(
            "https://fviainboxes.com/messages",
            {
            params: {
                username: email.split('@')[0],
                domain: email.split('@')[1],
            },
            headers: {
                "authorization": `Bearer af2b556e5e719052ca9193bace296b4fe9015bdc6c2c6ec28447d57c56187941`,
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,id;q=0.8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "Referer": "https://fviainboxes.com/"
            },
            }
        );
        //return response?.data?.result || [];
        if (response?.data && response?.data?.result.length > 0) {
            const mail = response.data.result[0];
            if (mail?.subject) {
                const codeMatch = mail.subject.match(/(\d{5})/);
                if (codeMatch) {
                    return codeMatch[1];
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching code:', error);
        throw error;
    }
};

// createFviaEmail(true).then(email => {
//     console.log('Created email:', email);
// }).catch(error => {
//     console.error('Error creating email:', error);
// });

// getCodeFviaEmail('mrtor456n@fviainboxes.com').then(code => {
//     console.log('Code from email:', code);
// }).catch(error => {
//     console.error('Error fetching code:', error);
// });

module.exports = { createFviaEmail, getCodeFviaEmail };