import { Setup } from './Setup';
import { Base } from '../Base';
import { SyncClock } from '../clock/SyncClock';
import { Playlist } from '../channel/Playlist';
import { Track } from '../channel/Track';
import { PlaylistFetcher } from '../channel/PlaylistFetcher';
import { AudioManager } from '../audio/AudioManager';
import { StreamManager } from '../audio/StreamManager';


/**
 * This class represents a single channel (stream) that is broadcasted from
 * RadioKit servers.
 *
 * It emits the following events:
 *
 * - error-network (no args) - when network error was encountered
 * - playback-started (no args) - when playback starts
 * - track-playback-started (arg1: track) - when track playback starts
 * - track-position (arg1: track, arg1: position in ms, arg2: duration in ms) -
 *   when the position is updated for the last track for which playback has started
 */
export class Player extends Base {
  private __setup:                  Setup;
  private __accessToken:            string;
  private __fetchTimeoutId:         number = 0;
  private __audioManager:           AudioManager;
  private __streamManager:          StreamManager;
  private __playbackStartedEmitted: boolean = false;
  private __started:                boolean;
  private __playlist:               Playlist = null;
  private __clock?:                 SyncClock = null;
  private __fetching:               boolean = false;
  private __playlistFetcher?:       PlaylistFetcher = null;
  private __volume:                 number = 1.0;
  private __options:                any = { from: 20, to: 600 };


  constructor(setup: Setup, accessToken: string, options = {}) {
    super();

    this.__options = {
      ...this.__options,
      ...options
    }
    this.__started = false;
    this.__setup = setup;
    this.__accessToken = accessToken;
  }


  public start() : Player {
    if(!this.__started) {
      this.__startFetching();

      this.__started = true;
      this.__playbackStartedEmitted = false;

      if(this.supportsAudioManager()) {
        this.debug("Using AudioManager");
        this.__audioManager = new AudioManager();
        this.__audioManager.setVolume(this.__volume);
        this.__audioManager.on('playback-started', this.__onAudioManagerPlaybackStarted.bind(this));
        this.__audioManager.on('position', this.__onAudioManagerPosition.bind(this));

      } else {
        this.debug("Using StreamManager");
        this.__streamManager = new StreamManager(this.__setup);
        this.__streamManager.setVolume(this.__volume);
        this.__streamManager.on('channel-metadata-update', this.__onStreamManagerChannelMetadataUpdate.bind(this));
        this.__streamManager.on('playback-started', this.__onStreamManagerPlaybackStarted.bind(this));
        this.__streamManager.start();
      }
    }

    return this;
  }


  public stop() : Player {
    if(this.__started) {
      this.__started = false;

      if(this.__audioManager) {
        // Remove all event handlers to avoid memory leaks
        this.__audioManager.offAll();

        // Cleanup audio manager to avoid memory leaks
        this.__audioManager.cleanup()

        // Remove audio manager
        delete this.__audioManager;
        this.__audioManager = undefined;

      } else if(this.__streamManager) {
        // Remove all event handlers to avoid memory leaks
        this.__streamManager.offAll();

        // Cleanup audio manager to avoid memory leaks
        this.__streamManager.stop()

        // Remove audio manager
        delete this.__streamManager;
        this.__streamManager = undefined;
      }

      return this;
    }
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


  public fetchPlaylist() : Player {
    this.__startFetching();

    return this;
  }


  public stopFetching() : void {
    if(this.__fetching) {
      this.__fetching = false;
      if(this.__fetchTimeoutId !== 0) {
        clearTimeout(this.__fetchTimeoutId);
        this.__fetchTimeoutId = 0;
      }
    }
  }


  public supportsAudioManager() : boolean {
    return (
      !this.__isAndroid() &&
      !this.__isIPhone() &&
      !this.__isSafari());
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__setup.getChannelId()}`;
  }


  private __isAndroid() : boolean {
    return navigator.userAgent.indexOf('Android') !== -1;
  }


  private __isIPhone() : boolean {
    return navigator.userAgent.indexOf('iPhone') !== -1;
  }


  private __isSafari() : boolean {
    return navigator.userAgent.indexOf('Chrome') === -1 && navigator.userAgent.indexOf('Safari') !== -1;
  }


  private __startFetching() : void {
    if (!this.__fetching) {
      this.__fetching = true;
      this.__fetchOnceAndRepeat();
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
            this.__playlistFetcher = new PlaylistFetcher(
              this.__accessToken,
              this.__setup, clock,
              { from: this.__options.from, to: this.__options.to }
            );

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
        this.__playlist = playlist;
        this.__onPlayListFetched(playlist);
        this.__started && this.__audioManager && this.__audioManager.update(this.__playlist, this.__clock);
        this.__scheduleNextFetch();
      })
      .catch((error) => {
        this.__scheduleNextFetch();
      });
  }


  private __scheduleNextFetch() : void {
    if(this.__fetching) {
      const timeout = 2000 + Math.round(Math.random() * 250);
      this.debug(`Fetch: Scheduling next fetch in ${timeout} ms`);
      this.__fetchTimeoutId = setTimeout(() => {
        this.__fetchTimeoutId = 0;
        this.__fetchOnceAndRepeat();
      }, timeout);
    }
  }

  private __onPlayListFetched(playlist: Playlist) : void {
    this._trigger('playlist-fetched', playlist);
  }

  private __onAudioManagerPosition(track: Track, position: number, duration: number) : void {
    this._trigger('track-position', track, position, duration);
  }


  private __onAudioManagerPlaybackStarted(track: Track) : void {
    if(!this.__playbackStartedEmitted) {
      this._trigger('playback-started');
      this.__playbackStartedEmitted = true;
    }

    this._trigger('track-playback-started', track);
  }


  private __onStreamManagerPlaybackStarted() : void {
    if(!this.__playbackStartedEmitted) {
      this._trigger('playback-started');
      this.__playbackStartedEmitted = true;
    }
  }


  private __onStreamManagerChannelMetadataUpdate(payload) : void {
    this._trigger('channel-metadata-update', payload);
  }
}
