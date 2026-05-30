# Unified Sidebar Shell Task D: Admin layout migration

```yaml
issue_number: 1018
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | unified-sidebar-shell-task-d-admin-layout-migration |
| タスク名 | Admin layout を SidebarShell へ移行し旧 AdminSidebar を削除 |
| 分類 | implementation |
| 対象機能 | `apps/web/app/(admin)/layout.tsx`, `apps/web/src/components/layout/AdminSidebar.tsx` |
| 優先度 | Medium |
| 見積もり規模 | Medium |
| ステータス | unassigned |
| 発見元 | `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 発見日 | 2026-05-29 |

## 背景

親 workflow の Phase 12 では、現行 AdminSidebar の admin item 数を 9、total nav item 数を 13 として補正済み。Task A/B/E 完了後、admin layout の責務を guard + shell 呼び出しへ縮小する。

## 目的

`(admin)/layout.tsx` を `SidebarShellServer` に置換し、既存 `AdminSidebar` とその参照を削除する。

## 受け入れ条件

- admin session で `/admin` 配下に PUBLIC+MEMBERS+ADMIN の 13 item が表示される
- non-admin session は `/login?gate=forbidden` に redirect される
- session null は `/login` に redirect される
- `components/layout/AdminSidebar` の production import が 0 件になる
- schemaDiffCount 取得失敗時は count=0 fallback で shell 描画が継続する

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-225049-wt-11/docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-D-admin-layout-migration.md`
- 症状: 旧 `AdminSidebar` が nav、schemaDiff badge、sign-out、user chip の責務を抱えていたため、削除前に Task A/B の責務分割と item 数を完全一致させないと admin route regression が出る。
- 参照: `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/system-spec-update-summary.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| admin gate の redirect contract が変わる | `(admin)/layout` focused test で null / non-admin / admin の3分岐を固定する |
| schemaDiff badge failure が admin shell 全体を落とす | `SidebarShellServer` 側で `getSchemaDiffCount()` を try/catch し count=0 fallback にする |
| 旧 AdminSidebar spec 削除で coverage が落ちる | 新 layout spec と shell-config spec で旧責務を置き換える |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run "src/app/(admin)"
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell
```

期待: admin layout guard と nav rendering tests が PASS。

### 統合検証

```bash
git grep -n "components/layout/AdminSidebar" -- apps/web | cat
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: production import 0 件、typecheck/lint exit code 0。

## スコープ

### 含む

- `(admin)/layout.tsx` の shell migration
- `AdminSidebar` 削除
- admin layout focused tests
- schemaDiff badge fallback verification

### 含まない

- public/member layout migration（Task C）
- visual baseline generation（Task F）
- admin page content redesign

## 参照

- `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-D-admin-layout-migration.md`
- `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/system-spec-update-summary.md`
