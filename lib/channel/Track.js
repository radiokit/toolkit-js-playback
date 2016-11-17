"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Base_1 = require("../Base");
var TrackInfo_1 = require("./TrackInfo");
var Track = (function (_super) {
    __extends(Track, _super);
    function Track(accessToken, id, fileId, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt) {
        var _this = _super.call(this) || this;
        _this.__accessToken = accessToken;
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
                '&a[]=affiliate_schemas.id' +
                '&a[]=affiliate_schemas.name' +
                '&a[]=affiliate_schemas.key' +
                '&a[]=affiliate_schemas.kind' +
                '&a[]=affiliate_items.id' +
                '&a[]=affiliate_items.affiliate_schema_id' +
                '&a[]=affiliate_items.affiliate_metadata' +
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
                '&j[]=affiliate_schemas' +
                '&j[]=affiliate_items' +
                '&c[id][]=eq%20' + encodeURIComponent(_this.__fileId);
            xhr.open('GET', url, true);
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
