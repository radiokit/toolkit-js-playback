import { Factory } from './Factory';
import { Source } from './Source';
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


  public update(playlist: Playlist, clock: SyncClock) : void {
    const tracks = playlist.getTracks();

    // Collect list of existing and new track IDs
    const existingIds = Object.keys(this.__audioPlayers);
    const newIds = Object.keys(tracks);


    // Make diff
    const tracksToAdd = this.__diff(tracks, this.__audioPlayers);
    const tracksToRemove = this.__diff(this.__audioPlayers, tracks);

    console.log("tracksToAdd", tracksToAdd);
    console.log("tracksToRemove", tracksToRemove);

    for(let id in tracksToAdd) {
      // FIXME is source obsolete? can't we pass Track directly?
      this.__audioPlayers[id] = Factory.make(Source.makeFromTrack(tracks[id]));
      this.__audioPlayers[id].prepare(); // FIXME
    }
  }


  public cleanup() : void {
    // TODO
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
