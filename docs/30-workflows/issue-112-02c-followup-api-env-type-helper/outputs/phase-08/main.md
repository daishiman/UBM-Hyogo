# Phase 8 outputs main — CI / 品質ゲート サマリ

## 結論

本タスクは既存 CI gate **追加なし**。typecheck / lint / unit test / boundary lint / verify-indexes の 5 gate で AC-1〜7 を担保する。

## 通過必須 gate（5 件）

| # | gate | コマンド | workflow / job | 期待 |
| --- | --- | --- | --- | --- |
| G-1 | typecheck | `pnpm typecheck` | `ci.yml` / `ci` | exit 0 |
| G-2 | lint | `pnpm lint` | `ci.yml` / `ci` | exit 0 |
| G-3 | apps/api unit test | `pnpm test --filter @ubm/api` | local + Phase 11 evidence | 02c 既存 test 全 pass |
| G-4 | boundary lint | `node scripts/lint-boundaries.mjs` | local + Phase 11 evidence | 違反 0 件、exit 0 |
| G-5 | verify-indexes | `pnpm indexes:rebuild` + git diff | `verify-indexes.yml` / `verify-indexes-up-to-date` | indexes drift 無し |

## CI workflow trigger

- `ci.yml`: push/PR `main`/`dev`
- `verify-indexes.yml`: push `main`、PR `main`/`dev`
- `backend-ci.yml`: push `dev`/`main`（deploy。本タスク scope 外）

## 既存 02c との差分

- 追加 workflow / 追加 job: **無し**
- 追加トークン（boundary lint）: `apps/api/src/env` を明示追加し、さらに relative import path 解決で `../../api/src/env` も遮断
- 追加 unit test: **無し**（refactor の後方互換維持のみ。Phase 6 で型レベル契約テストを導入）

## fail 時 fallback 一次切り分け

1. G-1 fail → `Env` field 漏れ or `Pick<Env, "DB">` 互換崩壊
2. G-3 fail → 02c fixture 形 vs `D1Db` alias 不整合（Phase 2 設計に差し戻し）
3. G-4 fail → apps/web 側に `apps/api` 文字列を含む新規 import が混入
4. G-5 fail → skill index 副作用（本タスクでは通常発生しない）
