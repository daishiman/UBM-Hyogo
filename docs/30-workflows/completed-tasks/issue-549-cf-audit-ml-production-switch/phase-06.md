# Phase 6: 実装手順（ステップバイステップ / 1 PR 完結）

## 目的

Phase 5 で確定した変更対象を 1 PR で実装するための順序付き手順を確定する。各ステップに「実行コマンド / 期待出力 / NG 時の対処」を併記し、Phase 7（テスト計画）で検証可能な形に揃える。

## 完了条件

- [ ] PR 1 本で全変更が完結する手順が確定している
- [ ] 各ステップに「実行コマンド / 期待出力 / NG 時の対処」が併記されている
- [ ] dry-run（staging）→ production env 切替の順序が固定されている
- [ ] hourly run 直後の 4 観測軸チェック手順が含まれている
- [ ] rollback 必要時の即時手順（env 1 行戻し PR）が含まれている

## 前 Phase 依存

- Phase 4: Gate 通過 / 環境準備 / production D1 列確認
- Phase 5: 変更対象ファイルと関数シグネチャ / I/O 契約

## ステップ 1: ブランチ作成（dev 起点）

CLAUDE.md の既定ブランチポリシーに従い `dev` 起点でブランチを切る。

```bash
git fetch origin dev
bash scripts/new-worktree.sh feat/issue-549-cf-audit-ml-production-switch
cd .worktrees/<生成された worktree dir>
mise exec -- pnpm install
```

期待出力: ワークツリーが作成され、`pnpm install` が exit 0。
NG 時: `mise install` を再走し Node 24.15.0 / pnpm 10.33.2 を再固定。

## ステップ 2: workflow yml 編集（env diff）

`.github/workflows/cf-audit-log-monitor.yml` の production env block を編集する。

```diff
 jobs:
   monitor:
+    environment: production
     env:
-      CF_AUDIT_CLASSIFIER: threshold
+      CF_AUDIT_CLASSIFIER: ml
+      ML_MODEL_PATH: ${{ vars.ML_MODEL_PATH }}
```

post-step を 3 種挿入（hourly run の最終 step の後）:

```yaml
      - name: Secret leakage grep
        run: |
          mise exec -- pnpm tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts \
            outputs/issues/*.md --exit-on-detect

      - name: Post-switch hourly snapshot
        run: |
          mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
            --hour="$(date -u +%Y-%m-%dT%H:00:00Z)" \
            --out="outputs/observation/$(date -u +%Y-%m-%dT%H).json"

      - name: Fallback rate alert
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          mise exec -- pnpm tsx scripts/cf-audit-log/observation/fallback-rate-alert.ts \
            --window=3 --threshold=0.05

      - name: Upload hourly snapshot
        uses: actions/upload-artifact@v4
        with:
          name: cf-audit-observation-${{ github.run_id }}
          path: outputs/observation/*.json
```

期待出力: yml lint pass。`actionlint` がローカルにあれば `actionlint .github/workflows/cf-audit-log-monitor.yml` で確認。
NG 時: indent / env scope を見直し、`environment: production` が job 直下にあるか確認。

## ステップ 3: 新規 ts ファイル実装

Phase 5 のシグネチャ通り `post-switch-monitor.ts` / `fallback-rate-alert.ts` を新規作成。`secret-leakage-grep.ts` には `--exit-on-detect` を追加。

```bash
# 静的検査
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待出力: 両者 exit 0。
NG 時: 型不整合を最小差分で修正（unused import / null許容 / 戻り値型）。

## ステップ 4: focused unit test 追加 / 実行

Phase 5 で定義した 2 テストファイルを実装する（Phase 7 で詳細記載）。

```bash
mise exec -- pnpm --filter @repo/scripts test \
  scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts \
  scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts
```

期待出力: 全 case pass。
NG 時: fixture の hourly snapshot JSON を再生成し、閾値判定の境界値を見直す。

## ステップ 5: dry-run 検証（staging で workflow_dispatch）

production に流す前に必ず staging で dry-run する。

```bash
# staging branch / staging environment で workflow_dispatch
gh workflow run cf-audit-log-monitor.yml \
  --ref dev \
  -f dry_run=true \
  -f environment=staging
