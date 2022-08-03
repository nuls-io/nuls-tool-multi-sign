const webpack = require('webpack');
// const CompressionWebpackPlugin = require("compression-webpack-plugin");
// const productionGzipExtensions = ["js", "css"];
// const isProduction = process.env.NODE_ENV === "production";
// const AutoImport = require('unplugin-auto-import/webpack');
const Components = require('unplugin-vue-components/webpack');
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  publicPath: '/',
  configureWebpack: config => {
    // element-plus import es-module
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    });

    // if (isProduction) {
    //   config.plugins.push(
    //     new CompressionWebpackPlugin({
    //       algorithm: "gzip",
    //       test: new RegExp("\\.(" + productionGzipExtensions.join("|") + ")$"),
    //       threshold: 10240,
    //       minRatio: 0.8
    //     })
    //   );
    // }

    config.plugins.push(
      new webpack.DefinePlugin({
        //定义全局变量
        'process.env': {
          BUILD_ENV: JSON.stringify(process.env.BUILD_ENV)
        }
      })
    );
    // element-plus按需引入
    /*config.plugins.push(
      AutoImport({
        resolvers: [ElementPlusResolver()]
      })
    );*/
    config.plugins.push(
      Components({
        resolvers: [ElementPlusResolver()]
      })
    );
    config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
    // config.plugins.push(new BundleAnalyzerPlugin());
  },

  devServer: {
    port: 8021,
    host: '0.0.0.0',
    https: false,
    open: true
  }
};
