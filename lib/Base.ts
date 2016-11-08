export abstract class Base {
  private __events: any = {}; // FIXME


  public on(eventName: string, callback) {
    // TODO
  }


  public off(eventName: string, callback) {
    // TODO
  }


  protected abstract _loggerTag() : string;


  protected warn(message: string) : void {
    console.warn(`[RadioKit.Playback ${new Date().toISOString()} ${this._loggerTag()}] ${message}`);
  }


  protected info(message: string) : void {
    console.info(`[RadioKit.Playback ${new Date().toISOString()} ${this._loggerTag()}] ${message}`);
  }


  protected debug(message: string) : void {
    console.debug(`[RadioKit.Playback ${new Date().toISOString()} ${this._loggerTag()}] ${message}`);
  }
}