gh run list --workflow cf-audit-log-monitor.yml --limit 1
gh run view <run-id> --log
```

期待結果:

- staging hourly run が 1 回実行され、Issue 起票なし（`--dry-run` 経路）
- `outputs/observation/*.json` artifact がアップロードされる
- leakage grep が exit 0（dirty なし）
- fallback-rate-alert が trigger=false

NG 時: 該当 step のログを `gh run view --log-failed` で取得し、Phase 5 の関数シグネチャ / 期待 I/O との乖離を確認。

## ステップ 6: PR 作成（main へ向けず dev へ向ける）

CLAUDE.md の `feature/* → dev → main` に従い base は `dev`。この節は **Gate-A〜C 通過後の実装サイクル用 handoff** であり、本 spec_created サイクルの PR には production env diff を含めない。

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(cf-audit): switch CF_AUDIT_CLASSIFIER to ml in production env (Refs #549)

- workflow env: CF_AUDIT_CLASSIFIER threshold→ml, ML_MODEL_PATH from secrets
- new: scripts/cf-audit-log/observation/{post-switch-monitor,fallback-rate-alert}.ts
- ext: secret-leakage-grep.ts --exit-on-detect flag
- runbook: forward-safe rollback (env 1 line) + 7-day observation checklist

Refs #549
EOF
)"
git push -u origin feat/issue-549-cf-audit-ml-production-switch
gh pr create --base dev --title "feat(cf-audit): production switch to ML classifier (Refs #549)" \
  --body-file docs/30-workflows/issue-549-cf-audit-ml-production-switch/outputs/phase-13/pr-body.md
```

PR 本文に必須記載:

- `Refs #549`（`Closes` を使わない）
- Gate-A〜C 通過状況の link
- rollback PR テンプレへの link
- 7 日 observation checklist へのリンク

## ステップ 7: production switch 直後の最初の hourly run 監視

`dev` → `main` への昇格は rollback approval/governance evidence + Gate 通過を確認した後。merge 後の最初の hourly run を観測する。

```bash
# 最新 hourly run の結果取得
gh run list --workflow cf-audit-log-monitor.yml --limit 1 --json databaseId,conclusion,createdAt
# artifact ダウンロード
gh run download <run-id> --name cf-audit-observation-<run-id>
# JSON snapshot 確認
jq '.classifierUsed, .fallbackRate, .leakageGrepResult' outputs/observation/*.json
```

期待出力:

- `classifierUsed == "ml"`
- `fallbackRate <= 0.05`
- `leakageGrepResult == "clean"`

NG 時: 即座にステップ 8（rollback）へ移行。

## ステップ 8: rollback 即時手順（必要時のみ）

`fallbackRate > 0.05` が 3 hour 連続 / leakage 検出 / Issue 起票数が baseline+3σ 超 のいずれかで発火。

```bash
# rollback ブランチ
git fetch origin dev
git checkout -b revert/issue-549-rollback-classifier-to-threshold origin/dev

# env 1 行戻し
sed -i.bak 's/CF_AUDIT_CLASSIFIER: ml/CF_AUDIT_CLASSIFIER: threshold/' \
  .github/workflows/cf-audit-log-monitor.yml
rm -f .github/workflows/cf-audit-log-monitor.yml.bak

git add .github/workflows/cf-audit-log-monitor.yml
git commit -m "revert(cf-audit): rollback CF_AUDIT_CLASSIFIER to threshold (Refs #549)"
git push -u origin revert/issue-549-rollback-classifier-to-threshold
gh pr create --base dev --title "revert(cf-audit): rollback to threshold classifier (Refs #549)" \
  --body "Rollback per forward-safe runbook. D1 columns are kept (forward-safe). Refs #549"
```

D1 列 (`classifier_used` / `classifier_version` / `confidence`) は **絶対に削除しない**。次回 ML 切替で再利用する。

## ステップ 9: 7 日観測完了後の終端サマリ作成

merge 後 7 日経過時点で、hourly snapshot を集計し `outputs/phase-11/observation/summary-7day.md` を生成する。

```bash
# 7 日分の artifact をローカル取得
mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
  --aggregate=7d --in="outputs/observation/" \
  --out="outputs/phase-11/observation/summary-7day.md"
```

期待出力: 4 観測軸（Issue 起票数 / fallback rate / p95 latency / leakage grep）すべて within。
NG 時: rollback runbook へ。

## Handoff（Phase 7 へ渡す入力）

- 各ステップの実行コマンドと期待出力
- staging dry-run の合格条件
- production switch 後の最初の hourly run チェックリスト
- rollback 即時手順（env 1 行戻し PR）
- 7 日観測の終端サマリ生成手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `index.md` ・ `phase-03.md` ・ `phase-04.md` ・ `phase-05.md`
- `CLAUDE.md`（ブランチ戦略 / `scripts/cf.sh` / Cloudflare CLI 規約）
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 実行タスク

| Task | 内容 |
| --- | --- |
| 06-1 | 実装サイクル用の関数シグネチャと CLI contract を整理する |
| 06-2 | PR / rollback command は user approval 後の handoff として記録する |

## 成果物/実行手順

本 Phase の成果物は `phase-06.md`。ここに含まれる commit / push / PR command は実行せず、Gate 後の実装サイクルへ渡す。

## 統合テスト連携

Phase 9 の focused test plan へ command contract を接続する。
