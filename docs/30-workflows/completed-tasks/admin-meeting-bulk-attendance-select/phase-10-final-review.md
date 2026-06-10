# Phase 10: 最終レビュー

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- 前提: Phase 1（AC-1..AC-12）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画 Red）/ Phase 5-9（実装手順・テスト追加・カバレッジ・リファクタ・QA）
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused vitest・local fixture screenshot は完了。staging 視覚証跡 / PR は user-gated）
- visualEvidence: `VISUAL`（local fixture 視覚確認は Phase 11 で実施済み。staging baseline は user-gated）
- 本 Phase の責務: AC-1..AC-12 の最終トレースを 3-state 語彙で確定し、MINOR 追跡・不変条件適合を再確認したうえで「仕様書として PASS（実装着手可）」を判定する。

## 目的

Phase 1〜9 の成果（要件・設計・テスト計画・カバレッジ・QA gate）が AC-1..AC-12 へ漏れなく trace され、実コード反映で green 化できることを最終確認する。
各 AC の判定は **`implemented_local_evidence_captured`** を基本とし、視覚に依存する項目は Phase 11 の **`runtime_pending`** を併記する。

## 1. AC-1..AC-12 充足判定表（各 AC → 対応 Phase → 3-state 判定）

判定語彙: `implemented_local_evidence_captured`（ローカル実装・focused test PASS） / `runtime_pending`（staging 視覚確認が user-gated で未実施）。

| AC | 条件要旨 | 主担当の変更点 | 対応 Phase | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | ドロワー内 複数選択チェックリスト UI | `BulkAttendanceChecklist.tsx`（F4） + Drawer 埋込（F6） + `.bulk-attendance*` CSS（F9） | P2 設計 / P9 T3 / P11 視覚 | `implemented_local_evidence_captured` ／ 視覚は `runtime_pending` |
| AC-2 | 名前 / memberId インクリメンタル検索 | `useBulkAttendanceSelection`（F3）`selectableCandidates` + 検索 FormField | P2 §2.2 / P9 T2 | `implemented_local_evidence_captured` |
| AC-3 | 件数 N 反映ボタン・0 件 disabled | `BulkAttendanceChecklist`（F4）submit button | P2 §2.3 / P9 T3 | `implemented_local_evidence_captured` ／ 視覚は `runtime_pending` |
| AC-4 | 出席済除外・未出席のみ選択対象 | hook（F3）`notAttended` filter + stale 除去 effect | P2 §2.2 / P9 T2 | `implemented_local_evidence_captured` |
| AC-5 | import endpoint へ 1 リクエスト送信 | `importAttendance`（F1）`?dryRun=false` `{rows}` | P2 §4 / P9 T6 | `implemented_local_evidence_captured` |
| AC-6 | 成功時 attended 反映・toast・clear | Shell `onBulkAdd`（F7）`committed:true` 分岐 | P2 §2.6 / P9 T3 + ロジック | `implemented_local_evidence_captured` ／ toast 表示は `runtime_pending` |
| AC-7 | `committed:false` 時 0 件追加・内訳 toast・選択保持 | Shell `onBulkAdd`（F7）+ `bulkFailureMessage`（純関数） | P2 §2.6 / P8 §2 / P9 | `implemented_local_evidence_captured` ／ toast 表示は `runtime_pending` |
| AC-8 | 大量選択モーダル（検索 / 全選択 / 解除 / 一括追加） | `BulkAttendanceModal.tsx`（F5） + Drawer 起動導線（F6） | P2 §2.4 / P9 T4 / P11 視覚 | `implemented_local_evidence_captured` ／ 視覚は `runtime_pending` |
| AC-9 | モーダルも同一契約・hook 集約 | `useBulkAttendanceSelection`（F3）を両 UI で共有 | P2 §1 / P8 §1 / P9 T2 | `implemented_local_evidence_captured` |
| AC-10 | 既存単発追加 / 削除 回帰なし | Drawer（F6）既存 select 保持・新 prop required 追加 | P2 §2.5 / P9 T5 | `implemented_local_evidence_captured` |
| AC-11 | Checkbox primitive・OKLch トークンのみ | `Checkbox.tsx`（F2） + `.ui-checkbox*` CSS（F9） | P2 §2.1 / P9 T3 gate | `implemented_local_evidence_captured` ／ accent-color 視覚は `runtime_pending` |
| AC-12 | apps/api / packages / Form schema 非変更 | （変更しないこと） | P9 タスク 4 / `git diff` 空 | `implemented_local_evidence_captured` |

