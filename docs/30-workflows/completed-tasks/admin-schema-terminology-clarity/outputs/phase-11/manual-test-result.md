# Phase 11 — 手動テスト結果（VISUAL / implemented_local_evidence_captured）

Task ID: `TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001`

## 0. 実行サマリ

| 項目 | 値 |
| --- | --- |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |
| capture 状態 | staging_visual_pending_user_gate |
| タスク種別 | UI task（視覚的変更あり） |
| 視覚的変更の性質 | 文言リネーム（表示文字列の日本語化 + 生 revisionId 非表示）。レイアウト・スタイル・トークンは不変 |

## 1. 実装済みローカル証跡

| 種別 | コマンド / 観点 | 結果 |
| --- | --- | --- |
| focused Vitest | `/admin/schema` page / diff panel / bulk resolve / bulk rollback / history / sidebar / KPI など 10 files | PASS（84 tests） |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| design token | `mise exec -- pnpm verify:tokens` | PASS |
| apps/api 非接触 | `git diff --quiet -- apps/api` | PASS（diff exit=0） |
| old technical-label grep | `CURRENT REVISION|FORM SCHEMA GUIDE|DIFF ITEMS|Bulk Resolve|Bulk Rollback|ALIAS HISTORY` | PASS（apps/web 表示対象から no match） |

## 2. screenshot 4 枚（user-gated）

authenticated staging で次の 4 枚を取得する。ローカル実装は完了しているが、認証付き staging 画面の取得はユーザー承認後に行う。

| canonical 名 | 観点 |
| --- | --- |
| `admin-schema-terminology-header-renamed.png` | サイドバー / 見出し / パンくず の日本語化 |
| `admin-schema-current-revision-hidden-id.png` | 生 revisionId 非表示・日本語日付表示 |
| `admin-schema-diff-panel-japanese-actions.png` | Diff パネルのアクション日本語化 |
| `admin-dashboard-form-item-alert.png` | ダッシュボードのアラート / KPI 日本語化 |

## 3. Phase 11 evidence の扱い

- Gate-B はローカル実装証跡で PASS。
- screenshot は `staging_visual_pending_user_gate` として Gate-C 側に残す。
- staging deploy / commit / push / PR / screenshot 取得は全て user-gated。

## 4. 境界

- `apps/api/**` は変更なし。
- 色・OKLch トークンは不変。
- API / D1 / Google Form / endpoint surface は変更しない。
