# serial-05-step-02 identity-conflicts merge UI - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本タスクは `apps/web/app/(admin)/admin/identity-conflicts/` 配下に
> 既存 `apps/web/src/components/admin/IdentityConflictRow.tsx` の merge / dismiss UI を
> serial-05 step-01 の `useAdminMutation` に寄せ、error toast / 二段階確認 / VISUAL evidence を
> hardening する実装タスク。`page.tsx` は server component のまま維持し、既存 API
> `POST /api/admin/identity-conflicts/:conflictId/merge` の契約に合わせる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | SERIAL-05-STEP-02 |
| タスク名 | identity-conflicts merge UI hardening |
| ディレクトリ | docs/30-workflows/serial-05-step-02-identity-conflicts-merge |
| 成果物台帳 | docs/30-workflows/serial-05-step-02-identity-conflicts-merge/artifacts.json |
| 親ワークフロー | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui |
| 原典 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-02-identity-conflicts-merge/spec.md |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | implemented_local_visual_evidence_captured |
| タスク種別 | implementation / VISUAL / existing-ui-hardening |
| workflow_state | implemented_local_visual_evidence_captured |
| visualEvidence | VISUAL |
| 優先度 | HIGH |
| 直列順序 | 2/5（step-01 useAdminMutation hook 確立済を前提） |

## 目的

admin/identity-conflicts 画面の既存 merge / dismiss 操作を、重複した `fetch()` 実装から
`useAdminMutation` へ寄せる。既存の二段階確認 UI と server component fetch 境界を維持しつつ、
400 / 409 error mapping、toast、a11y、VISUAL evidence を明示的に保証する。

## スコープ

### 含む

