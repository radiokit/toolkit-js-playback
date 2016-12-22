import { IAudioPlayer } from './IAudioPlayer';
import { Track } from '../channel/Track';
import { SyncClock } from '../clock/SyncClock';
import { Base } from '../Base';


/**
 * This class wraps HTML5 <audio> tag into a player that is capable of playing
 * sound from a given source at right time.
 *
 * Do not instantiate this directly, use Factory.make instead.
 *
 * It emits the following events:
 *
 * - playback-started (arg1: track) - when playback starts
 * - position (arg1: track, arg1: position in ms, arg2: duration in ms) -
 *   when the position is updated
 */
export class HTMLPlayer extends Base implements IAudioPlayer {
  private __track:              Track;
  private __clock:              SyncClock;
  private __audio:              HTMLAudioElement;
  private __started:            boolean = false;
  private __cueInTimeoutId:     number = 0;
  private __restartTimeoutId:   number = 0;
  private __positionIntervalId: number = 0;
  private __volume:             number = 1.0;


  constructor(track: Track, clock: SyncClock) {
    super();

    this.__track = track;
    this.__clock = clock;
  }


  /**
   * Starts the player.
   *
   * It will try to play given track on time defined by it's cue in point
   * as long as it does not reach EOS or stop() is being called. It will restart
   * the playback in case of any issues and seek to the appropriate position.
   *
   * Will throw an error if player is already started.
   *
   * Returns itself.
   *
   * TODO: Support fades
   * TODO: Support cue out
   */
  public start() : HTMLPlayer {
    if(!this.__started) {
      this.debug('Starting');
      this.__started = true;

      this.__preparePlayback();

    } else {
      throw new Error('Attempt to start HTML Player that is already started');
    }

    return this;
  }


  /**
   * Stops the player.
   *
   * Cleans up all resources associated with the player.
   *
   * Will throw an error if player was not started.
   *
   * Returns itself.
   */
  public stop() : HTMLPlayer {
    if(this.__started) {
      this.debug('Stopping');
      this.__stopPlayback();

      this.__started = false;

    } else {
      throw new Error('Attempt to stop HTML Player that is not started');
    }

    return this;
  }


  /**
   * Sets the volume of this particular player.
   *
   * Accepted volume is number in range <0.0, 1.0>.
   *
   * Returns itself.
   */
  public setVolume(volume: number) : HTMLPlayer {
    if(volume < 0.0 || volume > 1.0) {
      throw new Error('Volume out of range');
    }

    this.__volume = volume;

    if(this.__audio) {
      this.__audio.volume = volume;
    }

    return this;
  }


