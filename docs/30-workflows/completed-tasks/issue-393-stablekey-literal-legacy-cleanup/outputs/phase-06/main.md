# Phase 6 — 異常系検証

## fixture (既存・親 03a)
`scripts/__fixtures__/stablekey-literal-lint/violation.ts` および `edge.ts` は親 03a で配置済み。

## 検証
- `node scripts/lint-stablekey-literal.mjs --strict --include scripts/__fixtures__/...` を呼んだ場合、4 件の violation が報告され exit 1 となる（既存テスト "can directly scan Phase 6 violation fixtures..." が PASS で確認）。
- `eslint-disable` / `// @ts-ignore` の suppression 試行はそもそも本 lint script が ESLint rule ではないため bypass 不能。strict 実行で必ず exit 1 となる構造を維持。
- 本タスクで application code に新規の literal を 1 件追加すれば strict 結果が 1 violation に振れることを実機確認済み（再現後 revert）。

## 結論
fixture 1 行追加で fail する gate 構造を保持。suppression による gate 通過経路は存在しない。
