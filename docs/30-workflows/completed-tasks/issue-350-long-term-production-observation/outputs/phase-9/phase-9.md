# Phase 9 — 統合検証

**[実装区分: 実装仕様書]** / **NON_VISUAL**

## 1. 統合検証スコープ

local 完結 + GitHub Actions 上の dry-run 経路の 2 段。

## 2. local 統合シーケンス

```sh
# 1. 静的解析
actionlint .github/workflows/post-release-observation-reminder.yml
shellcheck scripts/observation/*.sh scripts/observation/test/*.sh

# 2. 単体・分岐
bash scripts/observation/test/test-create-reminder-issue.sh

# 3. dry-run 実行（実 GitHub には書かない）
RELEASE_DATE=2026-05-01 OFFSET=7 TARGET_DATE=2026-05-08 \
  bash scripts/observation/create-reminder-issue.sh --dry-run | tee /tmp/d7-render.md

# 4. dry-run の差分検査
diff -u <(cat scripts/observation/test/fixtures/expected-body-d7.md 2>/dev/null) /tmp/d7-render.md \
  || echo "(fixture 未配置時はスキップ可)"

# 5. ドキュメント整合
rg -n "D\+7|D\+30" docs/runbooks/post-release-long-term-observation.md
rg -n "consumed by issue-350" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md
mise exec -- pnpm indexes:rebuild

# 6. 型 / lint（既存リポ品質ゲート）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 3. GitHub Actions 上の dry-run

> **runtime evidence は user 認証ゲートが必要なため Phase 11 で `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 扱い**。本 Phase ではあくまで **手順だけを確定**する。

```sh
# PR merge 後 main 上で:
gh workflow run post-release-observation-reminder.yml \
  -f release_date=2026-05-01 \
  -f offset_days=7

# 実行確認
gh run list --workflow=post-release-observation-reminder.yml --limit 1
gh run view <run-id> --log
```

期待:
- workflow run が成功する
- 同タイトル open Issue がない場合 1 件作成される
- 既に存在すれば「Reminder already exists ... skip」がログに出る

## 4. 検証マトリクス

| 検証 ID | コマンド / 操作 | 期待 |
| --- | --- | --- |
| INT-01 | `actionlint` | exit 0 |
| INT-02 | `shellcheck` | exit 0 |
| INT-03 | `test-create-reminder-issue.sh` | exit 0 / `PASS=13 FAIL=0` |
| INT-04 | `--dry-run` 出力 | placeholder 全置換 |
| INT-05 | runbook 整合 | `rg` ヒット |
| INT-06 | 09c trace | `rg` ヒット |
| INT-07 | indexes rebuild | exit 0 / drift なし |
| INT-08 | `pnpm typecheck` / `pnpm lint` | exit 0 |
| INT-09（runtime） | `gh workflow run` | run conclusion=success（user 実行） |

## 5. 完了条件

- [ ] INT-01〜INT-08 が全て PASS（local 実行）
- [ ] INT-09 は手順記述のみで PASS 確認は Phase 11 へ持ち越し（NON_VISUAL irreversible でない・user 認証必須）
