# Phase 7: AC マトリクス

| AC | 内容 | 検証 | 成果物 | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | backend-ci.yml 4 箇所が vars に置換 | T-2 grep | phase-05/main.md | ✅ PASS |
| AC-2 | web-cd.yml 2 箇所が vars に置換 | T-2 grep | phase-05/main.md | ✅ PASS |
| AC-3 | secrets.CLOUDFLARE_ACCOUNT_ID 残存ゼロ | T-1 grep | phase-05/main.md | ✅ PASS |
| AC-4 | Variable 登録 / Secret 不在 | T-4, T-5 gh api | phase-01/main.md, phase-05/main.md | ✅ PASS |
| AC-5 | yaml 構文エラーゼロ | T-3 yaml.safe_load（actionlint 不在の代替） | phase-05/main.md | ✅ PASS |
| AC-6 | backend-ci deploy-production green | T-6 main マージ後実走 | phase-11/manual-smoke-log.md | ⏳ pending（main マージ後） |
| AC-7 | web-cd deploy-production green | T-7 main マージ後実走 | phase-11/manual-smoke-log.md | ⏳ pending（main マージ後） |
| AC-8 | Phase 12 7 ファイル揃 | ファイル数確認 | phase-12/* | ✅ PASS（既存生成済み） |
| AC-9 | 不変条件 #5 不侵害 | scope レビュー | phase-02/main.md, phase-03/main.md | ✅ PASS |
| AC-10 | Account ID Secret 化しない判断根拠 | phase-01 で根拠化 | phase-01/main.md | ✅ PASS |
| AC-11 | skill 検証 4 条件 | phase-01 / phase-09 | phase-01/main.md, phase-09/main.md | ✅ PASS |
| AC-12 | UT-27 正本 sync | Phase 12 Step 2 | phase-12/system-spec-update-summary.md | ✅ PASS（既存ドラフト） |

## 集計
- 静的検証で完結: AC-1〜AC-5, AC-8〜AC-12（10/12）
- ランタイム待ち: AC-6, AC-7（main マージ後の CI 実走で確定）
