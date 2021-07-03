'use strict';

const fs = require('fs');

module.exports = function(filename) {
    if (!fs.existsSync(filename)) {
        throw 'keyword_group.txt not found';
    }
    
    const data = fs.readFileSync(filename, 'utf8');

    let keywords = data.split('\n')
        .map(x => x.replace('\r',''))
        .map(x => x.trim())
        .filter(x => !x.startsWith('#'))
        .filter(x => x.length > 0);

    return keywords;
};