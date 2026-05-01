# Phase 13 PR 作成 — main

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | U-UT01-07 |
| 作成日 | 2026-04-30 |
| 状態 | **pending_user_approval** |
| user_approval_required | **true** |
| ブランチ | `feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec` |
| ベース | `main` |
| sourceIssue | #261（CLOSED） |

---

## 重要: 自動実行禁止

本フェーズは **user の明示的な承認なしに実行してはならない**。Claude Code は以下を行わない:

- `git commit`
- `git push`
- `gh pr create`

approval 取得後、user の明示的な指示があった場合のみ実行する。

---

## 承認ゲート（approval gate）

| ゲート項目 | 期待 | 現状 |
| --- | --- | --- |
| Phase 10 GO 判定 | GO | 要確認 |
| Phase 11 NON_VISUAL evidence | 採取済 | 要確認 |
| Phase 12 必須 7 成果物 | 要最終確認 | `phase12-task-spec-compliance-check.md` の実測欄で確定 |
| `metadata.workflow_state = "spec_created"` | maintained | 確認済 |
| `metadata.docsOnly = true` | true | 確認済 |
| `apps/api/migrations/` 非混入 | 0 件 | 要確認 |
| `apps/api/src/` 非混入 | 0 件 | 要確認 |
| `packages/shared/src/` 非混入 | 0 件 | 要確認 |
| 機密情報 grep | 0 件 | 要確認 |
| user 明示承認 | 取得済 | **未取得** |

---

## local-check-result（PR 前ローカル確認 — 承認後実行）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes
mise exec -- pnpm test

git diff --name-only main..HEAD | grep -E "^(apps/api/migrations/|apps/api/src/|packages/shared/src/)" \
  && echo "BLOCKED: 実コード混入" || echo "OK: spec only"

git diff main..HEAD | grep -nE "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" \
  || echo "OK: no secrets"
```

| チェック項目 | 期待 | 結果記入欄 |
| --- | --- | --- |
| typecheck | exit 0 | (承認後実行) |
| lint | exit 0 | (承認後実行) |
| verify-indexes | drift 0 | (承認後実行) |
| test | 全 PASS | (承認後実行) |
| 実コード混入 grep | 0 件 | (承認後実行) |
| 機密情報 grep | 0 件 | (承認後実行) |

---

## change-summary（PR description 草案）

### 概要

U-UT01-07 に基づき、論理名 `sync_log`（UT-01 Phase 2 設計）と既存物理 `sync_job_logs` / `sync_locks`（`apps/api/migrations/0002_sync_logs_locks.sql` で稼働中）の **命名 reconciliation 設計タスク仕様書** を `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` 配下に作成する。本 PR は spec のみで、物理 DDL・コード変更は後続の UT-04 / UT-09 で投入する。

### 動機

- GitHub Issue: **#261**（CLOSED） — U-UT01-07: `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合
- UT-04（D1 スキーマ設計）/ UT-09（Sheets→D1 同期ジョブ）が二重 ledger を作らないための上流前提として canonical 名・マッピング・migration 戦略を確定する必要がある
- CLAUDE.md 不変条件 #5（D1 直アクセスは `apps/api` に閉じる）の整合確認

### 採択した設計判断（要点）

1. **canonical 命名**: 物理 `sync_job_logs`（ledger） / `sync_locks`（lock）を canonical に確定。`sync_log` は概念名として文書のみで保持。
2. **後方互換戦略**: **no-op**（rename / view 化 / 新テーブル+移行 はすべて却下）。データ消失リスク 0。
3. **migration 戦略**: in-place 拡張のみ。`processed_offset` / `idempotency_key` の物理追加判定は **UT-04** に委譲。
4. **直交境界**: enum 値 → U-UT01-08、retry / offset → U-UT01-09 に委譲。本タスクで決定しない。

### 含めるファイル一覧（本ワークフロー配下のみ）

- `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` 全体（13 Phase + index + artifacts.json + outputs/）
- `docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md`（状態 → `spec_created`）
- `.claude/skills/aiworkflow-requirements/indexes/`（resource-map / quick-reference の same-wave sync 差分。topic-map / keywords は references 本文更新なしのため対象外）

### 含まないファイル（明示）

