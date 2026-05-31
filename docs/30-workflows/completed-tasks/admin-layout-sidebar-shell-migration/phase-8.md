# Phase 8: リファクタリング

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 実装区分: **実装仕様書**
- 前 Phase: 7（カバレッジ） / 次 Phase: 9（品質保証）
- 対象: 移行後 `apps/web/app/(admin)/layout.tsx` + `apps/web/app/(admin)/layout.spec.tsx` の整理
- 重点（phase-template-execution.md Phase 7-10 表）: duplicate / naming / navigation 短縮 + refactor 後 validator 再実行

## 目的

Phase 5 で SidebarShellServer へ移行し Phase 6/7 で回帰・カバレッジを確認した admin layout を、
**機能を変えずに**整理する。具体的には (1) import / 命名 / 重複の整理、(2) schemaDiffCount helper 抽出
（TECH-M-01）の最終確定、(3) 旧 `AdminSidebar` 由来 dead code（icon 定数・未使用 type 等）の完全消失の
grep 再確認、(4) refactor 後の validator（typecheck / lint / test）再実行。
**新規 primitive は生やさない**（親不変条件 #3）。AC を変えるリファクタリングは行わない。

## 実行タスク

- タスク1: 移行後 layout の重複 / 命名 / import 整理（機能不変）
- タスク2: schemaDiffCount helper（TECH-M-01）の所在を確定する（Phase 5 で確定済みか、本 Phase で確定するかを明記）
- タスク3: 旧 AdminSidebar 由来 dead code（icon 定数 / 未使用 import / orphan type）の完全消失を grep 再確認
- タスク4: refactor 後に validator（typecheck / lint / test）を再実行し green を確認

## 参照資料

- 実コード（refactor 起点）: `apps/web/app/(admin)/layout.tsx`（Phase 5 で書き換え済み）
- テスト: `apps/web/app/(admin)/layout.spec.tsx`
- Task A: `apps/web/src/components/shell/SidebarShell.server.tsx`（`SidebarShellServer`）
- 設計判断: `phase-2.md`（layout 新形 / 削除スコープ / schemaDiffCount SSOT）
- レビュー追跡: `phase-3.md`（TECH-M-01 / TECH-M-02）
- 親不変条件 #3（新規 primitive を生やさない）: `CLAUDE.md` §「UI prototype alignment / MVP recovery」

## 実行手順

### ステップ1: refactor 対象の抽出（重複 / 命名 / navigation）

移行後 layout は **guard + shell 呼び出し + admin shell DOM contract 維持**の最小責務になっている前提
（phase-2 採用案 C）。本 Phase では以下の観点で「機能を変えない」整理候補のみを抽出する。

| 観点 | チェック内容 | 想定アクション |
| --- | --- | --- |
| 重複 import | `next/navigation` の `redirect` / `ReactNode` / shell component が二重 import されていないか | 重複削除 |
| 未使用 import | 旧 layout 由来の `safeServerFetch` / `SchemaDiffListView` / `AdminSidebar` が残っていないか | 完全除去（lint `no-unused-vars` で検出） |
| 命名 | guard 条件の早期 return が AC-3（`/login?next=/admin`）/ AC-4（`/login?gate=forbidden`）と 1:1 で読めるか | コメントで AC 番号を 1 行付与（既存方針踏襲） |
| navigation 短縮 | layout から shell までのネストが過剰でないか（`<div data-*>` → `SidebarShellServer` の 1 段） | 余分な wrapper を作らない（新規 primitive 禁止・親不変条件 #3） |

> 注: DOM contract（`data-testid="admin-shell"` / `data-theme="cool"` / `data-route-group="admin"` /
> `data-shell-mode="sidebar"` / `<main data-route="admin">`）は AC-7 のため**リネーム・削除しない**。
> refactor は内部表現の整理に限定し、外部契約（属性・redirect 先・shell props）は不変とする。

### ステップ2: schemaDiffCount helper（TECH-M-01）の所在確定

phase-3.md の MINOR `TECH-M-01`（schemaDiffCount 算出責務の所在）の最終解決を本 Phase で確定し、
判定を下表に記録する。**Phase 5 の実装結果がどちらに着地したか**を事実として記録すること
（本 Phase で新規にロジックを移動させる場合は機能不変であることを test で担保）。

| ケース | Phase 5 実装結果 | 本 Phase のアクション | 結果記録 |
| --- | --- | --- | --- |
| A（第一案） | Task A `SidebarShellServer` 内部で `safeServerFetch("/admin/schema/diff")` + queued filter + 失敗時 0 を算出済み | layout 側に算出ロジックは残っていない（旧 `loadSchemaDiffCount` は削除済み）。helper 新設は不要 | `[ ]` 確定 |
| B（フォールバック） | shell に算出が無く `apps/web/src/lib/admin/schema-diff-count.ts` を新設して A・D 双方が import | helper の純関数（queued filter）と fetch 部の責務分離・命名・配置（`apps/web/src/lib/admin/`）を確認。重複定義がないか grep | `[ ]` 確定 |

判定コマンド（どちらに着地したかの事実確認）:

```bash
# layout に算出ロジックが残っていないこと（ケース A の確認）
git grep -n "loadSchemaDiffCount\|/admin/schema/diff" "apps/web/app/(admin)/layout.tsx"
# helper を新設した場合のみ存在（ケース B）
find apps/web/src -path '*schema-diff-count*'
```

