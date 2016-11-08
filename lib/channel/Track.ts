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
  private __startNextAt?: Date;


  constructor(id: string, fileId: string, cueInAt: Date, cueOutAt: Date, cueOffset: number, fadeInAt?: Date, fadeOutAt?: Date, startNextAt?: Date) {
    super();

    this.__id = id;
    this.__fileId = fileId;
    this.__cueInAt = cueInAt;
    this.__cueOutAt = cueOutAt;
    this.__cueOffset = cueOffset;
    this.__fadeInAt = fadeInAt;
    this.__fadeOutAt = fadeOutAt;
    this.__startNextAt = startNextAt;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']} ${this.__id}`;
  }
}
