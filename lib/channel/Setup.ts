export class Setup {
  private __channelId:       string;
  private __lineupBaseUrl:   string;
  private __lineupChannelId: string;
  private __tubeBaseUrl:     string;
  private __tubeFormat:      string;
  private __tubeBitrate:     number;

  constructor(channelId: string, lineupBaseUrl: string, lineupChannelId: string, tubeBaseUrl: string, tubeFormat: string, tubeBitrate: 192) {
    // TODO add more validations
    if(tubeFormat !== 'mp3') {
      throw new Error(`Unknown tubeFormat ${tubeFormat}`);
    }

    this.__channelId = channelId;
    this.__lineupBaseUrl = lineupBaseUrl;
    this.__lineupChannelId = lineupChannelId;
    this.__tubeBaseUrl = tubeBaseUrl;
    this.__tubeFormat = tubeFormat;
    this.__tubeBitrate = tubeBitrate;
  }


  public getChannelId() : string {
    return this.__channelId;
  }


  public getLineupBaseUrl() : string {
    return this.__lineupBaseUrl;
  }


  public getLineupChannelId() : string {
    return this.__lineupChannelId;
  }


  public getTubeBaseUrl() : string {
    return this.__tubeBaseUrl;
  }


  public getTubeFormat() : string {
    return this.__tubeFormat;
  }


  public getTubeBitrate() : number {
    return this.__tubeBitrate;
  }


  public getLineupPlaylistUrl(scope: string) {
    return `${this.__lineupBaseUrl}/api/lineup/v1.0/channel/${encodeURIComponent(this.__lineupChannelId)}/playlist?scope=${encodeURIComponent(scope)}`;
  }

  public getTubeStreamUrl() : string {
    return `${this.__tubeBaseUrl}/output-${this.__tubeBitrate}.${this.__tubeFormat}`;
  }
}
