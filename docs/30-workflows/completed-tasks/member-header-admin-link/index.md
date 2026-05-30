# member-header-admin-link

## 概要

`(member)/profile` の `MemberHeader` に「管理」リンクを追加し、`/admin` への動線を会員層から復旧する。`AuthView` を受領し admin 状態のときのみ admin link を描画する単一タスク workflow。

- workflow_id: `member-header-admin-link`
- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`
- 親 workflow: `docs/30-workflows/public-header-logged-in-nav-cleanup/` Task E を単独 workflow として切り出したもの
- 原典 spec: `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-e-member-header-admin-link.md`

## 実装区分

**[実装区分: 実装完了]** — `MemberHeader.tsx` と `(member)/layout.tsx` のコード変更に加え、未実装だった最小 `auth-view` 依存基盤を同一 cycle で実コード化した。

## スコープ

| # | 対象パス | 種別 |
|---|----------|------|
| 1 | `apps/web/src/components/layout/MemberHeader.tsx` | 編集 |
| 2 | `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 新規 or 編集 |
| 3 | `apps/web/app/(member)/layout.tsx` | 編集（async + `authView` 配信） |
| 4 | `apps/web/src/lib/auth-view/{types,resolveAuthView,getAuthView,index}.ts` | 新規（Task A 依存の最小実装） |
| 5 | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規 |

## 不変条件

1. 既存 API のみ接続（`apps/web/src/lib/auth-view/` の `AuthView` 型 / `getAuthView()` を利用）
2. `apps/web` から D1 直接アクセス禁止
3. HEX 直書き禁止（OKLch token 経由のみ）
4. 既存 `data-testid="member-header"` を維持
5. fail-closed: `authView` 未指定または取得失敗時は `data-auth-state="member"` で最小描画
6. PII 非露出: `data-auth-state` は `"member"|"admin"` のリテラルのみ
7. テストは `*.spec.tsx` のみ
8. プロトタイプ primitives は変更しない

## 依存

- **前提解消**: `apps/web/src/lib/auth-view/` の `AuthView` 型 / `getAuthView()` は本 cycle で最小実装済み。PublicHeader 側の Task A 全体実装は親 workflow に残るが、本 workflow の MemberHeader 依存は解消済み。
- **並列可**: 親 workflow の Task B / C / D / F と並列実装可能。

## Phase 構成

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | `phase-1-requirements.md` | 症状・期待振る舞い・AC |
| 2 | `phase-2-design.md` | コンポーネント設計（`authView` prop / admin 分岐） |
| 3 | `phase-3-design-review.md` | 不変条件適合チェック |
| 4 | `phase-4-test-plan.md` | Vitest / typecheck / lint 計画 |
| 5 | `phase-5-implementation.md` | 実装手順（CONST_005 完備） |
| 6 | `phase-6-test-additions.md` | 追加テスト一覧 |
| 7 | `phase-7-coverage.md` | coverage 戦略 |
| 8 | `phase-8-refactor.md` | 過剰設計排除 |
| 9 | `phase-9-qa.md` | 品質保証 gate |
| 10 | `phase-10-final-review.md` | 30種思考法 compact + 4条件 |
| 11 | `outputs/phase-11/manual-test-result.md` | runtime evidence 境界 |
| 12 | `outputs/phase-12/*` | strict 7 |
| 13 | `outputs/phase-13/pr-creation-result.md` | user-gated PR 境界 |

## 完了条件（DoD）

- [x] `MemberHeader` が `authView` prop を受領
- [x] admin session のみ admin リンク描画
- [x] `(member)/layout.tsx` が async + `<MemberHeader authView={authView} />`
- [x] 既存 `data-testid="member-header"` を維持
- [x] `mise exec -- pnpm typecheck` green
- [x] `mise exec -- pnpm lint` green
- [x] `mise exec -- pnpm exec vitest run apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` green
- [x] HEX 直書きなし
- [x] local header visual sanity screenshots saved under `outputs/phase-11/screenshots/`

## 参照

- 原典: `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-e-member-header-admin-link.md`
- 親 workflow: `docs/30-workflows/public-header-logged-in-nav-cleanup/`
- `apps/web/src/lib/auth-view/`
- `apps/web/src/components/layout/MemberHeader.tsx`
- `apps/web/app/(member)/layout.tsx`
- `apps/web/src/components/auth/SignOutButton.tsx`
- `docs/00-getting-started-manual/specs/02-auth.md`
