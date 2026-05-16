# Phase 7: テスト計画

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 6 で実装する 4 primitive + 1 hook + 1 CSS layer の品質保証として、**実テストコード（Vitest + jest-axe + Playwright visual）を実装する**ためのテスト計画 Phase。テストコードそのものを作成対象とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新計画) |
| 状態 | pending |

---

## 目的

G9-1〜G9-9 で実装する primitive / hook / CSS の品質を、以下 3 層で保証する:

1. **Vitest + Testing Library**: 関数・型・DOM 構造の正しさ
2. **jest-axe**: WCAG 2.1 AA 相当の a11y 違反 0
3. **Playwright visual**: visual regression（snapshot diff）

各層のテスト対象・spec ファイル名（`*.spec.{ts,tsx}` 厳守）・カバレッジ目標を本 Phase で固定する。

---

## 7-1. テストレイヤ概要

| レイヤ | ツール | 対象 | spec ファイル | カバレッジ目標 |
| --- | --- | --- | --- | --- |
| Unit (DOM) | Vitest + @testing-library/react | 4 primitive + 1 hook | 6 spec | line ≥ 90% / branch ≥ 80% |
| a11y | jest-axe | 4 primitive (FormField / Pagination / Icon / Breadcrumb) + EmptyState | 5 spec に統合 | violations 0 |
| Visual | Playwright | primitive 4 種の visual snapshot | 1 spec 拡張 | snapshot diff 0 |
| Regression smoke | 既存 task-18 verify-design-tokens | HEX 直書き 0 件 | CI gate | gate green |

---

## 7-2. Unit テスト計画

### 7-2-1. FormField (`apps/web/src/components/ui/__tests__/FormField.spec.tsx`)

| ケース | 入力 | 期待 |
| --- | --- | --- |
| normal | name / label / children | label の `htmlFor` が name と一致、children に `id={name}` が注入される |
| with error | error="必須" | `aria-invalid="true"` / `aria-describedby="{name}-error"` / `<span role="alert">` 表示 |
| without error | error 未指定 | `aria-invalid="false"` または属性なし、helper text 非表示 |
| children single child only | children に複数要素 | 型エラー（spec では tsd 確認、または try-catch） |
| a11y | error あり / なし両方 | jest-axe violations 0 |

### 7-2-2. EmptyState (`apps/web/src/components/ui/__tests__/EmptyState.spec.tsx`)

| ケース | 入力 | 期待 |
| --- | --- | --- |
| 後方互換 (children only) | `<EmptyState>テキスト</EmptyState>` | テキストが render される、warn / error なし |
| 拡張 props 全指定 | icon / title / description / action | 全要素が render |
| icon は decorative | icon あり | `<span aria-hidden="true">` で wrap |
| className 透過 | className="custom" | className が DOM に伝播 |
| a11y | 全パターン | jest-axe violations 0 |

### 7-2-3. Pagination (`apps/web/src/components/ui/__tests__/Pagination.spec.tsx`)

| ケース | 入力 | 期待 |
| --- | --- | --- |
| total 提供時 | total=100, current=2, pageSize=20 | "21-40 of 100" 表示 |
| total 未提供 (cursor-only) | total 未指定 | meta `<span>` 非表示、prev/next button のみ |
| hasPrev=false | hasPrev=false | Previous button disabled |
| hasNext=false | hasNext=false | Next button disabled |
| onNext 呼び出し | Next click | onNext callback が 1 回呼ばれる |
| nav aria-label | - | `<nav aria-label="pagination">` が存在 |
| a11y | 全パターン | jest-axe violations 0 |

### 7-2-4. Icon (`apps/web/src/components/ui/__tests__/Icon.spec.tsx`)

| ケース | 入力 | 期待 |
| --- | --- | --- |
| 4 size マッピング | size=sm/md/lg/xl | font-size が 12/16/20/24px |
| decorative (ariaLabel なし) | ariaLabel 未指定 | `aria-hidden="true"` |
| meaningful (ariaLabel あり) | ariaLabel="閉じる" | `role="img"` + `aria-label="閉じる"`、`aria-hidden` なし |
| a11y | decorative / meaningful 両方 | violations 0 |

### 7-2-5. Breadcrumb (`apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx`)

| ケース | 入力 | 期待 |
| --- | --- | --- |
| items 3 件 | [{label,href},{label,href},{label}] | li が 3 件、最初の 2 件は `<a>`、最後は `<span aria-current="page">` |
| separator | items 2 件以上 | 間に `<span aria-hidden="true">/</span>` |
| nav aria-label | - | `<nav aria-label="breadcrumb">` |
| href なし中間項目 | items[1].href 未指定 | `<span>` で render（`aria-current` 無し） |
| a11y | 全パターン | violations 0 |

### 7-2-6. useAdminMutation (`apps/web/src/lib/__tests__/useAdminMutation.spec.ts`)

| ケース | シナリオ | 期待 |
| --- | --- | --- |
| 通常成功 | mutationFn resolve | onSuccess invoke、`isLoading` が true→false |
| エラー | mutationFn reject | onError invoke、form state へ触らない（hook 側で reset しない） |
| 2nd call 拒否 | isLoading=true 中に再 mutate | 2nd call は `Promise<undefined>` を return + toast "既に保存中です" |
| シグネチャ後方互換 | 既存 caller pattern | 既存 import が型エラーなし |
| onSuccess / onError 未指定 | callback 省略 | エラー throw なし |