> AC-1/3/8/11 の「CSS の効き・toast 描画・accent-color」は jsdom で検証不能なため、Phase 11 local fixture screenshot で補完済み。staging 実データ baseline は **`runtime_pending`** として user-gated 確認する境界を残す。

## 2. blocker 無しの確認

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| 設計 4 条件（価値性 / 実現性 / 整合性 / 運用性） | PASS | Phase 3 §1 で全 PASS。1 サイクル完結（CONST_007） |
| API 変更の必要性 | なし | 既存 import endpoint 再利用。AC-12 で `git diff -- apps/api packages` 空を gate |
| 既存機能への回帰リスク | 低・統制済 | 既存単発 select 保持・T5 で回帰確認。新 prop は required だが Drawer 1 箇所のみ呼出 |
| all-or-nothing による全件失敗リスク | 統制済 | 選択母集合を未出席候補に限定（deleted は members 時点で除外）。race 時も `committed:false` 内訳表示 + 選択保持 |
| **blocker** | **無し** | 上記いずれも対策済み。仕様書として実装着手可 |

## 3. MINOR 指摘 追跡テーブル（未タスク化候補・Phase 12 unassigned-task-detection へ送る前段）

Phase 3 設計レビュー §4 で記録した MINOR を継承する。本サイクル非対象（CONST_007 例外・Phase 1 スコープ外）。

| MINOR ID | 指摘内容 | 本サイクル非対象の理由 | 未タスク化候補 | 解決確認 Phase |
| --- | --- | --- | --- | --- |
| M-1 | CSV ファイルアップロード一括取込 UI（import endpoint の email 行・dryRun preview を活用） | 別 UX。本タスクは memberId チェックリスト経路に限定（Phase 1 §3.3 ユーザー選択） | はい（Phase 12 で baseline 記録） | Phase 12 |
| M-2 | attendance route 二系統（単発 `attendances` plural toggle / bulk `attendance/import`）の統合 | API リファクタで別タスク。AC-12（apps/api 非変更）に抵触するため本サイクル不可 | はい（Phase 12 で baseline 記録） | Phase 12 |

> M-1 / M-2 は Phase 3 → Phase 10 → Phase 12 で一貫記録する。新規 Issue 起票要否は Phase 12 unassigned-task-detection の判定に委ねる（relatedIssue=null のため投機的起票は避ける）。

## 4. 不変条件の最終適合確認（CLAUDE.md）

| 不変条件 | 最終判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ接続・endpoint 追加 / D1 / Form 変更禁止 | ✅ 適合 | 既存 import endpoint 再利用。新 endpoint / zod / surface 不変。AC-12 で gate |
| #5 D1 直接アクセス禁止（apps/web → D1） | ✅ 適合 | データ取得・送信は既存 fetch（`call` → `/api/admin/*` catch-all proxy）経由のまま |
| #8 test は `*.spec.*` のみ | ✅ 適合 | T1..T6 すべて `.spec.ts(x)`。`.test.*` 不使用（Phase 9 grep gate） |
| #9 admin form input は FormField 経由 | ✅ 適合 | 検索 input は FormField 経由。Checkbox 各行は label 直結（単一フィールドでないため FormField 非必須）。新規 `<input>` を `components/admin/` 直下に増やさない |
| #10 admin mutation は `@/features/admin/hooks/useAdminMutation` 標準 | ✅ 適合（例外注記済） | import は **HTTP 200 で業務失敗（`committed:false`）を返す**ため mutation 抽象に合わず Shell 直呼びを許容。既存 `removeAttendance` も Shell raw 構築の前例あり。legacy `@/lib/useAdminMutation` への新規参照は増やさない（Phase 8 §3 注記・Phase 9 grep gate） |

## 5. 実装サイクルで green 化すべき項目（TDD Red → Green の対象）

Phase 4 の Red 期待結果に対応し、後続実装で green へ転じる対象を一覧化する。いずれも `apps/web` 内に閉じ 1 サイクルで green 化可能。

