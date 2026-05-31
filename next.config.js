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

  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
      img-src 'self' blob: data: https://jclphocedhteegocjawx.supabase.co https://*.supabase.co https://www.googletagmanager.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://jclphocedhteegocjawx.supabase.co https://*.supabase.co https://*.supabase.in https://vitals.vercel-insights.com https://va.vercel-scripts.com https://region1.google-analytics.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://secure.payu.in https://test.payu.in;
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `;

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '').trim() }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
