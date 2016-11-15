import { Base } from '../Base';


/**
 * This class creates a clock that is synchronized to RadioKit's servers.
 *
 * Use it instead of relying on browser's clock.
 *
 * Do not instantiate it directly, use provided factory makeAsyncForSure() instead.
 *
 * TODO:
 *
 * - handle super corner case when someone changes clock setting during runtime
 */
export class SyncClock extends Base {
  private __offset: number;


  /**
   * Returns promise that builds new clock that is synchronized to the server.
   */
  public static makeAsync() : Promise<SyncClock> {
    const promise = new Promise<SyncClock>((resolve: any, reject: any) => {
      const xhr = new XMLHttpRequest();

      xhr.open('OPTIONS', 'https://time.radiokitapp.org/api/time/v1.0/now', true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
      xhr.timeout = 5000;  // ms

      xhr.onerror = function(e) {
        reject(new Error(`Unable to synchronize clock: Network error (${xhr.status})`));
      }

      xhr.onabort = function(e) {
        reject(new Error(`Unable to synchronize clock: Aborted`));
      }

      xhr.ontimeout = function(e) {
        reject(new Error(`Unable to synchronize clock: Timeout`));
      }

      // TODO include request duration while computing offset
      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4) {
          if(xhr.status === 200) {
            resolve(new SyncClock(Date.parse(JSON.parse(xhr.responseText).utc_time)));

          } else {
            reject(new Error(`Unable to synchronize clock: Unexpected response (status = ${xhr.status})`));
          }
        }
      };

      xhr.send();
    });


    return promise;
  }


  /**
   * Constructs new SyncClock clock.
   *
   * Passed serverDate argument is a RadioKit server time as UNIX timestamp.
   *
   * Do not use this constructor directly, use SyncClock.makeAsync() factory instead.
   */
  constructor(serverDate: number) {
    super();
    this.__offset = serverDate - Date.now(); // in milliseconds

    this.debug(`Synchronized clock: offset = ${this.__offset} ms`);
  }


  public nowAsTimestamp() : number {
    return Date.now() + this.__offset;
  }


  protected _loggerTag() : string {
    return this['constructor']['name'];
  }
}
