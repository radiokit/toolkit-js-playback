export class TrackInfo {
  private __name: string;
  private __metadata: Object;


  /**
   * Factory that creates a track info object out of JSON data in the API format.
   */
  public static makeFromJson(data: Object) : TrackInfo {
    const name = data['name'];
    const metadata = {};

    // Convert list of schemas into objects for faster matches
    const metadataSchemas = {};
    for(let metadataSchema of data['metadata_schemas']) {
      metadataSchemas[metadataSchema['id']] = metadataSchema;
    }

    // Map items into objects
    for(let metadataItem of data['metadata_items']) {
      let key = metadataSchemas[metadataItem['metadata_schema_id']].key;
      let kind = metadataSchemas[metadataItem['metadata_schema_id']].kind;
      let value = metadataItem[`value_${kind}`];

      metadata[key] = value;
    }

    return new TrackInfo(name, metadata);
  }


  constructor(name: string, metadata: Object) {
    this.__name = name;
    this.__metadata = metadata;
  }


  public getName() : string {
    return this.__name;
  }


  public getMetadata() : Object {
    return this.__metadata;
  }
}
