export class AffiliateInfo {
  private __affiliateItem: Object;

  constructor(affiliateItem: Object) {
    this.__affiliateItem = affiliateItem;
  }


  public hasItem() : boolean {
    return this.__affiliateItem['item_url'] !== null;
  }


  public getItemUrl() : string | null {
    return this.__affiliateItem['item_url'];
  }
}
