var Q = require('q')
    , request = require('request')
    , winston = require('winston')
    , extend = require('node.extend')
    , url =require('url')

var Client = function () {

    this._boxClientPromise = null
};

Client.prototype.accountInfo = function (options) {
    var self = this;
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
                    return deferred.resolve(JSON.parse(body));
                }
            );
            return deferred.promise;
        })
};

Client.prototype.checkQuota = function (options) {
    var self = this;
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
                    return deferred.resolve(JSON.parse(body));
                }
            );
            return deferred.promise;
        })
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
                        'Authorization': 'Bearer ' + self.credentials.access_token,
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
                    return deferred.resolve(JSON.parse(body));
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
                    return deferred.resolve(body);
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
                    return deferred.resolve({ data: body, headers: r.headers});
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
                    return deferred.resolve(JSON.parse(body));
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
                    return deferred.resolve(JSON.parse(body));
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
                    return deferred.resolve(body);
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
                    return deferred.resolve(JSON.parse(body));
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
                return deferred.resolve(JSON.parse(body));
            }
        );
        return deferred.promise;
    })
};


///////////////////////////////////////////////////////////////////////////////
// Event Methods
///////////////////////////////////////////////////////////////////////////////

//TODO: the options should support path_prefix when https://github.com/dropbox/dropbox-js/issues/164
Client.prototype.events = function (cursor,options) {
    var self = this;
    var url_opts = url.parse('https://api.box.com/2.0/events');
    url_opts.query={
        limit:800
    };
    if(cursor){
        url_opts.query.stream_position = cursor
    }


    return self._getClient().then(function (client) {
        var deferred = Q.defer();
        client.get(
            {
                url: url.format(url_opts)
            },
            function (err, r, body) {
                err = errorHandler(r, err);
                if (err) return deferred.reject(err);
                return deferred.resolve(JSON.parse(body));
            }
        );
        return deferred.promise;
    })
};

///////////////////////////////////////////////////////////////////////////////
// Private Methods
///////////////////////////////////////////////////////////////////////////////

Client.prototype._getClient = function () {
    var self = this;
    if (this._boxClientPromise) return self._boxClientPromise;
    var options = {
        headers: {
            'Authorization': 'Bearer ' + self.credentials.access_token
        }
    };
    self._boxClientPromise = Q.when(request.defaults(options));
    return self._boxClientPromise;
}

function errorHandler(response, err) {
    if (err) return err;

    if(response.statusCode>=200 && response.statusCode <=299){
        return false;
    }
    //error codes parsed from http://developers.box.com/oauth/
    var err_message = response.headers['www-authenticate'] || response.body;
    return new Error(err_message);
}

module.exports = Client;