# AC マトリクス

| AC | テスト | 不変条件 | evidence |
| --- | --- | --- | --- |
| AC-1 | wrangler.toml 静的検証 | secrets 管理 / #5 | wrangler-toml-diff.md |
| AC-2 | 静的検証（.dev.vars.example 存在 / op 参照のみ） | secrets 管理 | apps/web/.dev.vars.example |
| AC-3 | T1 / T2 / T3 / T4 / T6 | — | env.test.ts PASS |
| AC-4 | T5 + T1（Node fallback） | — | env.test.ts PASS |
| AC-5 | G1 grep | secrets 管理 | grep-fallback-zero.txt（0 件） |
| AC-6 | G2 grep | — | grep-fallback-zero.txt（0 件） |
| AC-7 | T1〜T6（6 ケース） | — | env-test-output.txt（6 PASS） |
| AC-8 | typecheck / lint / build / test | — | build-output.txt |
| AC-9 | G3 grep | secrets 管理 | grep-fallback-zero.txt（0 件） |
| AC-10 | wrangler.toml レビュー（D1 binding 不在） | #5 | wrangler.toml inspection |
| AC-11 | next.config.ts 不変確認 | — | changed-files.md |
