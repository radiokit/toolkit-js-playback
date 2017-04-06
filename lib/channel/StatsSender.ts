/**
 * This class allows to send a request to stats backend with info about listener.
 */
export class StatsSender {
  private __options: any = { from: 20, to: 600, target: [] };
  private __channelId: string;
  private __accessToken: string;
  private __userFingerprint: string;
  private __statsId: string;


  constructor(accessToken: string, channelId: string, userFingerprint: string, options = {}) {
    this.__options = {
      ...this.__options,
      ...options,
    }
    this.__channelId = channelId;
    this.__accessToken = accessToken;
    this.__userFingerprint = userFingerprint;
  }

  /**
   * Asynchronously creates or updates session on circumstances bacckend.
   */
  public sendAsync() : Promise<string> {
    const promise = new Promise<string>((resolve: any, reject: any) => {
      const xhr = new XMLHttpRequest();
      var url = 'https://circumstances.radiokitapp-stag.org/api/stats/v1.0/raw_stream_play';

      if (typeof this.__statsId === 'undefined') {
        var method = 'POST';
        var requestParams = JSON.stringify({
          raw_stream_play: {
            user_fingerprint: this.__userFingerprint,
            channel_id: this.__channelId,
            targets: this.__options.targets,
          }
        });
      } else {
        var method = 'PATCH';
        var url = url + '/' + this.__statsId;
        var requestParams = JSON.stringify({});
      }

      xhr.open(method, url, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
      xhr.setRequestHeader('Authorization', `Bearer ${this.__accessToken}`);
      xhr.setRequestHeader('Accept', 'application/json');
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
          } else if(xhr.status === 201) {
            const responseAsJson = JSON.parse(xhr.responseText)['data'];
            this.__statsId = responseAsJson['id'];
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
