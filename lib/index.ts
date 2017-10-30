import { Player }  from './channel/Player';
import { Setup }  from './channel/Setup';

export const Channel = {
  Player,
  Setup,
};


// TODO remove
if(typeof(window) !== "undefined") {
  window['RadioKitToolkitPlayback'] = {
    Channel: {
      Player,
      Setup,
    }
  };
}
