/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === "true";

const nextConfig = {
  // Static export is enabled explicitly for export builds.
  ...(isExport ? { output: "export" } : {}),

  // Force a unique build id on every build so exported HTML always points
  // to a fresh set of hashed assets after deployment.
  generateBuildId: async () => {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA;
    const stamp = Date.now().toString(36);
    return commit ? `${commit}-${stamp}` : `build-${stamp}`;
  },
};

module.exports = nextConfig;
