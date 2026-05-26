# Lessons Learned — Issue #895 admin topbar actions client island (2026-05)

**Source**: `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/`
**Date**: 2026-05-25
**Status**: implemented_local_evidence_captured (PR user-gated)

---

## L-I895-001: Server Component の topbar に client 操作を流すときは "props 経由の island injection" を採る

**Rule**: `AdminTopbar` と `(admin)/layout.tsx` は Server Component のまま維持し、`onClick` / `signOut` を伴う client 操作は `"use client"` の小さな island に隔離し、Server 側の `actions={<Island />}` props 経由で注入する。

**Why**: 親 `(admin)/layout.tsx` は `getSession()` + `redirect()` の認証ガード（invariant #11 fail-closed）を Server 側で完結させている。topbar 自体に `"use client"` を付けると認証ガードが client に漏れ、fail-closed 不変条件が壊れる。

**How to apply**: admin AppShell の topbar / sidebar / page header の各 actions slot に client 操作を入れたいときは、必ず新規 client island component を `apps/web/src/features/admin/components/_layout/` 配下に作り、Server Component 親に props で渡す。親に `"use client"` を追加してはならない。`[[lessons-learned-fix-admin-scr-err-stg-fu-001-auth-env-via-getenv-2026-05]]` と整合。

---

## L-I895-002: topbar actions = グローバル / page header actions = ページ固有 の責務境界

**Rule**: admin AppShell の `AdminTopbar.actions` には全 admin 共通のグローバル操作（ログアウト、将来の通知ベル等）のみを集約する。各画面固有の操作（members の「新規追加」、tags の「タグ作成」等）は `AdminPageHeader.actions` に置く。両者は重複させない。

**Why**: topbar と page header の両方に同じ操作が出ると DOM 重複・テスト二重ヒット・focus order 崩れの原因になる。MVP では topbar = ログアウト 1 件、page header = ページ固有 0..N 件で完全分離する。

**How to apply**: 新規 admin 操作を追加するときは「全画面で意味があるか」を最初に判定する。Yes なら `AdminTopbarActions`、No なら該当ページの `AdminPageHeader.actions` props。判定が曖昧な場合は `AdminPageHeader.actions` を default 選択。

---

## L-I895-003: 既存 primitive component の props 互換は spec ではなく実コードを正本にする

**Rule**: Phase-5 spec に既存 component の props 利用例を書く場合、必ず Phase-5 §5.x に「props 確認手順」を併記し、未対応 props は spec 側を実コードに合わせて訂正する。

**Why**: 本タスクで `SignOutButton` に `size="sm" variant="ghost"` を渡す spec を書いたが、実 component は `className / redirectTo` のみ対応だった。spec を頼りに実装すると typecheck で必ず落ちる。spec は実装前 review 用途で書くため、merge 前に実コードとの整合確認を必須化する。

**How to apply**: Phase-5 で既存 component の props を spec する際は、(1) 当該 component を Read し props 一覧を確認、(2) spec 内に「props 確認手順」セクションを書く、(3) 不一致発覚時は spec を実コード正に合わせる（component 側は変えない）。`[[lessons-learned-fix-admin-scr-err-stg-fu-001-auth-env-via-getenv-2026-05]]` の「既存 surface を正本にする」原則と整合。

---

## 関連リンク

- 親ワークフロー: `[[workflow-issue-895-admin-topbar-actions-client-island-artifact-inventory]]`
- 起源: `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction/`
- 起源 unassigned: `docs/30-workflows/completed-tasks/parallel-03-followup-004-admin-topbar-actions-buttons.md`
