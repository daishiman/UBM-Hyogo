# Phase 6 — テスト拡充

`[実装区分: 実装仕様書]`

## 1. Phase 4 で挙げたケースに加える fail-path / 回帰 guard

| TC | ケース | 期待 |
|----|--------|------|
| TC-F01 | `vitest.config.ts` 読み取り失敗 (ENOENT) | throw + 明確なメッセージ |
| TC-F02 | exclude pattern が不正 (空配列) | excluded_count=0 で fall through |
| TC-F03 | targetGlob が absolute path | 警告 or 相対化 (実装は cwd 相対のみ受付) |
| TC-F04 | --out 拡張子が `.json` | JSON ファイルのみ書く |
| TC-F05 | regression: 既存 `coverage-guard.spec.ts` が依然 GREEN | `mise exec -- pnpm vitest run scripts/coverage-guard.spec.ts` |

## 2. CI workflow の dry run 検証

| ステップ | コマンド | 期待 |
|---------|---------|------|
| syntax | `actionlint .github/workflows/verify-coverage-exclude-ratio.yml` | exit 0 |
| local script | `pnpm tsx scripts/measure-coverage-exclude-ratio.ts --out /tmp/ratio.json` | JSON 生成 |

## 3. 実行コマンド

```bash
mise exec -- pnpm vitest run scripts/__tests__
mise exec -- pnpm vitest run apps/web/app/__tests__
mise exec -- pnpm vitest run scripts/coverage-guard.spec.ts
```