| 対象 | Red の理由（実装前 fail） | Green 化の実装 | 対応 AC |
| --- | --- | --- | --- |
| `Checkbox.tsx` 不在 | `ui/` に Checkbox primitive がない（Select.tsx のみ） | F2 新規作成（label 分岐・OKLch トークン） | AC-11 |
| `useBulkAttendanceSelection` 不在 | 選択 hook が存在しない | F3 新規作成（toggle / selectAll / clear / query / stale effect） | AC-2/4/9 |
| `importAttendance` 不在 | web client に一括取込関数がない | F1 追加（`?dryRun=false` `{rows}`） | AC-5 |
| `bulkFailureMessage` 不在 | `committed:false` 内訳整形の純関数がない | `bulk-attendance-message.ts` 新規 | AC-7 |
| チェックリスト UI 不在 | ドロワーに複数選択 UI がない | F4 `BulkAttendanceChecklist` + Drawer 埋込（F6） | AC-1/3/4/6 |
| モーダル UI 不在 | 大量選択モーダルがない | F5 `BulkAttendanceModal` + Drawer 起動導線（F6） | AC-8 |
| Shell `onBulkAdd` 未配線 | `committed` 分岐・attended 反映がない | F7 `onBulkAdd`（500 ガード / catch / committed 分岐） | AC-6/7 |
| `.bulk-attendance*` / `.ui-checkbox*` CSS 不在 | レイアウト CSS 未配線 | F9 globals.css に OKLch トークン CSS 追加 | AC-1/8/11 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | [phase-1-requirements.md](phase-1-requirements.md) | AC-1..AC-12 定義・根本原因 |
| 設計正本 | [phase-2-design.md](phase-2-design.md) | アーキ / hook / component / CSS 設計 |
| 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | 4 条件 PASS・MINOR（M-1/M-2）・不変条件適合 |
| カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) | 純関数 / hook 100% 目標・個別計測 |
| リファクタ | [phase-8-refactor.md](phase-8-refactor.md) | hook 集約 / 純関数分離 / #10 Shell 直呼び注記 |
| QA | [phase-9-qa.md](phase-9-qa.md) | grep gate・検証コマンド・AC マッピング・a11y |
| 共有コンテキスト（SSOT） | [outputs/phase-1/shared-context.md](outputs/phase-1/shared-context.md) | シグネチャ・契約・変更ファイル一覧・不変条件チェックリスト |
| artifacts | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/artifacts.json` | gates / phase 状態 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin primitive / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 10 仕様書 | 文書 | AC-1..AC-12 最終トレース（3-state）・blocker 無し確認・MINOR 追跡（M-1/M-2）・不変条件適合・green 化対象一覧 |
| 最終レビュー結果 | 文書 | [outputs/phase-10/final-review-result.md](outputs/phase-10/final-review-result.md) |
| 最終判定 | 判定 | 仕様書として PASS（実装着手可） |

## 統合テスト連携

- 本 Phase の AC トレースが Phase 12 `phase12-task-spec-compliance-check.md` の 4 条件 verdict / AC trace 節と一致すること。
- MINOR（M-1/M-2）が Phase 3 → Phase 10 → Phase 12 で一貫していること。
- 「green 化すべき項目」が Phase 4 Red 期待結果・Phase 9 focused vitest と 1:1 で対応していること。
- Phase 11（視覚）の local fixture screenshot が取得済みで、staging baseline のみ user-gated として本改善サイクルへ引き継がれること。

## 最終判定

**仕様書として PASS（実装着手可）**。

- AC-1..AC-12 がすべて 3-state 語彙で trace 済み。視覚 / toast 依存（AC-1/3/6/7/8/11）は Phase 11 `runtime_pending` を明示して境界化。
- blocker 無し。all-or-nothing リスク・回帰リスクは統制済み。
- MINOR は M-1（CSV アップロード UI）/ M-2（attendance route 統合）の 2 件で、いずれも CONST_007 例外として未タスク化候補（Phase 12 へ送る）。
- 不変条件 #1/#5/#8/#9/#10 に最終適合（#10 は Shell 直呼びの設計判断を注記）。
- TDD Red → Green の対象は今回 `apps/web` 内に閉じて green 化可能。

## 完了条件

1. AC-1..AC-12 が 3-state 語彙（`implemented_local_evidence_captured` / `runtime_pending`）で trace されていること。
2. blocker 無しが確認され、all-or-nothing / 回帰リスクの対策が記録されていること。
3. MINOR（M-1/M-2）が未タスク化候補として明記され、Phase 3 と一致していること。
4. 不変条件 #1/#5/#8/#9/#10 の最終適合（#10 は Shell 直呼び注記）が確認されていること。
5. 実装サイクルで green 化すべき項目が Phase 4 Red / Phase 9 vitest と対応づけて一覧化されていること。
6. Phase 11（VISUAL screenshot）は local fixture 取得済み、staging baseline は runtime user-gated である旨が明記されていること。
7. 最終判定が「仕様書として PASS（実装着手可）」であること。
