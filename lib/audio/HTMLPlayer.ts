import { IAudioPlayer } from './IAudioPlayer';
import { Source } from './Source';

/**
 * This class wraps HTML5 <audio> tag into a player that is capable of playing
 * sound from a given source.
 *
 * Do not instantiate this directly, use Factory.make instead.
 */
export class HTMLPlayer implements IAudioPlayer {
  private source: Source;

  constructor(source: Source) {
    this.source = source;
  }


  play() {
    return true; // FIXME
  }


  stop() {
    return true; // FIXME
  }
}
