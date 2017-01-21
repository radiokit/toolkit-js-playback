module.exports = {
    entry: './lib/index',
    output: {
        path: __dirname + '/dist/browser',
        filename: 'radiokit-toolkit-playback.js'
    },
    resolve: {
        extensions: ['', '.ts'] // '' is required in webpack 1.x
    },
    devtool: 'source-map', // if we want a source map
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            }
        ]
    }
}
