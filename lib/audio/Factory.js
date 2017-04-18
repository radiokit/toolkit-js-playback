"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HTMLPlayer_1 = require("./HTMLPlayer");
var Factory = (function () {
    function Factory() {
    }
    Factory.makeFromTrack = function (track, clock) {
        return new HTMLPlayer_1.HTMLPlayer(track, clock);
    };
    return Factory;
}());
exports.Factory = Factory;
