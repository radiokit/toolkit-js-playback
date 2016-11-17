"use strict";
var TrackInfo = (function () {
    function TrackInfo(name, metadata, affiliates) {
        this.__name = name;
        this.__metadata = metadata;
        this.__affiliates = affiliates;
    }
    TrackInfo.makeFromJson = function (data) {
        var name = data['name'];
        var metadata = {};
        var affiliates = {};
        var metadataSchemas = {};
        for (var _i = 0, _a = data['metadata_schemas']; _i < _a.length; _i++) {
            var metadataSchema = _a[_i];
            metadataSchemas[metadataSchema['id']] = metadataSchema;
        }
        var affiliateSchemas = {};
        for (var _b = 0, _c = data['affiliate_schemas']; _b < _c.length; _b++) {
            var affiliateSchema = _c[_b];
            affiliateSchemas[affiliateSchema['id']] = affiliateSchema;
        }
        for (var _d = 0, _e = data['metadata_items']; _d < _e.length; _d++) {
            var metadataItem = _e[_d];
            var key = metadataSchemas[metadataItem['metadata_schema_id']].key;
            var kind = metadataSchemas[metadataItem['metadata_schema_id']].kind;
            var value = metadataItem["value_" + kind];
            metadata[key] = value;
        }
        for (var _f = 0, _g = data['affiliate_items']; _f < _g.length; _f++) {
            var affiliateItem = _g[_f];
            var key = affiliateSchemas[affiliateItem['affiliate_schema_id']].key;
            var value = affiliateItem['affiliate_metadata'];
            affiliates[key] = value;
        }
        return new TrackInfo(name, metadata, affiliates);
    };
    TrackInfo.prototype.getName = function () {
        return this.__name;
    };
    TrackInfo.prototype.getMetadata = function () {
        return this.__metadata;
    };
    TrackInfo.prototype.getAffiliates = function () {
        return this.__affiliates;
    };
    return TrackInfo;
}());
exports.TrackInfo = TrackInfo;
