'use strict';

class Message {
    
    constructor(msg, keywords, keywordsGroup) {
        /**
         * Message WhatsApp
         * @type {Message}
         */
        this.msg = msg;

        /**
         * keywords to active bot
         * @type {array}
         */
        this.keywords = keywords;

        /**
         * keywords to active bot in chat group
         * @type {array}
         */
        this.keywordsGroup = keywordsGroup;
    }

    get isChat() {
        return this.msg.type === 'chat';
    }

    /**
     * check if the message came from a group
     * @returns {bool}
     */
    get isGroupMessage() {
        return this.msg.from.indexOf('@g.us') !== -1;
    }
    
    /**
     * check if the message was sent directly
     * @returns {bool}
     */
    get isDirectMessage() {
        return this.msg.from.indexOf('@c.us') !== -1.;
    }
    
    /**
     * removing accents from the word, removing any characters other than a-z 0-9 space and @
     * then I put everything in an array of words
     * @returns {array}
     */
    get getWords() {
        const body = (this.msg.body || '').trim();

        return body.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s@]/g, ' ')
            .replace(/\s{2,}/, ' ')
            .split(' ')
            .map(x => x.trim())
            .filter(x => x.length > 0);
    }

    /**
     * Checks if any key word has been activated, with this the robot becomes smart to interact
     * @return {bool}
     */
    get isKeyWord() {
        const words = this.getWords;
        return words.filter(x => this.keywords.includes(x)).length > 0 ||
            this.keywords.includes(words.join(' '));
    }

    /**
     * Send message in private chat?
     * @returns {bool}
     */
    get canReplyDirect() {
        return (this.isKeyWord && this.isDirectMessage);
    }

    /**
     * Send message in group chat?
     * @returns {bool}
     */
    get canReplyGroup() {
        const words = this.getWords;
        return (this.isKeyWord &&
            this.isGroupMessage &&
            (words.filter(x => this.keywordsGroup.includes(x)).length > 0) ||
                this.keywordsGroup.includes(words.join(' ')));
    }
}

module.exports = Message;