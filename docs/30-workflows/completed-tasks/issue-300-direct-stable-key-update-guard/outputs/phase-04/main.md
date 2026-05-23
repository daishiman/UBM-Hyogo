[実装区分: 実装仕様書]

# Phase 4 Output: テスト設計 / fixture

仕様本体: `../../phase-04.md`

## TC-01〜TC-12

phase-04.md の TC 表参照。

## fixture 配置

- `scripts/__fixtures__/stable-key-update-lint/violation-sql-update.ts`
- `scripts/__fixtures__/stable-key-update-lint/violation-drizzle-update.ts`
- `scripts/__fixtures__/stable-key-update-lint/violation-multiline-sql.ts`
- `scripts/__fixtures__/stable-key-update-lint/violation-camelcase-set.ts`
- `scripts/__fixtures__/stable-key-update-lint/allowed-read.ts`
- `scripts/__fixtures__/stable-key-update-lint/allowed-alias-update.ts`

## verify script placeholder

Phase 5 開始と同時に `scripts/lint-stable-key-update.mjs` の exit 0 placeholder を配置 → CI workflow / lefthook の wiring を並行検証。

## 状態

`completed`
