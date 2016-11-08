import { SyncClock } from '../clock/SyncClock';


export class Playlist {
  public static fetchAsync(channelId: string, accessToken: string, clock: SyncClock) : Promise<Playlist> {
    const promise = new Promise<Playlist>((resolve: any, reject: any) => {
      const now = clock.nowAsTimestamp();
      const xhr = new XMLHttpRequest();

      const url = 'https://plumber.radiokitapp.org/api/rest/v1.0/media/input/file/radiokit/vault?' +
        'a[]=id' +
        '&a[]=name' +
        '&a[]=file' +
        '&a[]=start_at' +
        '&a[]=stop_at' +
        '&a[]=cue_in_at' +
        '&a[]=cue_out_at' +
        '&a[]=cue_offset' +
        '&a[]=fade_in_at' +
        '&a[]=fade_out_at' +
        '&s[]=cue%20' + new Date(now).toISOString() + '%2020%20600' + // seek 20 seconds back, 600 seconds forward
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
            resolve(new Playlist());

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
