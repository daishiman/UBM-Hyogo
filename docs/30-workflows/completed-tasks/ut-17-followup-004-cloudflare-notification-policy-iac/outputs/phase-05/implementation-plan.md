# Phase 5 成果物: 実装計画

Phase 5 spec: `../../phase-05.md`

## 実装順序 (TDD)

1. fixtures (`tests/fixtures/cloudflare-alerts/`) — quota-base, api-list-policies, api-list-webhooks, api-drift-policies
2. JSON Schema (`schema/{policy,webhook,quota-base}.schema.json`)
3. IaC JSON (`quota-base.json`, `policies/*.json`, `webhooks/ut-17-relay.json`)
4. types.ts → resolve.ts / quota-base.ts / canonicalize.ts → diff.ts → load.ts → api-client.ts → cli.ts
5. vitest: canonicalize / diff / resolve / quota-base / load (red → green)
6. `scripts/cf.sh` alerts 分岐追加
7. scripts/__tests__/cf-alerts-cli.test.ts (S1〜S13 相当)
8. vitest.config.ts include 拡張、package.json scripts 追加
9. `.github/workflows/cloudflare-alerts-drift.yml`、README、`.env.example`
10. runbook 差し替え、親 UT-17 implementation-guide リンク追記
11. 品質ゲート: typecheck / lint / vitest / secret scan
12. artifacts.json + phase-NN.md status footer 更新

## 変更ファイル一覧

実ファイルは `git status` で確認可能。コミットは別 phase で実施 (本タスクは「コミット禁止」指示)。
