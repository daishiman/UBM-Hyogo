# Phase 10 — 最終レビュー

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. DoD チェックリスト

- [x] `apps/web/__tests__/opennext-config-regression.spec.ts` を新規追加
- [x] 4 it / 1 describe / AC と 1:1 対応
- [x] `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts` が 4 pass
- [x] `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web lint` / `pnpm lint` pass
- [x] CI workflow に focused guard step を追加
- [x] drift 観点は Phase 11 で構造 assertion として記録
- [x] aiworkflow-requirements skill の同 wave sync が Phase 12 で完了
- [ ] `verify-gate-metadata` / `verify-phase12-compliance` PASS
- [ ] PR は user-gated（Gate-C pending）

## 2. レビュー観点

| 観点 | 確認 |
|------|------|
| spec 内容 | AC ↔ it 対応 / assert msg / 重複 read なし |
| CI 組み込み | job 名表示・実行時間が許容範囲 |
| ドキュメント | Phase 12 strict 7 + Phase 11 evidence + artifacts.json schema |
| dependencies | 追加依存なし。test-local parser で限定 TOML 構造を検証 |

## 3. 残課題

なし（先送りなし）。
