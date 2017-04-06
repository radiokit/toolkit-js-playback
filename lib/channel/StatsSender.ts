/**
 * This class allows to send a request to stats backend with info about listener.
 */
export class StatsSender {
  private __options: any = { from: 20, to: 600 };
  private __channelId: string;
  private __accessToken: string;
  private __targetId: string;
  private __userFingerprint: string;


  constructor(accessToken: string, channelId: string, targetId: string, userFingerprint: string, options = {}) {
    this.__options = {
      ...this.__options,
      ...options,
    }
    this.__channelId = channelId;
    this.__accessToken = accessToken;
    this.__targetId = targetId;
    this.__userFingerprint = userFingerprint;
  }


  /**
   * Asynchronously sends stats.
   */
  public sendAsync(trackId: string) : Promise<string> {
    const promise = new Promise<string>((resolve: any, reject: any) => {
      const xhr = new XMLHttpRequest();

      const url = 'http://localhost:4010/api/stats/v1.0/raw_stream_play'
      const requestParams = JSON.stringify({
        raw_stream_play: {
          user_fingerprint: this.__userFingerprint,
          channel_id: this.__channelId,
          target_id: this.__targetId,
          file_id: trackId,
        }
      });

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
      xhr.setRequestHeader('Authorization', `Bearer ${this.__accessToken}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 15000;  // ms

      xhr.onerror = function(e) {
        reject(new Error(`Unable to send stats: Network error (${xhr.status})`));
      }

      xhr.onabort = function(e) {
        reject(new Error(`Unable to send stats: Aborted`));
      }

      xhr.ontimeout = function(e) {
        reject(new Error(`Unable to send stats: Timeout`));
      }

      xhr.onreadystatechange = () => {
        if(xhr.readyState === 4) {
          if(xhr.status === 200) {
            resolve("OK");
          } else {
            reject(new Error(`Unable to send stats: Unexpected response (status = ${xhr.status})`));
          }
        }
      };

      xhr.send(requestParams);
    });

    return promise;
  }
}
