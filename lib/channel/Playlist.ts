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
  public static makeFromJson(accessToken: string, playlistRaw: Array<Object>, filesRaw: Array<Object>) : Playlist {
    let tracks : Object = {};

    for(let playlistRecord of playlistRaw) {
      let id          : string       = playlistRecord['id'];
      let fileId      : string       = playlistRecord['file']['id'];
      let fileUrl     : string;

      for(let fileRecord of filesRaw) {
        if(fileRecord['id'] === fileId) {
          fileUrl = fileRecord['public_url'];
          break;
        }
      }

      let cueInAt     : Date         = new Date(playlistRecord['cue_in_at']);
      let cueOutAt    : Date         = new Date(playlistRecord['cue_out_at']);
      let cueOffset   : number       = playlistRecord['cue_offset'];
      let fadeInAt    : Date | null  = playlistRecord['fade_in_at'] !== null ? new Date(playlistRecord['fade_in_at']) : null;
      let fadeOutAt   : Date | null  = playlistRecord['fade_out_at'] !== null ? new Date(playlistRecord['fade_out_at']) : null;

      let track = new Track(accessToken, id, fileId, fileUrl, cueInAt, cueOutAt, cueOffset, fadeInAt, fadeOutAt);
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
