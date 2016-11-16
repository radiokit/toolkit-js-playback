import { SyncClock } from '../clock/SyncClock';
import { Track } from './Track';
import { Playlist } from './Playlist';


/**
 * This class represents a playlist of files to be played currently or
 * in a short time span on a given channel.
 */
export class PlaylistFetcher {
  private __clock: SyncClock;
  private __channelId: string;
  private __accessToken: string;


  constructor(channelId: string, accessToken: string, clock: SyncClock) {
    this.__clock = clock;
    this.__channelId = channelId;
    this.__accessToken = accessToken;
  }


  /**
   * Factory that asynchronously fetches and creates a playlist
   * for a given channel.
   */
  public fetchAsync() : Promise<Playlist> {
    const promise = new Promise<Playlist>((resolve: any, reject: any) => {
      const now = this.__clock.nowAsTimestamp();
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
        '&c[references][]=deq%20broadcast_channel_id%20' + encodeURIComponent(this.__channelId) +
        '&o[]=cue_in_at%20asc';


      xhr.open('GET', url, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
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
}
