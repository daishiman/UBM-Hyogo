# Phase 1: - 要件定義 / Gate 整理 / 真の論点

[実装区分: 実装仕様書 / Phase 01]

## 目的

unassigned-task `u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md` を Phase 1-13 仕様書に formalize する第一段階として、scope / 受入条件 / 入出力 inventory / タスク分類 / 命名規則整合 / P50 チェックを確定する。

## 入力

- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md`
- `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/index.md`
- 既存 workflow `.github/workflows/cf-audit-log-7day-summary.yml`

## scope（再確認）

| 項目 | 値 |
| --- | --- |
| タスク分類 | UI task（VISUAL evidence: dashboard screenshot 4 点を含む） |
| 実装区分 | 実装仕様書 |
| visualEvidence | VISUAL |
| implementation_mode | new |
| 命名規則 | `cf-audit-log-` prefix を踏襲（既存 `cf-audit-log-7day-summary.yml` / `cf-audit-log-monitor.yml` と整合）。新規 script は `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` |
| docs_only | false |

## 受入条件 inventory

index.md AC-1 〜 AC-18 を Phase 01 段階で再点検し、Phase 5 / Phase 7 / Phase 11 で evidence を取得する責務を割り当てる。

| AC | 取得 Phase | evidence path（予定） |
| --- | --- | --- |
| AC-1 (`week_starting`/`schema_version`) | 5 | workflow YAML diff |
| AC-2 (aggregator 新規) | 5 | `scripts/cf-audit-log/dashboard/aggregate-weekly.ts` |
| AC-3 (schema_version 契約: old skip / explicit unsupported throw / 型不正 throw / `1.0.0` 欠落補完) | 4, 6 | unit test ログ |
| AC-4 (schema 契約を含む 6 系統 pass) | 4, 6 | `outputs/phase-09/test.log` |
| AC-5 (line/branch ≥ 90%) | 7 | `outputs/phase-07/coverage.json` |
| AC-6 (描画レイヤ Phase 3 確定) | 3, 5 | `outputs/phase-03/decision.md` |
| AC-7 (4 指標プロット) | 11 | screenshots |
| AC-8 (比較線並記) | 11 | screenshots |
| AC-9 (screenshot 4 点) | 11 | `outputs/phase-11/evidence/screenshots/` |
| AC-10 (`screenshot-plan.json` `mode: VISUAL`) | 11 | 同上 |
| AC-11 (3 層評価) | 11 | `three-layer-evaluation.md` |
| AC-12 (D1 列追加 0) | 9, 10 | grep gate |
| AC-13 (Slack scope 重複なし) | 10 | DoD check |
| AC-14 (SSOT 追記) | 12 | `system-spec-update-summary.md` |
| AC-15 (Phase 12 strict 7) | 12 | `outputs/phase-12/*` |
| AC-16 (PR 本文 Refs 連携) | 13 | `pr-body.md` |
| AC-17 (typecheck/lint/build/design-tokens) | 9 | logs |
| AC-18 (mini-PR commit 分離) | 13 | git log |

## P50 チェック（implementation_mode 判定）

- 現 branch `task-20260514-203845-wt-10` で `scripts/cf-audit-log/dashboard/` 配下 / `apps/web/src/app/(admin)/admin/audit/dashboard/` / `docs/dashboards/cf-audit-log-7day-trend/` の存在確認。
- 確認コマンド:
  ```bash
  ls scripts/cf-audit-log/dashboard/ 2>/dev/null || echo "NOT_FOUND"
  ls apps/web/src/app/\(admin\)/admin/audit/dashboard/ 2>/dev/null || echo "NOT_FOUND"
  ls docs/dashboards/cf-audit-log-7day-trend/ 2>/dev/null || echo "NOT_FOUND"
  ```
- すべて `NOT_FOUND` なら `implementation_mode: "new"` 確定（artifacts.json と整合）。1 つでも既存ならば mode を `extend` に切替えて Phase 02 設計の前提を見直す。

## 真の論点（Phase 03 で結論）

1. **描画レイヤ**: admin UI 組込（Auth.js 保護下・運用継続性高）vs 静的 HTML（簿価最小・公開リスクあり）
2. **`week_starting` 計算箇所**: workflow YAML 側を正本とし、aggregator script は `schema_version: "1.0.0"` で欠落した場合のみ `generated_at` から native ISO week 補完する
3. **chart 描画 lib**: inline SVG 自前 vs 軽量 lib（recharts / chart.js / uPlot）。外部 SaaS 禁止 / bundle size 検討

## 出力

- `outputs/phase-01/main.md` — 要件定義 final 表 / Gate 一覧 / 真の論点 3 件

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
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
