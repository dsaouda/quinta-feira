const fs = require('fs');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

module.exports = function(env) {
    // file to keep session whatsapp
// warning: never share this file
    const SESSION_FILE_PATH = './session.json';

    // so you don't have to log in all the time, we recorded the session,
    // so when the robot stops and comes back it starts logged in
    let sessionCfg;
    if (fs.existsSync(SESSION_FILE_PATH)) {
        sessionCfg = require(SESSION_FILE_PATH);
    }

    const client = new Client({ 
        puppeteer: { 
            headless: env.HEADLESS,
            executablePath: env.BIN_CHROME,
        }, session: sessionCfg 
    });

    client.initialize();

    client.on('qr', (qr) => {
        qrcode.generate(qr, {small: true});
    });

    client.on('authenticated', (session) => {
        console.log('authenticated');
        sessionCfg=session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });

    client.on('auth_failure', msg => {
        console.error('auth_failure', msg);
    });

    client.on('change_state', state => {
        console.log('status atualizado', state );
    });

    client.on('disconnected', (reason) => {
        console.log('bot foi desconectado', reason);
    });

    return client;
};

