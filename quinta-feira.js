'use strict';

// see https://waguide.pedroslopez.me/ or https://pedroslopez.me/whatsapp-web.js/

const dotenvParseVariables = require('dotenv-parse-variables');
const env = dotenvParseVariables(require('dotenv').config().parsed);

const { program } = require('commander');
const { MessageMedia } = require('whatsapp-web.js');
const readKeywordFile = require('./src/readwords');
const Message = require('./src/message');

program.version('1.0.0');

program
    .command('bot')
    .description('Run bot')
    .action(() => {
        
        // keywords read from ./dict/
        const keywords = readKeywordFile(`./dict/${env.DICT}/keyword.txt`);
        const keywordsGroup = readKeywordFile(`./dict/${env.DICT}/keyword_group.txt`);
        const replyMessage = readKeywordFile(`./dict/${env.DICT}/reply_message.txt`);
        const client = require('./client')(env);

        client.on('ready', () => {
            console.log('bot ready');
        });

        // keep listening to group messages and private messages and do something :)
        client.on('message', async msg => {
            console.log('received message', {
                from: msg.from,
                body: msg.body,
                to: msg.to,
                type: msg.type
            });

            const message = new Message(msg, keywords, keywordsGroup);
    
            // media, stick or anything other than chat, ignore message
            if (!message.isChat) {
                return;
            }
    
            if (message.isGroupMessage) {
                if (!env.AUTO_REPLY_ENABLE_GROUP || !message.canReplyGroup) {
                    console.log('group message ignored');
                    return;
                }

                if (env.AUTO_REPLY_GROUPS.indexOf(msg.id._serialized) !== -1) {
                    console.log('group is not allow send message'); 
                    return;
                }
            }

            if (message.isDirectMessage) {
                if (!env.AUTO_REPLY_ENABLE_DIRECT || !message.canReplyDirect) {
                    console.log('direct message ignored');
                    return;
                }

                if (env.AUTO_REPLY_DIRECT.indexOf(msg.id._serialized) !== -1) {
                    console.log('contact is not allow send message'); 
                    return;
                }
            }
            
            if (msg.body.length < env.AUTO_REPLY_MESSAGE_SIZE) {
                console.log('message ignored by size');
                return;
            }

            const index = Math.floor(Math.random() * replyMessage.length);

            const reply = replyMessage[index];

            if (env.MODE === 'prod') {
                // wait to reply
                setTimeout(function() {
                    if (reply.startsWith('./assets')) {
                        msg.reply(MessageMedia.fromFilePath(reply));
                    } else {
                        msg.reply(reply);
                    }
                }, env.AUTO_REPLY_DELAY);
        
            } else {
                console.log(reply);
            }
        });
    });

program
    .command('env')
    .description('Show env values')
    .action(() => {
        console.log(env);
    });

program
    .command('list-chats')
    .description('Show your groups and contacts. This option helps you configure the env file, config AUTO_REPLY_GROUPS and AUTO_REPLY_DIRECT')
    .action(() => {
        const client = require('./client')(env);
        client.on('ready', () => {
            
            (async function() {
                const chats = await client.getContacts();
                
                const list = {};

                for(const i in chats) {
                    const chat = chats[i];

                    if (!chat.isMyContact && !chat.isGroup) {
                        continue;
                    }

                    const key = chat.isGroup ? 'group' : 'contact';
                    
                    list[key] = list[key] || [];
                    list[key].push({'id': chat.id._serialized, 'name': chat.name});
                }

                console.log(JSON.stringify(list, null, 4));
                console.log('Use id in env AUTO_REPLY_GROUPS or AUTO_REPLY_DIRECT');
                process.exit(0);
            })();

        });
    });

program.parse(process.argv);
