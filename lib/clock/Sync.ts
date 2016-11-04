import { Base } from '../Base';


declare class SyncError implements Error {
    public name: string;
    public message: string;

    constructor(message?: string);
}


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
export class Sync extends Base {
  private offset: number;


  /**
   * Returns promise that builds new clock that is synchronized to the server. 
   */
  public static makeAsync() : Promise<Sync> {
    const promise = new Promise<Sync>((resolve: any, reject: any) => {
      const xhr = new XMLHttpRequest();

      xhr.setRequestHeader('Cache-Control', 'no-cache, must-revalidate');
      xhr.open('OPTIONS', 'https://time.radiokitapp.org/api/time/v1.0/now', true);
      xhr.timeout = 5000;  // ms

      xhr.onerror = function(e) {
        reject(new SyncError(`Unable to synchronize clock: Network error (${e.target.status})`));
      }

      xhr.onabort = function(e) {
        reject(new SyncError(`Unable to synchronize clock: Aborted`));
      }

      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4 && xhr.status === 200) {
          resolve(new Sync(Date.parse(JSON.parse(xhr.responseText).utc_time)));

        } else {
          reject(new SyncError(`Unable to synchronize clock: Unexpected response (readyState = ${xhr.readyState}, status = ${xhr.status})`));
        }
      };

      xhr.send();      
    });


    return promise;
  }


  /**
   * Constructs new Sync clock. 
   *
   * Passed serverDate argument is a RadioKit server time as UNIX timestamp.
   *
   * Do not use this constructor directly, use Sync.makeAsync() factory instead.
   */ 
  constructor(serverDate: number) {
    super();
    this.offset = serverDate - Date.now(); // in milliseconds

    this.debug(`Constructed sync clock (offset = ${this.offset} ms}`);
  }
}
