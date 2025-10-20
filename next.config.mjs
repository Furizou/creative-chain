/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Enable webpack caching for faster rebuilds
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [import.meta.url],
        },
      };
    }
    return config;
  },

  // Optimize development experience
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Reduce unnecessary checks in development
  experimental: {
    // Use SWC minification (faster)
    swcMinify: true,
  },
};

export default nextConfig;