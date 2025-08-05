module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Eliminar el CssMinimizerPlugin completamente
      webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
        (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
      );
      return webpackConfig;
    },
  },
};
