import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "mizzonzarf.in" }],
        destination: "https://www.mizzonzarf.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
