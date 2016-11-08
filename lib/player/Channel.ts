import { Base } from '../Base';
import { SyncClock } from '../clock/SyncClock';
import { Playlist } from '../channel/Playlist';


/**
 * This class represents a single channel (stream) that is broadcasted from
 * RadioKit servers.
 */
export class Channel extends Base {
  private __channelId:      string;
  private __accessToken:    string;
  private __clock:          SyncClock;
  private __fetchTimeoutId: number = 0;


  constructor(channelId: string, accessToken: string) {
    super();

    this.__channelId = channelId;
    this.__accessToken = accessToken;
  }


  public start() : Promise<Channel> {
    this.info("Starting: Synchronizing clock...");
    const promise = new Promise<Channel>((resolve: any, reject: any) => {
      SyncClock.makeAsync()
        .catch((error) => {
          this.warn(`Failed to start: Unable to sync clock (${error.message})`);
          reject(new Error(`Unable to sync clock (${error.message})`));

        }).then((clock) => {
          this.debug("Starting: Synchronized clock");
          this.__clock = clock;

          this.__fetchTimeoutId = setTimeout(this.__onFetchTimeout, 1);
          resolve(this);
        });
    });

    return promise;
  }


  // FIXME temporary API
  public fetch() : void {
    Playlist.fetchAsync(this.__channelId, this.__accessToken, this.__clock)
      .catch((error) => {
        throw error;

      })
      .then((playlist) => {
        return playlist;
      });
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__channelId}`;
  }


  private __onFetchTimeout(): void {
    this.__fetchTimeoutId = 0;
  }
}
