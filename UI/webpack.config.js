var HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const env = require('./env');
const path = require('path');
const mode = env.env;

apiUrl = '';
middleApiUrl = '';
if(mode === 'local'){
//	apiUrl ="https://uatucpapi.cloud4c.com";
//    middleApiUrl ="https://uatucpapi.cloud4c.com";

   apiUrl ="http://localhost:9891";
   middleApiUrl ="http://localhost:9891";
} else if(mode === 'ucpdemo'){
	apiUrl ="https://demoucp.cloud4c.com";
    middleApiUrl ="https://demoucp.cloud4c.com";
} else if(mode === 'dev'){
	apiUrl ="http://45.127.100.176:9890";
    middleApiUrl ="http://45.127.100.176:9890";
} else if(mode === 'uat'){
	apiUrl ="https://internalucp360api.cloud4c.com";
    middleApiUrl ="https://internalucp360api.cloud4c.com";
} else if(mode === 'live'){
	apiUrl ="https://ucp360api.cloud4c.com";
    middleApiUrl ="https://ucp360api.cloud4c.com";
} else if(mode === 'dhluat'){
	apiUrl ="https://dhl-uatapi.cloud4c.com";
    middleApiUrl ="https://dhl-uatapi.cloud4c.com";
}else if(mode === 'dhluatonprem'){
	apiUrl ="https://uatucp.dhl.com";
    middleApiUrl ="https://uatucp.dhl.com";
}else if(mode === 'dhlonprem'){
	apiUrl ="https://ucp.dhl.com";
    middleApiUrl ="https://ucp.dhl.com";
}else {
	apiUrl ="http://localhost:9890";
    middleApiUrl ="http://localhost:9890";
} 
module.exports = {
  mode: "development",//mode === 'local' ? "development": "production",
//  entry: path.resolve(__dirname, 'src/index.jsx'),
//  output: {
//    path: path.resolve(__dirname, 'dist'),
//    filename: '[name].[contenthash].js',
//  },
//  optimization: {
//	runtimeChunk: 'single',
//    splitChunks: {
//      chunks: 'all',
//      maxInitialRequests: Infinity,
//      minSize: 0,
//      cacheGroups: {
//        vendor: {
//          test: /[\\/]node_modules[\\/]/,
//          name(module) {
//            // get the name. E.g. node_modules/packageName/not/this/part.js
//            // or node_modules/packageName
//            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
//
//            // npm package names are URL-safe, but some servers don't like @ symbols
//            return `npm.${packageName.replace('@', '')}`;
//          },
//        },
//      },
//    },
//  },
optimization: {
  minimize: false,//mode !== 'local',
  minimizer: [new TerserPlugin()]
},
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        query: {compact: false}
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    })
  ],
  devServer: {
    historyApiFallback: true,
    port: 8081
  },
  externals: {
    // global app config object
    config: JSON.stringify({
       apiUrl: apiUrl,
       middleApiUrl: middleApiUrl,
    })
  }
};