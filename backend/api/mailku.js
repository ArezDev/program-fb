const Imap = require('imap');

const emaildewe = (email, data) => {

    const imap = new Imap({
        user: 'catchall@arezdev.eu.org',
        password: 'SiwalanMail@',
        host: 'server.arezdev.eu.org',
        port: 993,
        tls: true
    });

    const filteredMails = [];

    imap.once('ready', function () {
        imap.openBox('INBOX', true, function (err, box) {
            if (err) return data(err);
            imap.search(['ALL'], function (err, results) {
                if (err) return data(err);
                if (!results || results.length === 0) {
                    imap.end();
                    return data(null, []);
                }
                //const fetch = imap.fetch(results, { bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)', struct: true });
                // // Ambil maksimal 50 email terakhir
                const uids = results.slice(-50);
                const fetch = imap.fetch(uids, {
                    bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                    struct: true
                });
                fetch.on('message', function (msg, seqno) {
                    msg.on('body', function (stream, info) {
                        let buffer = '';
                        stream.on('data', function (chunk) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.on('end', function () {
                            const headers = Imap.parseHeader(buffer);
                            if (
                                headers.to &&
                                headers.to[0] &&
                                headers.to[0].toLowerCase().includes(email.toLowerCase())
                            ) {
                                filteredMails.push({
                                    seqno,
                                    from: headers.from ? headers.from[0] : null,
                                    to: headers.to ? headers.to[0] : null,
                                    subject: headers.subject ? headers.subject[0] : null,
                                    date: headers.date ? headers.date[0] : null
                                });
                            }
                            //data(filteredMails);
                        });
                    });
                });
                // get exactly one email
                fetch.once('end', async function () {
                    imap.end();
                    if (filteredMails?.[0] && filteredMails?.[0]?.to && filteredMails?.[0]?.subject?.match(/(\d{5})/)[1]) {
                        data({user: filteredMails[0].to, code: filteredMails[0].subject.match(/(\d{5})/)[1]});
                    } else {
                        data({user: null, code: null});
                    }
                    
                });
            });
        });
    });

    imap.once('error', function (err) {
        data(err);
    });

    imap.connect();
}

// emaildewe('charlotte.harris.robinson99@sohibmail.uk', (result) => {
//     console.log(result);
// });

module.exports = { emaildewe };