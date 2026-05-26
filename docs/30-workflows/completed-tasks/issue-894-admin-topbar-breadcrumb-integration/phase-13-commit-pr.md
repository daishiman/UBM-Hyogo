# Phase 13: Commit / PR Guide

## 1. Overview

両 Gate（A / B）通過後、ユーザー明示承認のもとで commit / push / PR を作成する。本ファイルは template とガイドのみを定義する。

## 2. Commit Message テンプレート

```
feat(admin): issue-894 breadcrumb slot の責務分離（topbar=ルートトップ / page header=現在地） (Refs #894)

- (admin)/layout.tsx: AdminTopbar の breadcrumb slot に Breadcrumb primitive を注入
  - items=[{ label: "管理" }] をルートトップ静的 current label として所有
- admin/page.tsx: AdminPageHeader breadcrumbs を [{ label: "ダッシュボード" }] へ縮小
- admin/members/page.tsx: AdminPageHeader breadcrumbs を [{ label: "会員管理" }] へ縮小
- layout.spec.tsx: breadcrumb slot 内に primitive（data-component="breadcrumb"）が出現する assertion 追記

VISUAL implementation / RSC 境界維持 / 新規 primitive 追加なし / API・D1 変更なし。
親 workflow parallel-03-followup-001 で deferred された breadcrumb 実データ統合を完結。

Refs #894

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

> **注**: `Closes #894` ではなく `Refs #894` を使う（user-gated でユーザーが最終 close 判断）。

## 3. PR タイトル

```
feat(admin): issue-894 AdminTopbar breadcrumb slot と AdminPageHeader の責務分離
```

## 4. PR Body 骨格

```markdown
## Summary

- 親 workflow `parallel-03-followup-001-admin-topbar-primitive-extraction` で deferred された breadcrumb 実データ統合を完結
- 案 B（役割分担）採用: topbar slot = ルートトップ静的「管理」/ AdminPageHeader = ページ内現在地
- 「管理」ラベルの二重表示を解消し、breadcrumb 表示を `Breadcrumb` primitive 経由に統一

## Scope

- `apps/web/app/(admin)/layout.tsx`: AdminTopbar の breadcrumb slot 注入
- `apps/web/app/(admin)/admin/page.tsx`: breadcrumbs を現在地のみへ縮小
- `apps/web/app/(admin)/admin/members/page.tsx`: 同上
- `apps/web/app/(admin)/layout.spec.tsx`: slot 内 primitive 検出 assertion 追記

## Out of Scope

- AdminPageHeader 未導入ページ（tags / meetings / schema / requests / identity-conflicts / audit）への AdminPageHeader 導入
- AdminTopbar `actions` slot の具体実装

## Invariants

- `(admin)/layout.tsx` は server component のまま（`"use client"` / `usePathname` なし）
- 新規 primitive を追加していない（CLAUDE.md 不変条件3）
- HEX 直書き / arbitrary class の追加なし（不変条件2）
- API endpoint / D1 schema / Google Form 仕様の変更なし（不変条件1 / 4）

## Test Plan

- [x] `mise exec -- pnpm --dir apps/web exec vitest run "app/(admin)/layout.spec.tsx"` pass
- [x] `mise exec -- pnpm exec vitest run "apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx"` pass
- [x] `mise exec -- pnpm typecheck` 0 error
- [x] `mise exec -- pnpm lint` 0 warning
- [x] `grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/"` 0 hit
- [x] axe critical 0
- [x] 手動 dev で /admin / /admin/members を目視確認

## Evidence

VISUAL implementation 宣言（`phase-11-evidence-inventory.md`）。spec assertion + grep 結果 + typecheck / lint pass log + admin screenshot を evidence とする。

## References

- Issue: #894
- Workflow: `docs/30-workflows/issue-894-admin-topbar-breadcrumb-integration/`
- 親 workflow: `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction/`

Refs #894

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. PR 作成コマンド（user-gated）

```bash
gh pr create --base dev --title "feat(admin): issue-894 AdminTopbar breadcrumb slot と AdminPageHeader の責務分離" --body "$(cat <<'EOF'
（上記 PR Body 骨格をそのまま貼り付け）
EOF
)"
```

## 6. Issue Close 判断

- `Refs #894` で関連付け、PR merge 後にユーザーが手動で issue を close する。
- Issue #894 は 2026-05-25 時点で CLOSED のため、再 close は行わない。PR / commit 文脈は `Refs #894` のみを使う。

## 7. Workflow ステータス遷移

| 状態 | 遷移条件 |
|------|----------|
| `implemented_local_evidence_captured` | Gate-B passed / local evidence captured |
| `pr_opened` | gh pr create 実行（ユーザー承認後） |
| `pr_merged` | PR merge |
| `closed` | issue close（ユーザー判断） |
