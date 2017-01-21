"use strict";
var AffiliateInfo = (function () {
    function AffiliateInfo(affiliateItem) {
        this.__affiliateItem = affiliateItem;
    }
    AffiliateInfo.prototype.hasItem = function () {
        return this.__affiliateItem['item_url'] !== null;
    };
    AffiliateInfo.prototype.getItemUrl = function () {
        return this.__affiliateItem['item_url'];
    };
    return AffiliateInfo;
}());
exports.AffiliateInfo = AffiliateInfo;
