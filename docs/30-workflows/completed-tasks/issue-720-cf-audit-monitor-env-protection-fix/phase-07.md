# Phase 7: テスト計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | completed |

## 目的

本タスクの DoD を満たすための検証項目を、(a) 静的検証、(b) workflow_dispatch dry_run、(c) hourly 6 連続 success runtime evidence の 3 層で定義する。

## テスト方針

ユニットテストの対象となる application code 変更は無い（workflow yaml 1 行削除のみ）。よって本タスクは:

1. **静的検証 (yaml lint / actionlint)**
2. **動的検証 (workflow_dispatch dry_run)**
3. **runtime evidence (hourly schedule 6 連続 success)**

の 3 層で品質を担保する。

## レイヤー 1: 静的検証

### T-Test-01 actionlint

```bash
actionlint .github/workflows/cf-audit-log-monitor.yml
```

期待: exit code 0、警告ゼロ。

### T-Test-02 yaml 構文

```bash
mise exec -- pnpm exec js-yaml .github/workflows/cf-audit-log-monitor.yml > /dev/null
```

期待: parse 成功。

### T-Test-03 diff の最小性確認

```bash
git diff dev...HEAD -- .github/workflows/cf-audit-log-monitor.yml
```

期待: `-    environment: production` の 1 行削除のみ。他差分ゼロ。

### T-Test-04 secrets / vars 全数確認

```bash
# workflow yaml が参照する secrets / vars を抽出
grep -oE 'secrets\.[A-Z_]+' .github/workflows/cf-audit-log-monitor.yml | sort -u
grep -oE 'vars\.[A-Z_]+' .github/workflows/cf-audit-log-monitor.yml | sort -u

# repo-level に存在する secrets / vars と照合
gh secret list --repo daishiman/UBM-Hyogo
gh variable list --repo daishiman/UBM-Hyogo
```

期待: workflow が参照する全 secrets / vars (`GITHUB_TOKEN` 除く 5 secrets + 9 vars) が repo-level に存在する。

## レイヤー 2: 動的検証 (workflow_dispatch dry_run)

### T-Test-05 dry_run 1 件 success

```bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev
sleep 5
RUN_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID"
gh run view "$RUN_ID" --json conclusion,htmlUrl,jobs
```

期待:
- `conclusion: success`
- 全 step が success（`Compute window`, `Fetch audit logs into D1`, `Analyze and alert`, `Build hourly snapshot`, `Secret leakage grep`, `Evaluate fallback rate notification`, `Upload hourly artifact`, `Update success heartbeat`）
- `dry_run=true` のため GitHub Issue は作成されない（`Analyze and alert` step ログで確認）

### T-Test-06 secret leakage grep step が emit

`Secret leakage grep` step の出力が `outputs/observation/` の snapshot を grep して exit 0 で抜けることを確認。

### T-Test-07 artifact upload 確認

```bash
gh run view "$RUN_ID" --json artifacts
```

期待: `hourly-snapshot-<run_id>` artifact が upload 済 (`retention-days: 8`)。

## レイヤー 3: runtime evidence (hourly 6 連続 success)

### T-Test-08 cron schedule の最初 6 run

merge 完了後、`cron: '5 * * * *'` で起動する hourly run を観察。

```bash
# 6 時間以上待ち、その後:
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --event schedule --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl,event \
  --jq '.[] | select(.event == "schedule")'
```

期待: 直近 6 run（schedule trigger 限定）が全て `conclusion: success`。

### T-Test-09 連続性確認

各 run の `createdAt` がほぼ 1 時間間隔（55〜65 分）で並んでいること。skip / cancel / failure が混在していないこと。

### T-Test-10 heartbeat 更新確認

```bash
gh variable get CF_AUDIT_LAST_SUCCESS_AT --repo daishiman/UBM-Hyogo
```

期待: 6 連続 run の最後の run 完了時刻に近い epoch 秒が記録されている。

## 異常系テスト

| ケース | 期待挙動 | 確認方法 |
| --- | --- | --- |
| repo secret 未投入で run | 401/403 で fail | Step 1 投入前に dry_run しないこと自体が緩和策。投入漏れ検知は T-Test-04 で実施 |
| `environment: production` 残存で再 push | branch policy で fail | T-Test-03 で diff 確認 |
| hourly 観察中の単発 fail | 1 件でも fail があれば 6 連続 success 不成立 → 再度 6h 観察 | T-Test-08 / T-Test-09 |
| `concurrency: cancel-in-progress: false` での重複起動 | 直列化される | dry_run と schedule が同時刻に走った場合の `gh run list` で重複 cancel が発生しないことを確認 |

## テスト合否判定

すべての T-Test-01〜T-Test-10 が PASS の場合のみ Phase 11 evidence に「6 連続 success 達成」を記録できる。1 つでも FAIL の場合は Phase 6 実装手順に差し戻し、原因解析後に再実行する。

## evidence 出力先

| テスト | 出力ファイル |
| --- | --- |
| T-Test-01〜04 | `outputs/phase-07/static-verification.md` |
| T-Test-05〜07 | `outputs/phase-11/workflow-dispatch-dryrun.md` |
| T-Test-08〜10 | `outputs/phase-11/runtime-evidence/6h-success.md` |

## 実行タスク

- [ ] `outputs/phase-07/test-plan.md` を作成
- [ ] T-Test-01〜T-Test-10 のチェックリストを実装する

## 次 Phase

- 次: 8 (ドキュメント更新)
- 引き継ぎ事項: テスト結果の evidence 出力先を Phase 11 で参照
