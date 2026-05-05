# Phase 4: テスト戦略

本タスクはコード上の単体テスト追加対象を持たない CI yaml fix。検証は静的検査と CI 実走で行う。

## 検証マトリクス

| ID | 検証 | コマンド | 期待結果 | 紐付く AC |
| --- | --- | --- | --- | --- |
| T-1 | secrets 参照の残存ゼロ | `grep -rn 'secrets\.CLOUDFLARE_ACCOUNT_ID' .github/` | exit=1（0 件） | AC-3 |
| T-2 | vars 参照の網羅 | `grep -rn 'vars\.CLOUDFLARE_ACCOUNT_ID' .github/workflows/` | 6 件 | AC-1, AC-2 |
| T-3 | yaml 構文 | `actionlint .github/workflows/*.yml` または `python3 -c "import yaml; ..."` | エラーなし | AC-5 |
| T-4 | Variable 登録 | `gh api repos/daishiman/UBM-Hyogo/actions/variables` | `CLOUDFLARE_ACCOUNT_ID` が存在 | AC-4 |
| T-5 | Secret 不在 | `gh api repos/daishiman/UBM-Hyogo/actions/secrets` | `CLOUDFLARE_ACCOUNT_ID` が存在しない | AC-4 |
| T-6 | backend-ci 実走 | main マージ後 `gh run watch` | deploy-production green | AC-6 |
| T-7 | web-cd 実走 | 同上 | deploy-production green | AC-7 |

## テスト方針
- 単体テストは追加なし（対象がコードでなく yaml 設定のため）
- Phase 11（NON_VISUAL smoke）で T-1〜T-5 のローカル検査ログを記録
- T-6 / T-7 は main マージ後に実走確認し、phase-11 の `manual-smoke-log.md` に追記
