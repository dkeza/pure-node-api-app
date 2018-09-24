var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var lib = {};
lib.baseDir = path.join(__dirname, '/../data/');
lib.create = function(dir, file, data, callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);

            fs.writeFile(fileDescriptor, stringData, function (err) {
                if (!err) {
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback("Error closing new file");
                        }
                    })
                } else {
                    callback("Error writing to file");
                }
            });
        } else {
            callback('Could not create new file');
        }
    })

};

lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir+dir+"/"+file+'.json', 'utf8', function (err, data) {
        var parsedData = '';
        if (!err && data) {
            parsedData = helpers.parseJsonToObject(data);
            callback(err, parsedData);
            return;
        }

        callback(err, data);
    });
};

lib.update = function(dir, file, data, callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);

            fs.truncate(fileDescriptor, function (err) {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, function (err) {
                        if (!err) {
                            fs.close(fileDescriptor, function (err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback("Error closing new file");
                                }
                            })
                        } else {
                            callback("Error writing to file");
                        }
                    });
                } else {
                    callback('Error truncanting file');
                }
            })


        } else {
            callback('Could not open file');
        }
    });
};

lib.delete = function(dir, file, callback) {
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err, fileDescriptor) {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
};

module.exports = lib;