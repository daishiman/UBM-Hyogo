import path from "node:path";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

// git worktree 配下で動かすとき、Next.js / Turbopack が親リポ (.worktrees/ の外) を
// monorepo root として誤検出して別ワークツリーのソースを取り込むため、ここで固定する
const workspaceRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  // git worktree 環境で next build 内蔵の型チェッカが workspaceRoot 外 (親リポ側)
  // のソースを巻き込み誤検出するため無効化する。型検証は `pnpm --filter web exec tsc --noEmit` で別途担保。
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
