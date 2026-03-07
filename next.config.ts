import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false, // Changed to false to prevent page reload on forced sync events
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
