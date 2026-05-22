# Phase 12 — ドキュメント更新

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 名前 | ドキュメント更新 |
| 状態 | spec_created |
| 依存 | Phase 11 |
| 入力 | Phase 1-11 成果物 |
| 出力 | outputs/phase-12/{main.md + 6 補助成果物} |

## 目的

`task-specification-creator` skill Phase 12 規約に準拠した strict 7 成果物を作成し、
正本ドキュメント (`docs/00-getting-started-manual/specs/`, `aiworkflow-requirements` ledgers / indexes) を同期する。

## タスク

### Step 1-A: main.md

- [ ] Phase 12 全体の実施結果、Task 1-6 の完了状況、検証コマンド結果を 1 ファイルに集約する
- [ ] root `artifacts.json` / `outputs/artifacts.json` parity 結果を記録する

### Step 1-B: implementation-guide.md (Part 1 中学生 / Part 2 技術)

- [ ] Part 1: 中学生レベル概念説明（CSV って何 / 一括登録の意義 / dry-run の意義 / なぜ確認画面が必要か）
- [ ] Part 2: 技術詳細（endpoint / service / UI / D1 batch / audit_log / papaparse）

### Step 1-C: system-spec-update-summary.md

- [ ] `docs/00-getting-started-manual/specs/01-api-schema.md` admin endpoint 表への追記内容
- [ ] `docs/00-getting-started-manual/specs/11-admin-management.md` meetings / attendance 操作説明への追記内容
- [ ] `docs/00-getting-started-manual/specs/00-overview.md` への影響
- [ ] `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` への workflow 登録
- [ ] `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md,topic-map.md,keywords.json}` の再生成または更新結果
- [ ] artifact inventory / lessons / LOGS の更新有無と no-op 理由
- [ ] CLAUDE.md 不変条件への影響（なし）

### Step 1-D: documentation-changelog.md

- [ ] 本サイクルで更新したドキュメントの diff サマリ

### Step 2: 既存正本同期

- [ ] **新 API endpoint なので `apps/api` route inventory への追記が必要**
  - 対象: `docs/00-getting-started-manual/specs/01-api-schema.md` の admin endpoint 表
  - 新規 IPC ではないので IPC bridge 系ドキュメント更新は不要

### Step 3: unassigned-task-detection.md

- [ ] スコープ漏れタスク検出（0 件でも明示出力）

### Step 4: skill-feedback-report.md

- [ ] `task-specification-creator` / `aiworkflow-requirements` への feedback
- [ ] 0 件でも明示出力

### Step 5: phase12-task-spec-compliance-check.md

- [ ] canonical 9 headings を逐語使用
  1. Summary verdict
  2. Changed-files classification
  3. `workflow_state` and phase status consistency
  4. Phase 11 evidence file inventory
  5. Phase 12 strict 7 file inventory
  6. Skill/reference/system spec same-wave sync
  7. Runtime or user-gated boundary
  8. Archive/delete stale-reference gate
  9. Four-condition verdict
- [ ] Phase 11 evidence 表
- [ ] workflow root scan
- [ ] 4 条件 / 30 種 compact evidence

## 成果物（strict 7 ファイル必須）

| # | ファイル |
| --- | --- |
| 1 | `outputs/phase-12/main.md` |
| 2 | `outputs/phase-12/implementation-guide.md` |
| 3 | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | `outputs/phase-12/documentation-changelog.md` |
| 5 | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | `outputs/phase-12/skill-feedback-report.md` |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 完了条件

- strict 7 成果物がすべて存在する
- `verify:phase12-compliance` CI gate が PASS
- `gate-metadata:validate` PASS
- `indexes:rebuild` で drift 0
- 既存 `docs/00-getting-started-manual/specs/01-api-schema.md` の admin endpoint 表に新 endpoint が追記されている
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` と indexes に本 workflow が登録されている
- `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する

## 注意点 / リスク

- Step 2 は **新 IPC ではないが新 API endpoint なので必須**。skip しない
- `unassigned-task-detection.md` / `skill-feedback-report.md` は 0 件でも作成する（空ファイルではなく「0 件」の根拠本文を置く）
- Phase 11 evidence 表は `phase12-task-spec-compliance-check.md` に必ず含める
- Phase 12 実行前の本仕様パッケージ段階では strict 7 の物理 outputs は未生成でよい。ただし Phase 12 に進入したら `main.md` を含む 7 ファイルの欠落 1 件でも FAIL とする
