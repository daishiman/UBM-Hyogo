# Phase 10 — デプロイ / マージ手順

## 10.1 ランタイム影響

本タスクは test ファイルの rename のみで **production runtime / Cloudflare Workers bundle / D1 schema には一切影響しない**。

- Workers bundle 対象: `apps/web` / `apps/api` の `src/` 配下のみ → test 命名と無関係
- D1 migration: 無関係
- Secrets / op 参照: 無関係

## 10.2 デプロイ手順

通常の dev → main フローに従う:

1. `refactor/issue-622-packages-test-suffix-rename` → `dev` PR を merge
2. Cloudflare staging へ自動デプロイ（runtime smoke は test 命名と無関係に通過）
3. `dev` → `main` リリースサイクルで production へ反映

## 10.3 マージゲート

- CI required status checks:
  - typecheck PASS
  - lint PASS
  - vitest（unit/integration tests）PASS
  - verify-indexes-up-to-date PASS（本タスクで indexes 変更なしのため自動 PASS）
  - verify-design-tokens PASS（本タスクで token 変更なしのため自動 PASS）

## 10.4 rollback

Phase 8.3 を参照。`git revert <commit-C> <commit-B> <commit-A>` で完全 forward-safe rollback。

## 10.5 デプロイ後確認

不要。test 命名は runtime に到達しないため、デプロイ後の smoke test は通常の dev runtime smoke のみで十分。
