import { Base } from '../Base';
import { SyncClock } from '../clock/SyncClock';


export class Track extends Base {
  private __id: string;
  private __fileId: string;
  private __cueOffset: number;
  private __cueInAt: Date;
  private __cueOutAt: Date;
  private __fadeInAt?: Date;
  private __fadeOutAt?: Date;


  constructor(id: string, fileId: string, cueInAt: Date, cueOutAt: Date, cueOffset: number, fadeInAt?: Date, fadeOutAt?: Date) {
    super();

    this.__id = id;
    this.__fileId = fileId;
    this.__cueInAt = cueInAt;
    this.__cueOutAt = cueOutAt;
    this.__cueOffset = cueOffset;
    this.__fadeInAt = fadeInAt;
    this.__fadeOutAt = fadeOutAt;
  }


  public getId() : string {
    return this.__id;
  }


  public getFileId() : string {
    return this.__fileId;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__id}`;
  }
}
