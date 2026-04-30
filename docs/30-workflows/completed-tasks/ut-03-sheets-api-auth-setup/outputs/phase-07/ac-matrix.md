# Phase 7: AC マトリクス

| AC | 内容 | 検証種別 | 検証手段 | Evidence パス | 実施 Phase |
| --- | --- | --- | --- | --- | --- |
| AC-1 | SA vs OAuth 比較評価表 | docs | review | outputs/phase-02/main.md §「比較評価表」 | 2 / 10 |
| AC-2 | Web Crypto JWT フロー設計 | docs + unit | unit test `signJwt` | outputs/phase-02/main.md, packages/integrations/google/src/sheets/auth.test.ts | 2 / 5 / 9 |
| AC-3 | Secret 配置マトリクス | docs | runbook 記載 | outputs/phase-05/implementation-runbook.md ステップ 4-7 | 5 |
| AC-4 | SA メール Sheets 共有手順 | docs + smoke | manual smoke | outputs/phase-05 ステップ 3 / outputs/phase-11/manual-smoke-log.md | 5 / 11 |
| AC-5 | `packages/integrations/google/src/sheets/auth.ts` モジュール構成 | docs + 契約 | contract test | outputs/phase-02/main.md §「モジュール構成」/ packages/integrations/google/src/sheets/auth.contract.test.ts | 2 / 5 / 9 |
| AC-6 | Sheets API v4 疎通確認 | smoke | curl smoke | outputs/phase-11/manual-smoke-log.md | 11 |
| AC-7 | Node API 非依存 | static | typecheck + ESLint + build | outputs/phase-09/main.md（typecheck/build 結果） | 9 |
| AC-8 | JSON parse 失敗ハンドリング | unit | unit test `parseServiceAccountJson` | packages/integrations/google/src/sheets/auth.test.ts | 5 / 9 |
| AC-9 | 不変条件 #5（D1 不接触） | static | grep `apps/integrations` で `D1` 参照無し | outputs/phase-09/secret-hygiene.md | 9 |
| AC-10 | dev/staging/production 3 環境 secret | docs + smoke | `bash scripts/cf.sh secret list` × 3 | outputs/phase-05 ステップ 5 / outputs/phase-11/manual-smoke-log.md | 5 / 11 |

## 検証分類サマリ

| 種別 | 件数 | AC |
| --- | --- | --- |
| docs only | 2 | AC-1, AC-3 |
| docs + unit/contract | 4 | AC-2, AC-5, AC-8 |
| docs + smoke | 3 | AC-4, AC-6, AC-10 |
| static analysis | 2 | AC-7, AC-9 |

## ゲート

- [ ] 全 AC が「検証手段」と「Evidence パス」を持つ
- [ ] smoke / static / unit すべてが Phase 9 / 11 で実施される
