# Phase 6: 回帰確認

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 前 Phase: 5（実装） / 次 Phase: 7（カバレッジ）
- 実装区分: **実装仕様書**（CONST_004 判定根拠は `index.md` 参照）
- 検証コマンド suite: typecheck / lint / `@ubm-hyogo/web` test --run / `git grep` gate / `coverage-guard.sh`

## 目的

Phase 5 の書き換え・削除が、`(admin)` route group 配下の他 spec や `apps/web` 全体のテストに回帰を起こしていないことを確認する。
baseline（変更ファイル一覧）を固定し、`pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/web test --run` の green と
`bash scripts/coverage-guard.sh` exit 0 を確認する（AC-9 / AC-10）。

## 実行タスク

- タスク1: baseline（`git diff --name-only`）を固定し、変更影響範囲を把握する。
- タスク2: 削除 3 spec の検証責務移譲を確認する（layout.spec TC-04/05/06 + Task A spec）。
- タスク3: 補助コマンド suite を全て実行し green / exit 0 を確認する。
- タスク4: 他 admin route spec（`/admin/*` の page.spec 等）に回帰がないことを確認する。

## 実行手順

### ステップ1: baseline 固定（変更影響範囲）

```bash
# 変更ファイル一覧（追加・書き換え・削除）
git status --porcelain
git diff --name-only HEAD

# 想定される変更:
#   M apps/web/app/(admin)/layout.tsx
#   M apps/web/app/(admin)/layout.spec.tsx
#   D apps/web/src/components/layout/AdminSidebar.tsx
#   D apps/web/src/components/layout/AdminSidebarNavItem.tsx
#   D apps/web/src/components/layout/AdminBrandBlock.tsx
#   D apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx
#   D apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx
#   D apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx
#   (フォールバック採用時) A apps/web/src/lib/admin/schema-diff-count.ts
#   (フォールバック採用時) A apps/web/src/lib/admin/schema-diff-count.spec.ts
```

想定外のファイルが変更一覧に含まれる場合は、Phase 5 の編集スコープ逸脱を疑い差分を見直す。

### ステップ2: 削除 spec の検証責務移譲の確認

削除した 3 spec（`AdminSidebar.spec.tsx` / `AdminSidebar.component.spec.tsx` / `AdminSidebarNavItem.spec.tsx`）が
cover していた検証点が、移行後に欠落していないことを確認する。

| 削除 spec の検証点 | 移行後の cover 先 |
| --- | --- |
| nav 13 item の描画 | layout.spec TC-04（全 13 item href 集合） |
| schemaDiff badge（queued count / 失敗時非表示） | layout.spec TC-05 / TC-06 |
| active 判定（`usePathname()` → `aria-current`） | Task A spec（`SidebarShell.server.spec.tsx` / `SidebarNavItem` 系 spec） |
| brand block 描画 | Task A spec |
| user chip / SignOut | Task B spec（`SidebarUserMenu` spec） |

> active 判定 / brand / user chip の cover 先が Task A/B 側 spec で確かに存在することを確認する。存在しなければ欠落であり、Phase 12 unassigned-task-detection で follow-up として記録する（本タスクで Task A/B の spec は新設しない）。

### ステップ3: 補助コマンド suite（green / exit 0）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run
bash scripts/coverage-guard.sh
git grep -l "components/layout/AdminSidebar"   # → 0 件（AC-2 再確認）
```

| コマンド | 期待 | 対応 AC |
| --- | --- | --- |
| `pnpm typecheck` | green（型エラー 0） | AC-9 |
| `pnpm lint` | green（lint 違反 0） | AC-9 |
| `pnpm --filter @ubm-hyogo/web test --run` | 全 spec green（削除 spec の参照エラーが出ないこと含む） | AC-8/AC-9 |
| `bash scripts/coverage-guard.sh` | exit 0 | AC-10 |
| `git grep -l "components/layout/AdminSidebar"` | 0 件 | AC-2 |

### ステップ4: 他 admin route spec の回帰なし確認

`(admin)` route group 配下の他 page / component spec が、layout 書き換えと sidebar 削除の影響を受けていないことを確認する。

```bash
# (admin) 配下の spec を限定実行
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)

# AdminSidebar 由来 import が他 spec に残っていないか（削除後 0 件のはず）
git grep -n "AdminSidebar\|AdminBrandBlock" apps/web | grep -v "node_modules" || echo "no residual reference"
```

- `/admin/*` の各 page.spec が green であること。
- 各 admin page が layout を直接 import していない（layout は Next.js route convention 経由でのみ適用される）ため、page.spec は layout 変更の影響を受けない設計であることを確認する。

## coverage-guard の merge commit 例外について

`scripts/coverage-guard.sh` は push 範囲に merge commit を含む `--changed` モードで自動スキップ仕様（CLAUDE.md「sync-merge 時の hook 挙動」）。
本 Phase の回帰確認は feature ブランチ上の通常コミットで実施するため、coverage-guard は通常どおり exit 0 を要求する（スキップ対象外）。

## 参照資料

- phase-4.md（TC-01〜08 / 削除 spec の責務移譲表）
- phase-5.md（変更・削除ファイル一覧 / 初回 validation）
- CLAUDE.md「sync-merge 時の hook 挙動」（coverage-guard merge 例外の文脈）
- `scripts/coverage-guard.sh`（実在）

## 統合テスト連携

- `apps/web` の全 spec が green であること（削除 spec の dangling import が無いこと含む）。
- layout.spec の TC-01〜08 が green であること（Phase 4/5 と一致）。

## 多角的チェック観点（AIが判断）

- 削除 3 spec の検証点が移行後に欠落していないか（責務移譲の整合）。
- typecheck は削除ファイルへの dangling import を検出する第一防衛線。lint と合わせて 2 重に確認する。
- `git grep` gate は文字列一致のため、コメント内残存も検出する。0 件を厳密に要求する。
- 他 admin route spec の回帰は「layout import の有無」で切り分ける（route convention 適用のため通常は無影響）。

## サブタスク管理

- 単一責務。サブタスク分割なし。

## 成果物

- 本 Phase: baseline 変更一覧 / 補助コマンド suite 結果 / 削除 spec 責務移譲確認（本ファイル + 実行ログ）。

## 完了条件

- [ ] baseline（`git diff --name-only`）を固定し、想定外の変更が無いことを確認した
- [ ] `mise exec -- pnpm typecheck` green（AC-9）
- [ ] `mise exec -- pnpm lint` green（AC-9）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test --run` 全 green（AC-8/AC-9）
- [ ] `bash scripts/coverage-guard.sh` exit 0（AC-10）
- [ ] coverage（`apps/web`）Statements/Branches/Functions/Lines >=80% を確認した（AC-10）
- [ ] `git grep -l "components/layout/AdminSidebar"` 0 件（AC-2）
- [ ] 他 admin route spec に回帰がないことを確認した
- [ ] 削除 3 spec の検証点が移行後に欠落していないことを確認した

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] AC-2 / AC-8 / AC-9 / AC-10 を本 Phase の実行ログで充足した
- [ ] 削除 spec の責務移譲先（layout.spec / Task A・B spec）が実在することを確認した

## 次Phase

Phase 7（カバレッジ）。