  /**
   * Returns Track associated with this player.
   */
  public getTrack() : Track {
    return this.__track;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__track.getId()}`;
  }


  private __onAudioCanPlayThrough(e) : void {
    this.debug('Can play through');

    // Remove event handler. Otherwise it will be triggered again if we
    // update currentTime in the subsequent code.
    this.__audio.oncanplaythrough = undefined;

    // Adjust the currentTime. Seek takes some time, sometimes even a few seconds
    // so previously set currentTime may be obsolete. We recompute it again
    // but now seeking should be faster as most probably after canplaythrough
    // event was emitted we have some bufferred data.
    const now = this.__clock.nowAsTimestamp();
    const cueInAt = this.__track.getCueInAt().valueOf();
    const cueOutAt = this.__track.getCueOutAt().valueOf();

    if(now >= cueOutAt) {
      // We are after the sound is supposed to play, do nothing.
      //
      // Probably that means that seeking was so long that before it has
      // finished the cue out at has passed.
      this.warn('Unable to play: Track is obsolete');

    } else {
      // We are before the sound is supposed to play
      if(now < cueInAt) {
        // We are too early, wait to start
        const timeout = cueInAt - now;
        this.debug(`Waiting for ${timeout} ms`);
        this.__cueInTimeoutId = setTimeout(this.__onCueInTimeout.bind(this), timeout);

      } else if(now > cueInAt) {
        // We are too late, seek
        const position = now - cueInAt;
        this.debug(`Seeking to ${position} ms`);

        this.__audio.currentTime = position / 1000.0;
        this.__startPlayback();

      } else {
        // We are right on time, just play
        this.__startPlayback();
      }
    }
  }


  private __onAudioError(e) : void {
    this.warn('Error');
    this.__stopPlayback();
    this.__scheduleRestart();
  }


  private __onAudioEnded(e) : void {
    this.debug('EOS');
    this.__stopPlayback();
  }


  private __onAudioSeeking(e) : void {
    this.debug('Seeking');
  }


  private __onAudioSeeked(e) : void {
    this.debug('Seeked');
  }


  private __onAudioWaiting(e) : void {
    this.warn('Waiting');
  }


  private __onAudioStalled(e) : void {
    this.warn('Stalled');
  }


  private __onAudioSuspended(e) : void {
    this.warn('Suspended');
  }


  private __onCueInTimeout() : void {
    this.debug('Cue In timeout has passed');
    this.__cueInTimeoutId = 0;
    this.__startPlayback();
  }


  private __preparePlayback() : void {
    this.debug('Preparing playback');
    this.__audio = new Audio();

    // Set proper volume
    this.__audio.volume = this.__volume;

    // Disable automatic preloading
    this.__audio.preload = 'none';

    // Set source URL in the best format supported by the browser
    if(this.__audio.canPlayType('application/ogg; codecs=opus')) {
      this.__audio.src = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${this.__track.getFileId()}/variant/webbrowser-opus`;

    } else if(this.__audio.canPlayType('audio/mpeg')) {
      this.__audio.src = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${this.__track.getFileId()}/variant/webbrowser-mp3`;

    } else {
      throw new Error('Browser supports none of formats server can send.');
    }

    // Set currentTime to position from which track will start playback
    const now = this.__clock.nowAsTimestamp();
    const cueInAt = this.__track.getCueInAt().valueOf();
    const cueOutAt = this.__track.getCueOutAt().valueOf();

    if(now >= cueOutAt) {
      // We are after the sound is supposed to play, do nothing.
      this.warn('Unable to set initial currentTime: Track is obsolete');

    } else {
      // We are before the sound is supposed to play
      if(now <= cueInAt) {
        // We are too early, will wait to start, but once this happens,
        // it will play from the beginning.
        this.__audio.currentTime = 0;

      } else {
        // We are in the middle of the track, we are going to seek.
        const position = now - cueInAt;
        this.debug(`Setting initial currentTime to ${position} ms`);
        this.__audio.onseeking = this.__onAudioSeeking.bind(this);
        this.__audio.onseeked = this.__onAudioSeeked.bind(this);

        this.__audio.currentTime = position / 1000.0;
      }
    }

    // Set event handlers. Remember that canplaythrough is emitted also on
    // setting currentTime so it has to be bound after currentTime is valid.
    this.__audio.oncanplaythrough = this.__onAudioCanPlayThrough.bind(this);
    this.__audio.onerror = this.__onAudioError.bind(this);

    // Cause audio to load
    this.__audio.load();
  }


  private __startPlayback() : void {
    this.debug('Starting playback');
    this.__positionIntervalId = setInterval(this.__onPositionInterval.bind(this), 250);

    this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
    this.__audio.onstalled = this.__onAudioStalled.bind(this);
    this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
    this.__audio.onended = this.__onAudioEnded.bind(this);
    this.__audio.play();

    this._trigger('playback-started', this.__track);
  }


  private __stopPlayback() : void {
    this.debug('Stopping playback');
    if(this.__audio) {
      this.__audio.oncanplaythrough = undefined;
      this.__audio.onerror = undefined;
      this.__audio.onended = undefined;
      this.__audio.onwaiting = undefined;
      this.__audio.onstalled = undefined;
      this.__audio.onsuspend = undefined;
      this.__audio.onseeking = undefined;
      this.__audio.onseeked = undefined;
      if(this.__audio.readyState == 4) {
        this.__audio.pause();
      }
      this.__audio.src = '';
      delete this.__audio;
      this.__audio = undefined;
    }

    if(this.__cueInTimeoutId !== 0) {
      clearTimeout(this.__cueInTimeoutId);
      this.__cueInTimeoutId = 0;
    }

    if(this.__restartTimeoutId !== 0) {
      clearTimeout(this.__restartTimeoutId);
      this.__restartTimeoutId = 0;
    }

    if(this.__positionIntervalId !== 0) {
      clearInterval(this.__positionIntervalId);
      this.__positionIntervalId = 0;
    }
  }


  private __scheduleRestart() : void {
    if(this.__started) {
      const timeout = 500 + Math.round(Math.random() * 250);
      this.debug(`Scheduling restart in ${timeout} ms`);
      this.__restartTimeoutId = setTimeout(() => {
        this.__restartTimeoutId = 0;
        this.__preparePlayback();
      }, timeout);
    }
  }


  private __onPositionInterval() {
    const position = Math.round(this.__audio.currentTime * 1000);
    const cueInAt = this.__track.getCueInAt().valueOf();
    const cueOutAt = this.__track.getCueOutAt().valueOf();
    const duration = cueOutAt - cueInAt;

    this._trigger('position', this.__track, position, duration);
  }
}
