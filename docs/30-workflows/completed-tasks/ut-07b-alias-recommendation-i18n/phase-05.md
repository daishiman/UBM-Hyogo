# Phase 5: 実装（TDD GREEN）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 名称 | 実装 |
| TDD ステージ | GREEN |
| implementation_mode | new |
| 変更対象 | `apps/api/src/services/aliasRecommendation.ts`（編集のみ） |

## 目的

Phase 4 の RED を解消するため、`apps/api/src/services/aliasRecommendation.ts` に `normalizeLabelForCompare` を追加し、`recommendAliases` 内の `levenshtein` 呼び出しを差し替えて GREEN にする。

## 実行タスク

1. `levenshtein` 直後に `normalizeLabelForCompare` を export する
2. `recommendAliases` 内 `levenshtein(diff.label, e.label)` を `levenshtein(normalize(...), normalize(...))` に置換する
3. section / position 加算スコア（+10 / +5）は変更しない
4. test 実行で全 20 ケース PASS（GREEN）を確認する
5. typecheck / lint PASS を確認する
6. `git diff --stat` で変更が `aliasRecommendation.ts` 1 件のみ（spec は Phase 4 で更新済み）であることを確認する

## 実装内容

```ts
export function normalizeLabelForCompare(s: string): string {
  return s.normalize("NFKC").trim().replace(/\s+/g, " ");
}
```

```diff
   score:
-    -levenshtein(diff.label, e.label) +
+    -levenshtein(
+      normalizeLabelForCompare(diff.label),
+      normalizeLabelForCompare(e.label),
+    ) +
     (diff.sectionKey !== null && e.sectionKey === diff.sectionKey ? 10 : 0) +
     (diff.position !== null && e.position === diff.position ? 5 : 0),
```

## 入出力・副作用

- 入力: `RecommendDiffInput` / `RecommendExistingInput[]`（不変）
- 出力: `string[]`（stableKey 配列・不変）
- 副作用: なし
- DB / 外部 API: なし

## エラーハンドリング

- `null` / `undefined` は型で阻止
- 空文字 `""` は `""` を返す
- 例外は throw しない

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 参照資料

- `outputs/phase-02/main.md`（設計）
- `outputs/phase-04/red-test-result.md`（RED ログ）
- `apps/api/src/services/aliasRecommendation.ts:1-74`

## 統合テスト連携

- GREEN 確認は Phase 6（テスト拡充）の前提
- response shape 不変のため `/admin/schema/diff` の統合 test 追加は不要

## 成果物

`outputs/phase-05/green-test-result.md` に以下を記録:
- helper export 確認
- 全 20 ケース PASS のログ抜粋
- typecheck / lint PASS
- `git diff --stat` 結果

## 完了条件

- [ ] `normalizeLabelForCompare` が export されている
- [ ] `recommendAliases` の levenshtein が normalized label に切り替わっている
- [ ] vitest 全 PASS
- [ ] typecheck / lint PASS
- [ ] response shape の変更なし（`git diff -- apps/api/src/routes/admin/schema*` が空）
- [ ] `outputs/phase-05/green-test-result.md` が存在する
