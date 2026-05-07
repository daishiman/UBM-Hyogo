# Phase 1: 要件定義

[実装区分: ドキュメントのみ仕様書 / Phase taskType: docs-only / visualEvidence: NON_VISUAL]

## 目的

Issue #434 (parent #359) における production D1 `ubm-hyogo-db-prod` 先行 apply の出所監査要件を確定する。本タスクが read-only 監査であり、コード変更を伴わないことを Phase 1 で正式に固定する。

## 背景

- Issue #359 (`task-issue-191-production-d1-schema-aliases-apply-001`) の Phase 13 preflight 時点で、production D1 に以下が apply 済みであることを検出:
  - `0008_schema_alias_hardening.sql` — `2026-05-01 08:21:04 UTC`
  - `0008_create_schema_aliases.sql` — `2026-05-01 10:59:35 UTC`
- 当該 workflow の Phase 13 承認は `2026-05-02`。実 apply は workflow runtime より前。
- spec の NO-GO 句に従い apply 自体はスキップ済み（PRAGMA shape verification で完了）。
- 出所 (workflow / command / approver) が現時点で未接続。

## 要件

### 機能要件

1. `d1_migrations` ledger 上の対象 2 migration の applied timestamp を read-only に取得し記録する。
2. 2026-05-01 前後の git history / docs outputs / PR / `.claude/skills/aiworkflow-requirements/changelog/` から operation 候補を列挙する。
3. 候補ごとに `command evidence` / `approval evidence` / `target database evidence` を表形式で照合する。
4. 照合結果を `confirmed (workflow=<name>, approval=<evidence path>)` または `unattributed (no evidence found)` の二値分類で確定する。
5. `confirmed` の場合は親 workflow Phase 13 evidence への cross-reference 追加方針を確定する。
6. `unattributed` の場合は再発防止策を `runbook` / `lessons-learned` / `aiworkflow-requirements` のいずれかに formalize する反映先を確定する。
7. 承認有無 / command / target database / timestamp を単一レコードに集約する。

### 非機能要件

- read-only evidence: allowlist 外コマンドが実行されず、production mutation command が 0 件である。補助証跡として、取得可能な場合は `d1_migrations` ledger row 数が監査前後で不変である
- redaction PASS: secret 値（API Token / OAuth token / account secret）が成果物のいずれにも混入しない
- single record consistency: timestamp / command / approver / workflow evidence が同一レコードで矛盾なく確定している
- traceability: 出所判定根拠が evidence path として全件示せる

## 入力

- `task-issue-191-production-d1-schema-aliases-apply-001` の `outputs/phase-13/` 配下成果物
- `.claude/skills/aiworkflow-requirements/changelog/20260502-issue359-production-d1-schema-aliases-apply.md`
- 2026-05-01 前後の `git log --all --since=2026-04-29 --until=2026-05-03`
- production D1 `ubm-hyogo-db-prod` の `d1_migrations` ledger（`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` の read-only 結果）

## 出力

- `outputs/phase-01/main.md` — 要件定義サマリ
- 後続 Phase の入力となる以下の概念定義:
  - 「operation 候補」の定義（git commit, PR merge, workflow output, manual command 等）
  - 「approval evidence」の定義（apply timestamp 以前または同時刻の PR レビュー記録 / 明示 GO runbook / aiworkflow changelog 等）
  - 「confirmed / unattributed」二値分類の判定基準

## 完了条件

- [ ] 要件 (機能 / 非機能) が `outputs/phase-01/main.md` に列挙されている
- [ ] 「operation 候補」「approval evidence」「confirmed / unattributed」の用語定義が確定している
- [ ] 本タスクが docs-only / NON_VISUAL であることが固定されている
- [ ] read-only / redaction の不変条件が記録されている

## artifacts.json.metadata

| key | value |
| --- | --- |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

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
