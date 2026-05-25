---
phase: 11
title: Evidence Inventory
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 11: Evidence Inventory — internal alert relay binding 配線

[実装区分: 実装仕様書]

## NON_VISUAL 宣言

- **タスク種別**: implementation（config-wiring）/ NON_VISUAL
- **非視覚的理由**: 変更は `wrangler.toml` vars 追加・env.ts コメント・test 追加のみ。レンダリングされる UI 画面の変更がない。
- **代替証跡**: 自動テスト（vitest）・typecheck・lint・wrangler dry-run・staging Workers tail ログ。
- スクリーンショットは作成しない（`screenshots/` ディレクトリを置かない）。

## evidence 表

| evidence | 取得方法 | 主ソース | 保存先 |
| --- | --- | --- | --- |
| 型チェック | `pnpm --filter @ubm-hyogo/api typecheck` | stdout | `outputs/phase-11/evidence/typecheck-api.log` |
| lint | `pnpm --filter @ubm-hyogo/api lint` | stdout | `outputs/phase-11/evidence/lint-api.log` |
| config guard + contract | `pnpm --filter @ubm-hyogo/api test ...sheets-auth-healthcheck...` | vitest stdout（58 files / 373 tests PASS） | `outputs/phase-11/evidence/vitest-sheets-auth-healthcheck.log` |
| wrangler dry-run | `scripts/cf.sh deploy ... --dry-run` | stdout（TOML 受理） | 同上 |
| vars 配線 grep | `grep API_INTERNAL_BASE_URL apps/api/wrangler.toml` | 2 行ヒット | 同上 |
| staging tail（runtime） | `scripts/cf.sh deploy --env staging` 後の tail | `alert_relay_skipped` log 消失 | runtime evidence（user-gated・deploy 後） |

## 証跡件数サマリ

| カテゴリ | PASS | FAIL | SKIP | 備考 |
| --- | --- | --- | --- | --- |
| config guard (binding.spec) | 3 | - | - | TC-01〜03 |
| contract (fallback 追加) | 1 | - | - | TC-04 |
| contract (既存回帰) | 5 | - | - | TC-05 群 |

## 環境ブロッカー（該当時のみ・source-level PASS と分離）

- runtime 証跡（staging tail / secret list）は Cloudflare 環境と user 承認が前提。local source-level PASS とは別カテゴリで記録する。
