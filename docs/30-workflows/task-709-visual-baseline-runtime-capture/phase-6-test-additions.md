[実装区分: 実装仕様書]

# Phase 6: テスト拡充

## 目的

baseline 取得時に明らかになる flaky 動的要素を `mask` または `waitFor` で安定化する余地を整理する。

## 1. 既存 mask 設定（`full-visual.spec.ts:30`）

```ts
mask: [page.locator('[data-visual-mask]'), page.locator('time')],
```

`time` element と `data-visual-mask` 属性付き element は既にマスク済み。

## 2. 追加テスト方針（必要時のみ）

baseline 取得後の 2 連続 run で diff が出た route があれば、以下フローで対処:

| 症状 | 追加対応 | 変更箇所 |
|------|---------|---------|
| アニメ残骸 | `addStyleTag` 設定強化 | `full-visual.spec.ts:19-22`（既存設定で十分なはず） |
| 動的 ID / nonce | 該当 component に `data-visual-mask` 属性追加 | `apps/web/src/components/**` の該当 element |
| skeleton / loading 残り | `route.waitFor` selector を `visual-routes.ts` の対応 entry に追加 | `visual-routes.ts` |
| timestamp が time 要素外 | `mask` array に locator 追加 | `full-visual.spec.ts:30` |

## 3. テストコード追加判定

**現時点では追加不要**。Phase 5 Step 5 の 2 連続 PASS を満たせばこの Phase は no-op で完了する。

満たせなかった場合のみ、上記表に従い最小差分で `mask` / `waitFor` を追加する。追加した場合は本ファイルに記録する。

## 4. 検証コマンド

```bash
# Phase 5 Step 5 の 2 連続 PASS 結果
gh run list --workflow=playwright-visual-full.yml --branch=task/709-visual-baseline-runtime-capture --limit=2 --json conclusion,headSha
```

## 5. DoD

- 2 連続 PASS の evidence
- mask / waitFor 追加が発生した場合はその差分が記録されている

## 6. 成果物

- 本ファイル `phase-6-test-additions.md`
