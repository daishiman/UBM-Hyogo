# Phase 11: 監査実行 / 実測 evidence

[実装区分: ドキュメントのみ仕様書 / visualEvidence: NON_VISUAL]

## 目的

Phase 5 ランブックを実行し、出所監査の実測 evidence を取得する。本 Phase 完了で `confirmed` または `unattributed` の判定が確定する。

## 前提条件

- `bash scripts/cf.sh whoami` が exit 0 で staging/production 操作対象 Cloudflare account を返す（UT-09A 完了状態）
- `unassigned-task/task-issue-359-production-d1-out-of-band-apply-audit-001.md` および `index.md` を読了済み
- 監査前 `d1_migrations` ledger row 数が取得可能な場合は baseline として保存されている。local wrangler blocked 時は parent ledger snapshot + GitHub/git transcript fallback を使う（Phase 5 §Step 0/8）

## 実行 (Phase 5 ランブックを参照)

Phase 5 §Step 0〜9 を順に実行し、以下の成果物を生成する。

## 必須成果物（requiredOutputs）

| path | 内容 | 生成 Step |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 サマリ（実行日時 / 結果 / 判定 / 次アクション） | 全 Step 完了後 |
| `outputs/phase-11/manual-smoke-log.md` | docs-only / NON_VISUAL walkthrough log | spec-created / runtime audit 境界確認 |
| `outputs/phase-11/link-checklist.md` | workflow 内リンク / aiworkflow 参照リンク確認 | spec-created / runtime audit 境界確認 |
| `outputs/phase-11/d1-migrations-ledger.md` | 対象 2 migration の applied timestamp (redacted) | Step 1 |
| `outputs/phase-11/commands-executed.md` | allowlist command transcript | Step -1/0/1/8 |
| `outputs/phase-11/operation-candidate-inventory.md` | 候補 inventory 表 | Step 5 |
| `outputs/phase-11/attribution-decision.md` | `decision: confirmed (...)` または `decision: unattributed (...)` の 1 行 | Step 6 |
| `outputs/phase-11/single-record.md` | timestamp / command / approver / target / classification 集約表 | Step 7 |
| `outputs/phase-11/redaction-checklist.md` | redaction スキャン結果（0 件で PASS） | Step 9 |
| `outputs/phase-11/read-only-checklist.md` | mutation command 0 件。取得可能な場合は監査前後 ledger row 数差分（差分 0 で PASS）、local wrangler blocked 時は fallback evidence | Step 0/8 |

## 補助成果物（任意）

- `outputs/phase-11/git-log-window.txt` / `git-log-filtered.txt`（Step 2）
- `outputs/phase-11/docs-grep.txt`（Step 3）
- `outputs/phase-11/pr-list.json` / `run-list.json`（Step 4）
- `outputs/phase-11/d1-migrations-ledger-before.log` / `d1-migrations-ledger-after.log`（Step 0/8）

## main.md フォーマット

```markdown
# Phase 11 main

- 実行日時: <YYYY-MM-DD HH:MM UTC>
- 実行者: <runner identity>（user 指示）
- 監査ソース: 5 種（Phase 2 表参照）
- 候補件数: <N>
- 判定: confirmed / unattributed
- 親 workflow への影響: cross-reference 追加 / 再発防止策 formalize

## 成果物

- d1-migrations-ledger.md: <PASS/FAIL>
- operation-candidate-inventory.md: <候補件数>
- attribution-decision.md: <decision 1 行>
- single-record.md: <PASS/FAIL>
- redaction-checklist.md: <PASS (0 件) / FAIL>
- read-only-checklist.md: <PASS (mutation command 0 + optional 差分 0 / fallback evidence) / FAIL>

## 次アクション

(confirmed) Phase 12 で cross-reference-plan.md を作成し、親 workflow へ追記
(unattributed) Phase 12 で recurrence-prevention-formalization.md を作成し、反映先へ追記
```

## 完了条件

- [ ] docs-only / NON_VISUAL 必須 trio（main / manual-smoke-log / link-checklist）を含む必須成果物すべて実体存在
- [ ] redaction PASS (G1)
- [ ] read-only evidence PASS (G2)
- [ ] 判定一意性 PASS (G3)
- [ ] AC-1〜AC-3 / AC-6〜AC-8 が evidence で裏付け済み

## 注意事項

- **本仕様書作成段階では Phase 11 を実行しない**。`spec_created` のまま据え置く。
- 実 Phase 11 実行はユーザーの明示指示で起動する。

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

## 統合テスト連携

- docs-only / NON_VISUAL のため UI 統合テストは対象外。Phase 11 の read-only audit evidence と Phase 12 compliance check で検証する。
