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

helpers.createRandomString = function (strLength) {
    var result = "", possibleCharacters = "";
    strLength = typeof(strLength) == "number" && strLength > 0 ? strLength : 0;
    if (strLength === 0) {
        return result;
    }
    possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 1; i <= strLength; i++) {
        randStr = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        result = result + randStr;
    }
    return result;
};

module.exports = helpers;