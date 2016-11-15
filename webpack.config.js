module.exports = {
    entry: './lib/index',
    output: {
        path: __dirname + '/dist/browser',
        filename: 'radiokit-toolkit-playback.js'
    },
    resolve: {
        extensions: ['', '.ts']
    },
    devtool: 'source-map', // if we want a source map
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'webpack-typescript?target=ES5'
            }
        ]
    }
}
