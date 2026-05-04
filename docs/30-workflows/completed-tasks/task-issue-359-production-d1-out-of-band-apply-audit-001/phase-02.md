# Phase 2: 設計（監査ストラテジ）

[実装区分: ドキュメントのみ仕様書]

## 目的

Phase 1 の要件を満たす監査ストラテジを設計する。ソース別の探索順序、判定アルゴリズム、redaction ルール、read-only 制約の保証方法を確定する。

## 監査ソース（探索順序）

| 順序 | ソース | 取得方法 | 取得対象 |
| --- | --- | --- | --- |
| 1 | `d1_migrations` ledger (production) | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | applied timestamp / migration name の事実確認のみ（read-only） |
| 2 | git history | `git log --all --since=2026-04-29 --until=2026-05-03 --pretty=fuller` | 2026-05-01 前後の commit / merge / author / committer date |
| 3 | docs outputs | `rg -n "0008_schema_alias_hardening\|0008_create_schema_aliases\|schema_aliases\|2026-05-01 08:21:04\|2026-05-01 10:59:35\|ubm-hyogo-db-prod" docs/30-workflows .claude/skills/aiworkflow-requirements` | 該当文字列を含む既存 workflow output / changelog |
| 4 | GitHub PR / Actions | `gh pr list --search "merged:2026-04-29..2026-05-03" --state merged` / `gh run list --created 2026-04-29..2026-05-03` | 2026-05-01 前後の merge / Actions run |
| 5 | `aiworkflow-requirements` changelog | `ls .claude/skills/aiworkflow-requirements/changelog/` および 該当日付の changelog | 関連変更履歴 |

## 判定アルゴリズム

```
for each candidate in operation_candidates:
  has_command_evidence  = exists(git commit OR workflow output OR PR description that names migration file)
  has_approval_evidence = exists(PR approval OR runbook entry with explicit GO)
  approval_is_timely    = approval timestamp <= migration applied timestamp
  has_target_evidence   = exists(reference to "ubm-hyogo-db-prod" OR "production" environment in candidate)

  if has_command_evidence && has_approval_evidence && approval_is_timely && has_target_evidence:
    candidate.classification = "confirmed"
  else:
    candidate.classification = "unverifiable"

if any(candidate.classification == "confirmed" for candidate in candidates):
  decision = "confirmed (workflow=<best_match.workflow>, approval=<evidence path>)"
else:
  decision = "unattributed (no evidence found)"
```

## redaction ルール

- secret 値 (API Token / OAuth token / cookie / account secret) は記録しない
- account id は redacted (`<redacted-account-id>`) で記録
- 実 token / secret を含むログは保存しない
- `bash scripts/cf.sh whoami` 等の出力は redacted のうえで evidence path に保存

## read-only 制約

- allowlist は以下 2 種に限定する:
  - `bash scripts/cf.sh whoami`
  - `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production`
- `migrations apply` / `execute --command` (DDL) / `deploy` / `rollback` は使用禁止
- `d1 export` は本監査に不要なため使用禁止
- `wrangler` 直接実行禁止 (CLAUDE.md)
- production mutation command が 0 件であることを transcript で確認し、取得可能な場合は監査前後で `d1_migrations` の row 数が変化していないことも確認

## 出力 (`outputs/phase-02/main.md`)

- 監査ソース表（順序付き）
- 判定アルゴリズム（疑似コード）
- redaction ルール
- read-only 制約のチェックリスト

## 完了条件

- [ ] 監査ソース 5 種すべての取得方法が確定
- [ ] 判定アルゴリズムが疑似コードで明示
- [ ] redaction / read-only の不変条件が SOP として確定

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
