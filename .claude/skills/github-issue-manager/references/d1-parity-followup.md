# Execution Follow-up Issue / D1 Parity 連携 / Blocker 双方向更新

> **読み込み条件**: 親タスクの output が `NOT_EXECUTED` placeholder を残したまま CLOSED された場合、
> または D1 schema parity（staging vs production）の差分検出時、
> または下流タスク（例: 09c）が上流タスク（例: 09a-A）の実 evidence を待つ blocker 関係にある場合。
> **更新タイミング**: フローを変更した際、テンプレ追加時。

---

## 1. Execution Follow-up Issue パターン

### 1.1 判定条件

親タスクの outputs（`docs/30-workflows/<task>/outputs/phase-*/main.md`）または
artifacts（`artifacts.json`）に以下のいずれかが含まれる場合、execution-only 子 Issue を発行する。

- `NOT_EXECUTED` placeholder（実行ログ・スクリーンショット未取得）
- `pending_user_approval` フラグ（user gate 未通過）
- `runtime evidence pending` 注釈（staging/production ランタイム証跡未収集）
- `placeholder://` URL を含む artifact 参照

### 1.2 子 Issue タイトル規約

```
[exec] <parent-task-id>: runtime evidence execution
```

例:

- `[exec] 09a-A: runtime evidence execution`
- `[exec] 08b-A: playwright e2e runtime execution`

### 1.3 Body 必須項目

子 Issue の body には以下を含める（`gh issue create --body-file` で投入）。

```markdown
## 親 Issue
- parent_issue: #<parent_issue_number>
- parent_task: docs/30-workflows/<parent-task>/index.md

## NOT_EXECUTED placeholder の具体 list
- outputs/phase-04/main.md L120: `staging deploy log: NOT_EXECUTED`
- outputs/phase-05/main.md L88: `smoke test result: pending_user_approval`
- artifacts.json `runtime_evidence.staging_url`: `placeholder://staging`

## 実行コマンド（user 実行）
```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
pnpm --filter @ubm-hyogo/web test:e2e:staging
```

## User Approval Gate
- staging URL 確認: ___
- smoke test 全件 PASS: ___
- production parity diff 0 件: ___

## 完了時の親 Issue body 更新手順
1. 親仕様書 `outputs/phase-*/main.md` の `NOT_EXECUTED` を実 evidence に置換
2. `artifacts.json.runtime_evidence` を実 URL/log path に書き換え
3. `gh issue edit <parent_issue_number> --body-file <updated body>`
4. 下流タスク（例: 09c）の blocker 行を削除（§3 参照）
5. 子 Issue を close: `gh issue close <child_issue_number> --reason completed`
```

### 1.4 親タスクが既に CLOSED の場合の扱い

親 Issue が `spec_created` で CLOSED 済みであっても、execution follow-up 子 Issue は **OPEN で新規発行** する。
親の closing は「仕様書としての完成」を示すのみで、ランタイム実行は別ライフサイクル。

---

## 2. D1 Schema Parity 差分時の自動派生

### 2.1 比較手順（staging vs production）

```bash
# staging schema export
bash scripts/cf.sh d1 export ubm-hyogo-db-staging --env staging --output /tmp/staging-schema.sql --no-data

# production schema export
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output /tmp/prod-schema.sql --no-data

# normalize & diff
diff <(grep -E '^CREATE|^ALTER' /tmp/staging-schema.sql | sort) \
     <(grep -E '^CREATE|^ALTER' /tmp/prod-schema.sql | sort)
```

差分が 1 行でも検出された場合、§2.2 の unassigned-task を自動発行する。

### 2.2 unassigned-task テンプレ

`docs/30-workflows/unassigned-task/task-d1-prod-parity-followup-<NNN>.md` として作成。
`<NNN>` は連番（既存の最大値 +1）。

```yaml
---
task_id: d1-prod-parity-followup-<NNN>
task_name: D1 schema parity drift remediation
category: bugfix
priority: 高
scale: 小規模
status: 未実施
source_phase: post-deploy
parent_task: 09a-A-staging-deploy-smoke-execution
parent_issue: <parent_issue_number>
created_date: <YYYY-MM-DD>
dependencies:
  upstream:
    - issue_number: <parent_issue_number>
      task_name: <parent-task>
      status: completed
---

# D1 schema parity drift remediation

## 検出差分
（diff 出力をそのまま貼付）

## 修復方針
1. drift がどちら側で発生したかを特定（staging が新しいか production が新しいか）
2. 古い側に migration を適用 or rollback
3. parity 再検証で diff 0 件を確認
```

### 2.3 Issue 自動作成 hook 連携

このテンプレ作成時、既存の Claude Code Hook（`.claude/hooks/auto-create-issue.sh`）が
`docs/30-workflows/unassigned-task/task-*.md` の Write を検知して GitHub Issue を自動発行する。
追加の hook 実装は不要。Issue body には parent_issue が含まれるので、GitHub UI 上で双方向リンクが成立する。

---

## 3. Blocker 行双方向更新パターン

### 3.1 関係例

- 09a-A（staging deploy smoke execution）が 09c（production deploy）をブロック
- 09a-A の runtime evidence が `NOT_EXECUTED` の間、09c は **着手不可**

### 3.2 09c 仕様書側 blocker 行（初期記述）

```yaml
dependencies:
  upstream:
    - issue_number: <09a-A_issue_number>
      task_name: 09a-A-staging-deploy-smoke-execution
      status: spec_created
      blocker: true
      blocker_reason: "staging runtime evidence (NOT_EXECUTED) を実測値で置換するまで production deploy 不可"
```

### 3.3 blocker 行を削除する条件

**実測完了時にのみ削除する**。仕様書 CLOSED や Issue CLOSED だけでは削除しない。

判定:

- 親 outputs から `NOT_EXECUTED` / `pending_user_approval` / `placeholder://` が **0 件** になった
- 親 artifacts.json `runtime_evidence.*` が全て実値（URL/log path）になった
- 親側の execution follow-up 子 Issue が close 済み

### 3.4 双方向更新コマンド

```bash
# 1. 下流仕様書から blocker を削除
# （Edit ツールで dependencies.upstream[].blocker / blocker_reason を削除）

# 2. 下流 Issue body を再生成して GitHub に push
node .claude/skills/github-issue-manager/scripts/sync_issues.js --push

# 3. 下流 Issue にコメントで実測完了を記録
gh issue comment <downstream_issue_number> --body \
  "blocker resolved: parent #<parent_issue> runtime evidence updated at <commit-sha>"

# 4. 親 Issue 側にも双方向リンクを残す
gh issue comment <parent_issue_number> --body \
  "downstream #<downstream_issue> unblocked"
```

### 3.5 注意

- blocker を削除せずに下流タスクに着手することは禁止（execution-only 子 Issue が OPEN の間は特に）
- 仕様書の `dependencies.upstream` は status / blocker を独立に持つ。`status: completed` でも `blocker: true` のままなら下流は待機

---

## 4. クイックリファレンス

| シナリオ | アクション |
| -------- | ---------- |
| 親 outputs に NOT_EXECUTED 残存 | `[exec] <parent>: runtime evidence execution` 子 Issue 発行 |
| D1 staging↔prod schema diff 検出 | `task-d1-prod-parity-followup-<NNN>.md` 自動発行 → Hook が Issue 化 |
| 親実 evidence 確定 | 親 outputs / artifacts 更新 → 下流 blocker 行削除 → 双方向コメント |
| 親 Issue CLOSED だが実 evidence 未取得 | 子 Issue は OPEN で発行（CLOSED とは独立ライフサイクル） |
