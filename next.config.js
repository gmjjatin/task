/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // sql.js loads its .wasm file from disk, so Node must require it instead of the bundler inlining it.
    serverComponentsExternalPackages: ['sql.js'],
  },
};

module.exports = nextConfig;
