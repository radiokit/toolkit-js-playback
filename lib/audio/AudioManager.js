"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Factory_1 = require("./Factory");
var Base_1 = require("../Base");
var AudioManager = (function (_super) {
    __extends(AudioManager, _super);
    function AudioManager() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.__audioPlayers = {};
        _this.__volume = 1.0;
        return _this;
    }
    AudioManager.prototype.update = function (playlist, clock) {
        var tracks = playlist.getTracks();
        var existingIds = Object.keys(this.__audioPlayers);
        var newIds = Object.keys(tracks);
        var tracksToAdd = this.__diff(tracks, this.__audioPlayers);
        var tracksToRemove = this.__diff(this.__audioPlayers, tracks);
        for (var id in tracksToAdd) {
            this.debug("Adding track: ID = " + id);
            this.__audioPlayers[id] = Factory_1.Factory.makeFromTrack(tracks[id], clock);
            this.__audioPlayers[id].setVolume(this.__volume);
            this.__audioPlayers[id].on('playback-started', this.__onAudioPlayerPlaybackStarted.bind(this));
            this.__audioPlayers[id].on('position', this.__onAudioPlayerPosition.bind(this));
            this.__audioPlayers[id].start();
        }
        for (var id in tracksToRemove) {
            this.debug("Removing track: ID = " + id);
            this.__removeAudioPlayer(id);
        }
    };
    AudioManager.prototype.cleanup = function () {
        for (var id in this.__audioPlayers) {
            this.__removeAudioPlayer(id);
        }
    };
    AudioManager.prototype.setVolume = function (volume) {
        if (volume < 0.0 || volume > 1.0) {
            throw new Error('Volume out of range');
        }
        this.__volume = volume;
        for (var id in this.__audioPlayers) {
            this.__audioPlayers[id].setVolume(volume);
        }
        return this;
    };
    AudioManager.prototype._loggerTag = function () {
        return "" + this['constructor']['name'];
    };
    AudioManager.prototype.__removeAudioPlayer = function (id) {
        if (this.__currentTrack === this.__audioPlayers[id].getTrack()) {
            this.__currentTrack = undefined;
        }
        this.__audioPlayers[id].offAll();
        this.__audioPlayers[id].stop();
        delete this.__audioPlayers[id];
    };
    AudioManager.prototype.__diff = function (object1, object2) {
        var result = {};
        var array1 = Object.keys(object1);
        var array2 = Object.keys(object2);
        for (var _i = 0, array1_1 = array1; _i < array1_1.length; _i++) {
            var item = array1_1[_i];
            if (array2.indexOf(item) === -1) {
                result[item] = object1[item];
            }
        }
        return result;
    };
    AudioManager.prototype.__onAudioPlayerPlaybackStarted = function (audioPlayer) {
        this.__currentTrack = audioPlayer.getTrack();
        this._trigger('playback-started', this.__currentTrack);
        for (var id in this.__audioPlayers) {
            var iteratedAudioPlayer = this.__audioPlayers[id];
            var iteratedTrack = iteratedAudioPlayer.getTrack();
            if (iteratedAudioPlayer !== audioPlayer && iteratedTrack.getCueInAt() <= this.__currentTrack.getCueInAt()) {
                this.debug("Applying fade out to player for track " + iteratedAudioPlayer.getTrack().getId() + " so it does not overlap with player for track " + audioPlayer.getTrack().getId());
                iteratedAudioPlayer.fadeOut(1000);
            }
        }
    };
    AudioManager.prototype.__onAudioPlayerPosition = function (audioPlayer, position, duration) {
        var track = audioPlayer.getTrack();
        if (track === this.__currentTrack) {
            this._trigger('position', track, position, duration);
        }
    };
    return AudioManager;
}(Base_1.Base));
exports.AudioManager = AudioManager;
