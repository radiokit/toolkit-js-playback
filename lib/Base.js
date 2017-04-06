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
