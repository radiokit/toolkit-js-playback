import { Base } from '../Base';
import { SyncClock } from '../clock/SyncClock';
import { Playlist } from '../channel/Playlist';
import { Track } from '../channel/Track';
import { PlaylistFetcher } from '../channel/PlaylistFetcher';
import { AudioManager } from '../audio/AudioManager';


/**
 * This class represents a single channel (stream) that is broadcasted from
 * RadioKit servers.
 *
 * It emits the following events:
 *
 * - error-network (no args) - when network error was encountered
 * - track-playback-started (arg1: track) - when playback starts
 * - track-position (arg1: track, arg1: position in ms, arg2: duration in ms) -
 *   when the position is updated for the last track for which playback has started
 */
export class Player extends Base {
  private __channelId:        string;
  private __accessToken:      string;
  private __fetchTimeoutId:   number = 0;
  private __audioManager:     AudioManager;
  private __started:          boolean;
  private __clock?:           SyncClock = null;
  private __playlistFetcher?: PlaylistFetcher = null;
  private __volume:           number = 1.0;


  constructor(channelId: string, accessToken: string) {
    super();

    this.__started = false;
    this.__channelId = channelId;
    this.__accessToken = accessToken;
  }


  public start() : Player {
    this.__startFetching();
    this.__started = true;

    this.__audioManager = new AudioManager();
    this.__audioManager.setVolume(this.__volume);
    this.__audioManager.on('playback-started', this.__onAudioManagerPlaybackStarted.bind(this));
    this.__audioManager.on('position', this.__onAudioManagerPosition.bind(this));
    return this;
  }


  public stop() : Player {
    this.__stopFetching();
    this.__started = false;

    // Remove all event handlers to avoid memory leaks
    this.__audioManager.offAll();

    // Cleanup audio manager to avoid memory leaks
    this.__audioManager.cleanup()

    // Remove audio manager
    delete this.__audioManager;
    this.__audioManager = undefined;

    return this;
  }


  public setVolume(volume: number) : Player {
    if(volume < 0.0 || volume > 1.0) {
      throw new Error('Volume out of range');
    }

    this.debug(`Volume set to ${volume}`);

    this.__volume = volume;

    if(this.__audioManager) {
      this.__audioManager.setVolume(volume);
    }

    return this;
  }


  public getVolume() : number {
    return this.__volume;
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
          .then((clock) => {
            this.debug("Fetch: Synchronized clock");
            this.__clock = clock;
            this.__playlistFetcher = new PlaylistFetcher(this.__accessToken, this.__channelId, clock);

            return this.__fetchPlaylist(resolve, reject);
          })
          .catch((error) => {
            this.warn(`Fetch error: Unable to sync clock (${error.message})`);
            this._trigger('error-network');
            reject(new Error(`Unable to sync clock (${error.message})`));
          });
      });
      return promise;

    } else {
      const promise = new Promise<Playlist>((resolve: any, reject: any) => {
        this.__fetchPlaylist(resolve, reject);
      });
      return promise;
    }
  }


  private __fetchPlaylist(resolve: any, reject: any) : void {
    this.debug("Fetch: Fetching playlist...");
    this.__playlistFetcher.fetchAsync()
      .then((playlist) => {
        this.debug("Fetch: Done");
        resolve(playlist);
      })
      .catch((error) => {
        this.warn(`Fetch error: Unable to fetch playlist (${error.message})`);
        this._trigger('error-network');
        reject(new Error(`Unable to fetch playlist (${error.message})`));
      });
  }


  private __fetchOnceAndRepeat() : void {
    this.__fetchOnce()
      .then((playlist) => {
        if(this.__started) {
          this.__audioManager.update(playlist, this.__clock);
        }
        this.__scheduleNextFetch();
      })
      .catch((error) => {
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


  private __onAudioManagerPosition(track: Track, position: number, duration: number) : void {
    this._trigger('track-position', track, position, duration);
  }


  private __onAudioManagerPlaybackStarted(track: Track) : void {
    this._trigger('track-playback-started', track);
  }
}
