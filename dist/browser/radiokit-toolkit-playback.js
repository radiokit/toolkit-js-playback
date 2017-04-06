/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var Player_1 = __webpack_require__(1);
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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

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
	var __assign = (this && this.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var Base_1 = __webpack_require__(2);
	var SyncClock_1 = __webpack_require__(3);
	var PlaylistFetcher_1 = __webpack_require__(4);
	var AudioManager_1 = __webpack_require__(9);
	var StatsSender_1 = __webpack_require__(12);
	var Fingerprint2 = __webpack_require__(13);
	var Player = (function (_super) {
	    __extends(Player, _super);
	    function Player(channelId, accessToken, targetId, options) {
	        if (options === void 0) { options = {}; }
	        var _this = _super.call(this) || this;
	        _this.__fetchTimeoutId = 0;
	        _this.__statsTimeoutId = 0;
	        _this.__playlist = null;
	        _this.__clock = null;
	        _this.__fetching = false;
	        _this.__playlistFetcher = null;
	        _this.__statsSender = null;
	        _this.__volume = 1.0;
	        _this.__options = { from: 20, to: 600 };
	        _this.__options = __assign({}, _this.__options, options);
	        _this.__started = false;
	        _this.__channelId = channelId;
	        _this.__accessToken = accessToken;
	        _this.__targetId = targetId;
	        _this.__generateUserFingerprint();
	        return _this;
	    }
	    Player.prototype.start = function () {
	        this.__startFetching();
	        this.__started = true;
	        this.__startSendingStats();
	        this.__audioManager = new AudioManager_1.AudioManager();
	        this.__audioManager.setVolume(this.__volume);
	        this.__audioManager.on('playback-started', this.__onAudioManagerPlaybackStarted.bind(this));
	        this.__audioManager.on('position', this.__onAudioManagerPosition.bind(this));
	        return this;
	    };
	    Player.prototype.stop = function () {
	        this.__started = false;
	        this.__stopSendingStats();
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
	    Player.prototype.isStarted = function () {
	        return this.__started;
	    };
	    Player.prototype.fetchPlaylist = function () {
	        this.__startFetching();
	        return this;
	    };
	    Player.prototype.setTrackId = function (trackId) {
	        this.trackId = trackId;
	        return this;
	    };
	    Player.prototype.stopFetching = function () {
	        this.__fetching = false;
	        if (this.__fetchTimeoutId !== 0) {
	            clearTimeout(this.__fetchTimeoutId);
	            this.__fetchTimeoutId = 0;
	        }
	    };
	    Player.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__channelId;
	    };
	    Player.prototype.__startFetching = function () {
	        if (!this.__fetching) {
	            this.__fetching = true;
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
	                    _this.__playlistFetcher = new PlaylistFetcher_1.PlaylistFetcher(_this.__accessToken, _this.__channelId, clock, { from: _this.__options.from, to: _this.__options.to });
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
	    Player.prototype.__stopSendingStats = function () {
	        if (this.__statsTimeoutId !== 0) {
	            clearTimeout(this.__statsTimeoutId);
	            this.__statsTimeoutId = 0;
	        }
	    };
	    Player.prototype.__startSendingStats = function () {
	        if (!this.__statsSender) {
	            this.__statsSender = new StatsSender_1.StatsSender(this.__accessToken, this.__channelId, this.__targetId, this.__userFingerprint);
	        }
	        this.__sendStats();
	    };
	    Player.prototype.__sendStats = function () {
	        var _this = this;
	        this.__sendStatsOnce()
	            .then(function (responseStatus) {
	            if (responseStatus === "OK") {
	                _this.debug("Stats sent successfully.");
	            }
	            else {
	                _this.debug("Unable to send stats. Response code: " + responseStatus);
	            }
	            _this.__scheduleNextSending();
	        })
	            .catch(function (error) {
	            _this.__scheduleNextSending();
	        });
	    };
	    Player.prototype.__scheduleNextSending = function () {
	        var _this = this;
	        if (this.__started) {
	            var timeout = 15000 + Math.round(Math.random() * 250);
	            this.debug("Stats Sender: Scheduling next send in " + timeout + " ms");
	            this.__statsTimeoutId = setTimeout(function () {
	                _this.__statsTimeoutId = 0;
	                _this.__sendStats();
	            }, timeout);
	        }
	    };
	    Player.prototype.__sendStatsOnce = function () {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            _this.__sendStatsPromise(resolve, reject);
	        });
	        return promise;
	    };
	    Player.prototype.__sendStatsPromise = function (resolve, reject) {
	        var _this = this;
	        this.debug("Start sending stats.");
	        this.__statsSender.sendAsync(this.trackId)
	            .then(function (requestResponse) {
	            _this.debug("Sending stats done.");
	            resolve(requestResponse);
	        })
	            .catch(function (error) {
	            _this.warn("Send stats error: Unable to send stats (" + error.message + ")");
	            _this._trigger('error-network');
	            reject(new Error("Unable to send stats (" + error.message + ")"));
	        });
	    };
	    Player.prototype.__scheduleNextFetch = function () {
	        var _this = this;
	        if (this.__fetching) {
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
	    Player.prototype.__generateUserFingerprint = function () {
	        var _this = this;
	        new Fingerprint2().get(function (fingerprint) {
	            _this.__userFingerprint = fingerprint;
	        });
	    };
	    return Player;
	}(Base_1.Base));
	exports.Player = Player;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var Base = (function () {
	    function Base() {
	        this.__events = {};
	    }
	    Base.prototype.on = function (eventName, callback) {
	        if (this.__events.hasOwnProperty(eventName)) {
	            if (this.__events[eventName].indexOf(callback) === -1) {
	                this.__events[eventName].push(callback);
	            }
	            else {
	                throw new Error("Trying to addd twice the same callback for event \"" + eventName + "\"");
	            }
	        }
	        else {
	            this.__events[eventName] = [callback];
	        }
	        return this;
	    };
	    Base.prototype.off = function (eventName, callback) {
	        if (this.__events.hasOwnProperty(eventName)) {
	            var index = this.__events[eventName].indexOf(callback);
	            if (index !== -1) {
	                this.__events[eventName].splice(index, 1);
	            }
	            else {
	                throw new Error("Trying to remove non-existent callback for event \"" + eventName + "\"");
	            }
	        }
	        return this;
	    };
	    Base.prototype.offAll = function (eventName) {
	        if (eventName) {
	            if (this.__events.hasOwnProperty(eventName)) {
	                delete this.__events[eventName];
	            }
	        }
	        else {
	            this.__events = {};
	        }
	        return this;
	    };
	    Base.prototype._trigger = function (eventName) {
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        this.debug("Event: " + eventName + " (" + JSON.stringify(args) + ")");
	        if (this.__events.hasOwnProperty(eventName)) {
	            for (var _a = 0, _b = this.__events[eventName]; _a < _b.length; _a++) {
	                var callback = _b[_a];
	                callback.apply(this, args);
	            }
	        }
	        return this;
	    };
	    Base.prototype.warn = function (message) {
	        console.warn("[" + new Date().toISOString() + " RadioKit.Toolkit.Playback " + this._loggerTag() + "] " + message);
	    };
	    Base.prototype.info = function (message) {
	        console.info("[" + new Date().toISOString() + " RadioKit.Toolkit.Playback " + this._loggerTag() + "] " + message);
	    };
	    Base.prototype.debug = function (message) {
	        console.debug("[" + new Date().toISOString() + " RadioKit.Toolkit.Playback " + this._loggerTag() + "] " + message);
	    };
	    return Base;
	}());
	exports.Base = Base;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

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
	var Base_1 = __webpack_require__(2);
	var SyncClock = (function (_super) {
	    __extends(SyncClock, _super);
	    function SyncClock(serverDate) {
	        var _this = _super.call(this) || this;
	        _this.__offset = serverDate - Date.now();
	        _this.debug("Synchronized clock: offset = " + _this.__offset + " ms");
	        return _this;
	    }
	    SyncClock.makeAsync = function () {
	        var promise = new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            xhr.open('OPTIONS', 'https://time.radiokitapp.org/api/time/v1.0/now', true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.timeout = 5000;
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to synchronize clock: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to synchronize clock: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to synchronize clock: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        resolve(new SyncClock(Date.parse(JSON.parse(xhr.responseText).utc_time)));
	                    }
	                    else {
	                        reject(new Error("Unable to synchronize clock: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    SyncClock.prototype.nowAsTimestamp = function () {
	        return Date.now() + this.__offset;
	    };
	    SyncClock.prototype._loggerTag = function () {
	        return this['constructor']['name'];
	    };
	    return SyncClock;
	}(Base_1.Base));
	exports.SyncClock = SyncClock;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __assign = (this && this.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var PlaylistResolver_1 = __webpack_require__(5);
	var PlaylistFetcher = (function () {
	    function PlaylistFetcher(accessToken, channelId, clock, options) {
	        if (options === void 0) { options = {}; }
	        this.__options = { from: 20, to: 600 };
	        this.__options = __assign({}, this.__options, options);
	        this.__clock = clock;
	        this.__channelId = channelId;
	        this.__accessToken = accessToken;
	    }
	    PlaylistFetcher.prototype.fetchAsync = function () {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            var now = _this.__clock.nowAsTimestamp();
	            var xhr = new XMLHttpRequest();
	            var url = 'https://plumber.radiokitapp.org/api/rest/v1.0/media/input/file/radiokit/vault' +
	                '?a[]=id' +
	                '&a[]=name' +
	                '&a[]=file' +
	                '&a[]=cue_in_at' +
	                '&a[]=cue_out_at' +
	                '&a[]=cue_offset' +
	                '&a[]=fade_in_at' +
	                '&a[]=fade_out_at' +
	                '&s[]=cue%20' + encodeURIComponent(new Date(now).toISOString()) +
	                encodeURIComponent(" " + _this.__options.from + " " + _this.__options.to) +
	                '&c[references][]=deq%20broadcast_channel_id%20' + encodeURIComponent(_this.__channelId) +
	                '&o[]=cue_in_at%20asc';
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
	            xhr.setRequestHeader('Accept', 'application/json');
	            xhr.timeout = 15000;
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to fetch playlist: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to fetch playlist: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to fetch playlist: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        var responseAsJson = JSON.parse(xhr.responseText);
	                        var resolver = new PlaylistResolver_1.PlaylistResolver(_this.__accessToken, responseAsJson['data']);
	                        resolver.resolveAsync()
	                            .then(function (playlist) {
	                            resolve(playlist);
	                        })
	                            .catch(function (error) {
	                            reject(new Error("Unable to resolve playlist (" + error.message + ")"));
	                        });
	                    }
	                    else {
	                        reject(new Error("Unable to fetch playlist: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    return PlaylistFetcher;
	}());
	exports.PlaylistFetcher = PlaylistFetcher;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var Playlist_1 = __webpack_require__(6);
	var PlaylistResolver = (function () {
	    function PlaylistResolver(accessToken, playlistRaw) {
	        this.__playlistRaw = playlistRaw;
	        this.__accessToken = accessToken;
	    }
	    PlaylistResolver.prototype.resolveAsync = function () {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            var fileIds = [];
	            for (var _i = 0, _a = _this.__playlistRaw; _i < _a.length; _i++) {
	                var file = _a[_i];
	                fileIds.push(encodeURIComponent(file["file"]));
	            }
	            var url = 'https://vault.radiokitapp.org/api/rest/v1.0/data/record/file' +
	                '?a[]=id' +
	                '&a[]=public_url' +
	                '&c[id][]=in%20' + fileIds.join("%20");
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
	            xhr.setRequestHeader('Accept', 'application/json');
	            xhr.timeout = 15000;
	            var audio = new Audio();
	            var knownFormats = [];
	            if (audio.canPlayType('application/ogg; codecs=opus')) {
	                knownFormats.push('application/ogg; codecs=opus');
	            }
	            if (audio.canPlayType('application/ogg; codecs=vorbis')) {
	                knownFormats.push('application/ogg; codecs=vorbis');
	            }
	            if (audio.canPlayType('audio/mpeg')) {
	                knownFormats.push('audio/mpeg');
	            }
	            xhr.setRequestHeader('X-RadioKit-KnownFormats', knownFormats.join(', '));
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to fetch playlist: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to fetch playlist: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to fetch playlist: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        var responseAsJson = JSON.parse(xhr.responseText);
	                        var responseData = responseAsJson['data'];
	                        resolve(Playlist_1.Playlist.makeFromJson(_this.__accessToken, _this.__playlistRaw, responseData));
	                    }
	                    else {
	                        reject(new Error("Unable to fetch files: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    return PlaylistResolver;
	}());
	exports.PlaylistResolver = PlaylistResolver;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var Track_1 = __webpack_require__(7);
	var Playlist = (function () {
	    function Playlist(tracks) {
	        this.__tracks = tracks;
	    }
	    Playlist.makeFromJson = function (accessToken, playlistRaw, filesRaw) {
	        var tracks = {};
	        for (var _i = 0, playlistRaw_1 = playlistRaw; _i < playlistRaw_1.length; _i++) {
	            var playlistRecord = playlistRaw_1[_i];
	            var id = playlistRecord['id'];
	            var fileId = playlistRecord['file'];
	            var fileUrl = void 0;
	            for (var _a = 0, filesRaw_1 = filesRaw; _a < filesRaw_1.length; _a++) {
	                var fileRecord = filesRaw_1[_a];
	                if (fileRecord['id'] === playlistRecord['file']) {
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


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

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
	var Base_1 = __webpack_require__(2);
	var TrackInfo_1 = __webpack_require__(8);
	var Track = (function (_super) {
	    __extends(Track, _super);
	    function Track(accessToken, id, fileId, fileUrl, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt) {
	        var _this = _super.call(this) || this;
	        _this.__accessToken = accessToken;
	        _this.__id = id;
	        _this.__fileId = fileId;
	        _this.__fileUrl = fileUrl;
	        _this.__cueInAt = cueInAt;
	        _this.__cueOutAt = cueOutAt;
	        _this.__cueOffset = cueOffset;
	        _this.__fadeInAt = fadeInAt;
	        _this.__fadeOutAt = fadeOutAt;
	        return _this;
	    }
	    Track.prototype.getId = function () {
	        return this.__id;
	    };
	    Track.prototype.getFileId = function () {
	        return this.__fileId;
	    };
	    Track.prototype.getFileUrl = function () {
	        return this.__fileUrl;
	    };
	    Track.prototype.getCueInAt = function () {
	        return this.__cueInAt;
	    };
	    Track.prototype.getCueOutAt = function () {
	        return this.__cueOutAt;
	    };
	    Track.prototype.getFadeInAt = function () {
	        return this.__fadeInAt;
	    };
	    Track.prototype.getFadeOutAt = function () {
	        return this.__fadeOutAt;
	    };
	    Track.prototype.getCueOffset = function () {
	        return this.__cueOffset;
	    };
	    Track.prototype.getInfoAsync = function () {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            var url = 'https://vault.radiokitapp.org/api/rest/v1.0/data/record/file' +
	                '?a[]=id' +
	                '&a[]=name' +
	                '&a[]=stage' +
	                '&a[]=references' +
	                '&a[]=extra' +
	                '&a[]=public_url' +
	                '&a[]=metadata_schemas.id' +
	                '&a[]=metadata_schemas.name' +
	                '&a[]=metadata_schemas.key' +
	                '&a[]=metadata_schemas.kind' +
	                '&a[]=metadata_items.id' +
	                '&a[]=metadata_items.metadata_schema_id' +
	                '&a[]=metadata_items.metadata_schema_id' +
	                '&a[]=metadata_items.value_string' +
	                '&a[]=metadata_items.value_db' +
	                '&a[]=metadata_items.value_text' +
	                '&a[]=metadata_items.value_float' +
	                '&a[]=metadata_items.value_integer' +
	                '&a[]=metadata_items.value_duration' +
	                '&a[]=metadata_items.value_date' +
	                '&a[]=metadata_items.value_datetime' +
	                '&a[]=metadata_items.value_time' +
	                '&a[]=metadata_items.value_file' +
	                '&a[]=metadata_items.value_image' +
	                '&a[]=metadata_items.value_url' +
	                '&j[]=metadata_schemas' +
	                '&j[]=metadata_items' +
	                '&c[id][]=eq%20' + encodeURIComponent(_this.__fileId);
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
	            xhr.setRequestHeader('Accept', 'application/json');
	            xhr.timeout = 15000;
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to fetch track info: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to fetch track info: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to fetch track info: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        var responseAsJson = JSON.parse(xhr.responseText);
	                        if (responseAsJson["data"].length === 1) {
	                            resolve(TrackInfo_1.TrackInfo.makeFromJson(responseAsJson["data"][0]));
	                        }
	                        else {
	                            reject(new Error("Unable to fetch track info: Record not found"));
	                        }
	                    }
	                    else {
	                        reject(new Error("Unable to fetch track info: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send();
	        });
	        return promise;
	    };
	    Track.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__id;
	    };
	    return Track;
	}(Base_1.Base));
	exports.Track = Track;


/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var TrackInfo = (function () {
	    function TrackInfo(name, metadata) {
	        this.__name = name;
	        this.__metadata = metadata;
	    }
	    TrackInfo.makeFromJson = function (data) {
	        var name = data['name'];
	        var metadata = {};
	        var metadataSchemas = {};
	        for (var _i = 0, _a = data['metadata_schemas']; _i < _a.length; _i++) {
	            var metadataSchema = _a[_i];
	            metadataSchemas[metadataSchema['id']] = metadataSchema;
	        }
	        for (var _b = 0, _c = data['metadata_items']; _b < _c.length; _b++) {
	            var metadataItem = _c[_b];
	            var key = metadataSchemas[metadataItem['metadata_schema_id']].key;
	            var kind = metadataSchemas[metadataItem['metadata_schema_id']].kind;
	            var value = metadataItem["value_" + kind];
	            metadata[key] = value;
	        }
	        return new TrackInfo(name, metadata);
	    };
	    TrackInfo.prototype.getName = function () {
	        return this.__name;
	    };
	    TrackInfo.prototype.getMetadata = function () {
	        return this.__metadata;
	    };
	    return TrackInfo;
	}());
	exports.TrackInfo = TrackInfo;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

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
	var Factory_1 = __webpack_require__(10);
	var Base_1 = __webpack_require__(2);
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


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var HTMLPlayer_1 = __webpack_require__(11);
	var Factory = (function () {
	    function Factory() {
	    }
	    Factory.makeFromTrack = function (track, clock) {
	        return new HTMLPlayer_1.HTMLPlayer(track, clock);
	    };
	    return Factory;
	}());
	exports.Factory = Factory;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

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
	var Base_1 = __webpack_require__(2);
	var FADE_OUT_INTERVAL = 25;
	var HTMLPlayer = (function (_super) {
	    __extends(HTMLPlayer, _super);
	    function HTMLPlayer(track, clock) {
	        var _this = _super.call(this) || this;
	        _this.__started = false;
	        _this.__cueInTimeoutId = 0;
	        _this.__restartTimeoutId = 0;
	        _this.__positionIntervalId = 0;
	        _this.__volume = 1.0;
	        _this.__fadeVolumeMultiplier = 1.0;
	        _this.__fadeIntervalId = 0;
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
	            this.__audio.volume = volume * this.__fadeVolumeMultiplier;
	        }
	        return this;
	    };
	    HTMLPlayer.prototype.getTrack = function () {
	        return this.__track;
	    };
	    HTMLPlayer.prototype.fadeOut = function (duration) {
	        var _this = this;
	        if (this.__fadeIntervalId === 0) {
	            this.debug("Starting fade out of duration " + duration + " ms");
	            var step_1 = FADE_OUT_INTERVAL / duration;
	            this.__fadeIntervalId = setInterval(function () {
	                _this.__fadeVolumeMultiplier -= step_1;
	                if (_this.__fadeVolumeMultiplier <= 0) {
	                    _this.__fadeVolumeMultiplier = 0;
	                    clearInterval(_this.__fadeIntervalId);
	                    _this.__fadeIntervalId = 0;
	                    _this.debug("Finishing fade out");
	                }
	                _this.debug("Fade out: " + _this.__fadeVolumeMultiplier + "%");
	                if (_this.__audio) {
	                    _this.__audio.volume = _this.__volume * _this.__fadeVolumeMultiplier;
	                }
	            }, FADE_OUT_INTERVAL);
	        }
	        return this;
	    };
	    HTMLPlayer.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__track.getId();
	    };
	    HTMLPlayer.prototype.__onAudioCanPlayThroughWhenPreparing = function (e) {
	        this.debug('Can play through (when preparing)');
	        var now = this.__clock.nowAsTimestamp();
	        var cueInAt = this.__track.getCueInAt().valueOf();
	        var cueOutAt = this.__track.getCueOutAt().valueOf();
	        if (now >= cueOutAt) {
	            this.warn('Unable to play: Track is obsolete');
	        }
	        else {
	            if (now < cueInAt) {
	                var timeout = cueInAt - now;
	                this.debug("Waiting for " + timeout + " ms");
	                this.__cueInTimeoutId = setTimeout(this.__onCueInTimeout.bind(this), timeout);
	            }
	            else if (now > cueInAt) {
	                this.__audio.oncanplaythrough = this.__onAudioCanPlayThroughWhenReady.bind(this);
	                var position = now - cueInAt;
	                this.debug("Seeking to " + position + " ms");
	                this.__audio.currentTime = position / 1000.0;
	            }
	            else {
	                this.__startPlayback();
	            }
	        }
	    };
	    HTMLPlayer.prototype.__onAudioCanPlayThroughWhenReady = function (e) {
	        this.debug('Can play through (when ready)');
	        this.__startPlayback();
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
	    HTMLPlayer.prototype.__onAudioSeeking = function (e) {
	        this.debug('Seeking');
	    };
	    HTMLPlayer.prototype.__onAudioSeeked = function (e) {
	        this.debug('Seeked');
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
	        this.__startPlayback();
	    };
	    HTMLPlayer.prototype.__preparePlayback = function () {
	        this.debug('Preparing playback');
	        this.__fadeVolumeMultiplier = 1.0;
	        this.__audio = new Audio();
	        this.__audio.volume = this.__volume;
	        this.__audio.preload = 'none';
	        this.__audio.src = this.__track.getFileUrl();
	        var now = this.__clock.nowAsTimestamp();
	        var cueInAt = this.__track.getCueInAt().valueOf();
	        var cueOutAt = this.__track.getCueOutAt().valueOf();
	        if (now >= cueOutAt) {
	            this.warn('Unable to set initial currentTime: Track is obsolete');
	        }
	        else {
	            if (now <= cueInAt) {
	                this.__audio.currentTime = 0;
	            }
	            else {
	                var position = now - cueInAt;
	                this.debug("Setting initial currentTime to " + position + " ms");
	                this.__audio.onseeking = this.__onAudioSeeking.bind(this);
	                this.__audio.onseeked = this.__onAudioSeeked.bind(this);
	                this.__audio.currentTime = position / 1000.0;
	            }
	        }
	        this.__audio.oncanplaythrough = this.__onAudioCanPlayThroughWhenPreparing.bind(this);
	        this.__audio.onerror = this.__onAudioError.bind(this);
	        this.__audio.load();
	    };
	    HTMLPlayer.prototype.__startPlayback = function () {
	        this.debug('Starting playback');
	        this.__positionIntervalId = setInterval(this.__onPositionInterval.bind(this), 250);
	        this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
	        this.__audio.onstalled = this.__onAudioStalled.bind(this);
	        this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
	        this.__audio.onended = this.__onAudioEnded.bind(this);
	        this.__audio.play();
	        this._trigger('playback-started', this);
	    };
	    HTMLPlayer.prototype.__stopPlayback = function () {
	        this.debug('Stopping playback');
	        if (this.__audio) {
	            this.__audio.oncanplaythrough = undefined;
	            this.__audio.onerror = undefined;
	            this.__audio.onended = undefined;
	            this.__audio.onwaiting = undefined;
	            this.__audio.onstalled = undefined;
	            this.__audio.onsuspend = undefined;
	            this.__audio.onseeking = undefined;
	            this.__audio.onseeked = undefined;
	            if (this.__audio.readyState == 4) {
	                this.__audio.pause();
	            }
	            this.__audio.src = '';
	            delete this.__audio;
	            this.__audio = undefined;
	        }
	        if (this.__fadeIntervalId !== 0) {
	            clearInterval(this.__fadeIntervalId);
	            this.__fadeIntervalId = 0;
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
	        if (this.__audio) {
	            var position = Math.round(this.__audio.currentTime * 1000);
	            var cueInAt = this.__track.getCueInAt().valueOf();
	            var cueOutAt = this.__track.getCueOutAt().valueOf();
	            var duration = cueOutAt - cueInAt;
	            this._trigger('position', this, position, duration);
	        }
	    };
	    return HTMLPlayer;
	}(Base_1.Base));
	exports.HTMLPlayer = HTMLPlayer;


/***/ },
/* 12 */
/***/ function(module, exports) {

	"use strict";
	var __assign = (this && this.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var StatsSender = (function () {
	    function StatsSender(accessToken, channelId, targetId, userFingerprint, options) {
	        if (options === void 0) { options = {}; }
	        this.__options = { from: 20, to: 600 };
	        this.__options = __assign({}, this.__options, options);
	        this.__channelId = channelId;
	        this.__accessToken = accessToken;
	        this.__targetId = targetId;
	        this.__userFingerprint = userFingerprint;
	    }
	    StatsSender.prototype.sendAsync = function (trackId) {
	        var _this = this;
	        var promise = new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            var url = 'http://localhost:4010/api/stats/v1.0/raw_stream_play';
	            var requestParams = JSON.stringify({
	                raw_stream_play: {
	                    user_fingerprint: _this.__userFingerprint,
	                    channel_id: _this.__channelId,
	                    target_id: _this.__targetId,
	                    file_id: trackId,
	                }
	            });
	            xhr.open('POST', url, true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
	            xhr.setRequestHeader('Content-Type', 'application/json');
	            xhr.timeout = 15000;
	            xhr.onerror = function (e) {
	                reject(new Error("Unable to send stats: Network error (" + xhr.status + ")"));
	            };
	            xhr.onabort = function (e) {
	                reject(new Error("Unable to send stats: Aborted"));
	            };
	            xhr.ontimeout = function (e) {
	                reject(new Error("Unable to send stats: Timeout"));
	            };
	            xhr.onreadystatechange = function () {
	                if (xhr.readyState === 4) {
	                    if (xhr.status === 200) {
	                        resolve("OK");
	                    }
	                    else {
	                        reject(new Error("Unable to send stats: Unexpected response (status = " + xhr.status + ")"));
	                    }
	                }
	            };
	            xhr.send(requestParams);
	        });
	        return promise;
	    };
	    return StatsSender;
	}());
	exports.StatsSender = StatsSender;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;!function(e,t,i){"use strict"; true?!(__WEBPACK_AMD_DEFINE_FACTORY__ = (i), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)):"undefined"!=typeof module&&module.exports?module.exports=i():t.exports?t.exports=i():t[e]=i()}("Fingerprint2",this,function(){"use strict";var e=function(t){if(!(this instanceof e))return new e(t);var i={swfContainerId:"fingerprintjs2",swfPath:"flash/compiled/FontList.swf",detectScreenOrientation:!0,sortPluginsFor:[/palemoon/i],userDefinedFonts:[]};this.options=this.extend(t,i),this.nativeForEach=Array.prototype.forEach,this.nativeMap=Array.prototype.map};return e.prototype={extend:function(e,t){if(null==e)return t;for(var i in e)null!=e[i]&&t[i]!==e[i]&&(t[i]=e[i]);return t},get:function(e){var t=[];t=this.userAgentKey(t),t=this.languageKey(t),t=this.colorDepthKey(t),t=this.pixelRatioKey(t),t=this.hardwareConcurrencyKey(t),t=this.screenResolutionKey(t),t=this.availableScreenResolutionKey(t),t=this.timezoneOffsetKey(t),t=this.sessionStorageKey(t),t=this.localStorageKey(t),t=this.indexedDbKey(t),t=this.addBehaviorKey(t),t=this.openDatabaseKey(t),t=this.cpuClassKey(t),t=this.platformKey(t),t=this.doNotTrackKey(t),t=this.pluginsKey(t),t=this.canvasKey(t),t=this.webglKey(t),t=this.adBlockKey(t),t=this.hasLiedLanguagesKey(t),t=this.hasLiedResolutionKey(t),t=this.hasLiedOsKey(t),t=this.hasLiedBrowserKey(t),t=this.touchSupportKey(t),t=this.customEntropyFunction(t);var i=this;this.fontsKey(t,function(t){var a=[];i.each(t,function(e){var t=e.value;"undefined"!=typeof e.value.join&&(t=e.value.join(";")),a.push(t)});var r=i.x64hash128(a.join("~~~"),31);return e(r,t)})},customEntropyFunction:function(e){return"function"==typeof this.options.customFunction&&e.push({key:"custom",value:this.options.customFunction()}),e},userAgentKey:function(e){return this.options.excludeUserAgent||e.push({key:"user_agent",value:this.getUserAgent()}),e},getUserAgent:function(){return navigator.userAgent},languageKey:function(e){return this.options.excludeLanguage||e.push({key:"language",value:navigator.language||navigator.userLanguage||navigator.browserLanguage||navigator.systemLanguage||""}),e},colorDepthKey:function(e){return this.options.excludeColorDepth||e.push({key:"color_depth",value:screen.colorDepth||-1}),e},pixelRatioKey:function(e){return this.options.excludePixelRatio||e.push({key:"pixel_ratio",value:this.getPixelRatio()}),e},getPixelRatio:function(){return window.devicePixelRatio||""},screenResolutionKey:function(e){return this.options.excludeScreenResolution?e:this.getScreenResolution(e)},getScreenResolution:function(e){var t;return t=this.options.detectScreenOrientation&&screen.height>screen.width?[screen.height,screen.width]:[screen.width,screen.height],"undefined"!=typeof t&&e.push({key:"resolution",value:t}),e},availableScreenResolutionKey:function(e){return this.options.excludeAvailableScreenResolution?e:this.getAvailableScreenResolution(e)},getAvailableScreenResolution:function(e){var t;return screen.availWidth&&screen.availHeight&&(t=this.options.detectScreenOrientation?screen.availHeight>screen.availWidth?[screen.availHeight,screen.availWidth]:[screen.availWidth,screen.availHeight]:[screen.availHeight,screen.availWidth]),"undefined"!=typeof t&&e.push({key:"available_resolution",value:t}),e},timezoneOffsetKey:function(e){return this.options.excludeTimezoneOffset||e.push({key:"timezone_offset",value:(new Date).getTimezoneOffset()}),e},sessionStorageKey:function(e){return!this.options.excludeSessionStorage&&this.hasSessionStorage()&&e.push({key:"session_storage",value:1}),e},localStorageKey:function(e){return!this.options.excludeSessionStorage&&this.hasLocalStorage()&&e.push({key:"local_storage",value:1}),e},indexedDbKey:function(e){return!this.options.excludeIndexedDB&&this.hasIndexedDB()&&e.push({key:"indexed_db",value:1}),e},addBehaviorKey:function(e){return document.body&&!this.options.excludeAddBehavior&&document.body.addBehavior&&e.push({key:"add_behavior",value:1}),e},openDatabaseKey:function(e){return!this.options.excludeOpenDatabase&&window.openDatabase&&e.push({key:"open_database",value:1}),e},cpuClassKey:function(e){return this.options.excludeCpuClass||e.push({key:"cpu_class",value:this.getNavigatorCpuClass()}),e},platformKey:function(e){return this.options.excludePlatform||e.push({key:"navigator_platform",value:this.getNavigatorPlatform()}),e},doNotTrackKey:function(e){return this.options.excludeDoNotTrack||e.push({key:"do_not_track",value:this.getDoNotTrack()}),e},canvasKey:function(e){return!this.options.excludeCanvas&&this.isCanvasSupported()&&e.push({key:"canvas",value:this.getCanvasFp()}),e},webglKey:function(e){return this.options.excludeWebGL?e:this.isWebGlSupported()?(e.push({key:"webgl",value:this.getWebglFp()}),e):e},adBlockKey:function(e){return this.options.excludeAdBlock||e.push({key:"adblock",value:this.getAdBlock()}),e},hasLiedLanguagesKey:function(e){return this.options.excludeHasLiedLanguages||e.push({key:"has_lied_languages",value:this.getHasLiedLanguages()}),e},hasLiedResolutionKey:function(e){return this.options.excludeHasLiedResolution||e.push({key:"has_lied_resolution",value:this.getHasLiedResolution()}),e},hasLiedOsKey:function(e){return this.options.excludeHasLiedOs||e.push({key:"has_lied_os",value:this.getHasLiedOs()}),e},hasLiedBrowserKey:function(e){return this.options.excludeHasLiedBrowser||e.push({key:"has_lied_browser",value:this.getHasLiedBrowser()}),e},fontsKey:function(e,t){return this.options.excludeJsFonts?this.flashFontsKey(e,t):this.jsFontsKey(e,t)},flashFontsKey:function(e,t){return this.options.excludeFlashFonts?t(e):this.hasSwfObjectLoaded()&&this.hasMinFlashInstalled()?"undefined"==typeof this.options.swfPath?t(e):void this.loadSwfAndDetectFonts(function(i){e.push({key:"swf_fonts",value:i.join(";")}),t(e)}):t(e)},jsFontsKey:function(e,t){var i=this;return setTimeout(function(){var a=["monospace","sans-serif","serif"],r=["Andale Mono","Arial","Arial Black","Arial Hebrew","Arial MT","Arial Narrow","Arial Rounded MT Bold","Arial Unicode MS","Bitstream Vera Sans Mono","Book Antiqua","Bookman Old Style","Calibri","Cambria","Cambria Math","Century","Century Gothic","Century Schoolbook","Comic Sans","Comic Sans MS","Consolas","Courier","Courier New","Garamond","Geneva","Georgia","Helvetica","Helvetica Neue","Impact","Lucida Bright","Lucida Calligraphy","Lucida Console","Lucida Fax","LUCIDA GRANDE","Lucida Handwriting","Lucida Sans","Lucida Sans Typewriter","Lucida Sans Unicode","Microsoft Sans Serif","Monaco","Monotype Corsiva","MS Gothic","MS Outlook","MS PGothic","MS Reference Sans Serif","MS Sans Serif","MS Serif","MYRIAD","MYRIAD PRO","Palatino","Palatino Linotype","Segoe Print","Segoe Script","Segoe UI","Segoe UI Light","Segoe UI Semibold","Segoe UI Symbol","Tahoma","Times","Times New Roman","Times New Roman PS","Trebuchet MS","Verdana","Wingdings","Wingdings 2","Wingdings 3"],n=["Abadi MT Condensed Light","Academy Engraved LET","ADOBE CASLON PRO","Adobe Garamond","ADOBE GARAMOND PRO","Agency FB","Aharoni","Albertus Extra Bold","Albertus Medium","Algerian","Amazone BT","American Typewriter","American Typewriter Condensed","AmerType Md BT","Andalus","Angsana New","AngsanaUPC","Antique Olive","Aparajita","Apple Chancery","Apple Color Emoji","Apple SD Gothic Neo","Arabic Typesetting","ARCHER","ARNO PRO","Arrus BT","Aurora Cn BT","AvantGarde Bk BT","AvantGarde Md BT","AVENIR","Ayuthaya","Bandy","Bangla Sangam MN","Bank Gothic","BankGothic Md BT","Baskerville","Baskerville Old Face","Batang","BatangChe","Bauer Bodoni","Bauhaus 93","Bazooka","Bell MT","Bembo","Benguiat Bk BT","Berlin Sans FB","Berlin Sans FB Demi","Bernard MT Condensed","BernhardFashion BT","BernhardMod BT","Big Caslon","BinnerD","Blackadder ITC","BlairMdITC TT","Bodoni 72","Bodoni 72 Oldstyle","Bodoni 72 Smallcaps","Bodoni MT","Bodoni MT Black","Bodoni MT Condensed","Bodoni MT Poster Compressed","Bookshelf Symbol 7","Boulder","Bradley Hand","Bradley Hand ITC","Bremen Bd BT","Britannic Bold","Broadway","Browallia New","BrowalliaUPC","Brush Script MT","Californian FB","Calisto MT","Calligrapher","Candara","CaslonOpnface BT","Castellar","Centaur","Cezanne","CG Omega","CG Times","Chalkboard","Chalkboard SE","Chalkduster","Charlesworth","Charter Bd BT","Charter BT","Chaucer","ChelthmITC Bk BT","Chiller","Clarendon","Clarendon Condensed","CloisterBlack BT","Cochin","Colonna MT","Constantia","Cooper Black","Copperplate","Copperplate Gothic","Copperplate Gothic Bold","Copperplate Gothic Light","CopperplGoth Bd BT","Corbel","Cordia New","CordiaUPC","Cornerstone","Coronet","Cuckoo","Curlz MT","DaunPenh","Dauphin","David","DB LCD Temp","DELICIOUS","Denmark","DFKai-SB","Didot","DilleniaUPC","DIN","DokChampa","Dotum","DotumChe","Ebrima","Edwardian Script ITC","Elephant","English 111 Vivace BT","Engravers MT","EngraversGothic BT","Eras Bold ITC","Eras Demi ITC","Eras Light ITC","Eras Medium ITC","EucrosiaUPC","Euphemia","Euphemia UCAS","EUROSTILE","Exotc350 Bd BT","FangSong","Felix Titling","Fixedsys","FONTIN","Footlight MT Light","Forte","FrankRuehl","Fransiscan","Freefrm721 Blk BT","FreesiaUPC","Freestyle Script","French Script MT","FrnkGothITC Bk BT","Fruitger","FRUTIGER","Futura","Futura Bk BT","Futura Lt BT","Futura Md BT","Futura ZBlk BT","FuturaBlack BT","Gabriola","Galliard BT","Gautami","Geeza Pro","Geometr231 BT","Geometr231 Hv BT","Geometr231 Lt BT","GeoSlab 703 Lt BT","GeoSlab 703 XBd BT","Gigi","Gill Sans","Gill Sans MT","Gill Sans MT Condensed","Gill Sans MT Ext Condensed Bold","Gill Sans Ultra Bold","Gill Sans Ultra Bold Condensed","Gisha","Gloucester MT Extra Condensed","GOTHAM","GOTHAM BOLD","Goudy Old Style","Goudy Stout","GoudyHandtooled BT","GoudyOLSt BT","Gujarati Sangam MN","Gulim","GulimChe","Gungsuh","GungsuhChe","Gurmukhi MN","Haettenschweiler","Harlow Solid Italic","Harrington","Heather","Heiti SC","Heiti TC","HELV","Herald","High Tower Text","Hiragino Kaku Gothic ProN","Hiragino Mincho ProN","Hoefler Text","Humanst 521 Cn BT","Humanst521 BT","Humanst521 Lt BT","Imprint MT Shadow","Incised901 Bd BT","Incised901 BT","Incised901 Lt BT","INCONSOLATA","Informal Roman","Informal011 BT","INTERSTATE","IrisUPC","Iskoola Pota","JasmineUPC","Jazz LET","Jenson","Jester","Jokerman","Juice ITC","Kabel Bk BT","Kabel Ult BT","Kailasa","KaiTi","Kalinga","Kannada Sangam MN","Kartika","Kaufmann Bd BT","Kaufmann BT","Khmer UI","KodchiangUPC","Kokila","Korinna BT","Kristen ITC","Krungthep","Kunstler Script","Lao UI","Latha","Leelawadee","Letter Gothic","Levenim MT","LilyUPC","Lithograph","Lithograph Light","Long Island","Lydian BT","Magneto","Maiandra GD","Malayalam Sangam MN","Malgun Gothic","Mangal","Marigold","Marion","Marker Felt","Market","Marlett","Matisse ITC","Matura MT Script Capitals","Meiryo","Meiryo UI","Microsoft Himalaya","Microsoft JhengHei","Microsoft New Tai Lue","Microsoft PhagsPa","Microsoft Tai Le","Microsoft Uighur","Microsoft YaHei","Microsoft Yi Baiti","MingLiU","MingLiU_HKSCS","MingLiU_HKSCS-ExtB","MingLiU-ExtB","Minion","Minion Pro","Miriam","Miriam Fixed","Mistral","Modern","Modern No. 20","Mona Lisa Solid ITC TT","Mongolian Baiti","MONO","MoolBoran","Mrs Eaves","MS LineDraw","MS Mincho","MS PMincho","MS Reference Specialty","MS UI Gothic","MT Extra","MUSEO","MV Boli","Nadeem","Narkisim","NEVIS","News Gothic","News GothicMT","NewsGoth BT","Niagara Engraved","Niagara Solid","Noteworthy","NSimSun","Nyala","OCR A Extended","Old Century","Old English Text MT","Onyx","Onyx BT","OPTIMA","Oriya Sangam MN","OSAKA","OzHandicraft BT","Palace Script MT","Papyrus","Parchment","Party LET","Pegasus","Perpetua","Perpetua Titling MT","PetitaBold","Pickwick","Plantagenet Cherokee","Playbill","PMingLiU","PMingLiU-ExtB","Poor Richard","Poster","PosterBodoni BT","PRINCETOWN LET","Pristina","PTBarnum BT","Pythagoras","Raavi","Rage Italic","Ravie","Ribbon131 Bd BT","Rockwell","Rockwell Condensed","Rockwell Extra Bold","Rod","Roman","Sakkal Majalla","Santa Fe LET","Savoye LET","Sceptre","Script","Script MT Bold","SCRIPTINA","Serifa","Serifa BT","Serifa Th BT","ShelleyVolante BT","Sherwood","Shonar Bangla","Showcard Gothic","Shruti","Signboard","SILKSCREEN","SimHei","Simplified Arabic","Simplified Arabic Fixed","SimSun","SimSun-ExtB","Sinhala Sangam MN","Sketch Rockwell","Skia","Small Fonts","Snap ITC","Snell Roundhand","Socket","Souvenir Lt BT","Staccato222 BT","Steamer","Stencil","Storybook","Styllo","Subway","Swis721 BlkEx BT","Swiss911 XCm BT","Sylfaen","Synchro LET","System","Tamil Sangam MN","Technical","Teletype","Telugu Sangam MN","Tempus Sans ITC","Terminal","Thonburi","Traditional Arabic","Trajan","TRAJAN PRO","Tristan","Tubular","Tunga","Tw Cen MT","Tw Cen MT Condensed","Tw Cen MT Condensed Extra Bold","TypoUpright BT","Unicorn","Univers","Univers CE 55 Medium","Univers Condensed","Utsaah","Vagabond","Vani","Vijaya","Viner Hand ITC","VisualUI","Vivaldi","Vladimir Script","Vrinda","Westminster","WHITNEY","Wide Latin","ZapfEllipt BT","ZapfHumnst BT","ZapfHumnst Dm BT","Zapfino","Zurich BlkEx BT","Zurich Ex BT","ZWAdobeF"];i.options.extendedJsFonts&&(r=r.concat(n)),r=r.concat(i.options.userDefinedFonts);var o="mmmmmmmmmmlli",s="72px",l=document.getElementsByTagName("body")[0],h=document.createElement("div"),u=document.createElement("div"),c={},d={},g=function(){var e=document.createElement("span");return e.style.position="absolute",e.style.left="-9999px",e.style.fontSize=s,e.style.lineHeight="normal",e.innerHTML=o,e},p=function(e,t){var i=g();return i.style.fontFamily="'"+e+"',"+t,i},f=function(){for(var e=[],t=0,i=a.length;t<i;t++){var r=g();r.style.fontFamily=a[t],h.appendChild(r),e.push(r)}return e},m=function(){for(var e={},t=0,i=r.length;t<i;t++){for(var n=[],o=0,s=a.length;o<s;o++){var l=p(r[t],a[o]);u.appendChild(l),n.push(l)}e[r[t]]=n}return e},T=function(e){for(var t=!1,i=0;i<a.length;i++)if(t=e[i].offsetWidth!==c[a[i]]||e[i].offsetHeight!==d[a[i]])return t;return t},S=f();l.appendChild(h);for(var x=0,v=a.length;x<v;x++)c[a[x]]=S[x].offsetWidth,d[a[x]]=S[x].offsetHeight;var E=m();l.appendChild(u);for(var M=[],A=0,y=r.length;A<y;A++)T(E[r[A]])&&M.push(r[A]);l.removeChild(u),l.removeChild(h),e.push({key:"js_fonts",value:M}),t(e)},1)},pluginsKey:function(e){return this.options.excludePlugins||(this.isIE()?this.options.excludeIEPlugins||e.push({key:"ie_plugins",value:this.getIEPlugins()}):e.push({key:"regular_plugins",value:this.getRegularPlugins()})),e},getRegularPlugins:function(){for(var e=[],t=0,i=navigator.plugins.length;t<i;t++)e.push(navigator.plugins[t]);return this.pluginsShouldBeSorted()&&(e=e.sort(function(e,t){return e.name>t.name?1:e.name<t.name?-1:0})),this.map(e,function(e){var t=this.map(e,function(e){return[e.type,e.suffixes].join("~")}).join(",");return[e.name,e.description,t].join("::")},this)},getIEPlugins:function(){var e=[];if(Object.getOwnPropertyDescriptor&&Object.getOwnPropertyDescriptor(window,"ActiveXObject")||"ActiveXObject"in window){var t=["AcroPDF.PDF","Adodb.Stream","AgControl.AgControl","DevalVRXCtrl.DevalVRXCtrl.1","MacromediaFlashPaper.MacromediaFlashPaper","Msxml2.DOMDocument","Msxml2.XMLHTTP","PDF.PdfCtrl","QuickTime.QuickTime","QuickTimeCheckObject.QuickTimeCheck.1","RealPlayer","RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)","RealVideo.RealVideo(tm) ActiveX Control (32-bit)","Scripting.Dictionary","SWCtl.SWCtl","Shell.UIHelper","ShockwaveFlash.ShockwaveFlash","Skype.Detection","TDCCtl.TDCCtl","WMPlayer.OCX","rmocx.RealPlayer G2 Control","rmocx.RealPlayer G2 Control.1"];e=this.map(t,function(e){try{return new ActiveXObject(e),e}catch(t){return null}})}return navigator.plugins&&(e=e.concat(this.getRegularPlugins())),e},pluginsShouldBeSorted:function(){for(var e=!1,t=0,i=this.options.sortPluginsFor.length;t<i;t++){var a=this.options.sortPluginsFor[t];if(navigator.userAgent.match(a)){e=!0;break}}return e},touchSupportKey:function(e){return this.options.excludeTouchSupport||e.push({key:"touch_support",value:this.getTouchSupport()}),e},hardwareConcurrencyKey:function(e){return this.options.excludeHardwareConcurrency||e.push({key:"hardware_concurrency",value:this.getHardwareConcurrency()}),e},hasSessionStorage:function(){try{return!!window.sessionStorage}catch(e){return!0}},hasLocalStorage:function(){try{return!!window.localStorage}catch(e){return!0}},hasIndexedDB:function(){try{return!!window.indexedDB}catch(e){return!0}},getHardwareConcurrency:function(){return navigator.hardwareConcurrency?navigator.hardwareConcurrency:"unknown"},getNavigatorCpuClass:function(){return navigator.cpuClass?navigator.cpuClass:"unknown"},getNavigatorPlatform:function(){return navigator.platform?navigator.platform:"unknown"},getDoNotTrack:function(){return navigator.doNotTrack?navigator.doNotTrack:navigator.msDoNotTrack?navigator.msDoNotTrack:window.doNotTrack?window.doNotTrack:"unknown"},getTouchSupport:function(){var e=0,t=!1;"undefined"!=typeof navigator.maxTouchPoints?e=navigator.maxTouchPoints:"undefined"!=typeof navigator.msMaxTouchPoints&&(e=navigator.msMaxTouchPoints);try{document.createEvent("TouchEvent"),t=!0}catch(i){}var a="ontouchstart"in window;return[e,t,a]},getCanvasFp:function(){var e=[],t=document.createElement("canvas");t.width=2e3,t.height=200,t.style.display="inline";var i=t.getContext("2d");return i.rect(0,0,10,10),i.rect(2,2,6,6),e.push("canvas winding:"+(i.isPointInPath(5,5,"evenodd")===!1?"yes":"no")),i.textBaseline="alphabetic",i.fillStyle="#f60",i.fillRect(125,1,62,20),i.fillStyle="#069",this.options.dontUseFakeFontInCanvas?i.font="11pt Arial":i.font="11pt no-real-font-123",i.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03",2,15),i.fillStyle="rgba(102, 204, 0, 0.2)",i.font="18pt Arial",i.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03",4,45),i.globalCompositeOperation="multiply",i.fillStyle="rgb(255,0,255)",i.beginPath(),i.arc(50,50,50,0,2*Math.PI,!0),i.closePath(),i.fill(),i.fillStyle="rgb(0,255,255)",i.beginPath(),i.arc(100,50,50,0,2*Math.PI,!0),i.closePath(),i.fill(),i.fillStyle="rgb(255,255,0)",i.beginPath(),i.arc(75,100,50,0,2*Math.PI,!0),i.closePath(),i.fill(),i.fillStyle="rgb(255,0,255)",i.arc(75,75,75,0,2*Math.PI,!0),i.arc(75,75,25,0,2*Math.PI,!0),i.fill("evenodd"),e.push("canvas fp:"+t.toDataURL()),e.join("~")},getWebglFp:function(){var e,t=function(t){return e.clearColor(0,0,0,1),e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL),e.clear(e.COLOR_BUFFER_BIT|e.DEPTH_BUFFER_BIT),"["+t[0]+", "+t[1]+"]"},i=function(e){var t,i=e.getExtension("EXT_texture_filter_anisotropic")||e.getExtension("WEBKIT_EXT_texture_filter_anisotropic")||e.getExtension("MOZ_EXT_texture_filter_anisotropic");return i?(t=e.getParameter(i.MAX_TEXTURE_MAX_ANISOTROPY_EXT),0===t&&(t=2),t):null};if(e=this.getWebglCanvas(),!e)return null;var a=[],r="attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}",n="precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}",o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o);var s=new Float32Array([-.2,-.9,0,.4,-.26,0,0,.732134444,0]);e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW),o.itemSize=3,o.numItems=3;var l=e.createProgram(),h=e.createShader(e.VERTEX_SHADER);e.shaderSource(h,r),e.compileShader(h);var u=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(u,n),e.compileShader(u),e.attachShader(l,h),e.attachShader(l,u),e.linkProgram(l),e.useProgram(l),l.vertexPosAttrib=e.getAttribLocation(l,"attrVertex"),l.offsetUniform=e.getUniformLocation(l,"uniformOffset"),e.enableVertexAttribArray(l.vertexPosArray),e.vertexAttribPointer(l.vertexPosAttrib,o.itemSize,e.FLOAT,!1,0,0),e.uniform2f(l.offsetUniform,1,1),e.drawArrays(e.TRIANGLE_STRIP,0,o.numItems),null!=e.canvas&&a.push(e.canvas.toDataURL()),a.push("extensions:"+e.getSupportedExtensions().join(";")),a.push("webgl aliased line width range:"+t(e.getParameter(e.ALIASED_LINE_WIDTH_RANGE))),a.push("webgl aliased point size range:"+t(e.getParameter(e.ALIASED_POINT_SIZE_RANGE))),a.push("webgl alpha bits:"+e.getParameter(e.ALPHA_BITS)),a.push("webgl antialiasing:"+(e.getContextAttributes().antialias?"yes":"no")),a.push("webgl blue bits:"+e.getParameter(e.BLUE_BITS)),a.push("webgl depth bits:"+e.getParameter(e.DEPTH_BITS)),a.push("webgl green bits:"+e.getParameter(e.GREEN_BITS)),a.push("webgl max anisotropy:"+i(e)),a.push("webgl max combined texture image units:"+e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS)),a.push("webgl max cube map texture size:"+e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE)),a.push("webgl max fragment uniform vectors:"+e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS)),a.push("webgl max render buffer size:"+e.getParameter(e.MAX_RENDERBUFFER_SIZE)),a.push("webgl max texture image units:"+e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS)),a.push("webgl max texture size:"+e.getParameter(e.MAX_TEXTURE_SIZE)),a.push("webgl max varying vectors:"+e.getParameter(e.MAX_VARYING_VECTORS)),a.push("webgl max vertex attribs:"+e.getParameter(e.MAX_VERTEX_ATTRIBS)),a.push("webgl max vertex texture image units:"+e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS)),a.push("webgl max vertex uniform vectors:"+e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS)),a.push("webgl max viewport dims:"+t(e.getParameter(e.MAX_VIEWPORT_DIMS))),a.push("webgl red bits:"+e.getParameter(e.RED_BITS)),a.push("webgl renderer:"+e.getParameter(e.RENDERER)),a.push("webgl shading language version:"+e.getParameter(e.SHADING_LANGUAGE_VERSION)),a.push("webgl stencil bits:"+e.getParameter(e.STENCIL_BITS)),a.push("webgl vendor:"+e.getParameter(e.VENDOR)),a.push("webgl version:"+e.getParameter(e.VERSION));try{var c=e.getExtension("WEBGL_debug_renderer_info");c&&(a.push("webgl unmasked vendor:"+e.getParameter(c.UNMASKED_VENDOR_WEBGL)),a.push("webgl unmasked renderer:"+e.getParameter(c.UNMASKED_RENDERER_WEBGL)))}catch(d){}return e.getShaderPrecisionFormat?(a.push("webgl vertex shader high float precision:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision),a.push("webgl vertex shader high float precision rangeMin:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).rangeMin),a.push("webgl vertex shader high float precision rangeMax:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).rangeMax),a.push("webgl vertex shader medium float precision:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision),a.push("webgl vertex shader medium float precision rangeMin:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).rangeMin),a.push("webgl vertex shader medium float precision rangeMax:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).rangeMax),a.push("webgl vertex shader low float precision:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.LOW_FLOAT).precision),a.push("webgl vertex shader low float precision rangeMin:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.LOW_FLOAT).rangeMin),a.push("webgl vertex shader low float precision rangeMax:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.LOW_FLOAT).rangeMax),a.push("webgl fragment shader high float precision:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision),a.push("webgl fragment shader high float precision rangeMin:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).rangeMin),a.push("webgl fragment shader high float precision rangeMax:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).rangeMax),a.push("webgl fragment shader medium float precision:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision),a.push("webgl fragment shader medium float precision rangeMin:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).rangeMin),a.push("webgl fragment shader medium float precision rangeMax:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).rangeMax),a.push("webgl fragment shader low float precision:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.LOW_FLOAT).precision),a.push("webgl fragment shader low float precision rangeMin:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.LOW_FLOAT).rangeMin),a.push("webgl fragment shader low float precision rangeMax:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.LOW_FLOAT).rangeMax),a.push("webgl vertex shader high int precision:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_INT).precision),a.push("webgl vertex shader high int precision rangeMin:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_INT).rangeMin),a.push("webgl vertex shader high int precision rangeMax:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_INT).rangeMax),a.push("webgl vertex shader medium int precision:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_INT).precision),a.push("webgl vertex shader medium int precision rangeMin:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_INT).rangeMin),a.push("webgl vertex shader medium int precision rangeMax:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_INT).rangeMax),a.push("webgl vertex shader low int precision:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.LOW_INT).precision),a.push("webgl vertex shader low int precision rangeMin:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.LOW_INT).rangeMin),a.push("webgl vertex shader low int precision rangeMax:"+e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.LOW_INT).rangeMax),a.push("webgl fragment shader high int precision:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_INT).precision),a.push("webgl fragment shader high int precision rangeMin:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_INT).rangeMin),a.push("webgl fragment shader high int precision rangeMax:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_INT).rangeMax),a.push("webgl fragment shader medium int precision:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_INT).precision),a.push("webgl fragment shader medium int precision rangeMin:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_INT).rangeMin),a.push("webgl fragment shader medium int precision rangeMax:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_INT).rangeMax),a.push("webgl fragment shader low int precision:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.LOW_INT).precision),a.push("webgl fragment shader low int precision rangeMin:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.LOW_INT).rangeMin),a.push("webgl fragment shader low int precision rangeMax:"+e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.LOW_INT).rangeMax),a.join("~")):a.join("~")},getAdBlock:function(){var e=document.createElement("div");e.innerHTML="&nbsp;",e.className="adsbox";var t=!1;try{document.body.appendChild(e),t=0===document.getElementsByClassName("adsbox")[0].offsetHeight,document.body.removeChild(e)}catch(i){t=!1}return t},getHasLiedLanguages:function(){if("undefined"!=typeof navigator.languages)try{var e=navigator.languages[0].substr(0,2);if(e!==navigator.language.substr(0,2))return!0}catch(t){return!0}return!1},getHasLiedResolution:function(){return screen.width<screen.availWidth||screen.height<screen.availHeight},getHasLiedOs:function(){var e,t=navigator.userAgent.toLowerCase(),i=navigator.oscpu,a=navigator.platform.toLowerCase();e=t.indexOf("windows phone")>=0?"Windows Phone":t.indexOf("win")>=0?"Windows":t.indexOf("android")>=0?"Android":t.indexOf("linux")>=0?"Linux":t.indexOf("iphone")>=0||t.indexOf("ipad")>=0?"iOS":t.indexOf("mac")>=0?"Mac":"Other";var r;if(r="ontouchstart"in window||navigator.maxTouchPoints>0||navigator.msMaxTouchPoints>0,r&&"Windows Phone"!==e&&"Android"!==e&&"iOS"!==e&&"Other"!==e)return!0;if("undefined"!=typeof i){if(i=i.toLowerCase(),i.indexOf("win")>=0&&"Windows"!==e&&"Windows Phone"!==e)return!0;if(i.indexOf("linux")>=0&&"Linux"!==e&&"Android"!==e)return!0;if(i.indexOf("mac")>=0&&"Mac"!==e&&"iOS"!==e)return!0;if(0===i.indexOf("win")&&0===i.indexOf("linux")&&i.indexOf("mac")>=0&&"other"!==e)return!0}return a.indexOf("win")>=0&&"Windows"!==e&&"Windows Phone"!==e||((a.indexOf("linux")>=0||a.indexOf("android")>=0||a.indexOf("pike")>=0)&&"Linux"!==e&&"Android"!==e||((a.indexOf("mac")>=0||a.indexOf("ipad")>=0||a.indexOf("ipod")>=0||a.indexOf("iphone")>=0)&&"Mac"!==e&&"iOS"!==e||(0===a.indexOf("win")&&0===a.indexOf("linux")&&a.indexOf("mac")>=0&&"other"!==e||"undefined"==typeof navigator.plugins&&"Windows"!==e&&"Windows Phone"!==e)))},getHasLiedBrowser:function(){var e,t=navigator.userAgent.toLowerCase(),i=navigator.productSub;if(e=t.indexOf("firefox")>=0?"Firefox":t.indexOf("opera")>=0||t.indexOf("opr")>=0?"Opera":t.indexOf("chrome")>=0?"Chrome":t.indexOf("safari")>=0?"Safari":t.indexOf("trident")>=0?"Internet Explorer":"Other",("Chrome"===e||"Safari"===e||"Opera"===e)&&"20030107"!==i)return!0;var a=eval.toString().length;if(37===a&&"Safari"!==e&&"Firefox"!==e&&"Other"!==e)return!0;if(39===a&&"Internet Explorer"!==e&&"Other"!==e)return!0;if(33===a&&"Chrome"!==e&&"Opera"!==e&&"Other"!==e)return!0;var r;try{throw"a"}catch(n){try{n.toSource(),r=!0}catch(o){r=!1}}return!(!r||"Firefox"===e||"Other"===e)},isCanvasSupported:function(){var e=document.createElement("canvas");return!(!e.getContext||!e.getContext("2d"))},isWebGlSupported:function(){if(!this.isCanvasSupported())return!1;var e,t=document.createElement("canvas");try{e=t.getContext&&(t.getContext("webgl")||t.getContext("experimental-webgl"))}catch(i){e=!1}return!!window.WebGLRenderingContext&&!!e},isIE:function(){return"Microsoft Internet Explorer"===navigator.appName||!("Netscape"!==navigator.appName||!/Trident/.test(navigator.userAgent))},hasSwfObjectLoaded:function(){return"undefined"!=typeof window.swfobject},hasMinFlashInstalled:function(){return swfobject.hasFlashPlayerVersion("9.0.0")},addFlashDivNode:function(){var e=document.createElement("div");e.setAttribute("id",this.options.swfContainerId),document.body.appendChild(e)},loadSwfAndDetectFonts:function(e){var t="___fp_swf_loaded";window[t]=function(t){e(t)};var i=this.options.swfContainerId;this.addFlashDivNode();var a={onReady:t},r={allowScriptAccess:"always",menu:"false"};swfobject.embedSWF(this.options.swfPath,i,"1","1","9.0.0",!1,a,r,{})},getWebglCanvas:function(){var e=document.createElement("canvas"),t=null;try{t=e.getContext("webgl")||e.getContext("experimental-webgl")}catch(i){}return t||(t=null),t},each:function(e,t,i){if(null!==e)if(this.nativeForEach&&e.forEach===this.nativeForEach)e.forEach(t,i);else if(e.length===+e.length){for(var a=0,r=e.length;a<r;a++)if(t.call(i,e[a],a,e)==={})return}else for(var n in e)if(e.hasOwnProperty(n)&&t.call(i,e[n],n,e)==={})return},map:function(e,t,i){var a=[];return null==e?a:this.nativeMap&&e.map===this.nativeMap?e.map(t,i):(this.each(e,function(e,r,n){a[a.length]=t.call(i,e,r,n)}),a)},x64Add:function(e,t){e=[e[0]>>>16,65535&e[0],e[1]>>>16,65535&e[1]],t=[t[0]>>>16,65535&t[0],t[1]>>>16,65535&t[1]];var i=[0,0,0,0];return i[3]+=e[3]+t[3],i[2]+=i[3]>>>16,i[3]&=65535,i[2]+=e[2]+t[2],i[1]+=i[2]>>>16,i[2]&=65535,i[1]+=e[1]+t[1],i[0]+=i[1]>>>16,i[1]&=65535,i[0]+=e[0]+t[0],i[0]&=65535,[i[0]<<16|i[1],i[2]<<16|i[3]]},x64Multiply:function(e,t){e=[e[0]>>>16,65535&e[0],e[1]>>>16,65535&e[1]],t=[t[0]>>>16,65535&t[0],t[1]>>>16,65535&t[1]];var i=[0,0,0,0];return i[3]+=e[3]*t[3],i[2]+=i[3]>>>16,i[3]&=65535,i[2]+=e[2]*t[3],i[1]+=i[2]>>>16,i[2]&=65535,i[2]+=e[3]*t[2],i[1]+=i[2]>>>16,i[2]&=65535,i[1]+=e[1]*t[3],i[0]+=i[1]>>>16,i[1]&=65535,i[1]+=e[2]*t[2],i[0]+=i[1]>>>16,i[1]&=65535,i[1]+=e[3]*t[1],i[0]+=i[1]>>>16,i[1]&=65535,i[0]+=e[0]*t[3]+e[1]*t[2]+e[2]*t[1]+e[3]*t[0],i[0]&=65535,[i[0]<<16|i[1],i[2]<<16|i[3]]},x64Rotl:function(e,t){return t%=64,32===t?[e[1],e[0]]:t<32?[e[0]<<t|e[1]>>>32-t,e[1]<<t|e[0]>>>32-t]:(t-=32,[e[1]<<t|e[0]>>>32-t,e[0]<<t|e[1]>>>32-t])},x64LeftShift:function(e,t){return t%=64,0===t?e:t<32?[e[0]<<t|e[1]>>>32-t,e[1]<<t]:[e[1]<<t-32,0]},x64Xor:function(e,t){return[e[0]^t[0],e[1]^t[1]]},x64Fmix:function(e){return e=this.x64Xor(e,[0,e[0]>>>1]),e=this.x64Multiply(e,[4283543511,3981806797]),e=this.x64Xor(e,[0,e[0]>>>1]),e=this.x64Multiply(e,[3301882366,444984403]),e=this.x64Xor(e,[0,e[0]>>>1])},x64hash128:function(e,t){e=e||"",t=t||0;for(var i=e.length%16,a=e.length-i,r=[0,t],n=[0,t],o=[0,0],s=[0,0],l=[2277735313,289559509],h=[1291169091,658871167],u=0;u<a;u+=16)o=[255&e.charCodeAt(u+4)|(255&e.charCodeAt(u+5))<<8|(255&e.charCodeAt(u+6))<<16|(255&e.charCodeAt(u+7))<<24,255&e.charCodeAt(u)|(255&e.charCodeAt(u+1))<<8|(255&e.charCodeAt(u+2))<<16|(255&e.charCodeAt(u+3))<<24],
	s=[255&e.charCodeAt(u+12)|(255&e.charCodeAt(u+13))<<8|(255&e.charCodeAt(u+14))<<16|(255&e.charCodeAt(u+15))<<24,255&e.charCodeAt(u+8)|(255&e.charCodeAt(u+9))<<8|(255&e.charCodeAt(u+10))<<16|(255&e.charCodeAt(u+11))<<24],o=this.x64Multiply(o,l),o=this.x64Rotl(o,31),o=this.x64Multiply(o,h),r=this.x64Xor(r,o),r=this.x64Rotl(r,27),r=this.x64Add(r,n),r=this.x64Add(this.x64Multiply(r,[0,5]),[0,1390208809]),s=this.x64Multiply(s,h),s=this.x64Rotl(s,33),s=this.x64Multiply(s,l),n=this.x64Xor(n,s),n=this.x64Rotl(n,31),n=this.x64Add(n,r),n=this.x64Add(this.x64Multiply(n,[0,5]),[0,944331445]);switch(o=[0,0],s=[0,0],i){case 15:s=this.x64Xor(s,this.x64LeftShift([0,e.charCodeAt(u+14)],48));case 14:s=this.x64Xor(s,this.x64LeftShift([0,e.charCodeAt(u+13)],40));case 13:s=this.x64Xor(s,this.x64LeftShift([0,e.charCodeAt(u+12)],32));case 12:s=this.x64Xor(s,this.x64LeftShift([0,e.charCodeAt(u+11)],24));case 11:s=this.x64Xor(s,this.x64LeftShift([0,e.charCodeAt(u+10)],16));case 10:s=this.x64Xor(s,this.x64LeftShift([0,e.charCodeAt(u+9)],8));case 9:s=this.x64Xor(s,[0,e.charCodeAt(u+8)]),s=this.x64Multiply(s,h),s=this.x64Rotl(s,33),s=this.x64Multiply(s,l),n=this.x64Xor(n,s);case 8:o=this.x64Xor(o,this.x64LeftShift([0,e.charCodeAt(u+7)],56));case 7:o=this.x64Xor(o,this.x64LeftShift([0,e.charCodeAt(u+6)],48));case 6:o=this.x64Xor(o,this.x64LeftShift([0,e.charCodeAt(u+5)],40));case 5:o=this.x64Xor(o,this.x64LeftShift([0,e.charCodeAt(u+4)],32));case 4:o=this.x64Xor(o,this.x64LeftShift([0,e.charCodeAt(u+3)],24));case 3:o=this.x64Xor(o,this.x64LeftShift([0,e.charCodeAt(u+2)],16));case 2:o=this.x64Xor(o,this.x64LeftShift([0,e.charCodeAt(u+1)],8));case 1:o=this.x64Xor(o,[0,e.charCodeAt(u)]),o=this.x64Multiply(o,l),o=this.x64Rotl(o,31),o=this.x64Multiply(o,h),r=this.x64Xor(r,o)}return r=this.x64Xor(r,[0,e.length]),n=this.x64Xor(n,[0,e.length]),r=this.x64Add(r,n),n=this.x64Add(n,r),r=this.x64Fmix(r),n=this.x64Fmix(n),r=this.x64Add(r,n),n=this.x64Add(n,r),("00000000"+(r[0]>>>0).toString(16)).slice(-8)+("00000000"+(r[1]>>>0).toString(16)).slice(-8)+("00000000"+(n[0]>>>0).toString(16)).slice(-8)+("00000000"+(n[1]>>>0).toString(16)).slice(-8)}},e.VERSION="1.5.1",e});

/***/ }
/******/ ]);
//# sourceMappingURL=radiokit-toolkit-playback.js.map