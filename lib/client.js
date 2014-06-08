var Q = require('q')
    , request = require('request')
    , winston = require('winston')
    , extend = require('node.extend');

var Client = function () {

    this._boxClientPromise = null
};

Client.prototype.accountInfo = function (options) {
    var self = this;
    options = extend({includeSubscribed: true}, options || {});
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.get(
                {
                    url: 'https://api.box.com/2.0/users/me'
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                }
            );
            return deferred.promise;
        })
};

Client.prototype.checkQuota = function (options) {
    var self = this;
    //TODO
};

Client.prototype.createFile = function (fileName, parentIdentifier, content_buffer, options) {
    var self = this;
    parentIdentifier = parentIdentifier || '0';
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.post({
                    url: 'https://upload.box.com/api/2.0/files/content',
                    headers: {
                        'Authorization': 'Bearer ' + this.credentials.access_token,
                        'content-type': 'multipart/form-data'
                    },
                    multipart: [
                        {
                            'content-type': 'application/octet-stream',
                            'content-disposition': 'form-data; filename="' + fileName + '"; name="filename"',
                            body: content_buffer
                        },
                        {
                            'content-disposition': 'form-data; name="folder_id"',
                            body: parentIdentifier
                        }
                    ]
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                });

            return deferred.promise;
        })
};

Client.prototype.deleteFile = function (identifier) {
    var self = this;
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.del(
                {
                    url: 'https://api.box.com/2.0/files/' + identifier
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                }
            );
            return deferred.promise;
        })
};

Client.prototype.downloadFile = function (identifier) {
    var self = this;
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.get(
                {
                    url: 'https://api.box.com/2.0/files/' + identifier + '/content',
                    encoding: null /*forces the content to be sent back in binary form, body will always be a buffer.*/
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                }
            );
            return deferred.promise;
        })
};

Client.prototype.getFileInformation = function (identifier) {
    var self = this;
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.get(
                {
                    url: 'https://api.box.com/2.0/files/' + identifier
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                }
            );
            return deferred.promise;
        })
};

Client.prototype.createFolder = function (folderName, parentIdentifier, options) {
    var self = this;
    parentIdentifier = parentIdentifier || '0'
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.post(
                {
                    url: 'https://api.box.com/2.0/folders',
                    body: '{"name":"' + folderName + '", "parent": {"id": "' + parentIdentifier + '"}}'
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                }
            );
            return deferred.promise;
        })
};

Client.prototype.deleteFolder = function (identifier) {
    var self = this;
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.del(
                {
                    url: 'https://api.box.com/2.0/folders/' + identifier
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                }
            );
            return deferred.promise;
        })
};

Client.prototype.getFolderInformation = function (identifier) {
    var self = this;
    identifier = identifier || '0';
    return self._getClient()
        .then(function (client) {
            var deferred = Q.defer();
            client.get(
                {
                    url: 'https://api.box.com/2.0/folders/' + identifier
                },
                function (err, r, body) {
                    err = errorHandler(r, err);
                    if (err) return deferred.reject(err);
                    return deferred.resolve({ "response": r, "body": body});
                }
            );
            return deferred.promise;
        })
};

Client.prototype.retrieveFolderItems = function (identifier,options) {
    var self = this;
    options = extend({}, options || {});
    identifier = identifier || '0'
    return self._getClient().then(function (client) {
        var deferred = Q.defer();
        client.get(
            {
                url: 'https://api.box.com/2.0/folders/' + identifier + '/items'
            },
            function (err, r, body) {
                err = errorHandler(r, err);
                if (err) return deferred.reject(err);
                return deferred.resolve({ "response": r, "body": body});
            }
        );
        return deferred.promise;
    })
};

///////////////////////////////////////////////////////////////////////////////
// Private Methods
///////////////////////////////////////////////////////////////////////////////

Client.prototype._getClient = function () {
    if (this._boxClientPromise) return this._boxClientPromise;
    var options = {
        headers: {
            'Authorization': 'Bearer ' + this.credentials.access_token
        }
    };
    this._boxClientPromise = Q.when(request.defaults(options));
    return this._boxClientPromise;
}

function errorHandler(response, err) {
    if (err) return err;

    //error codes parsed from http://developers.box.com/oauth/
    var err_message = response.headers['www-authenticate'] || ''
    if (response.statusCode == 400) return new Error(err_message);
    if (response.statusCode == 401) return  new Error(err_message);
    if (response.statusCode == 403) return new Error(err_message);

    return false;
}

module.exports = Client;