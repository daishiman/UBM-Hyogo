# Phase 10: - 最終レビュー（DoD）

[実装区分: 実装仕様書 / Phase 10]

## 目的

index.md の AC-1〜AC-18 / DoD 全項目を 1 件ずつチェックし、未達があれば前 Phase に戻して修正する。MINOR 指摘で本サイクル外に回すものは Phase 12 `unassigned-task-detection.md` に formalize する。

## DoD チェックリスト

| # | 項目 | 確認方法 | 結果 |
| --- | --- | --- | --- |
| 1 | AC-1 `week_starting`/`schema_version` | workflow YAML diff 目視 | |
| 2 | AC-2 aggregator 新規 | `git ls-files scripts/cf-audit-log/dashboard/aggregate-weekly.ts` | |
| 3 | AC-3 schema_version 契約 | old skip / explicit unsupported throw / 型不正 throw / `1.0.0` 欠落補完の各 spec pass | |
| 4 | AC-4 schema 契約を含む 6 系統 pass | `outputs/phase-09/test.log` | |
| 5 | AC-5 line/branch ≥ 90% | `outputs/phase-07/coverage.json` | |
| 6 | AC-6 描画レイヤ Phase 3 確定 | `outputs/phase-03/decision.md` | |
| 7 | AC-7 4 指標プロット | screenshot 4 点 | |
| 8 | AC-8 比較線並記 | screenshot 目視 | |
| 9 | AC-9 screenshot 4 点配置 | `outputs/phase-11/evidence/screenshots/` | |
| 10 | AC-10 `screenshot-plan.json` `mode: VISUAL` | `outputs/phase-11/screenshot-plan.json` | |
| 11 | AC-11 3 層評価 | `three-layer-evaluation.md` | |
| 12 | AC-12 D1 列追加 0 | `git diff dev -- apps/api/migrations/ | wc -l` == 0 | |
| 13 | AC-13 Slack scope 重複なし | `git diff dev | grep -i "slack\|webhook" | wc -l` ≈ 0 | |
| 14 | AC-14 SSOT 追記 | `observability-monitoring.md` diff | |
| 15 | AC-15 Phase 12 strict 7 outputs | `ls outputs/phase-12/` | |
| 16 | AC-16 PR 本文 Refs | `outputs/phase-13/pr-body.md` | |
| 17 | AC-17 typecheck/lint/build/design-tokens | Phase 09 logs | |
| 18 | AC-18 mini-PR commit 分離 | `git log --oneline dev..HEAD` で `cf-audit-log-7day-summary.yml` のみの commit が先頭 | |

## MINOR 指摘の未タスク化方針

- aggregator の `migrate-summary.ts`（古い JSON への `week_starting` 補完）は別タスクとして `outputs/phase-12/unassigned-task-detection.md` に formalize する
- 12 週超の長期 baseline 比較は FU-03-A（90 日 baseline）と統合する将来タスクとする
- chart 描画 lib 採択（recharts / uPlot 等）の比較検討は本サイクル外

## 出力

- `outputs/phase-10/main.md` — レビュー実施記録
- `outputs/phase-10/dod-check.md` — 上記表（実値記入版）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 状態 | spec_created |

## 実行タスク

- 本文の目的・手順・出力に従う。

## 参照資料

- `index.md`
- `artifacts.json`

## 成果物

- `outputs/phase-*` に定義された成果物。

## 完了条件

- [ ] 本 Phase の出力仕様が `artifacts.json` と一致している。

## 統合テスト連携

- 実装 Phase で指定された focused command と Phase 09 品質ゲートに接続する。