- `apps/web/src/components/admin/IdentityConflictRow.tsx`（既存 UI の hardening）
- `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`（server component fetch 境界の維持確認）
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（import のみ・hook 実体は原則変更しない）
- `packages/shared/src/schemas/identity-conflict.ts` の `IdentityConflictRow` / `MergeIdentityRequest` / `MergeIdentityResponse` を参照
- `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（focused unit test）

### 含まない

- API 側変更（`POST /api/admin/identity-conflicts/:conflictId/merge` は実装済 / 改変禁止）
- D1 schema 変更
- `useAdminMutation` hook 自体の変更（step-01 で確定済 / 原則改変禁止）
- step-03..05（別タスク仕様書として並行設計）
- 401/403 redirect 経路（parallel-10 auth-session の責務）
- ToastProvider 配置（parallel-08 の責務）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-02-identity-conflicts-merge/spec.md | 原典タスク仕様 |
| 必須 | apps/api/src/routes/admin/identity-conflicts.ts（または該当 route） | API contract 正本（実装済） |
| 必須 | apps/web/src/features/admin/hooks/useAdminMutation.ts | step-01 で確立した hook（再利用） |
| 必須 | apps/web/app/(admin)/admin/identity-conflicts/page.tsx | server entry（server component 維持） |
| 必須 | apps/web/src/components/admin/IdentityConflictRow.tsx | 既存 merge / dismiss UI 正本 |
| 必須 | docs/00-getting-started-manual/specs/design-tokens.md | OKLch token 正本 |
| 必須 | apps/web/src/styles/tokens.css | デザイントークン CSS 正本 |
| 必須 | CLAUDE.md | UI prototype alignment 不変条件 |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | UI primitive 正本（inline panel 確認用） |
| 参考 | apps/web/src/features/admin/components/_members/NoteForm.tsx | `useAdminMutation` 利用例 |

## 受入条件 (AC)

- **AC-1**: `IdentityConflictRow` が既存 `callJson()` / 直書き `fetch()` を持たず、`useAdminMutation<MergeIdentityResponse>` 経由で
  `POST /api/admin/identity-conflicts/:conflictId/merge` を呼ぶ。
- **AC-2**: 既存の二段階確認 UI（`merge-confirm` → `merge-final`）を維持し、`reason` textarea（必須 / 1〜500 文字）と `targetMemberId: candidateTargetMemberId` を送信する。
- **AC-3**: `merge 実行` 押下時に `trigger({ targetMemberId: item.candidateTargetMemberId, reason })` を呼び、成功時に `router.refresh()`（hook 内部）と success toast が発火する。
- **AC-4**: API error response の handling: 409 (`ALREADY_MERGED`) / 400 (`TARGET_MEMBER_MISMATCH`)
  を toast error にマップし、inline panel は閉じずに残す（再操作を妨げない）。
- **AC-5**: `page.tsx` は server component のまま `fetchAdmin<ListIdentityConflictsResponse>()` を使い、各 item を既存 `IdentityConflictRow` に渡す。D1 直接アクセスは行わない。
- **AC-6**: `IdentityConflictRow` は `IdentityConflictRow` shared type の実 field（`sourceMemberId` / `candidateTargetMemberId` / `responseEmailMasked`）のみを参照し、存在しない 旧 UI 仕様の email field や型名 型を使わない。
- **AC-7**: 確認 UI は a11y 要件を満たす: `aria-live` error、textarea label、送信中 disabled、キーボード操作可能。modal 化する場合のみ `role="dialog"` / `aria-modal` / focus trap を追加する。
- **AC-8**: 色 / spacing / radius は OKLch token のみで表現する。HEX 直書き / `bg-[#xxx]` /
  `text-[#xxx]` 等の arbitrary value 禁止。`pnpm verify:tokens`（または同等の CI gate）で
  違反 0 件であること。
- **AC-9**: unit test (`IdentityConflictRow.spec.tsx` または同等 focused spec) が
  green で、coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を満たす。
- **AC-10**: TypeScript strict mode で型エラー 0。`pnpm typecheck` / `pnpm lint` green。
- **AC-11**: `bash scripts/coverage-guard.sh` exit 0（Phase 6 / Phase 9 / Phase 11 完了条件で参照）。
- **AC-12**: step-01 で export された `useAdminMutation` を **import 経路のみで** 再利用し、
  hook 実体を改変しない（regression 防止）。

## 不変条件

1. API endpoint surface は変更しない（`POST /api/admin/identity-conflicts/:conflictId/merge` の
   I/O 契約に従う）
2. `apps/web` から D1 直接アクセス禁止（既存条件継続）
3. 色は OKLch token 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止
4. `process.env.*` 直接参照禁止（`apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` 経由のみ）
5. test ファイルは `*.spec.{ts,tsx}` 形式のみ（`*.test.{ts,tsx}` 禁止）
6. プロトタイプの primitives + tokens + rhythm を流用し、新規 primitive を生やさない。
   inline panel は既存 dialog primitive を再利用する
7. `useAdminMutation` hook（step-01 成果）は import のみ。本タスクで signature / 振る舞いを変更しない

## Phase 一覧

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | タスク分解 | completed |
| 5 | 実装計画 | completed |
| 6 | 実装 | completed |
| 7 | リファクタリング | completed |
| 8 | 統合テスト | completed |
| 9 | 品質検証 | completed |
| 10 | 最終レビュー | completed |
| 11 | VISUAL Evidence | completed |
| 12 | 正本同期 | completed |
| 13 | PR・振り返り | blocked |

## サイクル完了原則 (CONST_007 準拠)

本タスク仕様書 (Phase 1-13) は **後続実装プロンプトの 1 サイクル内で完了させる** スコープに
収めている。先送り対象は無い。step-03..05 は同じ親ワークフロー配下で **並列実行のために
分離された別タスク仕様書** であり、本仕様書からの先送りではない。step-01 の `useAdminMutation`
hook は本タスク開始前に merge 済を前提とする（並行 merge は scope 外）。

## 台帳同期ルール

- root `artifacts.json` は本 workflow の唯一の現在台帳。現時点では Phase 1-3 が `spec_created`、
  Phase 4-13 は `pending`（Phase 13 のみ `blocked` / user approval required）。
- `outputs/artifacts.json` と Phase 11 / 12 outputs は、実装着手後に最初の Phase 完了処理で生成する。
  未着手 skeleton workflow では先行生成しない。
- Phase 12 完了時は `outputs/phase-12/` strict 7 の実体確認、root-only `artifacts.json` parity、
  aiworkflow-requirements same-wave sync を `phase12-task-spec-compliance-check.md` に記録する。