> useAdminMutation のテストは `renderHook` (@testing-library/react) を使用。toast はモック化する。

---

## 7-3. a11y テスト統合方針

- `jest-axe` を 5 spec (FormField / EmptyState / Pagination / Icon / Breadcrumb) に統合
- 各 spec の最終 `it()` ブロックで `axe(container)` を実行
- `expect.extend(toHaveNoViolations)` をテスト先頭で 1 回呼び出す共通 setup を `apps/web/src/test/setup-axe.ts` に集約（既存 setup があれば追記）
- a11y rule の disabled は禁止（必要時は spec コメントで根拠を明記）

---

## 7-4. Visual regression テスト計画

### 7-4-1. 対象 snapshot

| primitive | screen / state | viewport |
| --- | --- | --- |
| FormField | error あり / なし | mobile 375 / desktop 1280 |
| Pagination | normal / both disabled | desktop 1280 |
| Breadcrumb | 3 階層 | desktop 1280 |
| Icon | sm/md/lg/xl 並列表示 | desktop 1280 |

### 7-4-2. 実装方針

- 既存 `apps/web/e2e/visual.spec.ts`（または同等の Playwright entry）に block 追加
- snapshot baseline は `apps/web/e2e/__snapshots__/` 配下
- 対象 route に primitive を配置できる場所がない場合、既存 `/admin` 配下の実利用箇所を撮影対象とし、harness route を新設しない（MVP recovery スコープ堅持）

### 7-4-3. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:visual
# 初回実行で baseline 生成、以後 diff 0 を期待
```

---

## 7-5. Regression scope（既存テスト影響）

| 影響先 | 確認方法 | 対応 |
| --- | --- | --- |
| EmptyState 既存 caller | `grep -rn "EmptyState" apps/web/src` で件数把握 | 既存 spec が PASS することを確認 |
| useAdminMutation 既存 caller | `grep -rn "useAdminMutation" apps/web/src` | 既存 spec が PASS することを確認 |
| globals.css 既存 selector | `grep -n "@layer components" apps/web/src/styles/globals.css` | 視覚 diff が意図せず広がっていないか visual で確認 |
| parallel-03 spec | parallel-03 の spec 群 PASS | 共同編集 conflict があれば本 Phase で先に解消 |

---

## 7-6. テスト命名規約（CLAUDE.md 不変条件 8）

- 全 spec ファイルは `*.spec.{ts,tsx}` 命名
- `*.test.{ts,tsx}` は禁止（lefthook `block-test-suffix` / GitHub Actions `verify-test-suffix` で reject）
- 配置: 対象モジュールと同階層の `__tests__/` 配下

確認:

```bash
find apps/web/src -name "*.test.ts" -o -name "*.test.tsx"
# 期待: 0 件
```

---

## 7-7. ローカル実行コマンド一覧

```bash
# 型 + lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# Unit + a11y（Vitest + jest-axe）
mise exec -- pnpm --filter @ubm-hyogo/web test

# 個別 spec 実行
mise exec -- pnpm --filter @ubm-hyogo/web test FormField
mise exec -- pnpm --filter @ubm-hyogo/web test useAdminMutation

# Visual regression (Playwright)
mise exec -- pnpm --filter @ubm-hyogo/web test:visual

# coverage
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage

# HEX 直書きチェック (task-18 verify-design-tokens 相当)
grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src && echo "NG" || echo "OK"
```

---

## 7-8. CI gate との整合

| CI gate | 期待 |
| --- | --- |
| `verify-test-suffix` | `*.test.*` 0 件で PASS |
| `verify-design-tokens` | HEX 直書き 0 件で PASS |
| `verify-indexes-up-to-date` | 本タスクで indexes に影響なし（PASS 維持） |
| `playwright-smoke / smoke (chromium)` | 既存 smoke + 本 Phase で追加した primitive snapshot で PASS |
| `playwright-smoke / visual (chromium, 4 screens)` | snapshot diff 0 で PASS |

---

## 7-9. 不変条件チェック

- [ ] 全 spec が `*.spec.{ts,tsx}` 命名
- [ ] jest-axe violations 0
- [ ] Vitest line coverage ≥ 90% / branch ≥ 80%
- [ ] Playwright snapshot diff 0
- [ ] 既存 EmptyState / useAdminMutation caller の regression なし
- [ ] HEX 直書き 0 件

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/test-plan.md | テスト件数 / カバレッジ報告 |
| ドキュメント | outputs/phase-07/test-results.md | ローカル実行ログ要約 |
| メタ | artifacts.json | phase-07 を completed に更新 |

---

## 完了条件

- [ ] 6 unit spec が PASS
- [ ] 5 primitive で jest-axe violations 0
- [ ] Playwright visual snapshot baseline が登録され diff 0
- [ ] 既存 spec の regression 0
- [ ] CI gate (verify-test-suffix / verify-design-tokens) green

---

## 次 Phase 引き継ぎ事項

- 次: Phase 8（ドキュメント更新計画）
- 引き継ぎ事項:
  - 7-2 の各 spec ケース表を Phase 8 のドキュメント例として転記
  - 7-4 の visual snapshot 件数を Phase 8 の primitive リファレンスに記載
  - jest-axe 導入手順を Phase 8 の開発ガイドに追記
- ブロック条件: いずれかのテストレイヤが fail、または coverage が下回る場合
