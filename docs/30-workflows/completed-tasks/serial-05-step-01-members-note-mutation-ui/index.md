# serial-05-step-01 members-note mutation UI - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本タスクは `apps/web/src/features/admin/hooks/useAdminMutation.ts` 新規作成、`apps/web/src/features/admin/components/_members/NoteForm.tsx` 新規作成、`apps/web/src/features/admin/components/_members/MemberDrawer.tsx` 拡張、unit test 新規 2 ファイル追加を伴う実装タスク。API は `apps/api/src/routes/admin/member-notes.ts` で実装済のため UI / hook 側のみ。設定単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | SERIAL-05-STEP-01 |
| タスク名 | MemberDrawer note 作成/編集 + useAdminMutation hook 確立 |
| ディレクトリ | docs/30-workflows/serial-05-step-01-members-note-mutation-ui |
| 成果物台帳 | docs/30-workflows/serial-05-step-01-members-note-mutation-ui/artifacts.json |
| 親ワークフロー | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui |
| 原典 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-01-members-note/spec.md |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | implemented_local_runtime_pending |
| タスク種別 | implementation / VISUAL |
| workflow_state | implemented_local_runtime_pending |
| visualEvidence | VISUAL |
| 優先度 | HIGH |
| 直列順序 | 1/5（serial-05 admin-mutation-ui 系列の entry point） |

## 目的

MemberDrawer に note 作成/編集フォームを追加し、admin 系 mutation UI 全体で再利用する共通基盤 `useAdminMutation` hook を確立する。step-02..05（identity-conflicts / schema-diff / tags-assignment / requests-approve-reject 等）はこの hook を import して利用するため、step-01 で API contract / error shape / toast 経路 / `router.refresh()` 経路を確定させる責務を負う。

## スコープ

### 含む

- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（新規）: admin endpoint mutation 共通 hook
- `apps/web/src/features/admin/hooks/index.ts`（新規 or 拡張）: hook の barrel export
- `apps/web/src/features/admin/components/_members/NoteForm.tsx`（新規）: note 作成/編集 form
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（編集）: notes section 追加
- `apps/web/src/features/admin/hooks/useAdminMutation.spec.ts`（新規）: unit test
- `apps/web/src/features/admin/components/_members/NoteForm.spec.tsx`（新規）: unit test

### 含まない

- API 側変更（`apps/api/src/routes/admin/member-notes.ts` は実装済 / 改変禁止）
- D1 schema 変更
- step-02..08（別タスク仕様書として並行設計）
- ToastProvider の root layout 配置（parallel-08 の責務）
- 401/403 redirect 経路（parallel-10 auth-session の責務）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-01-members-note/spec.md | 原典タスク仕様 |
| 必須 | apps/api/src/routes/admin/member-notes.ts | API contract 正本（実装済） |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | 拡張対象 |
| 必須 | docs/00-getting-started-manual/specs/design-tokens.md | OKLch token 正本 |
| 必須 | apps/web/src/styles/tokens.css | デザイントークン CSS 正本 |
| 必須 | CLAUDE.md | UI prototype alignment 不変条件 |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | UI primitive 正本 |

## 受入条件 (AC)

- **AC-1**: `useAdminMutation<T>(endpoint, method, options?)` hook が `apps/web/src/features/admin/hooks/useAdminMutation.ts` に新規実装され、`trigger / isLoading / error` を返す契約が確定している。
- **AC-2**: hook 成功時に `router.refresh()` が呼ばれ、toast で「✓ 保存しました」が表示される。失敗時に API error response の `message ?? error` を toast に表示する。
- **AC-3**: `NoteForm` component が `memberId / initialBody? / noteId? / onSuccess?` を受け取り、新規時は `POST /api/admin/members/:memberId/notes`、編集時は `PATCH /api/admin/members/:memberId/notes/:noteId` を呼ぶ。
- **AC-4**: MemberDrawer に notes section が追加され、既存 note 一覧と NoteForm（add/edit toggle）が表示される。
- **AC-5**: textarea の validation が body 1-2000 文字で client side でも実施されている。
- **AC-6**: unit test `useAdminMutation.spec.ts` / `NoteForm.spec.tsx` が green。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80%。
- **AC-7**: design token 違反（HEX 直書き / `bg-[#xxx]`）が無いことを `pnpm verify:tokens` で確認。
- **AC-8**: TypeScript strict mode で型エラー 0。`pnpm typecheck` / `pnpm lint` green。
- **AC-9**: `bash scripts/coverage-guard.sh` exit 0。
- **AC-10**: step-02..05 が `import { useAdminMutation } from "@/features/admin/hooks"` で再利用可能な API surface になっている。

## 不変条件

1. API endpoint surface は変更しない（`apps/api/src/routes/admin/member-notes.ts` の I/O 契約に従う）
2. `apps/web` から D1 直接アクセス禁止（既存条件継続）
3. 色は OKLch token 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止
4. `process.env.*` 直接参照禁止（`apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` 経由のみ）
5. test ファイルは `*.spec.{ts,tsx}` 形式のみ（`*.test.{ts,tsx}` 禁止）
6. プロトタイプの primitives + tokens + rhythm を流用し、新規 primitive を生やさない

## Phase 一覧

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 | pending |
| 2 | 設計 | pending |
| 3 | 設計レビュー | pending |
| 4 | タスク分解 | pending |
| 5 | 実装計画 | pending |
| 6 | 実装 | pending |
| 7 | リファクタリング | pending |
| 8 | 統合テスト | pending |
| 9 | 品質検証 | pending |
| 10 | 最終レビュー | pending |
| 11 | VISUAL Evidence | pending |
| 12 | 正本同期 | pending |
| 13 | PR・振り返り | pending |

## サイクル完了原則 (CONST_007 準拠)

本タスク仕様書 (Phase 1-13) は **後続実装プロンプトの 1 サイクル内で完了させる** スコープに収めている。先送り対象は無い。step-02..08 は同じ親ワークフロー配下で **並列実行のために分離された別タスク仕様書** であり、本仕様書からの先送りではない。

## 台帳同期ルール

- root `artifacts.json` は本 workflow の唯一の現在台帳であり、現時点では全実行 Phase が `pending`、Phase 13 のみ `blocked`（user approval required）。
- `outputs/artifacts.json` と Phase 11 / 12 outputs は、実装着手後に最初の Phase 完了処理で生成する。未着手 skeleton workflow では先行生成しない。
- Phase 12 完了時は `outputs/phase-12/` strict 7 の実体確認、root / outputs `artifacts.json` parity、aiworkflow-requirements same-wave sync を `phase12-task-spec-compliance-check.md` に記録する。
