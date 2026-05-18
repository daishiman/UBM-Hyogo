---
phase: 13
title: Commit / PR — AppShell 3 系統の取り込み
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 13 — Commit / PR

[実装区分: 実装仕様書]

## 1. ブランチ戦略

- base: `dev`（CLAUDE.md「PR作成の完全自律フロー」§既定 PR base）
- feature branch 例: `feat/ui-foundation-appshell-layouts`
- 1 PR で 3 layout + 3 spec を取り込む（revert 単位を統一）

## 2. コミット粒度

| commit | 内容 | files |
|--------|------|-------|
| C1 | docs: parallel-03 Phase 1-13 spec | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-*.md` |
| C2 | feat(web): public AppShell に data-* 契約を導入 | `apps/web/app/(public)/layout.tsx` + spec |
| C3 | feat(web): admin AppShell に data-* 契約 + topbar slot 導入 | `apps/web/app/(admin)/layout.tsx` + spec |
| C4 | feat(web): member AppShell に data-* 契約を導入 | `apps/web/app/(member)/layout.tsx` + spec |
| C5 | chore: parallel-03 evidence inventory 追記 | `outputs/phase-11/*` |

C1-C5 は本サブワークフローの同一実装サイクル・同一 PR に含める。仕様のみ先行 PR や docs-only close-out は採用しない。

## 3. Commit message draft

### C1（docs）

```
docs(ui-foundation/parallel-03): AppShell 3 系統の Phase 1-13 仕様書

- 3 layout (public/admin/member) に data-theme / data-shell / data-route 契約を導入する仕様
- 既存 primitive (PublicHeader/PublicFooter/AdminSidebar/MemberHeader) の API は不変
- 認証 / role gate は既存 middleware + getSession() 経路を維持

Refs: docs/30-workflows/ui-prototype-design-system-foundation
```

### C2 (feat: public)

```
feat(web): public AppShell に data-theme / data-shell / data-route 契約を導入

- (public)/layout.tsx を編集し data-theme="warm" / data-route-group="public" / data-testid="public-shell" を付与
- <header data-shell="topbar"> / <main data-route="public"> / <footer data-shell="footer"> で wrap
- 既存 PublicHeader / PublicFooter の API は不変
- layout.spec.tsx 追加 (data-* 契約 + axe critical 0)

Refs: docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts
```

### C3 (feat: admin)

```
feat(web): admin AppShell に data-theme="cool" + topbar slot 導入

- (admin)/layout.tsx を編集し data-theme="cool" / data-route-group="admin" / data-testid="admin-shell" を付与
- 既存 getSession() 二段防御 (未認証 / non-admin redirect) を維持
- aside data-shell="sidebar" + 新規 header data-shell="topbar" (breadcrumb slot + actions slot) を追加
- main data-route="admin" で wrap
- AdminSidebar の API は不変。SignOutButton は AdminSidebar 内に並存
- layout.spec.tsx 追加 (3 分岐検証 + data-* 契約 + axe critical 0)

Refs: docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts
```

### C4 (feat: member)

```
feat(web): member AppShell に data-theme / data-shell / data-route 契約を導入

- (member)/layout.tsx を編集し data-theme="warm" / data-route-group="member" / data-testid="member-shell" を付与
- header data-shell="topbar" / main data-route="member" で wrap
- 旧 member-shell / member-main class は data-* 契約に統一
- MemberHeader の API は不変
- layout.spec.tsx 追加

Refs: docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts
```

## 4. PR draft

### title

```
feat(ui-foundation/parallel-03): AppShell 3 系統に data-* 契約を導入
```

### body

```markdown
## Summary

- Public / Admin / Member の 3 系統 AppShell layout に `data-theme` / `data-route-group` / `data-shell` / `data-route` / `data-testid` 契約を導入
- parallel-01 (globals.css rhythm) / parallel-02 (prototype CSS rules port) の selector が機械的に当たる土台を確立
- 既存 primitive (PublicHeader / PublicFooter / AdminSidebar / MemberHeader / SignOutButton) の API は不変
- 認証 / role gate は既存 `apps/web/middleware.ts` + `getSession()` 経路を維持（二段防御）

## 変更内容

| layout | 主な変更 |
|--------|---------|
| `apps/web/app/(public)/layout.tsx` | wrapper に `data-theme="warm"` 等を追加。`<header data-shell="topbar">` / `<main data-route="public">` / `<footer data-shell="footer">` で wrap |
| `apps/web/app/(admin)/layout.tsx` | `data-theme="cool"` 追加。`<aside data-shell="sidebar">` + 新規 `<header data-shell="topbar">` slot + `<main data-route="admin">` |
| `apps/web/app/(member)/layout.tsx` | `data-theme="warm"` / `data-shell="topbar"` / `data-route="member"` を付与し `member-shell` / `member-main` class を統一 |

3 layout に対応する `*.spec.tsx` も追加。

## 不変条件順守

- [x] 既存 API endpoint surface のみ接続（layout から API 呼び出しなし）
- [x] OKLch トークン正本化（`var(--ubm-color-*)` 経由のみ）
- [x] プロトタイプ正本順位（09e/f/g blueprint + 09h shell-and-fixtures 準拠）
- [x] D1 binding 直接アクセスなし
- [x] 既存 primitive の API 不変
- [x] 認証 / role gate は既存経路維持

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` 全 green
- [ ] `bash scripts/verify-design-tokens.sh` exit 0
- [ ] `bash scripts/verify-test-suffix.sh` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] 既存 `apps/web/middleware.spec.ts` regression 0
- [ ] dev server で `/` `/admin` `/login` を開き wrapper data-* 属性が DOM に出ることを確認

## Evidence

- `outputs/phase-11/typecheck.log`
- `outputs/phase-11/lint.log`
- `outputs/phase-11/web-build.log`
- `outputs/phase-11/public-layout-spec.log`
- `outputs/phase-11/admin-layout-spec.log`
- `outputs/phase-11/member-layout-spec.log`
- `outputs/phase-11/middleware-regression.log`
- `outputs/phase-11/verify-design-tokens.log`
- `outputs/phase-11/verify-test-suffix.log`
- `outputs/phase-11/diff-stat.txt`
- （visual 証跡は serial-07 で取得予定）

## Refs

- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-01..13-*.md`
```

## 5. PR 作成コマンド

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4

git checkout -b feat/ui-foundation-appshell-layouts
git add docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/ \
        apps/web/app/'(public)'/layout.tsx apps/web/app/'(public)'/layout.spec.tsx \
        apps/web/app/'(admin)'/layout.tsx apps/web/app/'(admin)'/layout.spec.tsx \
        apps/web/app/'(member)'/layout.tsx apps/web/app/'(member)'/layout.spec.tsx \
        outputs/phase-11/

git commit -m "feat(ui-foundation/parallel-03): AppShell 3 系統に data-* 契約を導入"
git fetch origin dev
git merge origin/dev
git push -u origin feat/ui-foundation-appshell-layouts

gh pr create --base dev --title "feat(ui-foundation/parallel-03): AppShell 3 系統に data-* 契約を導入" --body-file outputs/phase-13/pr-body.md
```

## 6. PR レビュー観点（self-review）

- [ ] 3 layout の diff が独立しており、1 layout だけ revert 可能
- [ ] 既存 primitive ファイルに `git diff` が含まれていない
- [ ] `apps/web/middleware.ts` に diff が含まれていない
- [ ] `apps/web/src/lib/session.ts` に diff が含まれていない
- [ ] HEX 直書きが含まれていない（`rg -nE 'bg-\[#|text-\[#|border-\[#' apps/web/app/'('*')'/layout.tsx`）
- [ ] `*.test.tsx` が含まれていない
- [ ] Phase 11 evidence が PR 本文から参照されている

## 7. マージ後 follow-up

- serial-07 が走るタイミングで Playwright 4 screens visual baseline を取り直す
- group migration（`/profile` を `(member)` 配下へ等）は行わない。現行 root 配下 path を `PROTOTYPE-COVERAGE.md` の `current_app_path` として維持する
- AdminTopbar の primitive 化は本 workflow の必須成果物ではない。parallel-03 では inline JSX の topbar slot を完了形とする
