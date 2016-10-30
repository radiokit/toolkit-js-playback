import { IAudioPlayer } from './IAudioPlayer';
import { Source } from './Source';

/**
 * This class wraps WebAudio API into a player that is capable of playing sound
 * from a given source.
 *
 * Do not instantiate this directly, use Factory.make instead.
 */
export class WebAudioPlayer implements IAudioPlayer {
  private source:       Source;
  private audioContext: Object;


  /**
   * Checks if WebAudio API is supported.
   */
  public static isSupported() : boolean {
    return window.hasOwnProperty('webkitAudioContext') ||
      window.hasOwnProperty('AudioContext');
  }


  private static findAudioContext() : Object {
    if(window.hasOwnProperty('webkitAudioContext')) {
      return window['webkitAudioContext'];
    } else if(window.hasOwnProperty('AudioContext')) {
      return window['AudioContext'];
    } else {
      throw new Error('Unable to find AudioContext');
    }
  }


  constructor(source: Source) {
    this.source = source;
    this.audioContext = WebAudioPlayer.findAudioContext();
  }


  play() {
    return true; // FIXME
  }


  stop() {
    return true; // FIXME
  }
}
