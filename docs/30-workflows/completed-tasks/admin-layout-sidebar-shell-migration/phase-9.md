# Phase 9: 品質保証

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 実装区分: **実装仕様書**
- 前 Phase: 8（リファクタリング） / 次 Phase: 10（最終レビューゲート）
- 重点（phase-template-execution.md Phase 7-10 表）: validator と quality gate の一括判定

## 目的

Phase 8 までで整理した admin layout 移行に対し、**validator（typecheck / lint / test）と quality gate
（coverage / 削除完了 grep / HEX 直書きなし）を一括で判定**し、すべて exit 0 / 期待値一致であることを記録する。
あわせて phase-3.md の MINOR 2 件（TECH-M-01 / TECH-M-02）の解決状況をテーブルで確認する。
本 Phase は新規実装を行わない。失敗があれば Phase 8（refactor）または Phase 5（実装）へ戻す。

## 実行タスク

- タスク1: validator 4 種（typecheck / lint / test / coverage-guard）を一括実行し exit 0 を確認
- タスク2: quality gate（削除完了 grep / HEX 直書きなし）を判定
- タスク3: MINOR（TECH-M-01 / TECH-M-02）の解決確認をテーブルで記録
- タスク4: AC-9 / AC-10 を満たすことを確定（Phase 10 へ引き渡し）

## 参照資料

- AC 定義: `phase-1.md`（AC-9 / AC-10）
- 削除スコープ: `phase-2.md`（6 ファイル + grep gate）
- MINOR 追跡: `phase-3.md`（TECH-M-01 / TECH-M-02）
- validation matrix: `phase-2.md` ステップ4
- coverage 方針: `phase-7.md`（>=80% / `coverage-guard.sh`）
- 設計トークン gate: `CLAUDE.md` 親不変条件 #2（`verify-design-tokens` 観点）

## 実行手順

### ステップ1: validator 一括実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run
bash scripts/coverage-guard.sh
```

| # | command | 期待 | 結果 |
| --- | --- | --- | --- |
| V-1 | `mise exec -- pnpm typecheck` | exit 0 | `[ ]` |
| V-2 | `mise exec -- pnpm lint` | exit 0 | `[ ]` |
| V-3 | `mise exec -- pnpm --filter @ubm-hyogo/web test --run` | 全 spec green（`layout.spec.tsx` 含む） | `[ ]` |
| V-4 | `bash scripts/coverage-guard.sh` | exit 0（`apps/web` Statements/Branches/Functions/Lines >=80%） | `[ ]` |

> V-3 は `apps/web` 全体を対象に実行し、6 ファイル削除に伴う他テストの巻き込み回帰がないことを確認する
> （AdminSidebar を import していた他テストが残っていれば V-1/V-3 がここで fail する）。

### ステップ2: quality gate 判定

```bash
# G-1: 旧コンポーネント完全除去（AC-2 の本体）
git grep -l "components/layout/AdminSidebar"          # 期待: 0 件（exit 1 = ヒットなし）
git grep -ln "AdminSidebar\b\|AdminSidebarNavItem\|AdminBrandBlock" apps/web   # 期待: 0 件

