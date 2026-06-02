# Phase 13: PR 作成

`[実装区分: implementation]`
status: `blocked`（user-gated）

## 前提

**PR 作成・commit・push・Issue 状態変更は、ユーザーの明示承認後のみ実施する（CONST_002）。**
本ワークフローはローカル実装と検証まで完了している。Cloudflare deploy、staging runtime PNG capture、commit、push、PR は user-gated。

## 実装サイクル完了後の PR 手順（参考）

1. 作業ブランチ（`docs/issue-1027-member-dynamic-og-worker-split` もしくは実装用 `feat/issue-1027-*`）でローカル実装差分を確認。
2. `git fetch origin dev` → ローカル `dev` を FF 同期 → 作業ブランチへマージしコンフリクト解消。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. OG worker / web 双方の size gate と回帰 grep を確認。
5. `gh pr create --base dev`（production リリース時のみ `--base main`）。本文に implementation-guide の主要見出しと Phase 11 の OG 画像証跡を反映。

## Issue 連携

- Issue #1027 は **OPEN 維持**。PR 本文に `Refs #1027`。close はユーザー承認後。

## ブロッカー

- コード実装済み（implemented_local_runtime_pending）。
- ユーザー承認待ち。
