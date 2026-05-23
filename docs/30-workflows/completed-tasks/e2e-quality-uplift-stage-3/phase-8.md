# Phase 8: 動的検証

## 動的検証シナリオ

### S-1: apply.sh dry-run（実 PUT 前）

```bash
# 引数バリデーション
bash .github/branch-protection/apply.sh invalid 2>&1 | grep -q "usage"
echo "exit=$?"  # 0 = OK
```

### S-2: apply.sh 実行（**ユーザー承認後**）

```bash
bash .github/branch-protection/apply.sh all
```

期待: GitHub API への PUT が 200 OK で返り、stderr に error 無し。

### S-3: drift 検査

```bash
bash scripts/verify-branch-protection.sh
```

期待出力:
```
OK(dev): no drift
OK(main): no drift
```

### S-4: lighthouse workflow 起動

```bash
gh workflow run lighthouse.yml --ref docs/issue-608-e2e-quality-uplift-stage-3
sleep 5
RUN_ID=$(gh run list --workflow=lighthouse.yml --limit=1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID"
```

期待: `Wait for server (wait-on)` step が 0 < t < 120s で完了、後続 LHCI step が completion まで進む。

> NOTE: `lighthouse.yml` は `workflow_dispatch` を持つため、user-gated runtime evidence は手動 workflow run または dev 向け実 PR のどちらでも取得できる。

### S-5: 新規 PR ブロッキング確認

```bash
# 適当な dummy PR（README タイポ修正等）を作成
gh pr create --base dev --head docs/issue-608-e2e-quality-uplift-stage-3 \
  --title "[stage-3] CI gate hard-lock spec + branch protection apply" \
  --body "see docs/30-workflows/e2e-quality-uplift-stage-3/"

# PR 番号取得
PR=$(gh pr list --head docs/issue-608-e2e-quality-uplift-stage-3 --json number -q '.[0].number')

# 必須 check 一覧確認
gh pr checks "$PR"
```

期待: `e2e-tests-coverage-gate` / `lighthouse-ci` が Required としてリスト表示される。

### S-6: rollback リハーサル（任意）

```bash
# pre snapshot から contexts のみ抽出して旧状態に戻す手順を文書化
# 実行は不要（手順だけ phase-11 evidence に残す）
```

## 失敗時の対処

| 症状 | 対処 |
|------|------|
| S-2 で 422 Unprocessable | contexts 名と `gh run list --workflow=...` の実 job 名を突き合わせ修正 |
| S-3 で DRIFT | apply 失敗。S-2 を再実行、もしくは GitHub UI で手動変更が混入していないか確認 |
| S-4 で wait-on タイムアウト | `/tmp/web-server.log` を artifact として保存し原因確認、Next.js build 失敗 / port 競合を疑う |
| S-5 で context が表示されない | workflow が PR に対して起動していない（branch 名 / paths filter / pull_request イベント未登録）を疑う |

## evidence 保存

すべての検証出力を `outputs/phase-11/runtime-evidence/` 配下に保存（コマンド出力 + 実行日時）。
