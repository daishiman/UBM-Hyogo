---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 12
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 12 — Implementation guide（Phase 13 実行手順 / 本 spec では実行しない）

本 doc は Phase 13 closeout で **実行する** コマンド / 手順を具体的に列挙する。**本 spec では実行しない**（コード変更ゼロ、PR は user-gated）。

## 1. grep gate 実行（AC-5）

```bash
# 実値非混入確認（0 件期待）
grep -rE '(AIza|ya29\.|sk-[A-Za-z0-9]|-----BEGIN PRIVATE KEY-----)' \
  docs/30-workflows/issue-265-forms-api-quota-sa-governance/

grep -rE '"private_key"|"client_email"\s*:\s*"[^o]' \
  docs/30-workflows/issue-265-forms-api-quota-sa-governance/

grep -rE '\b[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com\b' \
  docs/30-workflows/issue-265-forms-api-quota-sa-governance/
```

結果は `outputs/phase-11/secret-grep-log.md` に貼り付け（実装サイクル時）。

## 2. 起票元 unassigned-task への consumed trace 追記

**対象ファイル**: `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md`

**追記内容**（ファイル先頭 / 既存 H1 の直前）:

```yaml
---
consumed: true
canonical_workflow: issue-265-forms-api-quota-sa-governance
consumed_at: 2026-05-26
issue_refs: ["#265"]
note: "UT-03 (CLOSED) への申し送りから Forms API quota / SA governance standalone doc へ再フレーム済。"
---
```

本文「申し送り先」「組み込み先」セクションには `canonical_workflow` 参照行を 1 行追加（既存テーブルの直下）。

## 3. stale ref 確認 grep

```bash
# 旧 UT-03 申し送り言及の検出
grep -rn "U-UT01-06" docs/ .claude/ 2>/dev/null | grep -v "issue-265-forms-api-quota-sa-governance/"

# ut-03 への内包参照
grep -rn "UT-03 に内包" docs/ .claude/ 2>/dev/null

# 旧 Sheets API quota の独立記述
grep -rnE "GCP quota 配分.*UT-03" docs/ .claude/ 2>/dev/null
```

該当行があれば「standalone 化済」「`canonical_workflow: issue-265-forms-api-quota-sa-governance` 参照」を併記。

## 4. completed-tasks 移動（Phase 13）

```bash
# 実装サイクル完了後、Phase 11 sub-doc 7 件すべて配置済の状態で実行
git mv docs/30-workflows/issue-265-forms-api-quota-sa-governance \
       docs/30-workflows/completed-tasks/issue-265-forms-api-quota-sa-governance
```

移動後の参照補修対象は Phase 13 の `outputs/phase-13/phase-13.md` で grep スコープを再確認。

## 5. gate 検証（PR 作成前）

```bash
pnpm gate-metadata:validate
pnpm verify:phase12-compliance
pnpm indexes:rebuild   # idempotent 確認
```

すべて green 後に PR 作成（`gh pr create --base dev`）。

## 6. 本 spec で実行する作業（spec_created 段階）

**なし**。本 spec は仕様書配置のみ。実行は Phase 13 / 実装サイクル / PR 作成サイクルに委ねる。
