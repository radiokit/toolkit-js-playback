import { Player }  from './channel/Player';

export const Channel = {
  Player,
};


// TODO remove
if(typeof(window) !== "undefined") {
  window['RadioKitToolkitPlayback'] = {
    Channel: {
      Player,
    }
  };
}
