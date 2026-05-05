# Phase 5: 実装ランブック（監査ランブック）

[実装区分: ドキュメントのみ仕様書 — Phase 11 で実行する監査手順を確定する]

## 目的

監査の実行手順を runbook として確定し、Phase 11 でそのまま実行できる粒度に落とす。本タスクはコード実装を伴わないため「実装ランブック」=「監査ランブック」と読み替える。

## ランブック手順

### Step -1: cwd / output path 初期化

```bash
TASK_DIR="docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001"
mkdir -p "$TASK_DIR/outputs/phase-11" "$TASK_DIR/outputs/phase-12"
: > "$TASK_DIR/outputs/phase-11/commands-executed.md"
```

以降のコマンドは repo root から実行し、出力先は必ず `$TASK_DIR/outputs/...` で指定する。

### Step 0: 監査前 baseline 取得（read-only / optional when local wrangler works）

```bash
# 監査前の d1_migrations row 数を baseline として記録
printf '%s\n' 'bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production' >> "$TASK_DIR/outputs/phase-11/commands-executed.md"
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \
  | tee "$TASK_DIR/outputs/phase-11/d1-migrations-ledger-before.log" \
  | wc -l > "$TASK_DIR/outputs/phase-11/baseline-row-count.txt"
```

### Step 1: applied timestamp の確認

```bash
printf '%s\n' 'bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production' >> "$TASK_DIR/outputs/phase-11/commands-executed.md"
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \
  | grep -E "0008_(schema_alias_hardening|create_schema_aliases)" \
  | tee -a "$TASK_DIR/outputs/phase-11/d1-migrations-ledger.md"
```

期待: 2 件、それぞれ `2026-05-01 08:21:04` / `2026-05-01 10:59:35` が含まれる。

### Step 2: git history 探索

```bash
git log --all --since=2026-04-29 --until=2026-05-03 --pretty=fuller \
  > "$TASK_DIR/outputs/phase-11/git-log-window.txt"

git log --all --since=2026-04-29 --until=2026-05-03 \
  --grep -E "schema_alias|0008|production|apply" \
  --pretty=fuller \
  > "$TASK_DIR/outputs/phase-11/git-log-filtered.txt"
```

### Step 3: docs / changelog grep

```bash
rg -n "0008_schema_alias_hardening|0008_create_schema_aliases|schema_aliases|2026-05-01 08:21:04|2026-05-01 10:59:35|ubm-hyogo-db-prod" \
  docs .claude/skills/aiworkflow-requirements \
  > "$TASK_DIR/outputs/phase-11/docs-grep.txt"
```

### Step 4: GitHub PR / Actions 探索

```bash
gh pr list --search "merged:2026-04-29..2026-05-03" --state merged \
  --json number,title,mergedAt,mergeCommit,author,reviews \
  > "$TASK_DIR/outputs/phase-11/pr-list.json"

gh run list --created 2026-04-29..2026-05-03 --limit 50 \
  --json databaseId,name,conclusion,createdAt,event,headBranch \
  > "$TASK_DIR/outputs/phase-11/run-list.json"
```

### Step 5: 候補集計と evidence 照合

`operation-candidate-inventory.md` に各候補を以下の表形式で記録:

| candidate | source | command_evidence | approval_evidence | target_evidence | classification |
| --- | --- | --- | --- | --- | --- |
| ... | git/PR/docs | path | path | path | confirmed/unverifiable |

### Step 6: 出所判定

`outputs/phase-11/attribution-decision.md` の末尾に以下のいずれか 1 行のみ記載:

```
decision: confirmed (workflow=<workflow-name>, approval=<evidence-path>)
```
または
```
decision: unattributed (no evidence found)
```

### Step 7: 単一レコード化

`outputs/phase-11/single-record.md`:

| field | value |
| --- | --- |
| timestamp_1 | 2026-05-01 08:21:04 UTC (`0008_schema_alias_hardening.sql`) |
| timestamp_2 | 2026-05-01 10:59:35 UTC (`0008_create_schema_aliases.sql`) |
| target_database | `ubm-hyogo-db-prod` |
| command | (確定または `unknown`) |
| approver | (確定または `unknown`) |
| workflow_evidence | (確定または `none`) |
| classification | confirmed / unattributed |

### Step 8: 監査後 baseline 比較（read-only PASS 検証）

```bash
printf '%s\n' 'bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production' >> "$TASK_DIR/outputs/phase-11/commands-executed.md"
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \
  | tee "$TASK_DIR/outputs/phase-11/d1-migrations-ledger-after.log" \
  | wc -l > "$TASK_DIR/outputs/phase-11/after-row-count.txt"

{
  diff "$TASK_DIR/outputs/phase-11/baseline-row-count.txt" "$TASK_DIR/outputs/phase-11/after-row-count.txt" \
    && echo "PASS: migration ledger row count unchanged"
} > "$TASK_DIR/outputs/phase-11/read-only-checklist.md"
# 期待: 差分なし
```

local wrangler が remote ledger 取得前に blocked した場合、Step 8 は transcript proof に縮退する。`commands-executed.md` に `d1 migrations apply` / `deploy` / `rollback` / `cf.sh d1:apply-prod` が存在しないこと、かつ parent workflow Phase 13 の既取得 ledger snapshot を timestamp source として引用することを `read-only-checklist.md` に明記する。

### Step 9: redaction スキャン

```bash
if rg -n -i "(token=|secret=|Bearer\s+[A-Za-z0-9]|cf_api|api_token|oauth_token)" \
  "$TASK_DIR/outputs/" > "$TASK_DIR/outputs/phase-11/redaction-findings.tmp"; then
  {
    echo "FAIL: redaction findings present"
    cat "$TASK_DIR/outputs/phase-11/redaction-findings.tmp"
  } > "$TASK_DIR/outputs/phase-11/redaction-checklist.md"
else
  echo "PASS: 0 redaction findings" > "$TASK_DIR/outputs/phase-11/redaction-checklist.md"
fi
```

## 出力 (`outputs/phase-05/main.md`)

- 上記ランブック手順の Step 0〜9
- 各 Step の前提・成果物 path・期待結果

## 完了条件

- [ ] 全 Step が repo root からコマンド単位でコピー&ペースト可能
- [ ] 各 Step に成果物 path が紐付いている
- [ ] read-only / redaction が手順内で機械的に検証される

## メタ情報

- taskType: docs-only
- visualEvidence: NON_VISUAL
- workflow_state: spec_created

## 実行タスク

- 詳細は本 Phase の既存セクションを参照する。

## 参照資料

- index.md
- artifacts.json
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 成果物

- 対応する `outputs/phase-*` 配下の `main.md`。

## 統合テスト連携

- docs-only / NON_VISUAL のため UI 統合テストは対象外。Phase 11 の read-only audit evidence と Phase 12 compliance check で検証する。
