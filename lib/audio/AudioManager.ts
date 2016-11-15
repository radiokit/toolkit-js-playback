import { Factory } from './Factory';
import { IAudioPlayer } from './IAudioPlayer';
import { Playlist } from '../channel/Playlist';
import { SyncClock } from '../clock/SyncClock';

/**
 * This class contains audio manager that can convert playlist into
 * list of players that can actually play given tracks.
 *
 * It keeps their state and allows to update them once new playlist
 * is available.
 */
export class AudioManager {
  private __audioPlayers : Object;


  constructor() {
    this.__audioPlayers = {};
  }


  /**
   * Updates list of audio players to match given playlist.
   *
   * It performs diff on list of existing players and new playlist, so it
   * only adds new tracks, removes old ones but do not touch these that
   * are supposed to be currently playing.
   */
  public update(playlist: Playlist, clock: SyncClock) : void {
    const tracks = playlist.getTracks();

    // Collect list of existing and new track IDs
    const existingIds = Object.keys(this.__audioPlayers);
    const newIds = Object.keys(tracks);


    // Make diff
    const tracksToAdd = this.__diff(tracks, this.__audioPlayers);
    const tracksToRemove = this.__diff(this.__audioPlayers, tracks);

    for(let id in tracksToAdd) {
      this.__audioPlayers[id] = Factory.makeFromTrack(tracks[id], clock);
      this.__audioPlayers[id].play();
    }

    for(let id in tracksToRemove) {
      this.__removeAudioPlayer(id);
    }
  }


  /**
   * Stops all playback and removes associated audio players.
   */
  public cleanup() : void {
    for(let id in this.__audioPlayers) {
      this.__removeAudioPlayer(id);
    }
  }


  private __removeAudioPlayer(id: string) {
    this.__audioPlayers[id].stop();
    delete this.__audioPlayers[id];
  }


  private __diff(object1 : Object, object2 : Object) : Object {
    const result = {};

    const array1 = Object.keys(object1);
    const array2 = Object.keys(object2);

    for(let item of array1) {
      if(array2.indexOf(item) === -1) {
        result[item] = object1[item];
      }
    }

    return result;
  }
}
