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
	var Channel_1 = __webpack_require__(2);
	var e = {
	    Player: {
	        Channel: Channel_1.Channel,
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
	var Channel = (function (_super) {
	    __extends(Channel, _super);
	    function Channel(channelId, accessToken) {
	        var _this = _super.call(this) || this;
	        _this.__fetchTimeoutId = 0;
	        _this.__channelId = channelId;
	        _this.__accessToken = accessToken;
	        return _this;
	    }
	    Channel.prototype.start = function () {
	        var _this = this;
	        this.info("Starting: Synchronizing clock...");
	        var promise = new Promise(function (resolve, reject) {
	            SyncClock_1.SyncClock.makeAsync()
	                .catch(function (error) {
	                _this.warn("Failed to start: Unable to sync clock (" + error.message + ")");
	                reject(new Error("Unable to sync clock (" + error.message + ")"));
	            }).then(function (clock) {
	                _this.debug("Starting: Synchronized clock");
	                _this.__clock = clock;
	                _this.__fetchTimeoutId = setTimeout(_this.__onFetchTimeout, 1);
	                resolve(_this);
	            });
	        });
	        return promise;
	    };
	    Channel.prototype.fetch = function () {
	        Playlist_1.Playlist.fetchAsync(this.__channelId, this.__accessToken, this.__clock)
	            .catch(function (error) {
	            throw error;
	        })
	            .then(function (playlist) {
	            return playlist;
	        });
	    };
	    Channel.prototype._loggerTag = function () {
	        return this['constructor']['name'] + " " + this.__channelId;
	    };
	    Channel.prototype.__onFetchTimeout = function () {
	        this.__fetchTimeoutId = 0;
	    };
	    return Channel;
	}(Base_1.Base));
	exports.Channel = Channel;


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
/***/ function(module, exports) {

	"use strict";
	var Playlist = (function () {
	    function Playlist() {
	    }
	    Playlist.fetchAsync = function (channelId, accessToken, clock) {
	        var promise = new Promise(function (resolve, reject) {
	            var now = clock.nowAsTimestamp();
	            var xhr = new XMLHttpRequest();
	            var url = 'https://plumber.radiokitapp.org/api/rest/v1.0/media/input/file/radiokit/vault?' +
	                'a[]=id' +
	                '&a[]=name' +
	                '&a[]=file' +
	                '&a[]=start_at' +
	                '&a[]=stop_at' +
	                '&a[]=cue_in_at' +
	                '&a[]=cue_out_at' +
	                '&a[]=cue_offset' +
	                '&a[]=fade_in_at' +
	                '&a[]=fade_out_at' +
	                '&s[]=cue%20' + new Date(now).toISOString() + '%2020%20600' +
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
	                        resolve(new Playlist());
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
	    return Playlist;
	}());
	exports.Playlist = Playlist;


/***/ }
/******/ ]);
//# sourceMappingURL=radiokit-toolkit-playback.js.map