export class Base {
  protected warn(message: string) : void {
    console.warn(`[RadioKit.Playback ${new Date().toISOString()} ${this.constructor['name']}] ${message}`, this);
  }


  protected debug(message: string) : void {
    console.debug(`[RadioKit.Playback ${new Date().toISOString()} ${this.constructor['name']}] ${message}`, this);
  }
}
