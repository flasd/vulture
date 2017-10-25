const MinifyPlugin = require("babel-minify-webpack-plugin");
const path = require('path');
const webpack = require('webpack');

function resolve(stg) {
    return path.resolve(process.cwd(), stg);
}

module.exports = {
    entry: './src/index.js',

    output: {
        path: resolve('dist'),
        filename: 'index.js',
        library: "Vulture",
        libraryTarget: "umd",
    },

    module: {
        rules: [{
            loader: 'babel-loader',
            test: /.js$/,
            exclude: /node_modules/,
        }]
    },

    plugins: [
        new webpack.EnvironmentPlugin(['NODE_ENV']),
        new MinifyPlugin(),
    ],

    devtool: 'source-map',
}
