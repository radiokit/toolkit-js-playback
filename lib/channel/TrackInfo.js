"use strict";
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
