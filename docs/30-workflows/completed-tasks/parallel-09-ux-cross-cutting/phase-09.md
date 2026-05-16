# Phase 9: 受入確認（AC-1〜AC-10 検証）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 6 で実装した 4 primitive (FormField/Pagination/Icon/Breadcrumb) + EmptyState 拡張 + useAdminMutation 編集 + globals.css `@layer components` 追記 + Phase 7/8 で整備したテスト・ドキュメントを対象に、AC-1〜AC-10 の充足を **実コード / 実 grep / 実テスト実行** で検証する Phase。実環境への副作用は伴わないが、PR 昇格の唯一のゲートとして実物の動作判定が必要。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 受入確認（AC-1〜AC-10 検証） |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 8 (ドキュメント更新計画) |
| 次 Phase | 10 (後付けリファクタ) |
| 状態 | pending |
| GitHub Issue | parallel-09-ux-cross-cutting (UI prototype alignment MVP recovery 配下) |

---

## 目的

Phase 1 (index.md) で確定した AC-1〜AC-10 を、Phase 6/7/8 までに完成した実コード・テスト・ドキュメントに対して機械的に検証し、Phase 10 以降に進める品質ゲートを成立させる。本 Phase の判定が GO となった場合のみ Phase 10 リファクタ → Phase 11 visual evidence へ進行する。

特に以下 4 つの不変条件を本 Phase で grep / 静的検証ベースで再確認する:

1. **HEX 直書き 0 件**: `bg-[#…]` / `text-[#…]` / `border-[#…]` / `focus:[#…]` が `apps/web/src` 配下に存在しない
2. **OKLch token 正本利用**: 利用 token がすべて `apps/web/src/styles/tokens.css` に定義済
3. **API 変更ゼロ**: `apps/api/` / `apps/web/wrangler.toml` / D1 schema に diff が存在しない
4. **parallel-03 conflict ゼロ**: `globals.css` `@layer components` の section 区分が parallel-03 (G3-*) と物理的に分離されており、merge dry-run で conflict marker が発生しない

---

## 9-1. 受入対象 Acceptance Criteria（AC）

| AC ID | 内容 | 検証 Step |
| --- | --- | --- |
| AC-1 | FormField が `aria-invalid` / `aria-describedby` を注入し、border/helper text を OKLch token (`--ubm-color-danger`) で彩色 | Step 2 (unit) + Step 5 (token grep) |
| AC-2 | EmptyState API 拡張 (icon / title / description / action) が後方互換を保つ | Step 2 (unit) + Step 4 (既存 caller 動作) |
| AC-3 | Pagination が `current` / `total?` / `hasNext` / `hasPrev` / `onNext` / `onPrev` シグネチャで cursor-only モードに対応 | Step 2 (unit) |
| AC-4 | Icon が `IconSize = "sm" \| "md" \| "lg" \| "xl"` (12/16/20/24px) で 4 サイズを描画 | Step 2 (unit) + Step 6 (visual snapshot) |
| AC-5 | Breadcrumb が `nav[aria-label="breadcrumb"]` + `ol` で構築され最終項目に `aria-current="page"` | Step 2 (unit) + Step 3 (a11y) |
| AC-6 | Tailwind 既定 breakpoint (sm/md/lg/xl) を使った responsive contract が globals.css に存在 | Step 5 (CSS grep) |
| AC-7 | `:focus-visible` 統一規則 + `prefers-reduced-motion` 規則が globals.css に存在 | Step 5 (CSS grep) + Step 6 (visual focus snapshot) |
| AC-8 | `useAdminMutation` が isLoading 中の 2nd call を reject + toast 通知 | Step 2 (unit) |
| AC-9 | mutation 失敗時に form state がリセットされず error toast + field error 表示 | Step 2 (unit) |
| AC-10 | parallel-03 (`@layer components` 同時編集) との merge conflict が発生しない | Step 7 (merge dry-run) |

---

## 9-2. 着手前提チェックリスト

