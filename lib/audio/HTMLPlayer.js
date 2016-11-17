"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Base_1 = require("../Base");
var HTMLPlayer = (function (_super) {
    __extends(HTMLPlayer, _super);
    function HTMLPlayer(track, clock) {
        var _this = _super.call(this) || this;
        _this.__started = false;
        _this.__cueInTimeoutId = 0;
        _this.__restartTimeoutId = 0;
        _this.__positionIntervalId = 0;
        _this.__volume = 1.0;
        _this.__track = track;
        _this.__clock = clock;
        return _this;
    }
    HTMLPlayer.prototype.start = function () {
        if (!this.__started) {
            this.debug('Starting');
            this.__started = true;
            this.__preparePlayback();
        }
        else {
            throw new Error('Attempt to start HTML Player that is already started');
        }
        return this;
    };
    HTMLPlayer.prototype.stop = function () {
        if (this.__started) {
            this.debug('Stopping');
            this.__stopPlayback();
            this.__started = false;
        }
        else {
            throw new Error('Attempt to stop HTML Player that is not started');
        }
        return this;
    };
    HTMLPlayer.prototype.setVolume = function (volume) {
        if (volume < 0.0 || volume > 1.0) {
            throw new Error('Volume out of range');
        }
        this.__volume = volume;
        if (this.__audio) {
            this.__audio.volume = volume;
        }
        return this;
    };
    HTMLPlayer.prototype.getTrack = function () {
        return this.__track;
    };
    HTMLPlayer.prototype._loggerTag = function () {
        return this['constructor']['name'] + " " + this.__track.getId();
    };
    HTMLPlayer.prototype.__onAudioLoadedMetadata = function (e) {
        this.debug('Loaded metadata');
        this.__audio.onloadedmetadata = undefined;
        var now = this.__clock.nowAsTimestamp();
        var cueInAt = this.__track.getCueInAt().valueOf();
        var cueOutAt = this.__track.getCueOutAt().valueOf();
        if (now >= cueOutAt) {
            this.debug('Track is obsolete');
        }
        else {
            if (now < cueInAt) {
                var timeout = cueInAt - now;
                this.debug("Waiting for " + timeout + " ms");
                this.__cueInTimeoutId = setTimeout(this.__onCueInTimeout.bind(this), timeout);
            }
            else if (now > cueInAt) {
                var position = now - cueInAt;
                this.debug("Seeking to " + position + " ms");
                this.__audio.currentTime = position / 1000.0;
                this.__startPlayback();
            }
            else {
                this.__startPlayback();
            }
        }
    };
    HTMLPlayer.prototype.__onAudioError = function (e) {
        this.warn('Error');
        this.__stopPlayback();
        this.__scheduleRestart();
    };
    HTMLPlayer.prototype.__onAudioEnded = function (e) {
        this.debug('EOS');
        this.__stopPlayback();
    };
    HTMLPlayer.prototype.__onAudioWaiting = function (e) {
        this.warn('Waiting');
    };
    HTMLPlayer.prototype.__onAudioStalled = function (e) {
        this.warn('Stalled');
    };
    HTMLPlayer.prototype.__onAudioSuspended = function (e) {
        this.warn('Suspended');
    };
    HTMLPlayer.prototype.__onCueInTimeout = function () {
        this.debug('Cue In timeout has passed');
        this.__cueInTimeoutId = 0;
        this.__preparePlayback();
    };
    HTMLPlayer.prototype.__preparePlayback = function () {
        this.debug('Preparing playback');
        this.__audio = new Audio();
        this.__audio.volume = this.__volume;
        this.__audio.onloadedmetadata = this.__onAudioLoadedMetadata.bind(this);
        this.__audio.onerror = this.__onAudioError.bind(this);
        this.__audio.onended = this.__onAudioEnded.bind(this);
        if (this.__audio.canPlayType('application/ogg; codecs=opus')) {
            this.__audio.src = "https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/" + this.__track.getFileId() + "/variant/webbrowser-opus";
        }
        else if (this.__audio.canPlayType('audio/mpeg')) {
            this.__audio.src = "https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/" + this.__track.getFileId() + "/variant/webbrowser-mp3";
        }
        else {
            throw new Error('Browser supports none of formats server can send.');
        }
    };
    HTMLPlayer.prototype.__startPlayback = function () {
        this.debug('Starting playback');
        this.__positionIntervalId = setInterval(this.__onPositionInterval.bind(this), 250);
        this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
        this.__audio.onstalled = this.__onAudioStalled.bind(this);
        this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
        this.__audio.play();
        this._trigger('playback-started', this.__track);
    };
    HTMLPlayer.prototype.__stopPlayback = function () {
        this.debug('Stopping playback');
        if (this.__audio) {
            this.__audio.onloadedmetadata = undefined;
            this.__audio.onerror = undefined;
            this.__audio.onended = undefined;
            this.__audio.onwaiting = undefined;
            this.__audio.onstalled = undefined;
            this.__audio.onsuspend = undefined;
            this.__audio.pause();
            delete this.__audio;
            this.__audio = undefined;
        }
        if (this.__cueInTimeoutId !== 0) {
            clearTimeout(this.__cueInTimeoutId);
            this.__cueInTimeoutId = 0;
        }
        if (this.__restartTimeoutId !== 0) {
            clearTimeout(this.__restartTimeoutId);
            this.__restartTimeoutId = 0;
        }
        if (this.__positionIntervalId !== 0) {
            clearInterval(this.__positionIntervalId);
            this.__positionIntervalId = 0;
        }
    };
    HTMLPlayer.prototype.__scheduleRestart = function () {
        var _this = this;
        if (this.__started) {
            var timeout = 500 + Math.round(Math.random() * 250);
            this.debug("Scheduling restart in " + timeout + " ms");
            this.__restartTimeoutId = setTimeout(function () {
                _this.__restartTimeoutId = 0;
                _this.__preparePlayback();
            }, timeout);
        }
    };
    HTMLPlayer.prototype.__onPositionInterval = function () {
        var position = Math.round(this.__audio.currentTime * 1000);
        var cueInAt = this.__track.getCueInAt().valueOf();
        var cueOutAt = this.__track.getCueOutAt().valueOf();
        var duration = cueOutAt - cueInAt;
        this._trigger('position', this.__track, position, duration);
    };
    return HTMLPlayer;
}(Base_1.Base));
exports.HTMLPlayer = HTMLPlayer;