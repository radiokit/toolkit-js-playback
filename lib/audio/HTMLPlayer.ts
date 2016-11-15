import { IAudioPlayer } from './IAudioPlayer';
import { Track } from '../channel/Track';
import { SyncClock } from '../clock/SyncClock';


/**
 * This class wraps HTML5 <audio> tag into a player that is capable of playing
 * sound from a given source at right time.
 *
 * Do not instantiate this directly, use Factory.make instead.
 */
export class HTMLPlayer implements IAudioPlayer {
  private __track: Track;
  private __clock: SyncClock;
  private __audio: HTMLAudioElement;


  constructor(track: Track, clock: SyncClock) {
    this.__track = track;
    this.__clock = clock;
  }


  play() {
    const mp3Url = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${this.__track.getFileId()}/variant/webbrowser-mp3`;
    const opusUrl = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${this.__track.getFileId()}/variant/webbrowser-opus`;


    return true; // FIXME
  }


  stop() {
    return true; // FIXME
  }
}
