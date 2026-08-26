import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "mizoonzarf.in" }],
        destination: "https://www.mizoonzarf.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
