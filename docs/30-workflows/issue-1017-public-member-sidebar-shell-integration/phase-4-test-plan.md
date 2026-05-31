`[実装区分: 実装仕様書]`

# Phase 4: テスト計画（issue-1017 / verify_existing）

verify_existing のため、新規 RED テストは書かず、**landed 実装（commit `278001606`）に同梱済みの spec が
AC-1..AC-4 を被覆していることを確認する targeted test** を計画する。テスト操作対象は external props
（`vi.mock` で差し替えた `next/headers` の `x-pathname` と `@/lib/session` の session）であり、shell 内部実装には触れない。

## 回帰スイート（command suite）

```bash
# 1) 型チェック（6 packages）
mise exec -- pnpm typecheck

# 2) lint（exit 0 期待）
mise exec -- pnpm lint

# 3) targeted focused run（4 spec）
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "app/(public)/layout.spec.tsx" \
  "app/(member)/layout.spec.tsx" \
  "app/(public)/page.spec.tsx" \
  "app/(member)/profile/page.spec.tsx"

# 4) 旧 header production import 0 件確認（grep ヒット 0 を期待）
git grep -n "PublicHeader\|SessionAwarePublicHeader\|PublicHeaderWithPath\|MemberHeader" \
  -- apps/web/app apps/web/src
```

## 各 spec の期待ケース表

### `app/(public)/layout.spec.tsx` / `app/(member)/layout.spec.tsx`

| ケース | mock 入力（external props） | 期待 |
| --- | --- | --- |
| 未ログイン → PUBLIC | `session = null` | nav group が `[公開]` のみ。`data-shell-mode="sidebar"` を持つ |
| member → PUBLIC+MEMBERS | `session = { isAdmin:false }` | nav group が `[公開, 会員]`。`/profile` item を含む |
| admin → PUBLIC+MEMBERS+ADMIN | `session = { isAdmin:true }` | nav group が `[公開, 会員, 管理]`。schemaDiff badge を含む |
| active path 反映 | `headers().get("x-pathname") = "/members"` | `activePath` が SidebarShellServer へ伝播 |
| public footer 維持 | public layout | `<PublicFooter />` が shell 配下に描画される（AC-3） |
| route group 属性 | public / member | `data-route-group="public"` / `"member"`, `data-testid="public-shell"` / `"member-shell"` |

### `app/(public)/page.spec.tsx` / `app/(member)/profile/page.spec.tsx`

| ケース | 入力 | 期待 |
| --- | --- | --- |
| page 構造 guard | レンダリング | page 本体が header を mount せず children として描画される（MV-1: 移動後 page の構造健全性） |
| 相対 import 健全性 | import 解決 | route group 移動後も page の import / colocated 参照が壊れていない（AC-1 / 回帰） |
| profile から MemberHeader 直接 mount 除去 | `/profile` page | `MemberHeader` の直接 mount がない（AC-4） |

## grep による旧 header 撤去確認（AC-4）

| 対象パターン | 期待 |
| --- | --- |
| `PublicHeader` / `SessionAwarePublicHeader` / `PublicHeaderWithPath` | production（`apps/web/app` / `apps/web/src`）で **ヒット 0** |
| `MemberHeader` | production で **ヒット 0** |

> 本ワークフロー doc（`docs/30-workflows/...`）やアーカイブ参照は production 集計外。

## role → nav group 期待マトリクス（AC-2）

| role | nav groups | source |
| --- | --- | --- |
| viewer（未ログイン） | `[PUBLIC]` | `buildNavForRole("viewer")` → `[PUBLIC_GROUP]` |
| member | `[PUBLIC, MEMBERS]` | `buildNavForRole("member")` → `[PUBLIC_GROUP, MEMBERS_GROUP]` |
| admin | `[PUBLIC, MEMBERS, ADMIN(+schemaDiff badge)]` | `buildNavForRole("admin", {schemaDiffCount})` |

## DoD（テスト計画）

- 上記 4 spec が PASS（landed 検証実績: apps/web 1385 passed | 1 skipped）。
- typecheck 6 packages green / lint exit 0。
- grep による旧 header production import が 0 件。
- AC-1..AC-4 がいずれかのケースで被覆されている。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 4 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 4 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 4 記録を正本として維持する。
- #1028 の landed 実装と本 Phase の境界を確認する。

## 参照資料

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- `docs/30-workflows/task-c-public-member-sidebar-shell-integration/`
- commit `278001606` / PR #1028

## 成果物

- 本ファイル
- `artifacts.json` / `outputs/artifacts.json` parity
- Phase 11/12 outputs

## 完了条件

- [x] Phase 4 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
