/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // a lockfile higher up the tree otherwise wins the root inference
  outputFileTracingRoot: import.meta.dirname,
  // hides the Next dev badge in the corner; it never shipped to production
  // anyway, this just keeps it out of the way while working
  devIndicators: false,
};

export default nextConfig;
