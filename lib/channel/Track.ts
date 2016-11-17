import { Base } from '../Base';
import { TrackInfo } from './TrackInfo';
import { SyncClock } from '../clock/SyncClock';


export class Track extends Base {
  private __id: string;
  private __fileId: string;
  private __cueOffset: number;
  private __cueInAt: Date;
  private __cueOutAt: Date;
  private __fadeInAt?: Date;
  private __fadeOutAt?: Date;
  private __accessToken: string;


  constructor(accessToken: string, id: string, fileId: string, cueInAt: Date, cueOutAt: Date, cueOffset: number, fadeInAt?: Date, fadeOutAt?: Date) {
    super();

    this.__accessToken = accessToken;
    this.__id = id;
    this.__fileId = fileId;
    this.__cueInAt = cueInAt;
    this.__cueOutAt = cueOutAt;
    this.__cueOffset = cueOffset;
    this.__fadeInAt = fadeInAt;
    this.__fadeOutAt = fadeOutAt;
  }


  public getId() : string {
    return this.__id;
  }


  public getFileId() : string {
    return this.__fileId;
  }


  public getCueInAt() : Date {
    return this.__cueInAt;
  }


  public getCueOutAt() : Date {
    return this.__cueOutAt;
  }


  public getFadeInAt() : Date {
    return this.__fadeInAt;
  }


  public getFadeOutAt() : Date {
    return this.__fadeOutAt;
  }


  public getCueOffset() : number {
    return this.__cueOffset;
  }


  public getInfoAsync() : Promise<TrackInfo> {
    const promise = new Promise<TrackInfo>((resolve: any, reject: any) => {
      const xhr = new XMLHttpRequest();

      const url = 'https://vault.radiokitapp.org/api/rest/v1.0/data/record/file' +
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

        '&c[id][]=eq%20' + encodeURIComponent(this.__fileId);

      xhr.open('GET', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${this.__accessToken}`);
      xhr.timeout = 15000;  // ms

      xhr.onerror = function(e) {
        reject(new Error(`Unable to fetch playlist: Network error (${xhr.status})`));
      }

      xhr.onabort = function(e) {
        reject(new Error(`Unable to fetch playlist: Aborted`));
      }

      xhr.ontimeout = function(e) {
        reject(new Error(`Unable to fetch playlist: Timeout`));
      }

      xhr.onreadystatechange = () => {
        if(xhr.readyState === 4) {
          if(xhr.status === 200) {
            const responseAsJson = JSON.parse(xhr.responseText);
            if(responseAsJson["data"].length === 1) {
              resolve(TrackInfo.makeFromJson(responseAsJson["data"][0]));
            } else {
              reject(new Error(`Unable to fetch track info: Record not found`));
            }

          } else {
            reject(new Error(`Unable to fetch track info: Unexpected response (status = ${xhr.status})`));
          }
        }
      };

      xhr.send();
    });

    return promise;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__id}`;
  }
}
