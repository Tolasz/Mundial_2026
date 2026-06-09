import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // api-football / football-data flag CDNs
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "media.apifootball.com" },
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Generic https flag sources
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
