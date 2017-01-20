"use strict";
var AffiliateInfo = (function () {
    function AffiliateInfo(affiliateItem) {
        this.__affiliateItem = affiliateItem;
    }
    AffiliateInfo.prototype.getItemUrl = function () {
        return this.__affiliateItem['item_url'];
    };
    return AffiliateInfo;
}());
exports.AffiliateInfo = AffiliateInfo;
