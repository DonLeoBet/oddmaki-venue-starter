const path = require("path");
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    if (!isServer) {
      const emptyStub = path.join(__dirname, "lib/stubs/empty-module.js");
      const baseAccountStub = path.join(__dirname, "lib/stubs/baseAccount.js");

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        "@farcaster/mini-app-solana": emptyStub,
      };

      // Avoid bundling Coinbase Base Account payment SDK (optional wagmi connector dep).
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /@wagmi\/connectors\/dist\/esm\/baseAccount\.js$/,
          baseAccountStub,
        ),
      );
    }

    return config;
  },
};

module.exports = nextConfig;
