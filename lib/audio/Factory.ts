import { IAudioPlayer } from './IAudioPlayer';
import { HTMLPlayer } from './HTMLPlayer';
import { Track } from '../channel/Track';
import { SyncClock } from '../clock/SyncClock';


/**
 * This class implements factory pattern for creating players that utilize
 * the most of browser capabilities.
 */
export class Factory {
  /**
   * Instantiates an audio player for given track.
   */
  public static makeFromTrack(track: Track, clock: SyncClock) : IAudioPlayer {
    return new HTMLPlayer(track, clock);
  }
}
