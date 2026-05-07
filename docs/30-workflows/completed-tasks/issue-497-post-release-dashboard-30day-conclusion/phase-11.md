# Phase 11: 手動検証（NON_VISUAL 縮約 / 30 日 gh run 集計実行）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計 |
| Phase 番号 | 11 / 13 |
| 前 Phase | 10（30 日 gate 判定） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created → completed（実行時） |
| 実装区分 | ドキュメントのみ |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| user_approval_required | false |
| GitHub Issue | #497（CLOSED 据え置き） |
| 変更対象ファイル / 関数シグネチャ / unit/integration/e2e tests | **N/A（コード変更なし）** |

## VISUAL / NON_VISUAL 判定

- mode: **NON_VISUAL**（UI 追加なし / 一次証跡は CLI ログ + JSON + markdown 集計に閉じる）
- screenshot は不要（`outputs/phase-11/screenshots/` ディレクトリは作成しない / false green 防止）
- 適用テンプレ: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §「NON_VISUAL 縮約テンプレ」

## 目的

`.github/workflows/post-release-dashboard.yml` の 30 日連続 run を `gh run list` で取得し、conclusion 分布 / failure 根本原因 / 連続 failure 区間 / failure rate を確定する。集計結果は Phase 12 で `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に追記される。Phase 10 の 30 日 gate PASS が本 Phase 着手の前提。

## 実行タスク

1. 30 日 gate 再判定（Phase 10 PASS の再確認）
2. raw JSON 取得 → `outputs/phase-11/post-release-dashboard-30d.json`
3. conclusion 分布集計 → `outputs/phase-11/conclusion-distribution.md`（markdown 表）
4. failure run の log-failed 取得 → `outputs/phase-11/log-failed-<id>.log`（複数）
5. redaction grep → `outputs/phase-11/redaction-grep.log`
6. 連続 failure 区間算出 → `outputs/phase-11/consecutive-failure-window.md`
7. failure rate 判定 → `outputs/phase-11/failure-rate-decision.md`（`< 10%` / `>= 10%`）
8. **`>= 10%` 時のみ**: `gh issue create --title "[task-issue-497-fu-01] ..."` で別 unassigned task 起票し、issue 番号を `failure-rate-decision.md` に記録

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 緩和策 |
| --- | --- | --- |
| 1 | `gh run list --limit=80` が 30 日分をカバーしない可能性 | `--limit=80` まで段階的に増やし、最古 run `createdAt` ≦ 着手日 - 30 日を満たす limit を記録 |
| 2 | log-failed に token 等がエコーされている可能性 | grep 対象を `token` / `bearer` / `secret` / `Authorization` / `ya29\.` / `ghp_` / `ghs_` で固定し、検出時は `[REDACTED]` 化 |
| 3 | 連続 failure 区間境界判定（cancelled を含めるか） | 含める対象を `failure` / `startup_failure` / `timed_out` の 3 種に固定し、`cancelled` / `action_required` は別カウント |
| 4 | failure rate `>= 10%` 時の起票漏れ | `failure-rate-decision.md` に「起票要否 → 起票 issue 番号」を必須項目化 |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 30 日 schedule 沈黙的失敗の検知ベースラインが正本化される |
| 実現性 | PASS | `gh run list` / `gh run view --log-failed` は read-only |
| 整合性 | PASS | AC-1〜AC-5, AC-7, AC-8, AC-9 と直接対応 |
| 運用性 | PASS | redaction grep + `>= 10%` 時の別タスク起票で責務分離 |

## evidence 一覧 / AC 紐付け

| AC | path | 内容 | 取得コマンド |
| --- | --- | --- | --- |
| AC-1 | `outputs/phase-11/post-release-dashboard-30d.json` | 最古 run `createdAt` ≦ 着手日 - 30 日 | `gh run list --workflow=post-release-dashboard.yml --limit=80 --json databaseId,conclusion,status,createdAt,displayTitle,event` |
| AC-2 | `outputs/phase-11/conclusion-distribution.md` | conclusion 6 種 + count + ratio | `jq 'group_by(.conclusion)' ...` から markdown 表生成 |
| AC-3 | `outputs/phase-11/log-failed-<id>.log` | failure 別 root cause 分類（token 失効 / GraphQL 5xx / cron drift / schema drift / artifact retention / その他） | `gh run view <id> --log-failed` |
| AC-4 | `outputs/phase-11/consecutive-failure-window.md` | 最大連続 failure 日数（0 日でも明記） | jq + sort + awk |
| AC-5 | `outputs/phase-11/failure-rate-decision.md` | `< 10%` / `>= 10%` 判定 + 起票 issue 番号 | jq 比率算出 |
| AC-7 | `outputs/phase-11/post-release-dashboard-30d.json` | `jq empty` PASS | 上記 JSON validation |
| AC-8 | `outputs/phase-11/redaction-grep.log` | grep 検出 0 件 / 検出時 `[REDACTED]` 化済 | `rg -n -E "token\|bearer\|secret\|Authorization\|ya29\\.\|ghp_\|ghs_" outputs/phase-11/log-failed-*.log` |
| AC-9 | `gh issue view 497 --json state` | `"state": "CLOSED"` | `gh issue view 497 --json state` |

> AC-6 / AC-10 / AC-11 は Phase 12 / Phase 10 で扱う。

## runtime evidence 状態語彙

| 語彙 | 適用条件 |
| --- | --- |
| **PASS** | 30 日 gate PASS 後、本 Phase の全 evidence（AC-1〜AC-5, AC-7〜AC-9）が揃った状態 |
| **DEFER** | 30 日 gate 未達 → 本 Phase / Phase 12 / Phase 13 を実施せず spec_created 据え置き |

> `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は本タスクでは **使用しない**（runtime = 集計実行で完結するため）。