| # | 確認項目 | 確認方法 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | Phase 1〜8 が全 completed | `artifacts.json` 確認 | phase-01〜08 が completed | [ ] |
| 2 | 4 primitive 新規ファイルが存在 | `ls apps/web/src/components/ui/{FormField,Pagination,Icon}.tsx apps/web/src/components/admin/Breadcrumb.tsx` | 4 ファイル存在 | [ ] |
| 3 | useAdminMutation.ts が編集済 | `grep -n "isLoading" apps/web/src/lib/useAdminMutation.ts` | guard 実装存在 | [ ] |
| 4 | globals.css に G9 セクションが存在 | `grep -n "parallel-09" apps/web/src/styles/globals.css` | section コメントが hit | [ ] |
| 5 | spec ファイル 6 件が `*.spec.tsx` 命名で存在 | `find apps/web/src -name "*.spec.tsx" -path "*FormField*" -o -name "*.spec.tsx" -path "*Pagination*" -o -name "*.spec.tsx" -path "*Icon*" -o -name "*.spec.tsx" -path "*Breadcrumb*" -o -name "*.spec.tsx" -path "*EmptyState*" -o -name "*.spec.ts" -path "*useAdminMutation*"` | 6 ファイル hit | [ ] |
| 6 | `docs/00-getting-started-manual/specs/ui-primitives.md` が新規作成済 | `ls docs/00-getting-started-manual/specs/ui-primitives.md` | 存在 | [ ] |
| 7 | feature ブランチが dev 起点 | `git log --oneline dev..HEAD` | dev 起点で commit 列が確認可 | [ ] |

> 全項目 [x] になるまで Step 1 以降に進まない。

---

