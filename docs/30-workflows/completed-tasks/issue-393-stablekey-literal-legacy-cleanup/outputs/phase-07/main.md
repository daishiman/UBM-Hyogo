# Phase 7 — 統合検証 / AC trace

## 実測結果

| 検査 | コマンド | 結果 |
|---|---|---|
| strict lint (after) | `node scripts/lint-stablekey-literal.mjs --strict` | OK (mode=error, scanned=272 files, **stableKeys=31**, **violations=0**) |
| stableKey 二重定義 | 静的検査スクリプト内蔵 | `expected 31 stableKeys` を field.ts ロード時に assert（loadStableKeys 内）。31 件で PASS |
| typecheck | `mise exec -- pnpm typecheck` | 5 packages 全て Done |
| lint | `mise exec -- pnpm lint` | dependency-cruiser OK / stablekey-literal-lint warning OK / tsc lint Done |
| focused vitest | 影響 family 5 ディレクトリ + consent | 25 file / **158 tests PASS** |

## AC trace

| AC | 結果 | evidence |
|---|---|---|
| AC-1: violation=0 | ✅ | `outputs/phase-07/lint-strict-after.json` に `"violations": []` を確認 |
| AC-2: stableKeyCount=31 | ✅ | 上記 strict 出力 / loadStableKeys assertion |
| AC-3: focused test PASS | ✅ | 158/158 PASS |
| AC-4: typecheck PASS | ✅ | 5 packages Done |
| AC-5: lint + strict PASS | ✅ | 上記 |
| AC-6: suppression 0 件追加 | ✅ | `git diff` 上で `eslint-disable` / `@ts-ignore` 追加なし |
| AC-7: 親 03a 昇格可能 state | ✅ | strict 0 violation を達成。後続 PR で `.github/workflows/*.yml` に `node scripts/lint-stablekey-literal.mjs --strict` を required check として配置可能 |

## 残課題
- 親 03a workflow `outputs/phase-12/implementation-guide.md` の AC-7 enforce 仕様を「strict 昇格 ready」状態として更新する PR 作成（後続タスク・本 PR スコープ外）。
