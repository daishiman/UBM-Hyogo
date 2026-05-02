# Phase 11: NON_VISUAL evidence

[実装区分: 実装仕様書]
判定根拠: taskType は code に変更されたが、追加対象は API 内部の thin facade モジュール（`apps/api/src/jobs/_shared/`）のみで UI 影響を持たないため visualEvidence は `NON_VISUAL` のまま維持する。代替 evidence として TS ファイル存在 / grep 整合 / vitest PASS log / CODEOWNERS validation を採用する。

## メタ情報

| Phase | 11 / 13 |
| --- | --- |
| 前 Phase | 10 |
| 次 Phase | 12 |
| 状態 | completed |

## evidence 計画

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/evidence/file-existence.log` | `find docs/30-workflows/_design -type f` 出力 |
| `outputs/phase-11/evidence/owner-table-grep.log` | `cat docs/30-workflows/_design/sync-shared-modules-owner.md \| sed -n '1,80p'` 出力 |
| `outputs/phase-11/evidence/index-link-grep.log` | `grep -F 'sync-shared-modules-owner.md' docs/30-workflows/completed-tasks/03[ab]*/index.md` 出力 |
| `outputs/phase-11/evidence/relative-path-resolution.log` | Phase 7 I-3 のシェル出力 |

## VISUAL_ON_EXECUTION 適用判定

- 本タスクの成果物に UI / 画面 / runtime smoke は存在しない。`VISUAL_ON_EXECUTION` には該当せず、純粋に `NON_VISUAL` で完結する。

## 成果物

- `outputs/phase-11/main.md`（evidence 4 ファイルの内容と PASS 判定サマリ）

## 完了条件

- 4 evidence ログが揃っており、すべて Phase 6/7 と整合

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
