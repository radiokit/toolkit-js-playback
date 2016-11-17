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
   * as long as it does not reach EOS or stop() is being called.
   *
   * It will restart the playback in case of any issues and seek to
   * the appropriate position.
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


  public getTrack() : Track {
    return this.__track;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__track.getId()}`;
  }


  private __onAudioLoadedMetadata(e) : void {
    this.debug('Loaded metadata');
    this.__audio.onloadedmetadata = undefined;

    const now = this.__clock.nowAsTimestamp();
    const cueInAt = this.__track.getCueInAt().valueOf();
    const cueOutAt = this.__track.getCueOutAt().valueOf();

    if(now >= cueOutAt) {
      // We are after the sound is supposed to play, do nothing.
      this.debug('Track is obsolete');

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
    this.__preparePlayback();
  }


  private __preparePlayback() : void {
    this.debug('Preparing playback');
    this.__audio = new Audio();
    this.__audio.volume = this.__volume;
    this.__audio.onloadedmetadata = this.__onAudioLoadedMetadata.bind(this);
    this.__audio.onerror = this.__onAudioError.bind(this);
    this.__audio.onended = this.__onAudioEnded.bind(this);

    if(this.__audio.canPlayType('application/ogg; codecs=opus')) {
      this.__audio.src = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${this.__track.getFileId()}/variant/webbrowser-opus`;

    } else if(this.__audio.canPlayType('audio/mpeg')) {
      this.__audio.src = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${this.__track.getFileId()}/variant/webbrowser-mp3`;

    } else {
      throw new Error('Browser supports none of formats server can send.');
    }
  }


  private __startPlayback() : void {
    this.debug('Starting playback');
    this.__positionIntervalId = setInterval(this.__onPositionInterval.bind(this), 250);

    this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
    this.__audio.onstalled = this.__onAudioStalled.bind(this);
    this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
    this.__audio.play();

    this._trigger('playback-started', this.__track);
  }


  private __stopPlayback() : void {
    this.debug('Stopping playback');
    if(this.__audio) {
      this.__audio.onloadedmetadata = undefined;
      this.__audio.onerror = undefined;
      this.__audio.onended = undefined;
      this.__audio.onwaiting = undefined;
      this.__audio.onstalled = undefined;
      this.__audio.onsuspend = undefined;
      this.__audio.pause();
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
