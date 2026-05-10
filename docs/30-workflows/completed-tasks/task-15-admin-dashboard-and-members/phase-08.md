# Phase 8: リファクタリング

[実装区分: 実装仕様書]

> 目的: 旧実装の残骸整理 / duplicate 除去 / barrel export 統一 / navigation drift 修正。FB-RT-03 に従い `対象/Before/After/理由` テーブル形式で記録する。
> FB-UI-02-1: 削除確認は「git delete」または「`export {}` stub 化 + live import 0 件」のいずれかを PASS とする。

---

## 1. リファクタリング対象一覧

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| R-01 | `apps/web/src/components/admin/MembersClient.tsx`（旧） | 旧実装が `apps/web/src/components/admin/` 配下に存在 | `apps/web/src/features/admin/components/_members/` に移行済み、旧ファイル削除 | task-15 §10 D-10「旧 component 残骸 0」 |
| R-02 | 旧 `apps/web/app/(admin)/admin/page.tsx` の不要 import | 旧 component への参照 | 新 `_dashboard/*` import に置換 | Phase 5 で新規作成済み、unused import 削除 |
| R-03 | `apps/web/src/features/admin/components/index.ts` | 個別 import が page から直接 | barrel 経由に統一 | DX 向上 + task-16/17 が同 barrel に追記しやすい |
| R-04 | `formatJstDateTime` の散在 | dashboard で 1 件、他 page で類似 utility が乱立する場合 | `apps/web/src/lib/format/datetime.ts` に集約 | DRY |
| R-05 | OKLch token 直書き util の整理 | `bg-[var(--ubm-color-surface)]` 等の重複 | `cva` variant か helper に集約（Phase 5 内で完結していれば skip） | 視認性 |
| R-06 | テスト fixture の集約 | 各テストファイルで member fixture を inline | `apps/web/src/features/admin/components/__tests__/__fixtures__/member.ts` に集約 | 重複削減 |

---

## 2. 削除確認 grep（FB-UI-02-1 / FB-TASK-01/02）

```bash
# 旧 admin component への live import が 0 件であること
grep -rn "from \"@/components/admin/" apps/web/src/ | wc -l   # 期待: 0
grep -rn "import.*MembersClient" apps/web/src/ | wc -l         # 期待: 0

# describe.skip 内の旧参照も 0 件確認
grep -rn "components/admin" apps/web/src/ | wc -l               # 期待: 0
```

R-01 は **git delete** 方式で実施（stub 化は不要）。

---

## 3. navigation drift 確認

| route | Sidebar `aria-current` | 確認方法 |
|-------|----------------------|---------|
| `/admin` | "ダッシュボード" 行 | dev server 目視 + Phase 11 screenshot |
| `/admin/members` | "会員管理" 行 | 同上 |
| `/admin/tags` `/admin/schema` 等（task-16/17 で実装） | 該当 nav | task-16/17 で確認 |

`AdminSidebar` の active 判定が pathname-based であること（Phase 5 で確認済み）。

---

## 4. 完了条件（DoD）

- [ ] §1 R-01〜R-06 すべて完了またはスキップ判定
- [ ] §2 grep 結果が全て 0 件
- [ ] §3 navigation drift 確認完了
- [ ] vitest 36 ケースが green を維持（リファクタで壊れていないこと）
- [ ] `outputs/phase-08/refactor-log.md` に `対象/Before/After/理由` テーブル出力

## 成果物

- `outputs/phase-08/refactor-log.md`
- 旧 `apps/web/src/components/admin/` 配下ファイルの git delete commit
- 実行後に `artifacts.json` の `phase08.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
