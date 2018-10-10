var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all the handlers
var handlers = {};

// Sample handler
handlers.ping = function(data, callback){
    callback(200);
};

// Not found handler
handlers.notFound = function(data,callback){
    callback(404);
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
    var phone = '', token ='';
    if (typeof(data.queryStringObject.phone)=='string' && data.queryStringObject.phone.trim().length>1) {
        phone = data.queryStringObject.phone
    }
    if (phone.length <= 1) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    token = typeof(data.headers.token) === "string" ? data.headers.token : "";
    handlers._tokens.verifyToken(token, phone, function (isTokenValid) {
        if (isTokenValid) {
            _data.read("users", phone, function (err, resultData) {
                if (!err && resultData) {
                    delete resultData.hashedPassword;
                    callback(200, resultData);
                } else {
                    callback(404);
                }
            });
        } else {
            callback(403, {"error" : "Missing required token"});
        }
    })
};

handlers._users.put = function(data, callback) {
    var firstName = '', lastName = '', phone = '', password = '', token = '';
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
    
    token = typeof(data.headers.token) === "string" ? data.headers.token : "";
    handlers._tokens.verifyToken(token, phone, function (isTokenValid) {
        if (isTokenValid) {
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
        } else {
            callback(403, {"error" : "Missing required token"});
        }
    });
};

handlers._users.delete = function(data, callback) {
    var phone = '', token = '';
    if (typeof(data.queryStringObject.phone)=='string' && data.queryStringObject.phone.trim().length>1) {
        phone = data.queryStringObject.phone
    }
    if (phone.length <= 1) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    token = typeof(data.headers.token) === "string" ? data.headers.token : "";
    handlers._tokens.verifyToken(token, phone, function (isTokenValid) {
        if (isTokenValid) {
            _data.read("users", phone, function (err, userData) {
                if (!err && userData) {
                    _data.delete("users", phone, function (err) {
                        if (err) {
                            callback(500, {'error' : 'Could not delete user'});
                        } else {
                            var userChecks = [];
                            if (typeof(userData.checks) == 'object' && userData.checks instanceof Array) {
                                userChecks = userData.checks;
                            }
                            var checksToDelete = userChecks.length;
                            if (checksToDelete > 0) {
                                var checksDeleted = 0;
                                var deletionErrors = false;

                                userChecks.forEach(function(checkId){
                                    _data.delete('checks', checkId, function(err) {
                                        if (err) {
                                            deletionErrors = true;
                                        }
                                        checksDeleted++;
                                        if(checksDeleted == checksToDelete) {
                                            if (!deletionErrors) {
                                                callback(200);
                                            } else {
                                                callback(400,{"error":"Error when deleting checks"});
                                            }
                                        }
                                    })
                                });

                            } else {
                                callback(200);
                            }
                        }
                    });
                } else {
                    callback(400, {"error" : "Could not find user"});
                }
            });
        } else {
            callback(403, {"error" : "Missing required token"});
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
    var phone = "", password = "";
    if (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length>1) {
        phone = data.payload.phone.trim();
    }
    if (typeof(data.payload.password) == 'string' && data.payload.password.trim().length>0) {
        password = data.payload.password.trim();
    }
    if (!(phone && password)) {
        callback(400, {"error":"Missing required field(s)"});
        return;
    }
    _data.read("users", phone, function (err, resultData) {
        if (!err && resultData) {
            var hashedPassword = helpers.hash(password);
            if (hashedPassword === helpers.hash(resultData.password)) {
                var tokenId = helpers.createRandomString(20);
                var expires = Date.now() + 1000 * 60 * 60;
                var tokenObject = {
                    "phone" : phone,
                    "id" : tokenId,
                    "expires" : expires
                };
                _data.create("tokens", tokenId, tokenObject, function (err) {
                    if (!err) {
                        callback(200, tokenObject);
                    } else {
                        callback(500, {'error' : 'Could not create new token'});
                    }
                });
            } else {
                callback(500, {'error' : 'Wrong password'});
            }
        } else {
            callback(400, {"error" : "Could not find user"});
        }
    });
};

handlers._tokens.get = function(data, callback) {
    var id = '';
    if (typeof(data.queryStringObject.id)=='string' && data.queryStringObject.id.trim().length==20) {
        id = data.queryStringObject.id
    }
    if (id.length != 20) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    _data.read("tokens", id, function (err, resultData) {
        if (!err && resultData) {
            callback(200, resultData);
        } else {
            callback(404);
        }
    });
};

handlers._tokens.put = function(data, callback) {
    var id = "", extend = false;

    if (typeof(data.payload.id)=='string' && data.payload.id.trim().length===20) {
        id = data.payload.id
    }
    if (typeof(data.payload.extend)=='boolean' && data.payload.extend) {
        extend = true
    }
    if (!(id && extend)) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    _data.read('tokens', id, function (err, resultData) {
        if (!err && resultData) {
            if (resultData.expires > Date.now()) {
                resultData.expires = Date.now() + 1000 * 60 * 60;
                _data.update('tokens', id, resultData, function(err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'error' : 'Could not update'});
                    }
                });
            } else {
                callback(400, {'error' : 'Token is expired'});
            }
        } else {
            callback(400, {'error' : 'Could not read specified data'});
        }
    });
};

