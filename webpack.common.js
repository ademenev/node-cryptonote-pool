var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './website/index.js',
  output: {
	  path: path.resolve(__dirname, 'website/build'),
    filename: 'bundle.js',
    sourceMapFilename: 'bundle.js.map',
    publicPath: "/"
  },
  resolve : {
	modules: [path.resolve(__dirname, "website"), "node_modules"]
  },
	plugins: [
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
			loaders: {
				js: 'babel-loader'
			},
			postLoaders: {
				html: 'babel-loader?presets[]=es2015',
				css: 'babel-loader?presets[]=es2015',
				js: 'babel-loader?presets[]=es2015'
			}
		}
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader?presets[]=es2015',
        }
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  }
}
