# Unified Sidebar Shell Task C: Public/member layout integration

```yaml
issue_number: 1017
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | unified-sidebar-shell-task-c-public-member-layout-integration |
| タスク名 | 公開 / 会員 layout を SidebarShell へ統合 |
| 分類 | implementation |
| 対象機能 | `apps/web/app/(public)/layout.tsx`, `apps/web/app/(member)/layout.tsx` |
| 優先度 | Medium |
| 見積もり規模 | Medium |
| ステータス | unassigned |
| 発見元 | `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 発見日 | 2026-05-29 |

## 背景

Task B の UserMenu は実装済みだが、公開 / 会員 layout はまだ既存 header 系コンポーネントに依存している。Task A/E の完了後、公開・会員画面を同じ SidebarShell に載せ替える必要がある。

## 目的

`(public)` と `(member)` layout を `SidebarShellServer` へ統合し、旧 `PublicHeader*` / `MemberHeader` import を撤去する。

## 受け入れ条件

- `/`, `/members`, `/register`, `/privacy`, `/terms`, `/login`, `/profile` で同一 sidebar shell が描画される
- 未ログインは PUBLIC のみ、member は PUBLIC+MEMBERS、admin は PUBLIC+MEMBERS+ADMIN を表示する
- `PublicFooter` は維持される
- 旧 `PublicHeader*` / `MemberHeader` の production import が 0 件になる

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-225049-wt-11/docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- 症状: layout から pathname を渡すために `headers().get('x-pathname')` を使う設計だが、Next App Router の layout cache と header availability を誤ると active state が stale になる。
- 参照: `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| header 削除で public footer / SEO metadata の表示位置が崩れる | Phase 5 で `PublicFooter` を shell children 末尾に維持し、route smoke で確認する |
| role 判定を layout 側に重複実装する | role/session 解決は `SidebarShellServer` に閉じ、layout は activePath と children だけ渡す |
| grep でドキュメント内参照まで削除対象にしてしまう | production import grep と docs grep を分離し、コード参照 0 を完了条件にする |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/app
```

期待: public/member layout focused tests が PASS。

### 統合検証

```bash
git grep -n "PublicHeader\\|SessionAwarePublicHeader\\|PublicHeaderWithPath\\|MemberHeader" -- apps/web | cat
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: production import 0 件、typecheck/lint exit code 0。

## スコープ

### 含む

- `(public)/layout.tsx` の shell 統合
- `(member)/layout.tsx` の shell 統合
- 旧 public/member header import の削除
- focused layout tests

### 含まない

- admin layout migration（Task D）
- mobile drawer の新規実装（Task E）
- visual baseline CI 化（Task F）

## 参照

- `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`
