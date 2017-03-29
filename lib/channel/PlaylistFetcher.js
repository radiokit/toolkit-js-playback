"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var PlaylistResolver_1 = require("./PlaylistResolver");
var PlaylistFetcher = (function () {
    function PlaylistFetcher(accessToken, channelId, clock, options) {
        if (options === void 0) { options = {}; }
        this.__options = { from: 20, to: 600 };
        this.__options = __assign({}, this.__options, options);
        this.__clock = clock;
        this.__channelId = channelId;
        this.__accessToken = accessToken;
    }
    PlaylistFetcher.prototype.fetchAsync = function () {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            var now = _this.__clock.nowAsTimestamp();
            var xhr = new XMLHttpRequest();
            var url = 'https://plumber.radiokitapp.org/api/rest/v1.0/media/input/file/radiokit/vault' +
                '?a[]=id' +
                '&a[]=name' +
                '&a[]=file' +
                '&a[]=cue_in_at' +
                '&a[]=cue_out_at' +
                '&a[]=cue_offset' +
                '&a[]=fade_in_at' +
                '&a[]=fade_out_at' +
                '&s[]=cue%20' + encodeURIComponent(new Date(now).toISOString()) +
                encodeURIComponent(" " + _this.__options.from + " " + _this.__options.to) +
                '&c[references][]=deq%20broadcast_channel_id%20' + encodeURIComponent(_this.__channelId) +
                '&o[]=cue_in_at%20asc';
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.timeout = 15000;
            xhr.onerror = function (e) {
                reject(new Error("Unable to fetch playlist: Network error (" + xhr.status + ")"));
            };
            xhr.onabort = function (e) {
                reject(new Error("Unable to fetch playlist: Aborted"));
            };
            xhr.ontimeout = function (e) {
                reject(new Error("Unable to fetch playlist: Timeout"));
            };
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var responseAsJson = JSON.parse(xhr.responseText);
                        var resolver = new PlaylistResolver_1.PlaylistResolver(_this.__accessToken, responseAsJson['data']);
                        resolver.resolveAsync()
                            .then(function (playlist) {
                            resolve(playlist);
                        })
                            .catch(function (error) {
                            reject(new Error("Unable to resolve playlist (" + error.message + ")"));
                        });
                    }
                    else {
                        reject(new Error("Unable to fetch playlist: Unexpected response (status = " + xhr.status + ")"));
                    }
                }
            };
            xhr.send();
        });
        return promise;
    };
    return PlaylistFetcher;
}());
exports.PlaylistFetcher = PlaylistFetcher;
