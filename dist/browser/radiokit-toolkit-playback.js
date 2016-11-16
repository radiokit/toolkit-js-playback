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
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(2);
	var SyncClock_1 = __webpack_require__(3);
	var PlaylistFetcher_1 = __webpack_require__(4);
	var AudioManager_1 = __webpack_require__(7);
	var Player = (function (_super) {
	    __extends(Player, _super);
	    function Player(channelId, accessToken) {
	        _super.call(this);
	        this.__fetchTimeoutId = 0;
	        this.__clock = null;
	        this.__playlistFetcher = null;
	        this.__started = false;
	        this.__channelId = channelId;
	        this.__accessToken = accessToken;
	        this.__audioManager = new AudioManager_1.AudioManager();
	    }
	    Player.prototype.start = function () {
	        this.__startFetching();
	        this.__started = true;
	        return this;
	    };
	    Player.prototype.stop = function () {
	        this.__stopFetching();
	        this.__audioManager.cleanup();
	        this.__started = false;
	        return this;
	    };
	    Player.prototype.isStarted = function () {
	        return this.__started;
	    };
	    Player.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__channelId;
	    };
	    Player.prototype.__startFetching = function () {
	        this.__fetchOnceAndRepeat();
	    };
	    Player.prototype.__stopFetching = function () {
	        if (this.__fetchTimeoutId !== 0) {
	            clearTimeout(this.__fetchTimeoutId);
	            this.__fetchTimeoutId = 0;
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
	                    _this.__playlistFetcher = new PlaylistFetcher_1.PlaylistFetcher(_this.__channelId, _this.__accessToken, clock);
	                    return _this.__fetchPlaylist(resolve, reject);
	                })
	                    .catch(function (error) {
	                    _this.warn("Fetch error: Unable to sync clock (" + error.message + ")");
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
	            reject(new Error("Unable to fetch playlist (" + error.message + ")"));
	        });
	    };
	    Player.prototype.__fetchOnceAndRepeat = function () {
	        var _this = this;
	        this.__fetchOnce()
	            .then(function (playlist) {
	            if (_this.__started) {
	                _this.__audioManager.update(playlist, _this.__clock);
	            }
	            _this.__scheduleNextFetch();
	        })
	            .catch(function (error) {
	            _this.__scheduleNextFetch();
	        });
	    };
	    Player.prototype.__scheduleNextFetch = function () {
	        var _this = this;
	        if (this.__started) {
	            var timeout = 2000 + Math.round(Math.random() * 250);
	            this.debug("Fetch: Scheduling next fetch in " + timeout + " ms");
	            this.__fetchTimeoutId = setTimeout(function () {
	                _this.__fetchTimeoutId = 0;
	                _this.__fetchOnceAndRepeat();
	            }, timeout);
	        }
	    };
	    return Player;
	}(Base_1.Base));
	exports.Player = Player;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	var Base = (function () {
	    function Base() {
	        this.__events = {};
	    }
	    Base.prototype.on = function (eventName, callback) {
	    };
	    Base.prototype.off = function (eventName, callback) {
	    };
	    Base.prototype.warn = function (message) {
	        console.warn("[RadioKit.Playback " + new Date().toISOString() + " " + this._loggerTag() + "] " + message);
	    };
	    Base.prototype.info = function (message) {
	        console.info("[RadioKit.Playback " + new Date().toISOString() + " " + this._loggerTag() + "] " + message);
	    };
	    Base.prototype.debug = function (message) {
	        console.debug("[RadioKit.Playback " + new Date().toISOString() + " " + this._loggerTag() + "] " + message);
	    };
	    return Base;
	}());
	exports.Base = Base;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(2);
	var SyncClock = (function (_super) {
	    __extends(SyncClock, _super);
	    function SyncClock(serverDate) {
	        _super.call(this);
	        this.__offset = serverDate - Date.now();
	        this.debug("Synchronized clock: offset = " + this.__offset + " ms");
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
	var Playlist_1 = __webpack_require__(5);
	var PlaylistFetcher = (function () {
	    function PlaylistFetcher(channelId, accessToken, clock) {
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
	                '&s[]=cue%20' + encodeURIComponent(new Date(now).toISOString()) + '%2020%20600' +
	                '&c[references][]=deq%20broadcast_channel_id%20' + encodeURIComponent(_this.__channelId) +
	                '&o[]=cue_in_at%20asc';
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.setRequestHeader('Authorization', "Bearer " + _this.__accessToken);
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
	                        resolve(Playlist_1.Playlist.makeFromJson(responseAsJson["data"]));
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
	var Track_1 = __webpack_require__(6);
	var Playlist = (function () {
	    function Playlist(tracks) {
	        this.__tracks = tracks;
	    }
	    Playlist.makeFromJson = function (data) {
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
	            var track = new Track_1.Track(id, fileId, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt);
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(2);
	var Track = (function (_super) {
	    __extends(Track, _super);
	    function Track(id, fileId, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt) {
	        _super.call(this);
	        this.__id = id;
	        this.__fileId = fileId;
	        this.__cueInAt = cueInAt;
	        this.__cueOutAt = cueOutAt;
	        this.__cueOffset = cueOffset;
	        this.__fadeInAt = fadeInAt;
	        this.__fadeOutAt = fadeOutAt;
	    }
	    Track.prototype.getId = function () {
	        return this.__id;
	    };
	    Track.prototype.getFileId = function () {
	        return this.__fileId;
	    };
	    Track.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__id;
	    };
	    return Track;
	}(Base_1.Base));
	exports.Track = Track;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Factory_1 = __webpack_require__(8);
	var AudioManager = (function () {
	    function AudioManager() {
	        this.__audioPlayers = {};
	    }
	    AudioManager.prototype.update = function (playlist, clock) {
	        var tracks = playlist.getTracks();
	        var existingIds = Object.keys(this.__audioPlayers);
	        var newIds = Object.keys(tracks);
	        var tracksToAdd = this.__diff(tracks, this.__audioPlayers);
	        var tracksToRemove = this.__diff(this.__audioPlayers, tracks);
	        for (var id in tracksToAdd) {
	            this.__audioPlayers[id] = Factory_1.Factory.makeFromTrack(tracks[id], clock);
	            this.__audioPlayers[id].play();
	        }
	        for (var id in tracksToRemove) {
	            this.__removeAudioPlayer(id);
	        }
	    };
	    AudioManager.prototype.cleanup = function () {
	        for (var id in this.__audioPlayers) {
	            this.__removeAudioPlayer(id);
	        }
	    };
	    AudioManager.prototype.__removeAudioPlayer = function (id) {
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
	    return AudioManager;
	}());
	exports.AudioManager = AudioManager;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var HTMLPlayer_1 = __webpack_require__(9);
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
/* 9 */
/***/ function(module, exports) {

	"use strict";
	var HTMLPlayer = (function () {
	    function HTMLPlayer(track, clock) {
	        this.__track = track;
	        this.__clock = clock;
	    }
	    HTMLPlayer.prototype.play = function () {
	        var mp3Url = "https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/" + this.__track.getFileId() + "/variant/webbrowser-mp3";
	        var opusUrl = "https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/" + this.__track.getFileId() + "/variant/webbrowser-opus";
	        return true;
	    };
	    HTMLPlayer.prototype.stop = function () {
	        return true;
	    };
	    return HTMLPlayer;
	}());
	exports.HTMLPlayer = HTMLPlayer;


/***/ }
/******/ ]);
//# sourceMappingURL=radiokit-toolkit-playback.js.map