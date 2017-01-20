import { AffiliateInfo } from './AffiliateInfo';

export class TrackInfo {
  private __name: string;
  private __metadata: Object;
  private __affiliates: Object;


  /**
   * Factory that creates a track info object out of JSON data in the API format.
   */
  public static makeFromJson(data: Object) : TrackInfo {
    const name = data['name'];
    const metadata = {};
    const affiliates = {};

    // Convert list of schemas into objects for faster matches
    const metadataSchemas = {};
    for(let metadataSchema of data['metadata_schemas']) {
      metadataSchemas[metadataSchema['id']] = metadataSchema;
    }

    const affiliateSchemas = {};
    for(let affiliateSchema of data['affiliate_schemas']) {
      affiliateSchemas[affiliateSchema['id']] = affiliateSchema;
    }

    // Map items into objects
    for(let metadataItem of data['metadata_items']) {
      let key = metadataSchemas[metadataItem['metadata_schema_id']].key;
      let kind = metadataSchemas[metadataItem['metadata_schema_id']].kind;
      let value = metadataItem[`value_${kind}`];

      metadata[key] = value;
    }

    for(let affiliateItem of data['affiliate_items']) {
      let key = affiliateSchemas[affiliateItem['affiliate_schema_id']].key;
      let value = new AffiliateInfo(affiliateItem);

      affiliates[key] = value;
    }

    return new TrackInfo(name, metadata, affiliates);
  }


  constructor(name: string, metadata: Object, affiliates: Object) {
    this.__name = name;
    this.__metadata = metadata;
    this.__affiliates = affiliates;
  }


  public getName() : string {
    return this.__name;
  }


  public getMetadata() : Object {
    return this.__metadata;
  }


  public getAffiliates() : Object {
    return this.__affiliates;
  }
}
