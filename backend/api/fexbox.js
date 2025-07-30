const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const proxy = 'socks5h://user-zdevnet:mJ4r98VHY6FHgsC@pr.lunaproxy.com:12233';
const agent = new SocksProxyAgent(proxy);

const createFexboxMail = async () => {
    let createMail = '';
    const domainSelector = ['fexbox.org'];
    const random = Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
    createMail = `${random}@${domainSelector[Math.floor(Math.random() * domainSelector.length)]}`;
    try {
        const response = await axios.post(
            'https://fex.plus/api/box',
            `email=${createMail}&ttl_minutes=60&pin=1111&epin=1111`,
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
                referrer: 'https://fex.plus/en/',
                referrerPolicy: 'strict-origin-when-cross-origin',
                withCredentials: true,
                httpsAgent: agent,
                httpAgent: agent
            }
        );
        if (response?.data && response?.data?.result === true) {
            return createMail;
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getCodeFexboxMail = async (email) => {
    try {
        const response = await axios.get(
            'https://fex.plus/api/mails',
            {
                params: {
                    email: email,
                    first_id: 0,
                    epin: 1111
                },
                referrer: 'https://fex.plus/en/',
                referrerPolicy: 'strict-origin-when-cross-origin',
                responseType: 'json',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest'
                },
                withCredentials: true
            }
        );
        
        if (response?.data && response?.data?.count > 0) {
            const mail = response.data.mail_list[0];
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
}

// getCodeFexboxMail('nvhqrd@fexbox.org').then((c)=>{
//     console.log(c)
// });

// createFexboxMail().then((c)=>{
//     console.log(c)
// });

module.exports = { createFexboxMail, getCodeFexboxMail };
