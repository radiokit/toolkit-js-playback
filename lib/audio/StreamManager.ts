import { Base } from '../Base';
import { Socket, Channel } from 'phoenix';


/**
 * This class contains stream manager that can play a regular icecast stream.
 *
 * - playback-started (no args) - when playback starts
 */
export class StreamManager extends Base {
  private __volume:           number = 1.0;
  private __audio:            HTMLAudioElement;
  private __channelId:        string;
  private __started:          boolean = false;
  private __restartTimeoutId: number = 0;
  private __socket:           Socket;
  private __channel:          Channel;


  constructor(channelId: string) {
    super();

    this.__channelId = channelId;
    this.__socket = new Socket("wss://agenda.radiokitapp.org/api/stream/v1.0");
  }


  public start() : StreamManager {
    if(!this.__started) {
      this.debug('Starting');
      this.__started = true;
      this.__startPlayback();
      this.__subscribeMetadata();

    } else {
      throw new Error('Attempt to start Stream Manager that is already started');
    }

    return this;
  }


  public stop() : StreamManager {
    if(this.__started) {
      this.debug('Stopping');
      this.__stopPlayback();
      this.__unsubscribeMetadata();
      this.__started = false;

    } else {
      throw new Error('Attempt to stop Stream Manager that is not started');
    }

    return this;
  }


  /**
   * Sets volume of all current and future audio players.
   */
  public setVolume(volume: number) : StreamManager {
    if(volume < 0.0 || volume > 1.0) {
      throw new Error('Volume out of range');
    }

    this.__volume = volume;
    if(this.__audio) {
      this.__audio.volume = volume;
    }

    return this;
  }


  protected _loggerTag() : string {
    return `${this['constructor']['name']}`;
  }



  private __onAudioError(e) : void {
    this.warn('Error');
    this.__stopPlayback();
    this.__scheduleRestart();
  }


  private __onAudioEnded(e) : void {
    this.warn('EOS');
    this.__stopPlayback();
    this.__scheduleRestart();
  }


  private __onAudioWaiting(e) : void {
    this.warn('Waiting');
  }


  private __onAudioPlaying(e) : void {
    this.debug('Playing');
    this._trigger('playback-started');
  }


  private __onAudioStalled(e) : void {
    this.warn('Stalled');
  }


  private __onAudioSuspended(e) : void {
    this.warn('Suspended');
  }


  private __subscribeMetadata() : void {
    this.__socket.connect();
    this.__channel = this.__socket.channel(`broadcast:metadata:${this.__channelId}`);
    this.__channel.on("update", payload => {
      this.debug("Received metadata: payload = " + JSON.stringify(payload));
      this._trigger("channel-metadata-update", payload);
    })
    this.__channel.join()
      .receive("ok", ({messages}) => this.debug("Subscribed to metadata") )
      .receive("error", ({reason}) => this.warn("Failed to subscribe to metadata: error = " + reason) )
      .receive("timeout", () => this.warn("Failed to subscribe to metadata: timeout") )
  }


  private __unsubscribeMetadata() : void {
    this.__channel.leave();
    this.__socket.disconnect();
  }


  private __startPlayback() : void {
    this.debug('Starting playback');

    this.__audio = new Audio();

    // Set proper volume
    this.__audio.volume = this.__volume;

    // Do not disable preloading - it causes issues on Safari

    // Get URL from the playlist
    this.__audio.src = `http://cluster.radiokitstream.org/${encodeURIComponent(this.__channelId)}.mp3`;

    // Set callbacks
    this.__audio.onerror = this.__onAudioError.bind(this);
    this.__audio.onended = this.__onAudioEnded.bind(this);
    this.__audio.onwaiting = this.__onAudioWaiting.bind(this);
    this.__audio.onstalled = this.__onAudioStalled.bind(this);
    this.__audio.onsuspend = this.__onAudioSuspended.bind(this);
    this.__audio.onplaying = this.__onAudioPlaying.bind(this);
    this.__audio.play();
  }


  private __stopPlayback() : void {
    this.debug('Stopping playback');
    if(this.__audio) {
      this.__audio.onerror = undefined;
      this.__audio.onended = undefined;
      this.__audio.onwaiting = undefined;
      this.__audio.onstalled = undefined;
      this.__audio.onsuspend = undefined;
      this.__audio.onplaying = undefined;
      if(this.__audio.readyState == 4) {
        this.__audio.pause();
      }
      this.__audio.src = '';
      delete this.__audio;
      this.__audio = undefined;
    }

    if(this.__restartTimeoutId !== 0) {
      clearTimeout(this.__restartTimeoutId);
      this.__restartTimeoutId = 0;
    }
  }


  private __scheduleRestart() : void {
    if(this.__started) {
      const timeout = 500 + Math.round(Math.random() * 250);
      this.debug(`Scheduling restart in ${timeout} ms`);
      this.__restartTimeoutId = setTimeout(() => {
        this.__restartTimeoutId = 0;
        this.__startPlayback();
      }, timeout);
    }
  }
}
