"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Base_1 = require("../Base");
var phoenix_1 = require("phoenix");
var StreamManager = (function (_super) {
    __extends(StreamManager, _super);
    function StreamManager(channelId) {
        var _this = _super.call(this) || this;
        _this.__volume = 1.0;
        _this.__started = false;
        _this.__restartTimeoutId = 0;
        _this.__channelId = channelId;
        _this.__socket = new phoenix_1.Socket("wss://agenda.radiokitapp.org/api/stream/v1.0");
        return _this;
    }
    StreamManager.prototype.start = function () {
        if (!this.__started) {
            this.debug('Starting');
            this.__started = true;
            this.__startPlayback();
            this.__subscribeMetadata();
        }
        else {
            throw new Error('Attempt to start Stream Manager that is already started');
        }
        return this;
    };
    StreamManager.prototype.stop = function () {
        if (this.__started) {
            this.debug('Stopping');
            this.__stopPlayback();
            this.__unsubscribeMetadata();
            this.__started = false;
        }
        else {
            throw new Error('Attempt to stop Stream Manager that is not started');
        }
        return this;
    };
    StreamManager.prototype.setVolume = function (volume) {
        if (volume < 0.0 || volume > 1.0) {
            throw new Error('Volume out of range');
        }
        this.__volume = volume;
        if (this.__audio) {
            this.__audio.volume = volume;
        }
        return this;
    };
    StreamManager.prototype._loggerTag = function () {
        return "" + this['constructor']['name'];
    };
    StreamManager.prototype.__onAudioError = function (e) {
        this.warn('Error');
        this.__stopPlayback();
        this.__scheduleRestart();
    };
    StreamManager.prototype.__onAudioEnded = function (e) {
        this.debug('EOS');
        this.__stopPlayback();
        this.__scheduleRestart();
    };
    StreamManager.prototype.__onAudioWaiting = function (e) {
        this.warn('Waiting');
    };
    StreamManager.prototype.__onAudioStalled = function (e) {
        this.warn('Stalled');
    };
    StreamManager.prototype.__onAudioSuspended = function (e) {
        this.warn('Suspended');
    };
    StreamManager.prototype.__subscribeMetadata = function () {
        var _this = this;
        this.__socket.connect();
        this.__channel = this.__socket.channel("broadcast:metadata:" + this.__channelId);
        this.__channel.on("update", function (payload) {
            _this.debug("Received metadata: payload = " + JSON.stringify(payload));
            _this._trigger("channel-metadata-update", payload);
        });
        this.__channel.join()
            .receive("ok", function (_a) {
            var messages = _a.messages;
            return _this.debug("Subscribed to metadata");
        })
            .receive("error", function (_a) {
            var reason = _a.reason;
            return _this.warn("Failed to subscribe to metadata: error = " + reason);
        })
            .receive("timeout", function () { return _this.warn("Failed to subscribe to metadata: timeout"); });
    };
    StreamManager.prototype.__unsubscribeMetadata = function () {
        this.__channel.leave();
        this.__socket.disconnect();
    };
    StreamManager.prototype.__startPlayback = function () {
        this.debug('Starting playback');
        this.__audio = new Audio();
        this.__audio.volume = this.__volume;
        this.__audio.src = "http://cluster.radiokitstream.org/" + this.__channelId + ".mp3";
        this.__audio.onerror = this.__onAudioError.bind(this);
        this.__audio.onended = this.__onAudioEnded.bind(this);
        this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
        this.__audio.onstalled = this.__onAudioStalled.bind(this);
        this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
        this.__audio.play();
        this._trigger('playback-started');
    };
    StreamManager.prototype.__stopPlayback = function () {
        this.debug('Stopping playback');
        if (this.__audio) {
            this.__audio.onerror = undefined;
            this.__audio.onended = undefined;
            this.__audio.onwaiting = undefined;
            this.__audio.onstalled = undefined;
            this.__audio.onsuspend = undefined;
            if (this.__audio.readyState == 4) {
                this.__audio.pause();
            }
            this.__audio.src = '';
            delete this.__audio;
            this.__audio = undefined;
        }
        if (this.__restartTimeoutId !== 0) {
            clearTimeout(this.__restartTimeoutId);
            this.__restartTimeoutId = 0;
        }
    };
    StreamManager.prototype.__scheduleRestart = function () {
        var _this = this;
        if (this.__started) {
            var timeout = 500 + Math.round(Math.random() * 250);
            this.debug("Scheduling restart in " + timeout + " ms");
            this.__restartTimeoutId = setTimeout(function () {
                _this.__restartTimeoutId = 0;
                _this.__startPlayback();
            }, timeout);
        }
    };
    return StreamManager;
}(Base_1.Base));
exports.StreamManager = StreamManager;
