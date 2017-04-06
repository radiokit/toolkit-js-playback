import { Base } from '../Base';
import { SyncClock } from '../clock/SyncClock';
import { Playlist } from '../channel/Playlist';
import { Track } from '../channel/Track';
import { PlaylistFetcher } from '../channel/PlaylistFetcher';
import { AudioManager } from '../audio/AudioManager';
import { StatsSender } from '../channel/StatsSender';
import * as Fingerprint2 from 'fingerprintjs2';

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
  private __targetId:         string;
  private __fetchTimeoutId:   number = 0;
  private __statsTimeoutId:   number = 0;
  private __audioManager:     AudioManager;
  private __started:          boolean;
  private __playlist:         Playlist = null;
  private __clock?:           SyncClock = null;
  private __fetching:         boolean = false;
  private __playlistFetcher?: PlaylistFetcher = null;
  private __statsSender?:     StatsSender = null;
  private __volume:           number = 1.0;
  private __options:          any = { from: 20, to: 600 };
  private __userFingerprint:  string;
  trackId:                    string;


  constructor(channelId: string, accessToken: string, targetId: string, options = {}) {
    super();

    this.__options = {
      ...this.__options,
      ...options
    }
    this.__started = false;
    this.__channelId = channelId;
    this.__accessToken = accessToken;
    this.__targetId = targetId;
    this.__generateUserFingerprint();
  }

  public start() : Player {
    this.__startFetching();

    this.__started = true;
    this.__startSendingStats();

    this.__audioManager = new AudioManager();
    this.__audioManager.setVolume(this.__volume);
    this.__audioManager.on('playback-started', this.__onAudioManagerPlaybackStarted.bind(this));
    this.__audioManager.on('position', this.__onAudioManagerPosition.bind(this));
    return this;
  }


  public stop() : Player {
    this.__started = false;
    this.__stopSendingStats();

    if(this.__audioManager) {
      // Remove all event handlers to avoid memory leaks
      this.__audioManager.offAll();

      // Cleanup audio manager to avoid memory leaks
      this.__audioManager.cleanup()

      // Remove audio manager
      delete this.__audioManager;
      this.__audioManager = undefined;
    }

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


  public fetchPlaylist() : Player {
    this.__startFetching();

    return this;
  }


  public setTrackId(trackId) : Player {
    this.trackId = trackId;

    return this;
  }


  public stopFetching() : void {
    this.__fetching = false;
    if(this.__fetchTimeoutId !== 0) {
      clearTimeout(this.__fetchTimeoutId);
      this.__fetchTimeoutId = 0;
    }
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__channelId}`;
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
              this.__channelId, clock,
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
        this.__started && this.__audioManager.update(this.__playlist, this.__clock);
        this.__scheduleNextFetch();
      })
      .catch((error) => {
        this.__scheduleNextFetch();
      });
  }


  private __stopSendingStats() : void {
    if(this.__statsTimeoutId !== 0) {
      clearTimeout(this.__statsTimeoutId);
      this.__statsTimeoutId = 0;
    }
  }

  private __startSendingStats() : void {
    if (!this.__statsSender) {
      this.__statsSender = new StatsSender(
        this.__accessToken,
        this.__channelId,
        this.__targetId,
        this.__userFingerprint
      );
    }

    this.__sendStats();
  }

  private __sendStats() : void {
    this.__sendStatsOnce()
      .then((responseStatus) => {
        if (responseStatus === "OK") {
          this.debug(`Stats sent successfully.`);
        } else {
          this.debug(`Unable to send stats. Response code: ${responseStatus}`);
        }
        this.__scheduleNextSending();
      })
      .catch((error) => {
        this.__scheduleNextSending();
      });
  }

  private __scheduleNextSending() : void {
    if(this.__started) {
      const timeout = 15000 + Math.round(Math.random() * 250);
      this.debug(`Stats Sender: Scheduling next send in ${timeout} ms`);
      this.__statsTimeoutId = setTimeout(() => {
        this.__statsTimeoutId = 0;
        this.__sendStats();
      }, timeout);
    }
  }

  private __sendStatsOnce() : Promise<string> {
    const promise = new Promise<string>((resolve: any, reject: any) => {
      this.__sendStatsPromise(resolve, reject);
    });

    return promise;
  }

  private __sendStatsPromise(resolve: any, reject: any) : void {
    this.debug("Start sending stats.");
    this.__statsSender.sendAsync(this.trackId)
      .then((requestResponse) => {
        this.debug("Sending stats done.");
        resolve(requestResponse);
      })
      .catch((error) => {
        this.warn(`Send stats error: Unable to send stats (${error.message})`);
        this._trigger('error-network');
        reject(new Error(`Unable to send stats (${error.message})`));
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
    this._trigger('track-playback-started', track);
  }

  private __generateUserFingerprint() : void {
    new Fingerprint2().get((fingerprint) => {
      this.__userFingerprint = fingerprint;
    });
  }
}
