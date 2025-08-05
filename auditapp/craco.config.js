module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const minimizer = webpackConfig.optimization.minimizer;
      const cssMinimizer = minimizer.find(
        (plugin) => plugin.constructor.name === 'CssMinimizerPlugin'
      );

      if (cssMinimizer) {
        cssMinimizer.options.minimizerOptions = {
          preset: ['default', { discardComments: { removeAll: true } }]
        };
      }

      return webpackConfig;
    }
  }
};
