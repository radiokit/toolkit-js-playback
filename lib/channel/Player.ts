import { Base } from '../Base';
import { SyncClock } from '../clock/SyncClock';
import { Playlist } from '../channel/Playlist';
import { AudioManager } from '../audio/AudioManager';

/**
 * This class represents a single channel (stream) that is broadcasted from
 * RadioKit servers.
 */
export class Player extends Base {
  private __channelId:      string;
  private __accessToken:    string;
  private __fetchTimeoutId: number = 0;
  private __audioManager:   AudioManager;
  private __started:        boolean;
  private __clock?:         SyncClock = null;

  constructor(channelId: string, accessToken: string) {
    super();

    this.__started = false;
    this.__channelId = channelId;
    this.__accessToken = accessToken;
    this.__audioManager = new AudioManager();
  }


  public start() : Player {
    this.__startFetching();
    this.__started = true;
    return this;
  }


  public stop() : Player {
    this.__stopFetching();
    this.__audioManager.cleanup()
    this.__started = false;
    return this;
  }


  public isStarted() : boolean {
    return this.__started;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__channelId}`;
  }


  private __startFetching() : void {
    this.__fetchOnceAndRepeat();
  }


  private __stopFetching() : void {
    if(this.__fetchTimeoutId !== 0) {
      clearTimeout(this.__fetchTimeoutId);
      this.__fetchTimeoutId = 0;
    }
  }


  private __fetchOnce() : Promise<Playlist> {
    if(this.__clock === null) {
      this.debug("Fetch: Synchronizing clock...");
      const promise = new Promise<Playlist>((resolve: any, reject: any) => {
        SyncClock.makeAsync()
          .catch((error) => {
            this.warn(`Fetch error: Unable to sync clock (${error.message})`);
            reject(new Error(`Unable to sync clock (${error.message})`));

          }).then((clock) => {
            this.debug("Fetch: Synchronized clock");
            this.__clock = clock;
            console.log(clock);

            this.debug("Fetch: Fetching playlist...");
            Playlist.fetchAsync(this.__channelId, this.__accessToken, clock)
              .catch((error) => {
                this.warn(`Fetch error: Unable to fetch playlist (${error.message})`);
                reject(new Error(`Unable to fetch playlist (${error.message})`));
              })
              .then((playlist) => {
                this.debug("Fetch: Done");

                if(this.__started) {
                  this.__audioManager.update(playlist, clock);
                }

                resolve(playlist);
              });
          });
      });
      return promise;

    } else {
      const promise = new Promise<Playlist>((resolve: any, reject: any) => {
        this.debug("Fetch: Fetching playlist...");
        Playlist.fetchAsync(this.__channelId, this.__accessToken, this.__clock)
          .catch((error) => {
            this.warn(`Fetch error: Unable to fetch playlist (${error.message})`);
            reject(new Error(`Unable to fetch playlist (${error.message})`));
          })
          .then((playlist) => {
            this.debug("Fetch: Done");

            if(this.__started) {
              this.__audioManager.update(playlist, this.__clock);
            }

            resolve(playlist);
          });
      });

      return promise;
    }
  }


  private __fetchOnceAndRepeat() : void {
    this.__fetchOnce()
      .catch((error) => {
        this.__scheduleNextFetch();
      })
      .then((playlist) => {
        this.__scheduleNextFetch();
      });
  }


  private __scheduleNextFetch() : void {
    if(this.__started) {
      const timeout = 2000 + Math.round(Math.random() * 250);
      this.debug(`Fetch: Scheduling next fetch in ${timeout} ms`);
      this.__fetchTimeoutId = setTimeout(() => {
        this.__fetchTimeoutId = 0;
        this.__fetchOnceAndRepeat();
      }, timeout);
    }
  }
}