> どちらのケースでも **count 算出ロジックは 1 箇所のみ**（SSOT）であることを確定する。
> layout・shell・helper に同等の queued filter が二重に存在する状態は MAJOR とし Phase 3 へ差戻す。

### ステップ3: 旧 AdminSidebar 由来 dead code の完全消失 grep 再確認

Phase 5 で 6 ファイルを物理削除済みの前提で、削除に伴う残骸（icon 定数 / 未使用 type / 旧コメント）が
残っていないかを再確認する。

```bash
# (1) 旧コンポーネント参照の完全消失（AC-2 の本体・冪等再確認）
git grep -l "components/layout/AdminSidebar"            # 期待: 0 件
git grep -ln "AdminSidebar\b\|AdminSidebarNavItem\|AdminBrandBlock" apps/web   # 期待: 0 件

# (2) 旧 sidebar 専用の icon 定数 / nav 定義が orphan で残っていないか
git grep -ln "ADMIN_NAV\|adminNavItems\|SIDEBAR_ICON" apps/web/src/components/layout   # 期待: 0 件（ディレクトリごと空 or 関連ファイル消失）

# (3) layout.tsx の未使用 import 残骸
git grep -n "SchemaDiffListView\|safeServerFetch" "apps/web/app/(admin)/layout.tsx"   # 期待: 0 件（ケース A）/ helper 経由なら 0 件
```

| grep | 期待 | 結果 |
| --- | --- | --- |
| `components/layout/AdminSidebar` ヒット数 | 0 | `[ ]` |
| `AdminSidebarNavItem` / `AdminBrandBlock` ヒット数 | 0 | `[ ]` |
| 旧 icon 定数 / nav 定義の orphan | 0 | `[ ]` |
| layout.tsx 内の旧 import 残骸 | 0 | `[ ]` |

> grep がいずれかで > 0 の場合、refactor 未完了として本 Phase 内で除去する（Phase 9 へ持ち越さない）。

### ステップ4: refactor 後 validator 再実行（必須）

refactor は機能不変が原則だが、import 削除・命名変更で型・lint が壊れる可能性があるため**再実行を必須**とする。

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run "apps/web/app/(admin)"
```

| command | 期待 | 結果 |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | exit 0 | `[ ]` |
| `mise exec -- pnpm lint` | exit 0（HEX 直書きなし・未使用なし） | `[ ]` |
| `mise exec -- pnpm --filter @ubm-hyogo/web test --run "apps/web/app/(admin)"` | layout.spec 全 green | `[ ]` |

> refactor 前後でテストケース数・assert 内容を変えないこと（機能不変の証跡）。テスト自体を整理する場合は
> AC-8 のケース（null→redirect / non-admin→redirect / DOM contract / 単独『管理』なし / fetch 失敗 badge なし /
> queued のみ count / axe critical 0）の意味を保つ。

## 統合テスト連携

- 本 Phase のテストは新規追加せず、Phase 4/5 で確定した `layout.spec.tsx` を再実行して回帰がないことのみ確認する。
- helper を新設（ケース B）した場合は、その純関数（queued filter）に対する focused unit test を `apps/web/src/lib/admin/schema-diff-count.spec.ts`（`*.spec.ts`・invariant #8）として追加し、count 算出 SSOT を保護する。

## 多角的チェック観点（AIが判断）

- **機能不変の担保**: refactor 前後で AC-1〜AC-10 に影響する挙動（redirect 先 / DOM 属性 / nav 13 item / badge 条件）が変わっていないか。
- **新規 primitive 禁止（親不変条件 #3）**: 整理目的で新しい wrapper component / primitive を生やしていないか。
- **SSOT 単一性**: schemaDiffCount 算出が 1 箇所のみ（layout・shell・helper のいずれか単一）であること。
- **dead code 完全消失**: 旧 AdminSidebar 由来の定数・型・コメントが grep で 0 件であること。
- **HEX 直書きなし**: refactor 中に `bg-[#xxx]` 等を混入させていないか（`verify-design-tokens` 観点・Phase 9 で正式判定）。

## サブタスク管理

- 単一責務（admin layout 移行の仕上げ）。サブタスク分割なし。本 Phase は機能追加を伴わない整理 Phase。

## 成果物

- 整理後 `apps/web/app/(admin)/layout.tsx`（機能不変）
- TECH-M-01 の所在確定記録（ケース A/B いずれか・本ファイルの表）
- dead code grep 再確認結果（本ファイルの表）
- refactor 後 validator 再実行結果（本ファイルの表）

## 完了条件

- [ ] 重複 / 未使用 import / 命名を整理した（機能不変）
- [ ] TECH-M-01（schemaDiffCount 所在）をケース A/B のいずれかで確定し記録した（SSOT 単一性を確認）
- [ ] 旧 AdminSidebar 由来 dead code が grep で 0 件であることを再確認した
- [ ] refactor 後に typecheck / lint / test を再実行し green を確認した
- [ ] 新規 primitive を生やしていない（親不変条件 #3）

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] refactor で AC-1〜AC-10 の挙動を変えていない（外部契約不変）
- [ ] TECH-M-01 の解決を Phase 9/10 へ引き渡せる状態にした

## 次Phase

Phase 9（品質保証）。validator + quality gate の一括判定へ進む。
