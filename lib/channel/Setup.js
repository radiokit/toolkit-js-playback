"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Setup = (function () {
    function Setup(channelId, lineupBaseUrl, lineupChannelId, tubeBaseUrl, tubeFormat, tubeBitrate) {
        if (tubeFormat !== 'mp3') {
            throw new Error("Unknown tubeFormat " + tubeFormat);
        }
        this.__channelId = channelId;
        this.__lineupBaseUrl = lineupBaseUrl;
        this.__lineupChannelId = lineupChannelId;
        this.__tubeBaseUrl = tubeBaseUrl;
        this.__tubeFormat = tubeFormat;
        this.__tubeBitrate = tubeBitrate;
    }
    Setup.prototype.getChannelId = function () {
        return this.__channelId;
    };
    Setup.prototype.getLineupBaseUrl = function () {
        return this.__lineupBaseUrl;
    };
    Setup.prototype.getLineupChannelId = function () {
        return this.__lineupChannelId;
    };
    Setup.prototype.getTubeBaseUrl = function () {
        return this.__tubeBaseUrl;
    };
    Setup.prototype.getTubeFormat = function () {
        return this.__tubeFormat;
    };
    Setup.prototype.getTubeBitrate = function () {
        return this.__tubeBitrate;
    };
    Setup.prototype.getLineupPlaylistUrl = function (scope) {
        return this.__lineupBaseUrl + "/api/lineup/v1.0/channel/" + encodeURIComponent(this.__lineupChannelId) + "/playlist?scope=" + encodeURIComponent(scope);
    };
    Setup.prototype.getTubeStreamUrl = function () {
        return this.__tubeBaseUrl + "/output-" + this.__tubeBitrate + "." + this.__tubeFormat;
    };
    return Setup;
}());
exports.Setup = Setup;
