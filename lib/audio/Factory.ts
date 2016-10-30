import { IAudioPlayer } from './IAudioPlayer';
import { WebAudioPlayer } from './WebAudioPlayer';
import { HTMLPlayer } from './HTMLPlayer';
import { Source } from './Source';


/**
 * This class implements factory pattern for creating players that utilize
 * the most of browser capabilities.
 */
export class Factory {
  /**
   * Instantiates an audio player for given source.
   *
   * Performs browser capabilities test and selects the best player available.
   */
  public static make(source: Source) : IAudioPlayer {
    if(WebAudioPlayer.isSupported()) {
      return new WebAudioPlayer(source);

    } else {
      return new HTMLPlayer(source);
    }
  }
}