## 実行手順（要約）

```bash
# Step 1: 30 日 gate 再判定
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json databaseId,createdAt,conclusion \
  | jq -r '.[-1] | "oldest_run=\(.createdAt) databaseId=\(.databaseId)"'

# Step 2: raw JSON 取得
mkdir -p docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json databaseId,conclusion,status,createdAt,displayTitle,event,headBranch,htmlUrl \
  > docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json
jq empty docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json

# Step 3: conclusion 分布
jq -r 'group_by(.conclusion) | map({conclusion:(.[0].conclusion // "in_progress"), count:length}) | .[] | "\(.conclusion)\t\(.count)"' \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json

# Step 4: failure log-failed 取得
jq -r '.[] | select(.conclusion=="failure" or .conclusion=="startup_failure" or .conclusion=="timed_out") | .databaseId' \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json \
  | while read id; do
      gh run view "$id" --log-failed \
        > "docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/log-failed-${id}.log" 2>&1 || true
    done

# Step 5: redaction grep
rg -n -E "token|bearer|secret|Authorization|ya29\.|ghp_|ghs_|sk-[A-Za-z0-9]{20,}" \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/log-failed-*.log \
  > docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/redaction-grep.log \
  || echo "OK: no secrets" >> docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/redaction-grep.log

# Step 6: 連続 failure 区間算出
jq -r '.[] | [.createdAt, .conclusion] | @tsv' \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json \
  | sort \
  | awk -F '\t' '{ f=($2=="failure"||$2=="startup_failure"||$2=="timed_out")?1:0; if(f){c++;if(c>m)m=c}else c=0 } END{print "max_consecutive_failure_days="(m+0)}'

# Step 7: failure rate
jq -r '(map(select(.conclusion=="failure" or .conclusion=="startup_failure" or .conclusion=="timed_out")) | length) as $f | length as $n | "failure=\($f) total=\($n) rate=\(($f/$n*100))"' \
  docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/post-release-dashboard-30d.json

# Step 8: >= 10% 時のみ別 unassigned task 起票
gh issue create \
  --title "[task-issue-497-fu-01] retry/alert addition for post-release-dashboard (30-day failure rate >=10%)" \
  --body "Refs #497, Refs #351"
```

## 完了条件チェックリスト

- [ ] `outputs/phase-11/post-release-dashboard-30d.json` が `jq empty` PASS
- [ ] `outputs/phase-11/conclusion-distribution.md` に 6 conclusion + count + ratio
- [ ] failure run ごとの `log-failed-<id>.log` 冒頭に root cause 分類ラベル
- [ ] `consecutive-failure-window.md` に最大連続 failure 日数（0 日含む）
- [ ] `redaction-grep.log` 0 件もしくは `[REDACTED]` 化済
- [ ] `failure-rate-decision.md` に判定 + 根拠（`>= 10%` 時は起票 issue URL）
- [ ] `gh issue view 497 --json state` が CLOSED
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）

## 不変条件への影響

| # 1〜7 | 影響なし（コード変更なし / read-only `gh` 集計のみ） |
| --- | --- |

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ: `conclusion-distribution.md` / `consecutive-failure-window.md` / `failure-rate-decision.md` の数値を Phase 12 `implementation-guide.md` Part 2 に転記。`log-failed-<id>.log` の root cause 分類を `system-spec-update-summary.md` の deployment-gha.md 追記へ反映。failure rate `>= 10%` 時の起票 issue 番号を `unassigned-task-detection.md` の trace に記載。
- ブロック条件: 30 日 gate 未達（DEFER） / `[REDACTED]` 化未完了の機微情報残存 / `screenshots/` 誤作成 / Issue #497 の誤 reopen。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| index | `outputs/phase-11/main.md` | NON_VISUAL evidence index |
| smoke | `outputs/phase-11/manual-smoke-log.md` | 実行ログ記録先 |
| links | `outputs/phase-11/link-checklist.md` | 参照リンク確認 |
| raw | `outputs/phase-11/post-release-dashboard-30d.json` | 30 日 gate PASS 後に作成 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