handlers._tokens.delete = function(data, callback) {
    var id = '';
    if (typeof(data.queryStringObject.id)=='string' && data.queryStringObject.id.trim().length===20) {
        id = data.queryStringObject.id
    }
    if (!id) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    _data.read("tokens", id, function (err, resultData) {
        if (!err && resultData) {
            _data.delete("tokens", id, function (err) {
                if (err) {
                    callback(500, {'error' : 'Could not delete data'});
                } else {
                    callback(200, resultData);
                }
            });
        } else {
            callback(400, {"error" : "Could not find data"});
        }
    });
};

handlers._tokens.verifyToken = function (id, phone, callback) {
    _data.read('tokens', id, function (err, resultData) {
        if (!err && resultData) {
            if (resultData.phone === phone && resultData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

handlers.checks = function(data, callback){
    var acceptableMethods = ['get','post','put','delete'];
    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

handlers._checks = {};

handlers._checks.post = function(data, callback) {
    var protocol = "", url = "", method = "", successCodes = "", timeoutSeconds = "", token = "";
    if (typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1) {
        protocol = data.payload.protocol;
    }
    if (typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 1) {
        url = data.payload.url.trim();
    }
    if (typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1) {
        method = data.payload.method;
    }
    if (typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0) {
        successCodes = data.payload.successCodes;
    }
    if (typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1  && data.payload.timeoutSeconds <= 5) {
        timeoutSeconds = data.payload.timeoutSeconds;
    }

    if (!(protocol && url && method && successCodes && timeoutSeconds)) {
        callback(400, {"error":"Missing required field(s)"});
        return;
    }
    token = typeof(data.headers.token) === "string" ? data.headers.token : "";
    _data.read("tokens", token, function (err, resultData) {
        if (!err && resultData) {
            var userPhone = resultData.phone;
            _data.read('users', userPhone, function(err, userData) {
                var userChecks = [];
                if (!err && userData) {
                    if (typeof(userData.checks) == 'object' && userData.checks instanceof Array) {
                        userChecks = userData.checks;
                    }
                    if (userChecks.length < config.maxChecks) {
                        var checkId = helpers.createRandomString(20);
                        var checkObject = {
                            "id" : checkId,
                            "userPhone" : userPhone,
                            "protocol" : protocol,
                            "url" : url,
                            "method" : method, 
                            "successCodes" : successCodes,
                            "timeoutSeconds" : timeoutSeconds
                        }
                        _data.create("checks", checkId, checkObject, function(err) {
                            if (!err) {
                                userData.checks = userChecks;
                                userData.checks.push(checkId);
                                _data.update('users', userPhone, userData, function(err) {
                                    if (!err) {
                                        callback(200, checkObject);
                                    } else {
                                        callback(500, {"error":"Colud not update the user with the new check"});        
                                    }
                                });
                            } else {
                                callback(500, {"error":"Colud not create new check"});        
                            }
                        })
                    } else {
                        callback(400, {"error":"User hat maximum number of checks - " + config.maxChecks});
                    }
                } else {
                    callback(403);
                }
            });
        } else {
            callback(400, {"error" : "Could not find user"});
        }
    });
};

handlers._checks.get = function(data, callback) {
    var id = '', token ='';
    if (typeof(data.queryStringObject.id)=='string' && data.queryStringObject.id.trim().length===20) {
        id = data.queryStringObject.id
    }
    if (id.length < 20) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    _data.read("checks", id, function (err, resultData) {
        if (!err && resultData) {
            var token = typeof(data.headers.token) === "string" ? data.headers.token : "";
            handlers._tokens.verifyToken(token, resultData.userPhone, function (isTokenValid) {
                if (isTokenValid) {
                    callback(200, resultData);
                } else {
                    callback(403);
                }
            })
        } else {
            callback(404);
        }
    });

};

handlers._checks.put = function(data, callback) {
    var id = '';
    if (typeof(data.payload.id)=='string' && data.payload.id.trim().length===20) {
        id = data.payload.id
    }
    if (id.length < 20) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    var protocol = "", url = "", method = "", successCodes = "", timeoutSeconds = "", token = "";
    if (typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1) {
        protocol = data.payload.protocol;
    }
    if (typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 1) {
        url = data.payload.url.trim();
    }
    if (typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1) {
        method = data.payload.method;
    }
    if (typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0) {
        successCodes = data.payload.successCodes;
    }
    if (typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1  && data.payload.timeoutSeconds <= 5) {
        timeoutSeconds = data.payload.timeoutSeconds;
    }

    if (!(protocol && url && method && successCodes && timeoutSeconds)) {
        callback(400, {"error":"Missing required field(s)"});
        return;
    }

    _data.read("checks", id, function(err, resultData) {
        if (!err && resultData) {
            var token = typeof(data.headers.token) === "string" ? data.headers.token : "";
            handlers._tokens.verifyToken(token, resultData.userPhone, function (isTokenValid) {
                if (isTokenValid) {
                    if (protocol) {
                        resultData.protocol = protocol;
                    }
                    if (url) {
                        resultData.url = url;
                    }
                    if (method) {
                        resultData.method = method;
                    }
                    if (successCodes) {
                        resultData.successCodes = successCodes;
                    }
                    if (timeoutSeconds) {
                        resultData.timeoutSeconds = timeoutSeconds;
                    }
                    _data.update('checks', id, resultData, function(err){
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {"error":"Could not update the check"});
                        }
                    });
                } else {
                    callback(403);
                }
            });
        } else {
            callback(400, {"error" : "Id is not valid"});
        }
    });
};

handlers._checks.delete = function(data, callback) {
    var id = '', token = '';
    if (typeof(data.queryStringObject.id)=='string' && data.queryStringObject.id.trim().length===20) {
        id = data.queryStringObject.id
    }
    if (id.length < 20) {
        callback(400, {"error" : "Missing required field"});
        return;
    }
    _data.read("checks", id, function(err, resultData) {
        if (!err && resultData) {
            token = typeof(data.headers.token) === "string" ? data.headers.token : "";
            handlers._tokens.verifyToken(token, resultData.userPhone, function (isTokenValid) {
                if (isTokenValid) {
                    _data.delete('checks', id, function(err) {
                        if (!err) {
                            _data.read("users", resultData.userPhone, function (err, userData) {
                                if (!err && userData) {
                                    var userChecks = [];
                                    if (typeof(userData.checks) == 'object' && userData.checks instanceof Array) {
                                        userChecks = userData.checks;
                                    }
                                    var checkPosition = userChecks.indexOf(id);
                                    if (checkPosition>-1) {
                                        userChecks.splice(checkPosition,1);
                                        _data.update("users", resultData.userPhone, userData, function (err) {
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(500, {'error' : 'Could not update user'});
                                            }
                                        });
                                    } else {
                                        callback(500, {'error' : 'Could not find check'});
                                    }


                                } else {
                                    callback(500, {"error" : "Could not find user"});
                                }
                            });
                        } else {
                            callback(500, {"error":"Could not delete the check data"});
                        }
                    })
                } else {
                    callback(403, {"error" : "Missing required token"});
                }
            });
        } else {
            callback(400,{"error":"Specified check id not exists"});
        }

    });
};

module.exports = handlers;