## 9-3. 変更対象ファイル一覧（本 Phase で参照する範囲）

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/components/ui/FormField.tsx` | G9-1 primitive |
| `apps/web/src/components/ui/EmptyState.tsx` | G9-2 拡張 |
| `apps/web/src/components/ui/Pagination.tsx` | G9-3 primitive |
| `apps/web/src/components/ui/Icon.tsx` | G9-4 primitive |
| `apps/web/src/components/admin/Breadcrumb.tsx` | G9-5 primitive |
| `apps/web/src/lib/useAdminMutation.ts` | G9-8/9 hook |
| `apps/web/src/styles/globals.css` | G9-1/6/7 CSS |
| `apps/web/src/styles/tokens.css` | OKLch token 正本（参照のみ） |
| 各 `__tests__/*.spec.tsx` | Vitest + jest-axe テスト |

---

## 9-4. AC 突合表（Phase 9 完了時に埋める）

| AC ID | 検証 Step | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | Step 2 + Step 5 | FormField の aria-invalid/describedby unit 全 PASS + `--ubm-color-danger` が globals.css に出現 | _実測転記_ | [ ] |
| AC-2 | Step 2 + Step 4 | EmptyState 既存 caller (5 箇所) の typecheck PASS + 拡張 props 全 unit PASS | _実測転記_ | [ ] |
| AC-3 | Step 2 | Pagination unit (cursor-only / total 指定の両モード) PASS | _実測転記_ | [ ] |
| AC-4 | Step 2 + Step 6 | 4 size font-size unit PASS + visual snapshot diff 0 | _実測転記_ | [ ] |
| AC-5 | Step 2 + Step 3 | Breadcrumb 最終項目 aria-current PASS + axe violations 0 | _実測転記_ | [ ] |
| AC-6 | Step 5 | globals.css に sm/md/lg/xl 4 breakpoint media query が存在 | _実測転記_ | [ ] |
| AC-7 | Step 5 + Step 6 | `:focus-visible` + `prefers-reduced-motion` 両規則が hit + focus visual snapshot diff 0 | _実測転記_ | [ ] |
| AC-8 | Step 2 | useAdminMutation 同時呼出 reject unit PASS | _実測転記_ | [ ] |
| AC-9 | Step 2 | error 後に form state 保存 unit PASS | _実測転記_ | [ ] |
| AC-10 | Step 7 | parallel-03 ブランチとの merge dry-run で conflict 0 | _実測転記_ | [ ] |

---

## 9-5. 受入手順（実機）

### Step 1: 静的検証（typecheck + lint）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

**期待**: 全 PASS。型エラー / lint 違反 0 件。

### Step 2: Unit テスト実行（Vitest + Testing Library）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  apps/web/src/components/ui/__tests__/FormField.spec.tsx \
  apps/web/src/components/ui/__tests__/EmptyState.spec.tsx \
  apps/web/src/components/ui/__tests__/Pagination.spec.tsx \
  apps/web/src/components/ui/__tests__/Icon.spec.tsx \
  apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx \
  apps/web/src/lib/__tests__/useAdminMutation.spec.ts
```

**期待**: 6 spec すべて PASS。line coverage ≥ 90% / branch coverage ≥ 80%。

### Step 3: a11y 検証（jest-axe）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:a11y
```

**期待**: axe violations 0。FormField の `aria-invalid` + `aria-describedby` 組合違反なし、Breadcrumb の `nav[aria-label]` 存在、Icon の `aria-hidden` 適切設定が確認される。

### Step 4: 既存 caller 動作確認（後方互換）

```bash
# EmptyState 既存 caller の typecheck（5 箇所想定）
mise exec -- pnpm typecheck 2>&1 | grep -E "EmptyState" && echo "FAIL: 既存 caller に型エラー" || echo "OK: 後方互換維持"

# 既存利用箇所の grep
grep -rn "from.*ui/EmptyState" apps/web/src --include="*.tsx" --include="*.ts" | grep -v __tests__ | wc -l
# 期待: 1 以上の caller が存在し、Step 1 typecheck で全 PASS
```

### Step 5: HEX 直書き / token 正本検証

```bash
# HEX 直書き 0 件 grep gate（task-18 verify-design-tokens 相当）
grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src && echo "FAIL: HEX 直書き検出" || echo "OK: HEX 直書き 0 件"

# 利用 token がすべて tokens.css に定義済
for token in $(grep -oE '\-\-ubm-[a-z-]+' apps/web/src/styles/globals.css apps/web/src/components/ui/FormField.tsx apps/web/src/components/ui/Pagination.tsx apps/web/src/components/ui/Icon.tsx apps/web/src/components/admin/Breadcrumb.tsx 2>/dev/null | sort -u); do
  grep -q "$token" apps/web/src/styles/tokens.css || echo "MISSING: $token"
done
# 期待: MISSING 行が 0 件

# globals.css に sm/md/lg/xl 4 breakpoint が存在 (AC-6)
grep -cE "@media \(min-width: (640px|768px|1024px|1280px)\)|@media \(max-width: 639px\)" apps/web/src/styles/globals.css
# 期待: 4 以上

# focus-visible + prefers-reduced-motion 両規則が存在 (AC-7)
grep -cE ":focus-visible|prefers-reduced-motion" apps/web/src/styles/globals.css
# 期待: 2 以上
```

### Step 6: Visual snapshot 検証（Playwright）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:visual
```

**期待**: snapshot diff 0。詳細は Phase 11 で再取得・evidence 化するが、本 Step では既存 baseline に対する gate のみ確認。

> baseline が未確立の場合は Step 6 を skip し、Phase 11 で baseline 化する。skip 判定は `outputs/phase-09/visual-baseline-status.md` に記録。

### Step 7: parallel-03 conflict dry-run（AC-10）

```bash
git fetch origin
git branch -r | grep -E "parallel-03|feat/.*parallel-03"

# 仮想 merge を試す
git merge --no-commit --no-ff origin/feat/parallel-03-* 2>&1 | tee outputs/phase-09/parallel-03-merge-dryrun.log
grep -E "<<<<<<< |>>>>>>> " outputs/phase-09/parallel-03-merge-dryrun.log && echo "FAIL: conflict あり" || echo "OK: conflict 0"

# dry-run を取り消し
git merge --abort 2>/dev/null || true
```

> parallel-03 ブランチが未作成 / 同時並走未開始の場合は本 Step を skip し、`outputs/phase-09/parallel-03-conflict-skip.md` に skip 理由（「parallel-03 が未着手のため、本 PR マージ後に parallel-03 側でリベースする運用に委ねる」）を記録する。

### Step 8: API 変更ゼロ確認

```bash
git diff dev...HEAD --name-only | grep -E "^apps/api/" && echo "FAIL: api 変更" || echo "OK: api 変更なし"
git diff dev...HEAD --name-only | grep -E "wrangler\.toml$" && echo "FAIL: wrangler 変更" || echo "OK: wrangler 変更なし"
git diff dev...HEAD --name-only | grep -E "migrations/|schema\.sql$" && echo "FAIL: D1 schema 変更" || echo "OK: D1 schema 変更なし"
```

---

## 9-6. ロールバック条件（受入 FAIL 時）

| 段階 | 条件 | 退避手順 |
| --- | --- | --- |
| 1 | unit / a11y FAIL | Phase 6 (実装) に差し戻し、該当 primitive のロジックを修正。Phase 9 を再実行 |
| 2 | HEX 直書き / token 不足検出 | Phase 6 / Phase 8 に差し戻し、token 利用箇所を修正 / design-tokens.md に feedback 追記 |
| 3 | parallel-03 conflict 検出 | Phase 2 (g9-7-focus-visible-design.md) と parallel-03 設計の section 区分を再調整。本 PR の `globals.css` 編集位置を移動して再 dry-run |
| 4 | API 変更検出 | 該当 commit を `git revert` し、不変条件 4 (D1 直接アクセス禁止 / API 不変) を再確認 |

---

## 9-7. テスト方針 / 検証コマンド

| 種別 | コマンド | 目的 |
| --- | --- | --- |
| 静的 | `mise exec -- pnpm typecheck` | 型整合 |
| 静的 | `mise exec -- pnpm lint` | lint PASS |
| ユニット | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 6 spec PASS |
| a11y | `mise exec -- pnpm --filter @ubm-hyogo/web test:a11y` | violations 0 |
| visual | `mise exec -- pnpm --filter @ubm-hyogo/web test:visual` | snapshot diff 0（Phase 11 で再実施） |
| token | Step 5 の grep gate | HEX 0 + token 整合 |
| conflict | Step 7 dry-run | parallel-03 merge conflict 0 |
| evidence | `outputs/phase-09/acceptance.md` / `outputs/phase-09/parallel-03-merge-dryrun.log` | 受入結果 SSOT |

---

## 9-8. DoD

- [ ] 9-2 着手前提 7 項目全 [x]
- [ ] 9-5 Step 1〜8 全実施
- [ ] 9-4 AC 突合表が全 [x]（実測値が「期待」と一致）
- [ ] HEX 直書き 0 件・token 不足 0 件
- [ ] parallel-03 conflict dry-run で conflict 0（または skip 理由記録）
- [ ] `apps/api/` / `wrangler.toml` / D1 schema に diff なし
- [ ] `outputs/phase-09/acceptance.md` に AC 全件の実測値が記録
- [ ] `outputs/phase-09/parallel-03-merge-dryrun.log` または `parallel-03-conflict-skip.md` が存在

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 7 | Vitest / jest-axe / Playwright 3 層テスト | Step 2/3/6 で実行・PASS 判定 |
| Phase 8 | ui-primitives.md / design-tokens.md feedback | Step 4/5 で参照 |
| Phase 10 | リファクタ判定の振る舞い不変ベースライン | 本 Phase の AC 突合表 PASS 値を Phase 10 の "before" として固定 |
| Phase 11 | visual snapshot baseline 確立 | Step 6 が skip されている場合、Phase 11 で baseline 化 |
| parallel-03 | `@layer components` 同時編集 | Step 7 dry-run で衝突予知 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/index.md`「Acceptance Criteria」 | AC-1〜AC-10 定義 |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/phase-07.md` | テスト spec 一覧 |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/phase-08.md` | ドキュメント整合確認 |
| 必須 | `apps/web/src/styles/tokens.css` | OKLch token 正本 |
| 必須 | CLAUDE.md「不変条件」 | API 不変 / D1 直接アクセス禁止 / HEX 直書き禁止 |
| 参考 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md`「9. DoD」 | 元 spec の DoD 12 項目 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-09/acceptance.md` | AC 突合表 + 実測値 + ロールバック条件まとめ |
| evidence | `outputs/phase-09/parallel-03-merge-dryrun.log` | parallel-03 merge dry-run 結果（または `parallel-03-conflict-skip.md`） |
| evidence | `outputs/phase-09/visual-baseline-status.md` | Step 6 visual baseline の状態（既存/未確立） |
| メタ | `artifacts.json` | phase-09 を completed に更新 |

---

## 完了条件

- [ ] AC-1〜AC-10 が全て [x]
- [ ] Step 1〜8 が全 PASS（または Step 6/7 が文書化された skip）
- [ ] HEX 0 件 / token 整合 / API 変更 0 が grep で確認済
- [ ] `outputs/phase-09/` 配下に 3 evidence ファイルが存在

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（後付けリファクタ・最小スコープ）
- 引き継ぎ事項:
  - Step 2 unit / Step 6 visual の PASS 値を Phase 10 リファクタの「振る舞い不変」ベースラインに固定
  - parallel-03 conflict dry-run の結果（OK / skip）を Phase 13 PR 本文に転記
  - Step 5 token grep の MISSING 件数を Phase 12 system-spec-update-summary に転記
- ブロック条件: AC-1〜AC-10 のいずれかが FAIL の場合、Phase 10 に進まず該当 Phase（実装 = 6 / テスト = 7 / ドキュメント = 8）に差し戻す
