# Issue #749 — Primitive Adoption Tracker (19 routes × 6 primitive)

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-749-primitive-adoption-tracker |
| source issue | #749（CLOSED 維持、`Refs #749` のみ、再 open 禁止） |
| 親 spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` |
| taskType | implementation |
| visualEvidence | VISUAL（admin panel UI 差分が発生するため） |
| workflow_state | implemented_local_evidence_captured |
| evidence_state | LOCAL_EVIDENCE_CAPTURED_VISUAL_RUNTIME_PENDING |
| implementationCategory | standard |
| 実装対象（要約） | `apps/web/src/components/admin/{MeetingPanel,AuditLogPanel,TagQueuePanel,SchemaDiffPanel,RequestQueuePanel}.tsx`、`apps/web/src/components/public/DensityToggle.client.tsx`、`apps/web/app/(admin)/admin/**/page.tsx`（Breadcrumb / EmptyState / Pagination 採用）、`scripts/verify-primitive-adoption.sh`、`.github/workflows/verify-primitive-adoption.yml`、`docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker/outputs/adoption-tracker.md` |
| 作成日 | 2026-05-17 |
| ブランチ | `feat/issue-749-primitive-adoption-tracker` |
| Phase 13 | blocked_pending_user_approval |

## Summary

parallel-09 で配置済みの 5 primitive（`FormField` / `EmptyState` / `Pagination` / `Icon` / `Breadcrumb`）と `useAdminMutation` hook が、`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` で定義された 19 routes 全てで一貫採用されたことを **コードと grep CI gate の両方で機械検証可能**な状態にする umbrella tracking タスク。

baseline 計測（Phase 1 にて実施）の時点で以下の drift が存在する:

- `<input>` 直接利用が admin 5 panel + 1 public component に 15 箇所残存（`FormField` 未採用）
- `useAdminMutation` 採用は `IdentityConflictRow.tsx` 1 箇所のみ（mutation を持つ admin panel 4 件で未採用）
- `Breadcrumb` / `EmptyState` / `Pagination` は admin route の `page.tsx` で未採用
- `outputs/adoption-tracker.md`（19×6 matrix）が未作成
- `verify-primitive-adoption` 系 CI gate が未整備（drift が機械検出されない）

本仕様書は上記 drift を 1 サイクル内（CONST_007）で全解消する。

## Scope

### 含む

- `<input>` 直接利用箇所（baseline 15 箇所）を `FormField` + `Input` primitive に置換
- `MeetingPanel` / `TagQueuePanel` / `SchemaDiffPanel` / `RequestQueuePanel` の mutation 呼び出しを `useAdminMutation().trigger()` 経由に統一（`AuditLogPanel` は read-only surface として C2 対象外）
- admin route 群（8 routes）の `page.tsx` に `<Breadcrumb />` を配置
- 結果ゼロ件 UI に `<EmptyState />` を採用（members / meetings / tags / requests / audit / identity-conflicts / schema）
- ページング UI に `<Pagination />` primitive を採用（admin members / requests / audit）
- `scripts/verify-primitive-adoption.sh`（C1-C6 grep gate）を追加し、CI 接続方針を Phase 10 governance に記録
- `outputs/adoption-tracker.md`（19×6 採用状況 matrix）を生成し PR 本文に貼り付け
- `*.spec.{ts,tsx}` のみで a11y / 採用検証 spec を追加
- Phase 11 local evidence（typecheck / focused tests / grep gate）収集。visual runtime screenshot は user-gated として `VISUAL_RUNTIME_PENDING`
- Phase 12 必須 7 outputs を生成（中学生レベル概念説明を含む）

### 含まない

- 新規 API endpoint 追加、D1 schema 変更、Google Form schema 変更
- 新規 primitive の作成（既存 5 primitive + `useAdminMutation` のみで完結させる）
- `verify-design-tokens`（task-18）の改変。本タスクの grep gate は別 workflow として独立
- branch protection の required check への実 PUT 反映（Phase 10 は read-only evidence のみ）
- commit / push / PR 作成（Phase 13 は blocked_pending_user_approval）
- Issue #749 の再 open

## 19 routes × 6 primitive baseline matrix

凡例: `O` = 採用済 / `X` = 未採用 / `-` = 該当UI要素なし

| # | route | FormField | EmptyState | Pagination | Icon | Breadcrumb | useAdminMutation |
| --- | --- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `/`（top）| - | - | - | O | - | - |
| 2 | `/(public)/members` | - | X | X | O | - | - |
| 3 | `/(public)/members/[id]` | - | - | - | O | - | - |
| 4 | `/(public)/register` | X | - | - | O | - | - |
| 5 | `/privacy` | - | - | - | - | - | - |
| 6 | `/terms` | - | - | - | - | - | - |
| 7 | `/login` | X | - | - | O | - | - |
| 8 | `/profile` | X | - | - | O | - | - |
| 9 | `/(admin)/admin` | - | - | - | O | X | - |
| 10 | `/(admin)/admin/members` | X | X | X | O | X | X |
| 11 | `/(admin)/admin/tags` | X | X | - | O | X | X |
| 12 | `/(admin)/admin/meetings` | X | X | X | O | X | X |
| 13 | `/(admin)/admin/schema` | X | X | - | O | X | X |
| 14 | `/(admin)/admin/requests` | - | X | - | O | X | X |
| 15 | `/(admin)/admin/identity-conflicts` | - | X | - | O | X | O |
| 16 | `/(admin)/admin/audit` | X | X | X | O | X | X |
| 17 | `error.tsx`（共通） | - | - | - | O | - | - |
| 18 | `not-found.tsx`（共通） | - | O | - | O | - | - |
| 19 | `loading.tsx`（共通） | - | - | - | O | - | - |

baseline 採用率（該当セル分母）:
- FormField: 0 / 9 = **0%**
- EmptyState: 0 / 8 = **0%**
- Pagination: 0 / 4 = **0%**
- Icon: 16 / 16 = **100%**（既採用、回帰防止のみ）
- Breadcrumb: 0 / 8 = **0%**
- useAdminMutation: 1 / 8 = **12.5%**

DoD 採用率: **全セル `O` または `-`、grep gate exit 0、CI workflow green**。

## 受入条件（AC）

- **AC-1**: 19 routes × 6 primitive の matrix 上、`X` セルが 0 件である（`outputs/adoption-tracker.md` で表示）
- **AC-2**: `grep -rn '<input' apps/web/src/components/admin/ apps/web/src/components/public/DensityToggle.client.tsx` が 0 件
- **AC-3**: `grep -rln 'useAdminMutation' apps/web/src/components/admin/` が 5 ファイル以上（panel 5 + IdentityConflictRow）
- **AC-4**: `Breadcrumb` import が admin route 8 page で確認できる
- **AC-5**: `scripts/verify-primitive-adoption.sh` exit 0
- **AC-6**: `.github/workflows/verify-primitive-adoption.yml` が CI で green
- **AC-7**: `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm test` exit 0
- **AC-8**: `bash scripts/coverage-guard.sh` exit 0（既定 workspace 閾値 80%）
- **AC-9**: a11y: `FormField` 経由で `label[for]` ↔ `input[id]` が紐付き、`aria-invalid` / `aria-describedby` が error 時に出力される spec が通る
- **AC-10**: HEX 直書きが残らない（`verify-design-tokens` も併走 green）
- **AC-11**: `*.test.{ts,tsx}` を新規導入しない（`*.spec.{ts,tsx}` のみ）

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `phase-1.md` + `outputs/phase-1/spec-extraction-map.md` | spec_created |
| 2 | `phase-2.md` | spec_created |
| 3 | `phase-3.md` | spec_created |
| 4 | `phase-4.md` | spec_created |
| 5 | `phase-5.md` | spec_created |
| 6 | `phase-6.md` | spec_created |
| 7 | `phase-7.md` | spec_created |
| 8 | `phase-8.md` | spec_created |
| 9 | `phase-9.md` | spec_created |
| 10 | `phase-10.md` | spec_created |
| 11 | `phase-11.md` | completed_local_evidence |
| 12 | `phase-12.md` + `outputs/phase-12/*.md` | completed |
| 13 | `phase-13.md` | blocked_pending_user_approval |

## DoD（最終）

- 全 AC-1〜AC-11 が満たされる
- `outputs/adoption-tracker.md` で 19×6 matrix が全 `O` / `-`
- Phase 12 必須 7 outputs が `outputs/phase-12/` に物理的に存在
- `artifacts.json` が実装済み local evidence captured 状態と一致
- commit / push / PR はユーザー承認まで未実行（Phase 13 blocked）

## 不変条件（CLAUDE.md より転記）

1. `apps/web` から D1 直接アクセス禁止
2. `bg-[#xxx]` 等の HEX 直書き禁止（`tokens.css` 経由のみ）
3. 新規 test は `*.spec.{ts,tsx}` のみ
4. 新規 API endpoint 追加・D1 schema 変更禁止
5. Issue #749 は CLOSED のまま、再 open 禁止
