/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/manifest.webmanifest",
      headers: [{ key: "Content-Type", value: "application/manifest+json" }]
    },
    {
      source: "/sw.js",
      headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }]
    },
    {
      source: "/((?!_next/static|_next/image|favicon.ico|branding).*)",
      headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }]
    }
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    },
    serverComponentsExternalPackages: ["pdfkit"]
  },
  webpack: (config, { dev }) => {
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push({
      module: /@supabase\/realtime-js/,
      message: /Critical dependency: the request of a dependency is an expression/
    });
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/System Volume Information/**",
          "**/$RECYCLE.BIN/**"
        ]
      };
    }
    return config;
  }
};

export default nextConfig;
