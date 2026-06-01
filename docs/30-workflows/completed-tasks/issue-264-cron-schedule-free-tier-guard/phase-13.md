# Phase 13: PR 作成手順

| 項目 | 値 |
| --- | --- |
| 実装区分 | 実装仕様書（本サイクルで guard test 実装済み） |
| PR / commit / push | **user-gated**（本サイクルでは実行しない） |
| base_branch | dev |
| Issue #264 | **CLOSED のまま**（再 open しない・GitHub mutation なし） |

## 本サイクルの扱い

本ワークフローは **実装仕様書 + guard test 実装**サイクルである。commit / push / PR 作成は **user 明示承認後のみ** 実行する
（CLAUDE.md「実 `gh api -X PUT` / commit / push / PR はユーザー明示承認後のみ実行」方針）。本サイクルでは
docs（`docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/` 配下）の spec ファイルと
`apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` を同一変更として生成した。

> フラット `phase-13.md`（本ファイル）は手順の正本概要を担う。詳細出力（PR 本文ドラフト等）は別エージェントが
> `outputs/phase-13/` に配置する。

## PR（user 承認後に実行）

| 項目 | 値 |
| --- | --- |
| base | `dev`（既定。production リリースではないため `main` を使わない） |
| PR タイトル案 | `test(api): wrangler cron free-tier guard (Refs #264)` |
| Issue 参照 | `Refs #264`（CLOSED のまま参照・back-link 同期済み。`Closes`/`Fixes` は使わない） |

> 本サイクルでは docs と guard test を同一変更として扱うため、PR タイトルは `test(api): wrangler cron free-tier guard (Refs #264)` を採用し、本文に spec への参照を含める。

## PR 本文骨子

```
## 概要
issue #264 を現行コード（Sheets→Forms 移行済 / free-plan 3-cron 確定）に最適化して再スコープし、
デプロイ済み 3-cron スケジュールの free-tier 回帰ガード（新規 spec test）＋ ADR / 無料枠予算文書を整備する。

## 背景 / 再スコープ
- 原 issue の「Sheets を 6h/1h/5min で 24h staging 実測」は obsolete（Sheets cron は手動限定に撤回・間隔は free-plan 制約で確定済）。
- supersede: docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md

## 変更内容
- docs: 実装仕様書 phase-01..13 + strict 7 + ADR / 解析的予算表
- test: apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts（依存追加 0 / プロダクションコード 0）

## ガード内容（CANONICAL = ["0 18 * * *","*/15 * * * *","*/5 * * * *"]）
- TC: canonical 一致 / ≤3 本（free-plan 上限）/ legacy `0 * * * *` 不在 / 3 セクション parity

## 検証
- mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
- mise exec -- pnpm typecheck / pnpm lint

## free-tier
依存追加 0 / paid 機能なし / runtime deploy なし

Refs #264

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## PR 作成コマンド（user 承認後）

```bash
# base=dev を明示
gh pr create --base dev \
  --title "test(api): wrangler cron free-tier guard (Refs #264)" \
  --body-file <PR本文>
```

## 影響範囲

| 区分 | 範囲 |
| --- | --- |
| 本サイクル（spec） | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/**` のみ。`apps/api` spec test 追加 1 |
| 実装 | `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` 新規 1 ファイル（テストのみ・プロダクションコード 0・`wrangler.toml` 無変更） |
| Issue | #264 は CLOSED のまま。`Refs #264` で参照・back-link 同期済み（再 open / close / ラベル変更などの mutation なし） |

## DoD（Phase 13）

- 本サイクルで guard test 実装済みで commit/push/PR は user-gated であることを明記。
- 本サイクル完了後の PR base=dev・タイトル案・本文骨子・作成コマンドを提示。
- Issue #264 は CLOSED のまま（`Refs #264` 参照・back-link 同期済み）であることを明記。
- 影響範囲（docs + 本サイクルで apps/api テスト 1 ファイル）を明記。
