import { Setup } from './Setup';
import { SyncClock } from '../clock/SyncClock';
import { Track } from './Track';
import { Playlist } from './Playlist';
import { PlaylistResolver } from './PlaylistResolver';


/**
 * This class allows to fetch a Playlist of tracks that are schedule for
 * current time plus small margin.
 */
export class PlaylistFetcher {
  private __options: any = { from: 20, to: 600 };
  private __clock: SyncClock;
  private __setup: Setup;
  private __accessToken: string;


  constructor(accessToken: string, setup: Setup, clock: SyncClock, options = {}) {
    this.__options = {
      ...this.__options,
      ...options,
    }
    this.__clock = clock;
    this.__setup = setup;
    this.__accessToken = accessToken;
  }


  /**
   * Asynchronously fetches and creates a Playlist.
   */
  public fetchAsync() : Promise<Playlist> {
    const promise = new Promise<Playlist>((resolve: any, reject: any) => {
      const now = this.__clock.nowAsTimestamp();
      const xhr = new XMLHttpRequest();

      const url = this.__setup.getLineupPlaylistUrl('current-15s');

      xhr.open('GET', url, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
      xhr.setRequestHeader('Authorization', `Bearer ${this.__accessToken}`);
      xhr.setRequestHeader('Accept', 'application/json');
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
            const resolver = new PlaylistResolver(this.__accessToken, responseAsJson['data']['playlist']['tracks']);

            resolver.resolveAsync()
              .then((playlist) => {
                resolve(playlist);
              })
              .catch((error) => {
                reject(new Error(`Unable to resolve playlist (${error.message})`));
              });

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
