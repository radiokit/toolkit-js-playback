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
var SyncClock_1 = require("../clock/SyncClock");
var PlaylistFetcher_1 = require("../channel/PlaylistFetcher");
var AudioManager_1 = require("../audio/AudioManager");
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(channelId, accessToken) {
        var _this = _super.call(this) || this;
        _this.__fetchTimeoutId = 0;
        _this.__playlist = null;
        _this.__clock = null;
        _this.__isFetchingRunning = false;
        _this.__playlistFetcher = null;
        _this.__volume = 1.0;
        _this.__started = false;
        _this.__channelId = channelId;
        _this.__accessToken = accessToken;
        return _this;
    }
    Player.prototype.start = function () {
        this.__startFetching();
        this.__started = true;
        this.__audioManager = new AudioManager_1.AudioManager();
        this.__audioManager.setVolume(this.__volume);
        this.__audioManager.on('playback-started', this.__onAudioManagerPlaybackStarted.bind(this));
        this.__audioManager.on('position', this.__onAudioManagerPosition.bind(this));
        return this;
    };
    Player.prototype.stop = function () {
        this.__started = false;
        if (this.__audioManager) {
            this.__audioManager.offAll();
            this.__audioManager.cleanup();
            delete this.__audioManager;
            this.__audioManager = undefined;
        }
        return this;
    };
    Player.prototype.setVolume = function (volume) {
        if (volume < 0.0 || volume > 1.0) {
            throw new Error('Volume out of range');
        }
        this.debug("Volume set to " + volume);
        this.__volume = volume;
        if (this.__audioManager) {
            this.__audioManager.setVolume(volume);
        }
        return this;
    };
    Player.prototype.getVolume = function () {
        return this.__volume;
    };
    Player.prototype.getPlayList = function () {
        return this.__playlist;
    };
    Player.prototype.isStarted = function () {
        return this.__started;
    };
    Player.prototype.fetchPlaylist = function () {
        this.__startFetching();
        return this;
    };
    Player.prototype.stopFetching = function () {
        this.__isFetchingRunning = false;
        if (this.__fetchTimeoutId !== 0) {
            clearTimeout(this.__fetchTimeoutId);
            this.__fetchTimeoutId = 0;
        }
    };
    Player.prototype._loggerTag = function () {
        return this['constructor']['name'] + " " + this.__channelId;
    };
    Player.prototype.__startFetching = function () {
        if (!this.__isFetchingRunning) {
            this.__isFetchingRunning = true;
            this.__fetchOnceAndRepeat();
        }
    };
    Player.prototype.__fetchOnce = function () {
        var _this = this;
        if (this.__clock === null) {
            this.debug("Fetch: Synchronizing clock...");
            var promise = new Promise(function (resolve, reject) {
                SyncClock_1.SyncClock.makeAsync()
                    .then(function (clock) {
                    _this.debug("Fetch: Synchronized clock");
                    _this.__clock = clock;
                    _this.__playlistFetcher = new PlaylistFetcher_1.PlaylistFetcher(_this.__accessToken, _this.__channelId, clock);
                    return _this.__fetchPlaylist(resolve, reject);
                })
                    .catch(function (error) {
                    _this.warn("Fetch error: Unable to sync clock (" + error.message + ")");
                    _this._trigger('error-network');
                    reject(new Error("Unable to sync clock (" + error.message + ")"));
                });
            });
            return promise;
        }
        else {
            var promise = new Promise(function (resolve, reject) {
                _this.__fetchPlaylist(resolve, reject);
            });
            return promise;
        }
    };
    Player.prototype.__fetchPlaylist = function (resolve, reject) {
        var _this = this;
        this.debug("Fetch: Fetching playlist...");
        this.__playlistFetcher.fetchAsync()
            .then(function (playlist) {
            _this.debug("Fetch: Done");
            resolve(playlist);
        })
            .catch(function (error) {
            _this.warn("Fetch error: Unable to fetch playlist (" + error.message + ")");
            _this._trigger('error-network');
            reject(new Error("Unable to fetch playlist (" + error.message + ")"));
        });
    };
    Player.prototype.__fetchOnceAndRepeat = function () {
        var _this = this;
        this.__fetchOnce()
            .then(function (playlist) {
            _this.__playlist = playlist;
            _this.__onPlayListFetched(playlist);
            _this.__started && _this.__audioManager.update(_this.__playlist, _this.__clock);
            _this.__scheduleNextFetch();
        })
            .catch(function (error) {
            _this.__scheduleNextFetch();
        });
    };
    Player.prototype.__scheduleNextFetch = function () {
        var _this = this;
        if (this.__isFetchingRunning) {
            var timeout = 2000 + Math.round(Math.random() * 250);
            this.debug("Fetch: Scheduling next fetch in " + timeout + " ms");
            this.__fetchTimeoutId = setTimeout(function () {
                _this.__fetchTimeoutId = 0;
                _this.__fetchOnceAndRepeat();
            }, timeout);
        }
    };
    Player.prototype.__onPlayListFetched = function (playlist) {
        this._trigger('playlist-fetched', playlist);
    };
    Player.prototype.__onAudioManagerPosition = function (track, position, duration) {
        this._trigger('track-position', track, position, duration);
    };
    Player.prototype.__onAudioManagerPlaybackStarted = function (track) {
        this._trigger('track-playback-started', track);
    };
    return Player;
}(Base_1.Base));
exports.Player = Player;
