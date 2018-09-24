var crypto = require('crypto');
var config = require('./config');
var helpers = {};
var fs = require('fs');

helpers.hash = function(str) {
    var hash = '';
    
    if (!(typeof(str)=='string' && str.length > 0)) {
        return false;
    }

    hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
};

helpers.parseJsonToObject = function (str) {
    var obj = null;
    try {
        obj = JSON.parse(str);
    } catch (e) {
        obj = {}
    }
    return obj;
};

helpers.checkDir = function (str) {
    if (!fs.existsSync(str)){
        fs.mkdirSync(str);
    }
};

module.exports = helpers;