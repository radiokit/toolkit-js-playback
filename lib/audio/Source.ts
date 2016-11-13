import { Track } from '../channel/Track';


export class Source {
  private mp3: string;
  private opus: string;


  public static makeFromTrack(track: Track) : Source {
    let mp3Url = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${track.getFileId()}/variant/webbrowser-mp3`;
    let opusUrl = `https://essence.radiokitapp.org/api/cdn/v1.0/vault/file/${track.getFileId()}/variant/webbrowser-opus`;

    return new Source(mp3Url, opusUrl);
  }


  constructor(mp3: string, opus: string) {
    this.mp3 = mp3;
    this.opus = opus;
  }


  public getOpus() : string {
    return this.opus
  }


  public getMp3() : string {
    return this.mp3;
  }
}
