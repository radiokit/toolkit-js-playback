import { SyncClock } from '../clock/SyncClock';
import { Track } from './Track';


/**
 * This class represents a playlist of files to be played currently or
 * in a short time span on a given channel.
 */
export class Playlist {
  private __tracks : Object;


  /**
   * Factory that creates a playlist out of JSON data in the API format.
   */
  public static makeFromJson(accessToken: string, data: Array<Object>) : Playlist {
    let tracks : Object = {};

    for(let record of data) {
      let id          : string       = record['id'];
      let fileId      : string       = record['file'];
      let cueInAt     : Date         = new Date(record['cue_in_at']);
      let cueOutAt    : Date         = new Date(record['cue_out_at']);
      let cueOffset   : number       = record['cue_offset'];
      let fadeInAt    : Date | null  = record['fade_in_at'] !== null ? new Date(record['fade_in_at']) : null;
      let fadeOutAt   : Date | null  = record['fade_out_at'] !== null ? new Date(record['fade_out_at']) : null;

      let track = new Track(accessToken, id, fileId, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt);
      tracks[id] = track;
    }

    return new Playlist(tracks);
  }


  constructor(tracks: Object) {
    this.__tracks = tracks;
  }


  public getTracks() : Object {
    return this.__tracks;
  }
}
