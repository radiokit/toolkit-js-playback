"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var StatsSender = (function () {
    function StatsSender(accessToken, channelId, userFingerprint, options) {
        if (options === void 0) { options = {}; }
        this.__options = { from: 20, to: 600, target: [] };
        this.__options = __assign({}, this.__options, options);
        this.__channelId = channelId;
        this.__accessToken = accessToken;
        this.__userFingerprint = userFingerprint;
    }
    StatsSender.prototype.sendAsync = function () {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url = 'http://localhost:4010/api/stats/v1.0/raw_stream_play';
            if (typeof _this.__statsId === 'undefined') {
                var method = 'POST';
                var requestParams = JSON.stringify({
                    raw_stream_play: {
                        user_fingerprint: _this.__userFingerprint,
                        channel_id: _this.__channelId,
                        targets: _this.__options.targets,
                    }
                });
            }
            else {
                var method = 'PATCH';
                var url = url + '/' + _this.__statsId;
                var requestParams = JSON.stringify({});
            }
            xhr.open(method, url, true);
            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 15000;
            xhr.onerror = function (e) {
                reject(new Error("Unable to send stats: Network error (" + xhr.status + ")"));
            };
            xhr.onabort = function (e) {
                reject(new Error("Unable to send stats: Aborted"));
            };
            xhr.ontimeout = function (e) {
                reject(new Error("Unable to send stats: Timeout"));
            };
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve("OK");
                    }
                    else if (xhr.status === 201) {
                        var responseAsJson = JSON.parse(xhr.responseText)['data'];
                        _this.__statsId = responseAsJson['id'];
                        resolve("OK");
                    }
                    else {
                        reject(new Error("Unable to send stats: Unexpected response (status = " + xhr.status + ")"));
                    }
                }
            };
            xhr.send(requestParams);
        });
        return promise;
    };
    return StatsSender;
}());
exports.StatsSender = StatsSender;
