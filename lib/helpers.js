var crypto = require('crypto');
var config = require('./config');
var querystring = require('querystring');
var https = require('https');
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

helpers.sendTwilioSms = function (phone, msg, callBack) {
    var phone = typeof(phone) == 'string' && phone.trim().length > 0 ? phone.trim() : false;
    var msg = typeof(msg) == 'string' && msg.trim().length <= 1600 ? msg.trim() : false;
    if (phone && msg) {
        var payload = {
            'From' : config.twilio.fromPhone,
            'To' : phone,
            'Body' : msg
        };

        var stringPayload = querystring.stringify(payload);
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        var req = https.request(requestDetails, function (res) {
            var status = res.statusCode;
            if (status == 200 || status == 201) {
                callBack(false);
            } else {
                console.log(res);
                callBack('Status code returned ' + status);
            }
        });

        req.on('error', function (e) {
            console.log(e);
            callBack(e);
        })

        req.write(stringPayload);

        req.end();
    } else {
        callBack("Invalid parameters!");
    }
}

module.exports = helpers;