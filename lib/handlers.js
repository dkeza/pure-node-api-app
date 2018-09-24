var _data = require('./data');
var helpers = require('./helpers');

// Define all the handlers
var handlers = {};

// Sample handler
handlers.ping = function(data, callback){
    callback(200);
};

handlers.users = function(data, callback){
    var acceptableMethods = ['get','post','put','delete'];
    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._users = {};

handlers._users.post = function(data, callback) {
    var firstName = '', lastName = '', phone = '', password = '', tosAgreement = false;
    if (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length>0) {
        firstName = data.payload.firstName.trim();
    }
    if (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length>0) {
        lastName = data.payload.lastName.trim();
    }
    if (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length>1) {
        phone = data.payload.phone.trim();
    }
    if (typeof(data.payload.password) == 'string' && data.payload.password.trim().length>0) {
        password = data.payload.password.trim();
    }
    if (typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement) {
        tosAgreement = true;
    }
    if (!(firstName && lastName && phone && password && tosAgreement)) {
        callback(400, {'error':'Missing required fields'})
        return;
    }
    _data.read('users', phone, function(err, data) {
        if (err) {
            var hashedPassword = helpers.hash(password);
            if (!hashedPassword) {
                callback(500, {'error' : 'Could not hash user\'s password'});
                return;
            }
            var userObject = {
                "firstName" : firstName,
                "lastName" : lastName,
                "phone" : phone,
                "password" : password,
                "tosAgreement" : true
            };
            _data.create('users', phone, userObject, function (err) {
                if (!err) {
                    callback(200);
                } else {
                    callback(500, {'error' : 'Could not create new user'});
                }
            });
        } else {
            callback(400,{'error':'User with same phone number already exists'})
        }
    });
};

handlers._users.get = function(data, callback) {
    var phone = '';
    if (typeof(data.queryStringObject.phone)=='string' && data.queryStringObject.phone.trim().length>1) {
        phone = data.queryStringObject.phone
    }
    if (phone.length <= 1) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    _data.read("users", phone, function (err, resultData) {
        if (!err && resultData) {
            delete resultData.hashedPassword;
            callback(200, resultData);
        } else {
            callback(404);
        }
    });
};

handlers._users.put = function(data, callback) {
    var firstName = '', lastName = '', phone = '', password = '';
    if (typeof(data.payload.phone)=='string' && data.payload.phone.trim().length>1) {
        phone = data.payload.phone
    }
    if (phone.length <= 1) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    if (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length>0) {
        firstName = data.payload.firstName.trim();
    }
    if (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length>0) {
        lastName = data.payload.lastName.trim();
    }
    if (typeof(data.payload.password) == 'string' && data.payload.password.trim().length>0) {
        password = data.payload.password.trim();
    }
    if (!(firstName || lastName || password)) {
        callback(400, {"error" : "Missing fields to update"});
        return;
    }
    _data.read('users', phone, function (err, userData) {
        if (!err && userData) {
            if (firstName) {
                userData.firstName = firstName;
            }
            if (lastName) {
                userData.lastName = lastName;
            }
            if (password) {
                var hashedPassword = helpers.hash(password);
                if (!hashedPassword) {
                    callback(500, {'error' : 'Could not hash user\'s password'});
                    return;
                }
                userData.password = hashedPassword;
            }
            _data.update('users', phone, userData, function(err) {
                if (!err) {
                    callback(200);
                } else {
                    callback(500, {'error' : 'Could not update the user'});
                }
            });
        } else {
            callback(400, {'error' : 'Could not read specified user'});
        }
    })
};

handlers._users.delete = function(data, callback) {
    var phone = '';
    if (typeof(data.queryStringObject.phone)=='string' && data.queryStringObject.phone.trim().length>1) {
        phone = data.queryStringObject.phone
    }
    if (phone.length <= 1) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    _data.read("users", phone, function (err, resultData) {
        if (!err && resultData) {
            _data.delete("users", phone, function (err) {
                if (err) {
                    callback(500, {'error' : 'Could not delete user'});
                } else {
                    callback(200, resultData);
                }
            });
        } else {
            callback(400, {"error" : "Could not find user"});
        }
    });
};

handlers.tokens = function(data, callback){
    var acceptableMethods = ['get','post','put','delete'];
    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._tokens = {};

handlers._tokens.post = function(data, callback) {

};

handlers._tokens.get = function(data, callback) {

};

handlers._tokens.put = function(data, callback) {

};

handlers._tokens.delete = function(data, callback) {

};

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};

module.exports = handlers;