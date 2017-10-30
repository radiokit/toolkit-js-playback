"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Track_1 = require("./Track");
var Playlist = (function () {
    function Playlist(tracks) {
        this.__tracks = tracks;
    }
    Playlist.makeFromJson = function (accessToken, playlistRaw, filesRaw) {
        var tracks = {};
        for (var _i = 0, playlistRaw_1 = playlistRaw; _i < playlistRaw_1.length; _i++) {
            var playlistRecord = playlistRaw_1[_i];
            var id = playlistRecord['id'];
            var fileId = playlistRecord['file']['id'];
            var fileUrl = void 0;
            for (var _a = 0, filesRaw_1 = filesRaw; _a < filesRaw_1.length; _a++) {
                var fileRecord = filesRaw_1[_a];
                if (fileRecord['id'] === fileId) {
                    fileUrl = fileRecord['public_url'];
                    break;
                }
            }
            var cueInAt = new Date(playlistRecord['cue_in_at']);
            var cueOutAt = new Date(playlistRecord['cue_out_at']);
            var cueOffset = playlistRecord['cue_offset'];
            var fadeInAt = playlistRecord['fade_in_at'] !== null ? new Date(playlistRecord['fade_in_at']) : null;
            var fadeOutAt = playlistRecord['fade_out_at'] !== null ? new Date(playlistRecord['fade_out_at']) : null;
            var track = new Track_1.Track(accessToken, id, fileId, fileUrl, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt);
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
