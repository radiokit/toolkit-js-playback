"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Playlist_1 = require("./Playlist");
var PlaylistResolver = (function () {
    function PlaylistResolver(accessToken, playlistRaw) {
        this.__playlistRaw = playlistRaw;
        this.__accessToken = accessToken;
    }
    PlaylistResolver.prototype.resolveAsync = function () {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var fileIds = [];
            for (var _i = 0, _a = _this.__playlistRaw; _i < _a.length; _i++) {
                var file = _a[_i];
                fileIds.push(encodeURIComponent(file["file"]));
            }
            var url = 'https://vault.radiokitapp.org/api/rest/v1.0/data/record/file' +
                '?a[]=id' +
                '&a[]=public_url' +
                '&c[id][]=in%20' + fileIds.join("%20");
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.timeout = 15000;
            var audio = new Audio();
            var knownFormats = [];
            if (audio.canPlayType('application/ogg; codecs=opus')) {
                knownFormats.push('application/ogg; codecs=opus');
            }
            if (audio.canPlayType('application/ogg; codecs=vorbis')) {
                knownFormats.push('application/ogg; codecs=vorbis');
            }
            if (audio.canPlayType('audio/mpeg')) {
                knownFormats.push('audio/mpeg');
            }
            xhr.setRequestHeader('X-RadioKit-KnownFormats', knownFormats.join(', '));
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
                        var responseData = responseAsJson['data'];
                        resolve(Playlist_1.Playlist.makeFromJson(_this.__accessToken, _this.__playlistRaw, responseData));
                    }
                    else {
                        reject(new Error("Unable to fetch files: Unexpected response (status = " + xhr.status + ")"));
                    }
                }
            };
            xhr.send();
        });
        return promise;
    };
    return PlaylistResolver;
}());
exports.PlaylistResolver = PlaylistResolver;
