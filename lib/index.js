"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Player_1 = require("./channel/Player");
var Setup_1 = require("./channel/Setup");
exports.Channel = {
    Player: Player_1.Player,
    Setup: Setup_1.Setup,
};
if (typeof (window) !== "undefined") {
    window['RadioKitToolkitPlayback'] = {
        Channel: {
            Player: Player_1.Player,
            Setup: Setup_1.Setup,
        }
    };
}
