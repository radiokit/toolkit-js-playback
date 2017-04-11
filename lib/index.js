"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Player_1 = require("./channel/Player");
exports.Channel = {
    Player: Player_1.Player,
};
if (typeof (window) !== "undefined") {
    window['RadioKitToolkitPlayback'] = {
        Channel: {
            Player: Player_1.Player,
        }
    };
}
