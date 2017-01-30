import { Track } from '../channel/Track';


export interface IAudioPlayer {
  start() : IAudioPlayer;
  stop() : IAudioPlayer;
  setVolume(volume: number) : IAudioPlayer;
  getTrack() : Track;
  fadeOut(duration: number) : IAudioPlayer;
}
