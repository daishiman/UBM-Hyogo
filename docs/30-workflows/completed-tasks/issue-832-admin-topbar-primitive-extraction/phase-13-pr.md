# Phase 13: PR 作成（user 承認後）

> コード実装・focused test・Phase 12 strict 7・正本同期は完了済み。**PR 自体は作らない**（commit / push / PR は user 承認後に本 Phase を実行）。

## 1. ブランチ

`feat/issue-832-admin-topbar-primitive-extraction`（`dev` から分岐）

## 2. base ブランチ

`dev`（CLAUDE.md「PR 作成の完全自律フロー」/ memory `feedback_default_branch_dev`）。`main` への PR は production リリース時の `dev → main` のみ。

## 3. PR 前チェック

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
git status --porcelain          # 空であること
git diff dev...HEAD --name-only # 変更ファイル一覧確認（下記 3 ファイルのみ）
```

## 4. PR title

```
feat(issue-832): extract AdminTopbar primitive from (admin) layout
```

## 5. PR body テンプレート

```markdown
## Summary

- `apps/web/app/(admin)/layout.tsx` に inline で直書きされていた admin AppShell の topbar（`<header data-shell="topbar">`）を、兄弟 primitive（AdminSidebar / PublicHeader / MemberHeader）と対称な Server Component `AdminTopbar` へ抽出
- DOM 出力・data-* 契約・OKLch トークン参照は無改変で移植（見た目・契約は完全に同一）
- `breadcrumb?` / `actions?` の省略可能 slot props を持つ最小 API。props 省略時は parallel-03 既定描画（breadcrumb「管理」+ aria-hidden actions placeholder）を維持
- AdminTopbar 単体契約 spec を新規追加。`(admin)/layout.spec.tsx` は無修正で pass を確認

Refs #832（issue は CLOSED のまま — parallel-03 で deferred 宣言され別タスクへ送られた記録に過ぎず、調査の結果 AdminTopbar は dev 上に未実装であったため本 PR で根本対応する）

## 変更ファイル

- `apps/web/src/components/layout/AdminTopbar.tsx`（新規 / Server Component / export `AdminTopbar` / props `breadcrumb?` `actions?`）
- `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx`（新規 / 既定描画・slot 注入・OKLch・axe 契約）
- `apps/web/app/(admin)/layout.tsx`（修正 / inline `<header data-shell="topbar">` → `<AdminTopbar />`）

## Test plan

- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` PASS（新規 AdminTopbar.spec.tsx を含む）
- [ ] `(admin)/layout.spec.tsx` が無修正で pass（data-shell/data-route/data-theme/data-route-group 契約維持）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build`（OpenNext Workers bundle）PASS / client bundle 増加なし
- [ ] `verify-design-tokens` gate PASS（HEX 直書き / 任意値 class なし）
- [ ] axe critical violation 0（省略時 actions placeholder の aria-hidden）
- [ ] 手動: admin session で `/admin` を開き topbar「管理」目視 / DOM 契約 / sidebar・main regression なし（Phase 11 TC-1〜TC-5）

## Screenshots

`outputs/phase-11/screenshots/` 参照（`admin-topbar-default.png` / `admin-shell-regression.png` / `admin-topbar-axe.png` / `admin-topbar-dom-contract.txt`）。
```

## 6. 作成コマンド

```bash
gh pr create --base dev \
  --title "feat(issue-832): extract AdminTopbar primitive from (admin) layout" \
  --body "$(cat <<'EOF'
... (上記テンプレート)
EOF
)"
```

> CLAUDE.md「PR 作成の完全自律フロー」に従う。**本プロンプトでは PR 自体は作らない**（コード実装・focused test・Phase 11/12 証跡は完了済みで、commit / push / PR は user 承認後に実行するため）。

## 7. CLOSED issue へのリンク戦略

Issue #832 は既に CLOSED。PR description には:

- 冒頭に `Refs #832`（**`Closes #832` は使わない** — CLOSED 済み issue を再度 close するイベントを発生させないため）。
- 本文に「issue は CLOSED だが parallel-03 で deferred されただけで実装は未完了であったため本 PR で根本対応する」旨を 1 行明記（§5 の Refs 行に記載済み）。

PR merge 後、issue #832 への実装完了コメント追記は別途手動で行う（自動 close はしない）。

## 8. 関連ドキュメントの追従更新（PR 内で同時実施）

- `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction.md`
  → 冒頭に `docs/30-workflows/completed-tasks/issue-832-admin-topbar-primitive-extraction/` への参照リンクを追記し、ステータス行を `consumed / canonical spec created` に更新（Phase 12 §3）。
- PR merge 後（別 commit / 別 PR 可）に `docs/30-workflows/completed-tasks/issue-832-admin-topbar-primitive-extraction/` を `docs/30-workflows/completed-tasks/` 配下へ移動する。
