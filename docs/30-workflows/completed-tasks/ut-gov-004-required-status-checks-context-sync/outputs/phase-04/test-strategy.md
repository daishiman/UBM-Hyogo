# Phase 4: テスト戦略

> 対象: 草案 8 contexts × 3 経路（rename / exclude / 後追い）
> NON_VISUAL タスクのため「ドキュメント検証 + `gh api` dry-run + branch protection の dry-run 適用」が「テスト」に相当する。

## 1. 8 × 3 経路マトリクス

| # | 草案 | rename テスト | exclude テスト | 後追い投入テスト |
| --- | --- | --- | --- | --- |
| 1 | typecheck | rename → `ci` を `gh api` で実績確認 | n/a | n/a |
| 2 | lint | rename → `ci` を `gh api` で実績確認 | n/a | n/a |
| 3 | unit-test | n/a | exclude を staged-rollout に記載 | UT-GOV-005 後 trigger テスト |
| 4 | integration-test | n/a | 同上 | 同上 |
| 5 | build | rename → `Validate Build` 実績確認 | n/a | n/a |
| 6 | security-scan | n/a | exclude 記載 | UT-GOV-005 後 |
| 7 | docs-link-check | n/a | exclude 記載 | UT-GOV-005 後 |
| 8 | phase-spec-validate | rename → `verify-indexes-up-to-date` 実績確認 | n/a | n/a |

## 2. `gh api` 検証テンプレート

### 2-a. 直近 main の check-runs 取得

```bash
RECENT_SHA=$(gh api repos/daishiman/UBM-Hyogo/commits/main --jq '.sha')
gh api "repos/daishiman/UBM-Hyogo/commits/${RECENT_SHA}/check-runs" --paginate \
  --jq '.check_runs[] | {name: .name, conclusion: .conclusion, completed_at: .completed_at}'
```

期待出力（少なくとも以下 3 件が `success`）:

```json
{"completed_at":"2026-04-2X...","conclusion":"success","name":"ci"}
{"completed_at":"2026-04-2X...","conclusion":"success","name":"Validate Build"}
{"completed_at":"2026-04-2X...","conclusion":"success","name":"verify-indexes-up-to-date"}
```

### 2-b. 過去 30 日内 success 集計

```bash
gh api "repos/daishiman/UBM-Hyogo/actions/runs?per_page=100" \
  --jq '[.workflow_runs[] | select(.conclusion=="success") | .name] | unique'
```

期待: `["ci", "Validate Build", "verify-indexes-up-to-date", ...]` を含む。

### 2-c. branch protection 適用 dry-run（実機未適用）

```bash
# 実適用は UT-GOV-001 の責務。本タスクでは payload を生成して目視検証のみ。
cat <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci", "Validate Build", "verify-indexes-up-to-date"]
  }
}
EOF
```

検証観点: contexts 配列が `confirmed-contexts.yml` と完全一致すること。

## 3. 期待出力 / pass 基準

| テスト | pass 基準 |
| --- | --- |
| 2-a | 3 件すべて `conclusion=success` で取得できる |
| 2-b | `ci` / `Validate Build` / `verify-indexes-up-to-date` が unique 集合に含まれる |
| 2-c | payload の `contexts` 配列要素数 = 3、文字列が確定リストと一致 |
| ドキュメント整合 | Phase 2 成果物 3 ファイルすべてに同じ確定 contexts が記載 |

## 4. 失敗系（Phase 6 で詳細）

- 実在 context が `gh api` で取得できない → Phase 6 §1 に分類
- 同名 job がある → Phase 6 §2
- matrix 展開後の名前不一致 → Phase 6 §3
- workflow refactor 直後の名前変更 → Phase 6 §4

## 5. テスト実行記録

| 実行日 | コマンド | 結果 |
| --- | --- | --- |
| 2026-04-29 | 2-a (RECENT_SHA=`f4fb3baa`) | PASS — 3 件すべて success |
| 2026-04-29 | 2-b | PASS — 3 件含む（`backend-ci` / `web-cd` は failure 多発のため除外妥当） |
| 2026-04-29 | 2-c (payload 生成) | PASS — `confirmed-contexts.yml` ドラフトと完全一致 |

## 6. 引き渡し

- Phase 5 (実装ランブック): 上記コマンドの実装手順化
- Phase 6 (失敗系): §4 を分類精緻化
- Phase 9 (品質保証): テスト実行記録の最終取得
