/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === "true";

const nextConfig = {
  ...(isExport ? { output: "export" } : {}),

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  generateBuildId: async () => {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA;
    const stamp = Date.now().toString(36);
    return commit ? `${commit}-${stamp}` : `build-${stamp}`;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jclphocedhteegocjawx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
