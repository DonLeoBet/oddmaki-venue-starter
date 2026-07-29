/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Schakel waarschuwingen uit voor expressie-dependencies (zoals ox/viem tempo)
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Maskeer ontbrekende optionele bibliotheken en problematische SDK's
      config.resolve.alias = {
        ...config.resolve.alias,
        '@coinbase/cdp-sdk': false,
        '@farcaster/mini-app-solana': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
