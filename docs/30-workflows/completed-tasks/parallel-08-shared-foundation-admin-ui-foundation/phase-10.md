# Phase 10: 最終レビュー

## メタ情報

- **タスク**: parallel-08-shared-foundation-admin-ui-foundation
- **Phase**: 10 / 13
- **[実装区分: 実装仕様書]**
- **判定根拠**: Phase 9 で apps/web 配下に 2 ファイル新規作成 + 1 ファイル編集を伴っており、code 差分監査が必須。docs-only 区分ではない。
- **前提**: Phase 9 の品質検証 (typecheck / lint / build / test / playwright `@admin-smoke` / coverage-guard) が全て pass。

---

## 目的

design（spec.md）と implementation（apps/web 配下の実差分）の間の drift を 0 にし、MINOR 追跡テーブルを完全 closeout する。
CLAUDE.md の不変条件違反が残っていないことを最終確認し、Phase 11 のエビデンス取得に進める状態を作る。

---

## 実行タスク

1. MINOR 追跡テーブル closeout（Phase 1〜9 で発生した MINOR 指摘の解消確認）
2. design ↔ implementation drift 0 確認（spec.md の「変更対象ファイル一覧」と git diff の整合）
3. 不変条件監査
   - D1 直接アクセス禁止（`apps/web` から D1 binding を参照していないこと）
   - OKLch トークン正本化（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件）
   - `getEnv()` / `getPublicEnv()` 経由のみ（`process.env.*` 直接参照 0 件）
   - `apps/web` から D1 binding 禁止
4. テスト命名規約: `*.spec.{ts,tsx}` のみ。`*.test.{ts,tsx}` 0 件
5. ソース spec の表記揺れ修正記録（`(admin)/error.tsx` → `(admin)/admin/error.tsx`）を documentation-changelog 候補としてメモ

---

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`
- Phase 9 成果物（quality-report.md / type-probe.md）
- CLAUDE.md 不変条件セクション
- `apps/web/wrangler.toml`（D1 binding が存在しないことの確認）

---

## 実行手順

### Step 1: MINOR 追跡テーブル closeout

各 Phase の outputs で発生した MINOR 指摘を 1 件ずつ status: closed に遷移。
0 件であってもテーブル自体は記録する。

### Step 2: drift 監査

```bash
git diff --name-only dev...HEAD -- apps/web | sort
```

期待リスト（spec.md と整合）:
- `apps/web/app/layout.tsx`
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- `apps/web/src/features/admin/hooks/index.ts`

`(admin)/admin/error.tsx` / `middleware.ts` は diff に現れないこと（confirm のみ）。

### Step 3: 不変条件 grep gate

```bash
# OKLch: HEX 直書き禁止
grep -RInE '#[0-9a-fA-F]{3,8}' apps/web/src apps/web/app 2>/dev/null | grep -vE '\.(svg|png|md)$' | grep -v 'tokens.css'
# bg-[#...] / text-[#...] 禁止
grep -RInE 'bg-\[#|text-\[#' apps/web/src apps/web/app
# process.env 直接参照禁止
grep -RIn 'process\.env\.' apps/web/src apps/web/app | grep -v 'src/lib/env.ts'
# D1 binding 直接参照禁止
grep -RIn 'env\.DB\|getDb(' apps/web/src apps/web/app
# *.test.ts 禁止
find apps/web -type f \( -name '*.test.ts' -o -name '*.test.tsx' \)
```

全てヒット 0 件であること（必要に応じ allowlist を明記）。

### Step 4: ソース spec 表記揺れ確認

spec.md の `apps/web/app/(admin)/error.tsx` 表記は実体 `apps/web/app/(admin)/admin/error.tsx` を指す。Phase 12 の documentation-changelog で訂正を明示する。

---

## 多角的チェック観点（AI が判断）

- **drift**: spec ↔ git diff の 1:1 整合
- **不変条件**: 上記 5 ルール全 pass
- **scope creep**: ToastProvider wrap 以外の root layout 変更が混入していないこと
- **serial-05 互換**: 型契約に破壊的変更なし
- **依存関係**: parallel-01..07 と独立、serial-05/step-01 への前提のみ

---

## サブタスク管理

| No | サブタスク | 完了条件 |
|----|-----------|---------|
| 10-1 | MINOR closeout | 全件 closed |
| 10-2 | drift 監査 | 変更ファイル 3 件、confirm 2 件で一致 |
| 10-3 | 不変条件 grep gate | 5 種すべて 0 件 |
| 10-4 | spec 表記揺れ記録 | documentation-changelog 候補メモ作成 |

---

## 成果物

- `outputs/phase-10/final-review.md`（drift 監査結果、不変条件 grep 結果、MINOR closeout 表）

---

## 完了条件

- [ ] MINOR 追跡テーブル全件 closed
- [ ] design ↔ implementation drift 0
- [ ] 不変条件違反 0
- [ ] ソース spec 表記揺れを Phase 12 申し送りに記録

---

## タスク 100% 実行確認【必須】

- [ ] 上記 5 タスクすべて完遂
- [ ] 未完項目があれば再着手し、Phase 11 に進まない
- [ ] CONST_007 遵守

---

## 次 Phase

Phase 11: エビデンス収集（NON_VISUAL 縮約テンプレで PASS 5 点セット）。
