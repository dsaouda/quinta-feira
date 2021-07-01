const fs = require('fs');
const { Client, MessageMedia } = require('whatsapp-web.js');
require('dotenv').config();

const YOUR_PHONE_WHATSAPP_QUOTE = process.env.YOUR_PHONE_WHATSAPP_QUOTE;
const HEADLESS = false;
const BIN_CHROME = process.env.BIN_CHROME;
const SESSION_FILE_PATH = './session.json';

// mensagens enviadas automaticamente.
// varia de acordo com a quantidade de parabéns enviados no dia. hehe
const REPLY_MESSAGE = {
    '0': 'Muito Obrigado :)',
    '1': 'De novo? Que honra!!! Muito obrigado :)',
    '2': 'Mais 2 vezes te entrego um prêmio',
    '3': 'Tem certeza que deseja continuar?',
    '4': MessageMedia.fromFilePath('./assets/video1.mp4'),
    '5': 'Tá bom né? hehe',
    '6': 'Parabéns Você chegou até o final do quinta-feira bot, robô que responde mensagens de aniversário automaticamente'
};

// palavras que ativam o robo
const HAPPY_BIRTHDAY_WORDS = [
    'parabens', 
    'feliz aniversario', 
    'happy birthday'
];

// palavras usadas para filtrar mensagens de grupo depois que o robo foi ativado
const KEY_WORDS = [
    YOUR_PHONE_WHATSAPP_QUOTE, 
    'sucesso', 
    'feliz', 
    'aniversario', 
    'saude', 
    'abencoar', 
    'abencoe', 
    'anos', 
    'vida', 
    'diego', 
    'felicidade', 
    'felicidades', 
    'ano', 
    'filho'
];

class Message {
    
    constructor(msg) {
        this.msg = msg;
    }

    /**
     * verifica se a mensagem veio de um grupo
     * @returns bool
     */
    get isMessageFromGroup() {
        return this.msg.from.indexOf('@g.us') !== -1;
    }
    
    /**
     * verifica se a mensagem foi enviada diretamente
     * @returns bool
     */
    get isMessageFromDirect() {
        return this.msg.from.indexOf('@c.us') !== -1.;
    }
    
    /**
     * retornar o número do usuário que enviou a mensagem, seja em um grupo ou de forma direta
     * @returns string
     */
    get getFromId() {
        return this.isMessageFromGroup ? this.msg.author : this.msg.from;
    }
    
    /**
     * removendo acentos da palavra, removendo qualquer caracter que não seja a-z 0-9 espaço e @
     * depois jogo tudo em um array de palavras
     * @returns array
     */
    get getWordsFromMessageBody() {
        return this.msg.body.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s@]/g, '')
            .split(' ');
    }

    /**
     * Verifica se alguma key word foi ativada, com isso o robô passa a ficar esperto para interagir
     * @return bool
     */
    get isHappyBirthdayMessage() {
        const words = this.getWordsFromMessageBody;
        return words.filter(x => HAPPY_BIRTHDAY_WORDS.includes(x)).length > 0;
    }

    /**
     * Enviar mensagem em chat privado?
     * @returns bool
     */
    get hasSendDirectMessage() {
        return (
            this.isMessageFromDirect && 
            this.isHappyBirthdayMessage);
    }

    /**
     * Enviar mensagem em chat de grupo?
     * @returns bool
     */
    get hasSendGroupMessage() {
        const words = this.getWordsFromMessageBody;
        return (
            this.isMessageFromGroup && 
            this.isHappyBirthdayMessage && 
            words.filter(x => KEY_WORDS.includes(x)).length > 0);
    }

    /**
     * Robô pode enviar uma mensagem de resposta ao parabéns?
     * @returns bool
     */
    get hasSendMessage() {
        return this.hasSendDirectMessage || this.hasSendGroupMessage;
    }
}

// para não precisar ficar logando toda hora gravamos a sessão, 
// assim quando o robo parar e voltar ele já inicia logado
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

// conta os parabéns por pessoa, dependendo da quantidade o robo envia uma mensagem diferente
const countHappyBirthday = {};

const client = new Client({ 
    puppeteer: { 
        headless: HEADLESS,
        executablePath: BIN_CHROME,
    }, session: sessionCfg 
});

client.initialize();

// ler qr code
client.on('qr', (qr) => {
    console.log('qrcode recebido', qr);
});

// autenticou
client.on('authenticated', (session) => {
    console.log('autenticado', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

// falhou na autenticacao
client.on('auth_failure', msg => {
    console.error('autenticacao falhou', msg);
});

client.on('ready', () => {
    console.log('bot pronto');
});

// fica ouvindo as menagens de grupos e mensagens privadas e faz alguma coisa :)
client.on('message', async msg => {
    console.log('mensagem recebida', msg);

    const message = new Message(msg);
    
    // se for media, stick ou qualquer outra coisa diferente de chat ignora a mensagem
    if (msg.type !== 'chat') {
        return;
    }
    
    if (!message.hasSendMessage) {
        return;
    }

    // preparando um map in memory para contar os parabéns de uma pessoa
    const fromId = message.getFromId;
    countHappyBirthday[fromId] = countHappyBirthday[fromId] | 0;
    const currentValue = countHappyBirthday[fromId];
    const replyMessage = REPLY_MESSAGE[currentValue];
    
    if (replyMessage) {
        msg.reply(replyMessage);
    }

    countHappyBirthday[fromId]++;
});

client.on('change_state', state => {
    console.log('status atualizado', state );
});

client.on('disconnected', (reason) => {
    console.log('bot foi desconectado', reason);
});
