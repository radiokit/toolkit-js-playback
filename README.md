# RadioKit JS Toolkit: Playback

High-level JavaScript API for performing playback of RadioKit channels.

# Development

* Clone the repo
* Enter dir with the project
* Install NPM packages: `npm install`

# Building

* Type `npm run build-browser`

Browser-compatible version will be located in `dist/browser/`.

TODO: build native JS version for NPM.

# Demo

In order to run demo located in the `demo/` folder, build the browser version,
enter the demo folder and run

    python -m SimpleHTTPServer

And open http://localhost:8000 in the browser.

Then you can type in the browser console e.g.

`x = new RadioKitToolkitPlayback.Player.Channel("3d49ef93-a010-4649-b3ed-b0f99fe96173", 123).start().then(function(channel) { console.debug(channel.fetch()); });`

# Authors

Marcin Lewandowski <marcin@radiokit.org>

# License

MIT
