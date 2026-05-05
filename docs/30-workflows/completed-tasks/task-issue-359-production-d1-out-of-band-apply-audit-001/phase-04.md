# Phase 4: テスト戦略（監査検証戦略）

[実装区分: ドキュメントのみ仕様書]

## 目的

監査タスクは「コードのテスト」ではなく「監査結果の検証」を行う。本 Phase では監査結果が AC を満たすことを確認する検証戦略を定義する。

## 検証カテゴリ

| カテゴリ | 内容 | 検証方法 | 対応 AC |
| --- | --- | --- | --- |
| 事実取得 | `d1_migrations` ledger の applied timestamp が Phase 13 evidence と一致 | `outputs/phase-11/d1-migrations-ledger.md` と `task-issue-191.../verification-report.md` の値 diff | AC-1 |
| 候補網羅 | 2026-05-01 前後の operation 候補が漏れなく列挙 | `git log` 範囲と inventory 件数の整合 | AC-2 |
| 判定一意性 | 出所判定が `confirmed` または `unattributed` の二値で確定 | `outputs/phase-11/attribution-decision.md` の最終行に decision 一行のみ | AC-3 |
| 反映方針 | confirmed → cross-reference / unattributed → 再発防止策のいずれかが必ず確定 | Phase 12 で対応する追加成果物が存在 | AC-4 / AC-5 |
| 単一レコード | timestamp / command / approver / workflow が同一レコード | `single-record.md` のテーブル列構造 | AC-6 |
| redaction | secret 値が成果物に混入していない | `rg -n "(token=|secret=|Bearer\s|cf_api_)"` が `outputs/` 配下で 0 件 | AC-7 |
| read-only | allowlist 外コマンドが実行されず、production mutation が発生していない | `commands-executed.md` の allowlist 照合 + 可能な場合は監査前後の `d1_migrations` ledger row 数一致。local wrangler blocked 時は parent ledger snapshot + GitHub/git read-only transcript で代替 | AC-8 |
| Phase 12 7 ファイル | 7 固定成果物が実体配置 | `ls outputs/phase-12/` で 7 ファイル以上 | AC-9 |

## 検証コマンド

```bash
# AC-1: timestamp 整合
diff <(grep -E "0008_(schema_alias_hardening|create_schema_aliases)" \
        outputs/phase-11/d1-migrations-ledger.md) \
     <(grep -E "0008_(schema_alias_hardening|create_schema_aliases)" \
        ../completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/verification-report.md)

# AC-3: 判定行が一意
grep -cE "^decision:\s+(confirmed|unattributed)" outputs/phase-11/attribution-decision.md
# 期待: 1

# AC-7: secret 漏洩スキャン
rg -n -i "(token=|secret=|Bearer\s+[A-Za-z0-9]|cf_api|api_token|oauth_token)" outputs/
# 期待: 0 件

# AC-8: read-only 検証（mutation 0 件 + ledger 補助証跡）
# commands-executed.md で allowlist 外コマンドが 0 件であることを確認
rg -n "migrations apply|d1 execute|deploy|rollback|wrangler " outputs/phase-11/commands-executed.md
# 期待: 0 件

# 監査前: bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production | wc -l > before.tmp
# 監査後: bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production | wc -l > after.tmp
# diff before.tmp after.tmp  # 期待: 差分なし
# local wrangler blocked 時は parent workflow Phase 13 の ledger snapshot と
# GitHub Actions / git read-only transcript を read-only fallback evidence とする。

# AC-9: 7 固定成果物
ls outputs/phase-12/main.md \
   outputs/phase-12/implementation-guide.md \
   outputs/phase-12/documentation-changelog.md \
   outputs/phase-12/system-spec-update-summary.md \
   outputs/phase-12/unassigned-task-detection.md \
   outputs/phase-12/skill-feedback-report.md \
   outputs/phase-12/phase12-task-spec-compliance-check.md
```

## 出力 (`outputs/phase-04/main.md`)

- 検証カテゴリ表
- 各 AC に対応する検証コマンドの記載
- 監査前後 ledger 比較手順

## 完了条件

- [ ] 全 AC (AC-1〜AC-9) に対して検証手段が定義されている
- [ ] 検証コマンドがコピー&ペーストで実行可能な形式

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
