# Phase 7 — カバレッジ

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. カバレッジ取扱い

本 spec は **設定ファイルに対する regression guard** であり、apps/web のアプリコード行を実行しない。したがって line / branch coverage の計上対象外。

## 2. 除外設定

既存 `apps/web/vitest.config.ts`（または `coverage.exclude`）に `__tests__/opennext-config-regression.spec.ts` を含める必要は **ない**（テスト自身は coverage 対象 source ではないため）。一方、被テスト対象である `wrangler.toml` / `package.json` / `.assetsignore` は元々 coverage 対象外（source ではない）であり、追加除外設定は不要。

## 3. 監視指標

| 指標 | 値 |
|------|----|
| 追加 line coverage | 0 行 |
| 追加 test 件数 | 4 件 |
| 期待 pass | 4 / 4 |

## 4. ローカル実行

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts --coverage=false
```

## 5. DoD

- coverage 対象外であることを Phase 12 documentation-changelog に明記
- `verify-coverage-exclude-ratio` workflow に新規影響なし
