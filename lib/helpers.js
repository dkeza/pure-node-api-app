var crypto = require('crypto');
var config = require('./config');
var helpers = {};

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

module.exports = helpers;