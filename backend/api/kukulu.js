const axios = require('axios');
const wrapper = require("axios-cookiejar-support").default;
const tough = require("tough-cookie");
const { SocksProxyAgent } = require('socks-proxy-agent');
// Atur socks ssh
//const proxy = 'socks5h://user-zdevnet-region-jp:mJ4r98VHY6FHgsC@as.lunaproxy.com:12233';
const proxy = 'socks5h://user-zdevnet-region-jp:mJ4r98VHY6FHgsC@as.lunaproxy.com:12233';
const agent = new SocksProxyAgent(proxy);

const tesProxy = async () => {
    const cookieJar = new tough.CookieJar();
    const client = wrapper(axios.create({
        jar: cookieJar,
        withCredentials: true
    }));
    try {
        // Test proxy by fetching IP from httpbin
        const res = await client.get('https://httpbin.org/ip', {
            httpAgent: agent,
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        return res.data;
    } catch (err) {
        console.error('Proxy test failed:', err);
        throw err;
    }

};

const createKukulu = async (user, domain) => {
    const cookieJar = new tough.CookieJar();
    const client = wrapper(axios.create({
        jar: cookieJar,
        withCredentials: true
    }));
    //const random = Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
    try {
        const response = await client.get('https://m.kuku.lu/id.php', {
            headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            }
        });
        // Ambil nilai csrf_token_check
        const tokenMatch = response.data.match(/csrf_token_check=([a-f0-9]+)/);
        const csrfToken = tokenMatch ? tokenMatch[1] : null;

        // Ambil nilai csrf_subtoken_check
        const subTokenMatch = response.data.match(/csrf_subtoken_check=([a-f0-9]+)/);
        const csrfSubToken = subTokenMatch ? subTokenMatch[1] : null;

        // Use axios to perform the same GET request as the fetch example
        const addMailUrl = `https://m.kuku.lu/index.php?action=addMailAddrByManual&nopost=1&by_system=1&t=${Date.now()}&csrf_token_check=${csrfToken}&newdomain=${domain}&newuser=${user}&recaptcha_token=&_=${Date.now()}`;
        const addMailResponse = await client.get(addMailUrl, {
            httpAgent: agent,
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            }
        });

        // You can return the response or any relevant data
        return {
            user: `${user}@${domain}`,
            csrfToken,
            csrfSubToken,
            addMailResponse: addMailResponse.data
        };
        
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getCodeKukulu = async (email) => {
    const cookieJar = new tough.CookieJar();
    const client = wrapper(axios.create({
        jar: cookieJar,
        withCredentials: true
    }));
    try {
        const getCSRFtoken = await client.get('https://m.kuku.lu/id.php', {
            headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            }
        });
        // Ambil nilai csrf_token_check
        const tokenMatch = getCSRFtoken.data.match(/csrf_token_check=([a-f0-9]+)/);
        const csrfToken = tokenMatch ? tokenMatch[1] : null;

        // Ambil nilai csrf_subtoken_check
        const subTokenMatch = getCSRFtoken.data.match(/csrf_subtoken_check=([a-f0-9]+)/);
        const csrfSubToken = subTokenMatch ? subTokenMatch[1] : null;

        if (!csrfToken || !csrfSubToken) {
            throw new Error('CSRF token or subtoken not found');
        }

        const getCodeAPI = `https://m.kuku.lu/recv._ajax.php?&page=0&q=${encodeURIComponent(email)}&nopost=1&csrf_token_check=${csrfToken}&csrf_subtoken_check=${csrfSubToken}&_=${Date.now()}`;
        const response = await client.get(getCodeAPI, {
            httpAgent: agent,
            httpsAgent: agent,
            headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,id;q=0.8",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            "Referer": "https://m.kuku.lu/"
            },
            responseType: 'text'
        });

        // response.data contains the HTML response as a string
        return response.data;

        // if (response.data?.count > 0) {
        //     const mail = response.data.mail_list[0];
        //     if (mail?.subject) {
        //         const codeMatch = mail.subject.match(/(\d{5})/);
        //         if (codeMatch) {
        //             return codeMatch[1]; // Return the first 5-digit code found
        //         } else {
        //             return  mail.subject; // Return the subject if no code found
        //         }
        //     }
        // }
    } catch (error) {
        console.error('Error fetching code:', error);
        throw error;
    }
}

const getCodeKukuluAuth = async (email, csrfToken, csrfSubToken) => {
    const cookieJar = new tough.CookieJar();
    const client = wrapper(axios.create({
        jar: cookieJar,
        withCredentials: true
    }));
    try {
        const getCodeAPI = `https://m.kuku.lu/recv._ajax.php?&page=0&q=${encodeURIComponent(email)}&nopost=1&csrf_token_check=${csrfToken}&csrf_subtoken_check=${csrfSubToken}&_=${Date.now()}`;
        const response = await axios.get(getCodeAPI, {
            httpAgent: agent,
            httpsAgent: agent,
            headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            },
            responseType: 'text'
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching code:', error);
        throw error;
    }
}

module.exports = { createKukulu, getCodeKukulu };