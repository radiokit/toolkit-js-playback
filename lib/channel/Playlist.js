"use strict";
var Track_1 = require("./Track");
var Playlist = (function () {
    function Playlist(tracks) {
        this.__tracks = tracks;
    }
    Playlist.makeFromJson = function (accessToken, data) {
        var tracks = {};
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var record = data_1[_i];
            var id = record['id'];
            var fileId = record['file'];
            var cueInAt = new Date(record['cue_in_at']);
            var cueOutAt = new Date(record['cue_out_at']);
            var cueOffset = record['cue_offset'];
            var fadeInAt = record['fade_in_at'] !== null ? new Date(record['fade_in_at']) : null;
            var fadeOutAt = record['fade_out_at'] !== null ? new Date(record['fade_out_at']) : null;
            var track = new Track_1.Track(accessToken, id, fileId, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt);
            tracks[id] = track;
        }
        return new Playlist(tracks);
    };
    Playlist.prototype.getTracks = function () {
        return this.__tracks;
    };
    return Playlist;
}());
exports.Playlist = Playlist;
