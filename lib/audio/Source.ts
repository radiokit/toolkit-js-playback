export class Source {
  private mp3: string;
  private opus: string;


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
