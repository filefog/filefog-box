var q = require('q')
    , OAuth = require('oauth')

var OAuth2 = OAuth.OAuth2;

var Provider = function(){
    this._oauth2Client = new OAuth2(this.config.client_key,
        this.config.client_secret,
        'https://www.box.com',
        '/api/oauth2/authorize',
        '/api/oauth2/token'
    );
};

Provider.prototype.interfaces = ["oauth"];


Provider.prototype.oAuthGetAuthorizeUrl = function() {
    return this._oauth2Client.getAuthorizeUrl({
        "redirect_uri": this.config.redirect_url,
        "response_type": "code"
    })
};


Provider.prototype.oAuthGetAccessToken = function(code) {
    var deferred = q.defer();
    this._oauth2Client.getOAuthAccessToken(
        code,
        {
            "grant_type": "authorization_code",
            "redirect_uri": this.config.redirect_url
        },
        function (err, access_token, refresh_token, results) {
            var oauth_data = {'access_token': access_token, 'refresh_token': refresh_token, 'raw': results}
            if (err) return deferred.reject(err);
            return deferred.resolve(oauth_data);
        });
    return deferred.promise;
};

Provider.prototype.oAuthRefreshAccessToken = function(credentials){
    var deferred = q.defer();
    this._oauth2Client.getOAuthAccessToken(
        credentials.refresh_token,
        {
            "grant_type": "refresh_token"
        },
        function (err, access_token, refresh_token, results) {
            var oauth_data = {'access_token': access_token, 'refresh_token': refresh_token, 'raw': results}
            if (err) return deferred.reject(err);
            return deferred.resolve(oauth_data);
        });
    return deferred.promise;

};

module.exports = Provider;






