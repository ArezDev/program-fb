const Imap = require('imap');

const imap = new Imap({
  user: 'catchall@arezdev.eu.org',
  password: 'SiwalanMail@',
  host: 'server.arezdev.eu.org',
  port: 993,
  tls: true
});

imap.once('ready', function () {
    imap.openBox('INBOX', true, function (err, box) {
        if (err) throw err;
        imap.search(['ALL'], function (err, results) {
            if (err) throw err;
            if (!results || results.length === 0) {
                console.log('No messages found.');
                imap.end();
                return;
            }
            const fetch = imap.fetch(results, { bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)', struct: true });
            fetch.on('message', function (msg, seqno) {
                msg.on('body', function (stream, info) {
                    let buffer = '';
                    stream.on('data', function (chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.on('end', function () {
                        // Parse headers to JSON
                        const headers = Imap.parseHeader(buffer);
                        // Hindari parsing dan filter di dalam event 'data' untuk setiap pesan
                        // Kumpulkan semua headers dulu, lalu filter setelah semua pesan diterima
                        if (!global.filteredMails) global.filteredMails = [];
                        if (headers.to && headers.to[0] && headers.to[0].includes('sohibmail.uk')) {
                            const mailData = {
                                seqno,
                                from: headers.from ? headers.from[0] : null,
                                to: headers.to ? headers.to[0] : null,
                                subject: headers.subject ? headers.subject[0] : null,
                                date: headers.date ? headers.date[0] : null
                            };
                            console.log(mailData);
                        }
                    });
                });
            });
            fetch.once('end', function () {
                imap.end();
            });
        });
    });
});

imap.once('error', function (err) {
  console.log(err);
});

imap.connect();