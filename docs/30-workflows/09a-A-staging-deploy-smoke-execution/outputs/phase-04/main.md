# outputs phase-04: 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書 — 実行時 evidence 受け皿]

- status: spec_contract_completed
- purpose: テスト戦略（curl smoke / Playwright UI smoke / Forms sync / D1 parity の検証粒度）
- expected artifacts:
  - 検証カテゴリ × 期待ステータスコード対応表
  - Playwright staging config の存在確認結果
  - 08a-B `/members` search/filter contract との対応マトリクス
- evidence path: なし（戦略段階。実行は Phase 11）
- approval gate: なし
- 実行時記録欄:
  - Playwright staging config 不在等で戦略を変更した場合、変更点を記録する。