# G-2: HEX 直書きなし（verify-design-tokens 観点）
git grep -nE "#[0-9a-fA-F]{3,6}\b|bg-\[#|text-\[#" "apps/web/app/(admin)/layout.tsx"   # 期待: 0 件
```

| # | gate | 期待 | 結果 |
| --- | --- | --- | --- |
| G-1 | `git grep -l "components/layout/AdminSidebar"` ヒット数 | 0（AC-2） | `[ ]` |
| G-1b | `AdminSidebarNavItem` / `AdminBrandBlock` ヒット数 | 0 | `[ ]` |
| G-2 | layout.tsx の HEX 直書き / `bg-[#` / `text-[#` | 0（OKLch トークンのみ・親不変条件 #2） | `[ ]` |

> G-1 / G-1b は AC-2、G-2 は親不変条件 #2 の `verify-design-tokens` 観点に対応する。
> `git grep -l` は「ヒットなし」のとき exit 1 を返す点に注意（gate としては「0 件 = PASS」）。

### ステップ3: MINOR 解決確認テーブル

phase-3.md で追跡した MINOR 2 件の解決状況を本 Phase で確定する（TECH-M-02 の目視は Phase 11 だが、
本 Phase で「設計どおり client `usePathname()` に委ねられている」コード上の事実を確認する）。

| MINOR ID | 指摘 | 解決予定 Phase | 本 Phase での確認方法 | 結果 |
| --- | --- | --- | --- | --- |
| TECH-M-01 | schemaDiffCount 算出責務の所在 | Phase 5（実装）/ Phase 8（確定） | Phase 8 表でケース A/B 確定済み。本 Phase で SSOT が 1 箇所のみであることを `git grep -n "status === \"queued\"" apps/web/src` で再確認（重複定義 0） | `[ ]` |
| TECH-M-02 | `activePath="/admin"` 固定 + client `usePathname()` active 表示 | Phase 5（実装）/ Phase 11（目視） | layout が `activePath="/admin"` を seed として渡し、active state を server で再解決していないこと（`git grep -n "x-pathname" apps/web` = 0）をコード上で確認。目視確認は Phase 11 へ引き渡す | `[ ]` |

> TECH-M-01 は本 Phase で**コード上の解決完了**（SSOT 単一）を確定する。
> TECH-M-02 は**コード上の方針整合**を確定し、**目視確認は Phase 11**へ明示的に引き渡す（戻り先を曖昧にしない）。

### ステップ4: AC-9 / AC-10 の確定

| AC | 内容 | 対応する確認 | 結果 |
| --- | --- | --- | --- |
| AC-9 | `pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/web test --run` が green | V-1 / V-2 / V-3 | `[ ]` |
| AC-10 | coverage >=80% / `coverage-guard.sh` exit 0 | V-4 | `[ ]` |

## 統合テスト連携

- 本 Phase は実行のみ。新規テストは追加しない（Phase 8 で helper を新設した場合の focused spec は Phase 8 完了済み前提）。
- `layout.spec.tsx` の全ケースが V-3 に含まれ green であることが AC-8 の最終確認も兼ねる。

## 多角的チェック観点（AIが判断）

- **validator の網羅**: typecheck / lint / test / coverage の 4 種すべてを exit 0 で揃えたか。一部スキップしていないか。
- **gate の意味理解**: `git grep -l` の exit code（ヒットなしで 1）を「PASS」と正しく判定しているか。
- **MINOR の戻り先明示**: TECH-M-01 はコード上解決、TECH-M-02 は Phase 11 目視へ引き渡し、と戻り先を曖昧にしていないか。
- **回帰の巻き込み**: 6 ファイル削除で他テストが落ちていないか（V-3 を `apps/web` 全体で実行する理由）。
- **トークン遵守**: HEX 直書きが layout.tsx に混入していないか（G-2）。

## サブタスク管理

- 単一責務。サブタスク分割なし。

## 成果物

- validator 4 種の実行結果（V-1〜V-4 テーブル）
- quality gate 判定（G-1 / G-1b / G-2 テーブル）
- MINOR 解決確認テーブル（TECH-M-01 / TECH-M-02）
- AC-9 / AC-10 の確定記録

## 完了条件

- [ ] validator 4 種（typecheck / lint / test / coverage-guard）が全て exit 0
- [ ] quality gate（削除完了 grep 0 件 / HEX 直書き 0 件）が全て PASS
- [ ] TECH-M-01 をコード上で解決（SSOT 単一）し確認した
- [ ] TECH-M-02 をコード上で方針整合を確認し、目視確認を Phase 11 へ引き渡した
- [ ] AC-9 / AC-10 を満たすことを確定した

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] 失敗があった場合の戻り先（Phase 8 refactor / Phase 5 実装）を判断できる状態にした
- [ ] Phase 10（最終レビューゲート）に AC 全件と MINOR 状況を引き渡せる

## 次Phase

Phase 10（最終レビューゲート）。AC-1〜AC-10 の 1:1 final review へ進む。
