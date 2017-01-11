import { Playlist } from './Playlist';


/**
 * This class allows resolves file URLs out of IDs got in the Playlist.
 */
export class PlaylistResolver {
  private __playlistRaw: Array<Object>;
  private __accessToken: string;


  constructor(accessToken: string, playlistRaw: Array<Object>) {
    this.__playlistRaw = playlistRaw;
    this.__accessToken = accessToken;
  }


  /**
   * Asynchronously fetches information about files and creates a Playlist.
   */
  public resolveAsync() : Promise<Playlist> {
    const promise = new Promise<Playlist>((resolve: any, reject: any) => {
      const xhr = new XMLHttpRequest();

      const fileIds = [];
      for(let file of this.__playlistRaw) {
        fileIds.push(encodeURIComponent(file["file"]));
      }

      const url = 'https://vault.radiokitapp.org/api/rest/v1.0/data/record/file' +
        '?a[]=id' +
        '&a[]=public_url' +
        '&c[id][]=in%20' + fileIds.join("%20");


      xhr.open('GET', url, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
      xhr.setRequestHeader('Authorization', `Bearer ${this.__accessToken}`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.timeout = 15000;  // ms

      const audio = new Audio();
      const knownFormats = [];

      // Set source URL in the best format supported by the browser
      if(audio.canPlayType('application/ogg; codecs=opus')) {
        knownFormats.push('application/ogg; codecs=opus');
      }

      if(audio.canPlayType('application/ogg; codecs=vorbis')) {
        knownFormats.push('application/ogg; codecs=vorbis');
      }

      if(audio.canPlayType('audio/mpeg')) {
        knownFormats.push('audio/mpeg');
      }
      xhr.setRequestHeader('X-RadioKit-KnownFormats', knownFormats.join(', '));


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
            const responseData = responseAsJson['data'];

            resolve(Playlist.makeFromJson(this.__accessToken, this.__playlistRaw, responseData));

          } else {
            reject(new Error(`Unable to fetch files: Unexpected response (status = ${xhr.status})`));
          }
        }
      };

      xhr.send();
    });

    return promise;
  }
}
