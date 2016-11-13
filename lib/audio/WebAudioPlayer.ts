import { Base } from '../Base';

import { IAudioPlayer } from './IAudioPlayer';
import { Source } from './Source';


/**
 * This class wraps WebAudio API into a player that is capable of playing sound
 * from a given source.
 *
 * Do not instantiate this directly, use Factory.make instead.
 */
export class WebAudioPlayer extends Base implements IAudioPlayer {
  private source       : Source;
  private audioContext : AudioContext;
  private request      : XMLHttpRequest;


  /**
   * Checks if WebAudio API is supported.
   */
  public static isSupported() : boolean {
    return window.hasOwnProperty('AudioContext') || window.hasOwnProperty('webkitAudioContext');
  }


  private static findAudioContext() : AudioContext {
    if(window.hasOwnProperty('AudioContext')) {
      return window['AudioContext'];
    } else if(window.hasOwnProperty('webkitAudioContext')) {
      return window['webkitAudioContext'];
    } else {
      throw new Error('Unable to find AudioContext');
    }
  }


  constructor(source: Source) {
    super();

    this.debug("Construct");
    this.source = source;

    this.audioContext = WebAudioPlayer.findAudioContext();

    this.request = new XMLHttpRequest();
    this.request.responseType = 'arraybuffer';
    this.request.addEventListener('load', this.__onRequestLoad);
    this.request.addEventListener('error', this.__onRequestError);
    this.request.addEventListener('abort', this.__onRequestAbort);
  }


  public prepare() {
    this.debug("Prepare");

    this.request.open('GET', this.source.getOpus(), true);
    this.request.responseType = 'arraybuffer';
    this.request.send();
  }


  public play() {
    this.debug("Play");
    return true; // FIXME
  }


  public stop() {
    this.debug("Stop");
    return true; // FIXME
  }


  protected _loggerTag() : string {
    return this['constructor']['name'];
  }


  private __onRequestLoad(event) : void {
    this.debug("Request Load");
    this.audioContext.decodeAudioData(this.request.response, this.__onAudioContextDecode);
  }


  private __onRequestError(event) : void {
    this.warn("Request Error");
  }


  private __onRequestAbort(event) : void {
    this.warn("Request Abort");
  }


  private __onAudioContextDecode(buffer) : void {
    this.debug("Audio Decode");
    // TODO
  }
}
