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
