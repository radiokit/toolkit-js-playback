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

	/* WEBPACK VAR INJECTION */(function(module) {"use strict";
	var Player_1 = __webpack_require__(2);
	var e = {
	    Channel: {
	        Player: Player_1.Player,
	    }
	};
	module.e = e;
	if (typeof (window) !== "undefined") {
	    window['RadioKitToolkitPlayback'] = e;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)(module)))

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(3);
	var SyncClock_1 = __webpack_require__(4);
	var Playlist_1 = __webpack_require__(5);
	var AudioManager_1 = __webpack_require__(7);
	var Player = (function (_super) {
	    __extends(Player, _super);
	    function Player(channelId, accessToken) {
	        var _this = _super.call(this) || this;
	        _this.__fetchTimeoutId = 0;
	        _this.__started = false;
	        _this.__channelId = channelId;
	        _this.__accessToken = accessToken;
	        _this.__audioManager = new AudioManager_1.AudioManager();
	        return _this;
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
	        this.info("Fetch: Synchronizing clock...");
	        var promise = new Promise(function (resolve, reject) {
	            SyncClock_1.SyncClock.makeAsync()
	                .catch(function (error) {
	                _this.warn("Fetch error: Unable to sync clock (" + error.message + ")");
	                reject(new Error("Unable to sync clock (" + error.message + ")"));
	            }).then(function (clock) {
	                _this.debug("Fetch: Synchronized clock");
	                _this.debug("Fetch: Fetching playlist...");
	                Playlist_1.Playlist.fetchAsync(_this.__channelId, _this.__accessToken, clock)
	                    .catch(function (error) {
	                    _this.warn("Fetch error: Unable to fetch playlist (" + error.message + ")");
	                    reject(new Error("Unable to fetch playlist (" + error.message + ")"));
	                })
	                    .then(function (playlist) {
	                    _this.debug("Fetch: Done");
	                    if (_this.__started) {
	                        _this.__audioManager.update(playlist, clock);
	                    }
	                    resolve(playlist);
	                });
	            });
	        });
	        return promise;
	    };
	    Player.prototype.__fetchOnceAndRepeat = function () {
	        var _this = this;
	        this.__fetchOnce()
	            .catch(function (error) {
	            _this.__scheduleNextFetch();
	        })
	            .then(function (playlist) {
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
/* 3 */
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
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(3);
	var SyncClock = (function (_super) {
	    __extends(SyncClock, _super);
	    function SyncClock(serverDate) {
	        var _this = _super.call(this) || this;
	        _this.__offset = serverDate - Date.now();
	        _this.debug("Constructed sync clock (offset = " + _this.__offset + " ms}");
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
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Track_1 = __webpack_require__(6);
	var Playlist = (function () {
	    function Playlist(tracks) {
	        this.__tracks = tracks;
	    }
	    Playlist.fetchAsync = function (channelId, accessToken, clock) {
	        var promise = new Promise(function (resolve, reject) {
	            var now = clock.nowAsTimestamp();
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
	                '&c[references][]=deq%20broadcast_channel_id%20' + encodeURIComponent(channelId) +
	                '&o[]=cue_in_at%20asc';
	            xhr.open('GET', url, true);
	            xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
	            xhr.setRequestHeader('Authorization', "Bearer " + accessToken);
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
	                        resolve(Playlist.makeFromJson(responseAsJson["data"]));
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
	var Base_1 = __webpack_require__(3);
	var Track = (function (_super) {
	    __extends(Track, _super);
	    function Track(id, fileId, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt) {
	        var _this = _super.call(this) || this;
	        _this.__id = id;
	        _this.__fileId = fileId;
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
	var Source_1 = __webpack_require__(11);
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
	        console.log("tracksToAdd", tracksToAdd);
	        console.log("tracksToRemove", tracksToRemove);
	        for (var id in tracksToAdd) {
	            var track = tracks[id];
	            var mp3Url = "https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/" + track.getFileId() + "/variant/webbrowser-mp3";
	            var opusUrl = "https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/" + track.getFileId() + "/variant/webbrowser-opus";
	            this.__audioPlayers[id] = Factory_1.Factory.make(new Source_1.Source(mp3Url, opusUrl));
	            this.__audioPlayers[id].prepare();
	        }
	    };
	    AudioManager.prototype.cleanup = function () {
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
	var WebAudioPlayer_1 = __webpack_require__(9);
	var HTMLPlayer_1 = __webpack_require__(10);
	var Factory = (function () {
	    function Factory() {
	    }
	    Factory.make = function (source) {
	        if (WebAudioPlayer_1.WebAudioPlayer.isSupported()) {
	            return new WebAudioPlayer_1.WebAudioPlayer(source);
	        }
	        else {
	            return new HTMLPlayer_1.HTMLPlayer(source);
	        }
	    };
	    return Factory;
	}());
	exports.Factory = Factory;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Base_1 = __webpack_require__(3);
	var WebAudioPlayer = (function (_super) {
	    __extends(WebAudioPlayer, _super);
	    function WebAudioPlayer(source) {
	        var _this = _super.call(this) || this;
	        _this.debug("Construct");
	        _this.source = source;
	        _this.audioContext = WebAudioPlayer.findAudioContext();
	        _this.request = new XMLHttpRequest();
	        _this.request.responseType = 'arraybuffer';
	        _this.request.addEventListener('load', _this.__onRequestLoad);
	        _this.request.addEventListener('error', _this.__onRequestError);
	        _this.request.addEventListener('abort', _this.__onRequestAbort);
	        return _this;
	    }
	    WebAudioPlayer.isSupported = function () {
	        return window.hasOwnProperty('AudioContext') || window.hasOwnProperty('webkitAudioContext');
	    };
	    WebAudioPlayer.findAudioContext = function () {
	        if (window.hasOwnProperty('AudioContext')) {
	            return window['AudioContext'];
	        }
	        else if (window.hasOwnProperty('webkitAudioContext')) {
	            return window['webkitAudioContext'];
	        }
	        else {
	            throw new Error('Unable to find AudioContext');
	        }
	    };
	    WebAudioPlayer.prototype.prepare = function () {
	        this.debug("Prepare");
	        this.request.open('GET', this.source.getOpus(), true);
	        this.request.responseType = 'arraybuffer';
	        this.request.send();
	    };
	    WebAudioPlayer.prototype.play = function () {
	        this.debug("Play");
	        return true;
	    };
	    WebAudioPlayer.prototype.stop = function () {
	        this.debug("Stop");
	        return true;
	    };
	    WebAudioPlayer.prototype._loggerTag = function () {
	        return this['constructor']['name'];
	    };
	    WebAudioPlayer.prototype.__onRequestLoad = function (event) {
	        this.debug("Request Load");
	        this.audioContext.decodeAudioData(this.request.response, this.__onAudioContextDecode);
	    };
	    WebAudioPlayer.prototype.__onRequestError = function (event) {
	        this.warn("Request Error");
	    };
	    WebAudioPlayer.prototype.__onRequestAbort = function (event) {
	        this.warn("Request Abort");
	    };
	    WebAudioPlayer.prototype.__onAudioContextDecode = function (buffer) {
	        this.debug("Audio Decode");
	    };
	    return WebAudioPlayer;
	}(Base_1.Base));
	exports.WebAudioPlayer = WebAudioPlayer;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	var HTMLPlayer = (function () {
	    function HTMLPlayer(source) {
	        this.source = source;
	    }
	    HTMLPlayer.prototype.play = function () {
	        return true;
	    };
	    HTMLPlayer.prototype.stop = function () {
	        return true;
	    };
	    return HTMLPlayer;
	}());
	exports.HTMLPlayer = HTMLPlayer;


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	var Source = (function () {
	    function Source(mp3, opus) {
	        this.mp3 = mp3;
	        this.opus = opus;
	    }
	    Source.prototype.getOpus = function () {
	        return this.opus;
	    };
	    Source.prototype.getMp3 = function () {
	        return this.mp3;
	    };
	    return Source;
	}());
	exports.Source = Source;


/***/ }
/******/ ]);
//# sourceMappingURL=radiokit-toolkit-playback.js.map