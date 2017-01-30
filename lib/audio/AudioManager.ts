import { Factory } from './Factory';
import { IAudioPlayer } from './IAudioPlayer';
import { Playlist } from '../channel/Playlist';
import { Track } from '../channel/Track';
import { SyncClock } from '../clock/SyncClock';
import { Base } from '../Base';

/**
 * This class contains audio manager that can convert playlist into
 * list of players that can actually play given tracks.
 *
 * It keeps their state and allows to update them once new playlist
 * is available.
 *
 * It emits the following events:
 *
 * - playback-started (arg1: track) - when playback starts
 * - position (arg1: track, arg1: position in ms, arg2: duration in ms) -
 *   when the position is updated for the last track for which playback has started
 */
export class AudioManager extends Base {
  private __audioPlayers:   Object = {};
  private __volume:         number = 1.0;
  private __currentTrack?:  Track;


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
      this.debug(`Adding track: ID = ${id}`);
      this.__audioPlayers[id] = Factory.makeFromTrack(tracks[id], clock);
      this.__audioPlayers[id].setVolume(this.__volume);
      this.__audioPlayers[id].on('playback-started', this.__onAudioPlayerPlaybackStarted.bind(this));
      this.__audioPlayers[id].on('position', this.__onAudioPlayerPosition.bind(this));
      this.__audioPlayers[id].start();
    }

    for(let id in tracksToRemove) {
      this.debug(`Removing track: ID = ${id}`);
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


  /**
   * Sets volume of all current and future audio players.
   */
  public setVolume(volume: number) : AudioManager {
    if(volume < 0.0 || volume > 1.0) {
      throw new Error('Volume out of range');
    }

    this.__volume = volume;

    for(let id in this.__audioPlayers) {
      this.__audioPlayers[id].setVolume(volume);
    }

    return this;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']}`;
  }


  private __removeAudioPlayer(id: string) {
    // If we remove player for current track, remove the reference
    // to avoid memory leaks.
    if(this.__currentTrack === this.__audioPlayers[id].getTrack()) {
      this.__currentTrack = undefined;
    }

    // Detach all event handlers to avoid memory leaks.
    this.__audioPlayers[id].offAll();

    // Ensure that player is stopped before we remove it to avoid memory leaks.
    this.__audioPlayers[id].stop();

    // Remove the player
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


  private __onAudioPlayerPlaybackStarted(audioPlayer: IAudioPlayer) : void {
    this.__currentTrack = audioPlayer.getTrack();
    this._trigger('playback-started', this.__currentTrack);

    for(let id in this.__audioPlayers) {
      const iteratedAudioPlayer = this.__audioPlayers[id];
      const iteratedTrack = iteratedAudioPlayer.getTrack();

      if(iteratedAudioPlayer !== audioPlayer && iteratedTrack.getCueInAt() <= this.__currentTrack.getCueInAt()) {
        this.debug(`Applying fade out to player ${iteratedAudioPlayer.getTrack().getId()} so it does not overlap with player ${audioPlayer.getTrack().getId()}`);
        iteratedAudioPlayer.fadeOut(1000);
      }
    }
  }


  private __onAudioPlayerPosition(audioPlayer: IAudioPlayer, position: number, duration: number) : void {
    const track = audioPlayer.getTrack();
    if(track === this.__currentTrack) {
      this._trigger('position', track, position, duration);
    }
  }
}
