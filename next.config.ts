import type { NextConfig } from "next";

// Automatically detect repo name for GitHub Pages path routing (e.g. /hyperscaler)
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserSite = repo.toLowerCase().endsWith(".github.io");
const autoBasePath = process.env.GITHUB_ACTIONS && repo && !isUserSite ? `/${repo}` : "";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? autoBasePath;

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