| 対象 | 委譲先 |
| --- | --- |
| `apps/api/migrations/*.sql` | UT-04 実装 PR |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | UT-09 実装 PR |
| `packages/shared/src/zod/*` | U-10 実装 PR |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` の実編集 | UT-04 同期 PR or 別途 doc-only PR（diff plan のみ本 PR に記載） |

### 動作確認

- typecheck / lint / verify-indexes / test: 全 PASS（承認後 local-check で記録）
- Phase 11 NON_VISUAL evidence 採取済
- 機密情報 grep: 0 件
- spec PR 境界 grep（`apps/api/` / `packages/shared/src/`）: 0 件

### リスク・後方互換性

- 破壊的変更なし（spec ドキュメントのみ）
- production D1 への影響なし
- workflow_state は **spec_created** を維持

### 関連 Issue

- `Refs #261`（issue は既に CLOSED のため、本 PR は `Refs` のみで `Closes` は使用しない）

---

## PR テンプレ

| 項目 | 値 |
| --- | --- |
| title | `docs(u-ut01-07): sync_log 命名 reconciliation 設計タスク仕様書 (Issue #261)` |
| base | `main` |
| head | `feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec` |
| reviewer | required reviewers=0（solo 運用） |
| labels | `area:docs` / `task:U-UT01-07` / `wave:1` / `spec-only` |
| linked issue | #261（CLOSED）— `Refs #261` |

### PR body テンプレ

```
## 概要
U-UT01-07 に基づき、論理 sync_log（UT-01）と物理 sync_job_logs / sync_locks（既存稼働）の命名 reconciliation 設計タスク仕様書を整備します。本 PR は spec のみで、実 DDL は UT-04、実コードは UT-09 で投入します。

## 動機
- GitHub Issue: #261（CLOSED）
- UT-04 / UT-09 が二重 ledger を作らない上流前提
- CLAUDE.md 不変条件 #5 の整合確認

## 採択判断
- canonical: 物理 sync_job_logs / sync_locks（rename しない）
- 後方互換: no-op
- migration: in-place のみ。物理カラム追加判定は UT-04 に委譲
- enum / retry / offset 値は U-UT01-08 / U-UT01-09 に委譲

## 変更内容
- 新規: docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/（13 Phase + outputs/）
- 同期: aiworkflow indexes（resource-map / quick-reference）
- 更新: docs/30-workflows/unassigned-task/U-UT01-07-...md の状態を spec_created に変更

## 含まないもの（明示）
- apps/api/migrations/*.sql
- apps/api/src/**
- packages/shared/src/**
- .claude/skills/aiworkflow-requirements/references/database-schema.md の DDL 追補（UT-04 判定）

## 動作確認
- typecheck / lint / verify-indexes / test: 全 PASS
- Phase 11 NON_VISUAL evidence 採取済
- 機密情報 grep / spec PR 境界 grep: 0 件

## リスク
- 破壊的変更なし / production 影響なし
- workflow_state は spec_created を維持

Refs #261
```

---

## 承認後の実行手順（user 明示指示後のみ）

```bash
git status
git branch --show-current

git add docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/ \
        docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md \
        .claude/skills/aiworkflow-requirements/indexes/

git commit -m "$(cat <<'EOF'
docs(u-ut01-07): sync_log 命名 reconciliation 設計タスク仕様書 (Issue #261)

- Phase 1〜13 仕様書を docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/ に追加
- canonical 命名 / 論理→物理マッピング / 後方互換 no-op / UT-04・UT-09 引き継ぎ を spec として整備
- Phase 12 same-wave sync（aiworkflow indexes + 原典 unassigned status）完了
- workflow_state は spec_created を維持

Refs #261
EOF
)"

git push -u origin feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec

gh pr create \
  --title "docs(u-ut01-07): sync_log 命名 reconciliation 設計タスク仕様書 (Issue #261)" \
  --base main \
  --head feat/issue-261-u-ut01-07-sync-log-naming-reconciliation-task-spec \
  --body-file docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-13/main.md
```

---

## マージ後の手順（user 操作領域）

```bash
gh pr checks <PR番号>
gh pr merge <PR番号> --squash --delete-branch
```

- マージ後、`artifacts.json` の `phases[*].status` を `completed` に更新
- `metadata.workflow_state` は **`spec_created` を維持**（実 DDL / 実コードは UT-04 / UT-09 で投入されるまで spec 段階）

---

## 承認ログ

| 日時 | 承認者 | 承認内容 | 状態 |
| --- | --- | --- | --- |
| (未取得) | (user) | (PR 作成承認) | **pending** |
