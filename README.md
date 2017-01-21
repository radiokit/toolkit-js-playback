# RadioKit JS Toolkit: Playback

High-level JavaScript API for performing playback of [RadioKit](http://www.radiokit.org)-powered
channels.


# Documentation

See https://docs-toolkit-js.radiokit.org/en/latest/playback.html.


# Demo

See https://radiokit.github.io/toolkit-js-playback-demo/

Otherwise you can run demo locally. In order to run demo located in the `demo/`
folder, build the browser bundle, enter the demo folder and run

```sh
python -m SimpleHTTPServer
```

And open http://localhost:8000 in the browser.

Then you can type in the browser console e.g.

```javascript
window.player = new RadioKitToolkitPlayback.Player.Channel("3d49ef93-a010-4649-b3ed-b0f99fe96173", "123");
window.player.start();
```


# Development

* Clone the repo
* Enter dir with the project
* Install NPM packages: `npm install`


# Building browser bundle

* Type `npm run build-browser`

Browser-compatible version will be located in `dist/browser/`.


# Authors

Marcin Lewandowski <marcin@radiokit.org>

# License

MIT
