import { SyncClock } from '../clock/SyncClock';
import { Track } from './Track';


/**
 * This class represents a playlist of files to be played currently or
 * in a short time span on a given channel.
 */
export class Playlist {
  private __tracks : Object;


  /**
   * Factory that asynchronously fetches and creates a playlist
   * for a given channel.
   */
  public static fetchAsync(channelId: string, accessToken: string, clock: SyncClock) : Promise<Playlist> {
    const promise = new Promise<Playlist>((resolve: any, reject: any) => {
      const now = clock.nowAsTimestamp();
      const xhr = new XMLHttpRequest();

      const url = 'https://plumber.radiokitapp.org/api/rest/v1.0/media/input/file/radiokit/vault' +
        '?a[]=id' +
        '&a[]=name' +
        '&a[]=file' +
        '&a[]=cue_in_at' +
        '&a[]=cue_out_at' +
        '&a[]=cue_offset' +
        '&a[]=fade_in_at' +
        '&a[]=fade_out_at' +
        '&s[]=cue%20' + encodeURIComponent(new Date(now).toISOString()) + '%2020%20600' + // seek 20 seconds back, 600 seconds forward
        '&c[references][]=deq%20broadcast_channel_id%20' + encodeURIComponent(channelId) +
        '&o[]=cue_in_at%20asc';


      xhr.open('GET', url, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
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

      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4) {
          if(xhr.status === 200) {
            const responseAsJson = JSON.parse(xhr.responseText);
            resolve(Playlist.makeFromJson(responseAsJson["data"]));

          } else {
            reject(new Error(`Unable to fetch playlist: Unexpected response (status = ${xhr.status})`));
          }
        }
      };

      xhr.send();
    });

    return promise;
  }


  /**
   * Factory that creates a playlist out of JSON data in the API format.
   */
  public static makeFromJson(data: Array<Object>) : Playlist {
    let tracks : Object = {};

    for(let record of data) {
      let id          : string       = record['id'];
      let fileId      : string       = record['file'];
      let cueInAt     : Date         = new Date(record['cue_in_at']);
      let cueOutAt    : Date         = new Date(record['cue_out_at']);
      let cueOffset   : number       = record['cue_offset'];
      let fadeInAt    : Date | null  = record['fade_in_at'] !== null ? new Date(record['fade_in_at']) : null;
      let fadeOutAt   : Date | null  = record['fade_out_at'] !== null ? new Date(record['fade_out_at']) : null;

      let track = new Track(id, fileId, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt);
      tracks[id] = track;
    }

    return new Playlist(tracks);
  }


  constructor(tracks: Object) {
    this.__tracks = tracks;
  }


  public getTracks() : Object {
    return this.__tracks;
  }
}
