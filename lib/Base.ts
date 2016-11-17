export abstract class Base {
  private __events: Object = {};


  /**
   * Adds given callback for given event name.
   */
  public on(eventName: string, callback) : Base {
    if(this.__events.hasOwnProperty(eventName)) {
      if(this.__events[eventName].indexOf(callback) === -1) {
        this.__events[eventName].push(callback);
      } else {
        throw new Error(`Trying to addd twice the same callback for event "${eventName}"`);
      }
    } else {
      this.__events[eventName] = [callback];
    }

    return this;
  }


  /**
   * Removes given callback for given event name.
   */
  public off(eventName: string, callback) : Base {
    if(this.__events.hasOwnProperty(eventName)) {
      const index = this.__events[eventName].indexOf(callback);
      if(index !== -1) {
        this.__events[eventName].splice(index, 1);
      } else {
        throw new Error(`Trying to remove non-existent callback for event "${eventName}"`);
      }
    }

    return this;
  }


  /**
   * Removes all callbacks for given event name.
   *
   * If given event name is undefined, removes all callbacks for all events.
   */
  public offAll(eventName?: string) : Base {
    if(eventName) {
      if(this.__events.hasOwnProperty(eventName)) {
        delete this.__events[eventName];
      }
    } else {
      this.__events = {};
    }

    return this;
  }


  protected _trigger(eventName, ...args: any[]) : Base {
    this.debug(`Event: ${eventName} (${JSON.stringify(args)})`);

    if(this.__events.hasOwnProperty(eventName)) {
      for(let callback of this.__events[eventName]) {
        callback.apply(this, args);
      }
    }

    return this;
  }


  protected abstract _loggerTag() : string;


  protected warn(message: string) : void {
    console.warn(`[${new Date().toISOString()} RadioKit.Toolkit.Playback ${this._loggerTag()}] ${message}`);
  }


  protected info(message: string) : void {
    console.info(`[${new Date().toISOString()} RadioKit.Toolkit.Playback ${this._loggerTag()}] ${message}`);
  }


  protected debug(message: string) : void {
    console.debug(`[${new Date().toISOString()} RadioKit.Toolkit.Playback ${this._loggerTag()}] ${message}`);
  }
}
