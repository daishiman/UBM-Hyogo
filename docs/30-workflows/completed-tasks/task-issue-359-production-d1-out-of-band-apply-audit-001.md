# task-issue-359-production-d1-out-of-band-apply-audit-001

## メタ情報

| Field | Value |
| --- | --- |
| Status | unassigned |
| Priority | Medium |
| Source | phase12-final-doc-update review / task-issue-191-production-d1-schema-aliases-apply-001 Phase 13 |
| Type | production-operation-audit |
| GitHub Issue | #434 (parent: #359) |

## 1. なぜこのタスクが必要か（Why）

Issue #359 の Phase 13 preflight で、production D1 `ubm-hyogo-db-prod` は `0008_schema_alias_hardening.sql` を `2026-05-01 08:21:04 UTC`、`0008_create_schema_aliases.sql` を `2026-05-01 10:59:35 UTC` に適用済みであることが判明した。対象 workflow の Phase 13 は 2026-05-02 に承認・検証されたため、どちらの apply も当該 workflow の runtime execution より前の operation である。

この状態自体は PRAGMA shape verification により安全確認済みだが、誰が、どの workflow / command / approval で先行 apply したかの監査証跡が未接続だと、将来の production operation で「承認ゲート外の変更」と「承認済みだが別 workflow の証跡」が区別できない。

## 2. 何を達成するか（What）

- `0008_schema_alias_hardening.sql` と `0008_create_schema_aliases.sql` が 2026-05-01 に production D1 へ適用された operation の出所を特定する。
- 該当する会話ログ、workflow output、PR / commit、Cloudflare audit evidence があれば current workflow から参照できる形で記録する。
- 承認ゲート外 operation だった場合は、再発防止策を task / skill feedback / runbook のいずれかに formalize する。
- 承認済みの別 workflow operation だった場合は、`task-issue-191-production-d1-schema-aliases-apply-001` の Phase 13 evidence へ cross-reference を追加する。

## 3. どのように実行するか（How）

Git log、workflow outputs、Cloudflare D1 migration ledger、必要に応じて GitHub PR / Actions / issue comments を照合する。生 secret や token は記録しない。Cloudflare 側の追加読み取りが必要な場合も、write operation は含めない。

## 4. 実行手順

1. `d1_migrations` の `0008_schema_alias_hardening.sql` / `0008_create_schema_aliases.sql` applied timestamp と current Phase 13 evidence を確認する。
2. 2026-05-01 前後の git history / docs outputs / PR timeline から該当 operation 候補を列挙する。
3. 候補ごとに approval evidence、command evidence、database target evidence を確認する。
4. 出所を確定できた場合は artifact inventory / Phase 13 main に cross-reference を追加する。
5. 出所を確定できない場合は、unattributed production operation として lessons / runbook に再発防止策を追加する。

## 5. 完了条件チェックリスト

- [ ] 先行 apply の出所が `confirmed` または `unattributed` として分類されている。
- [ ] evidence path が `task-issue-191-production-d1-schema-aliases-apply-001` から参照できる。
- [ ] 承認有無、command、target database、timestamp が記録されている。
- [ ] 必要な再発防止策または cross-reference が正本仕様に同期されている。

## 6. 検証方法

```bash
rg -n "0008_schema_alias_hardening|0008_create_schema_aliases|schema_aliases|2026-05-01 08:21:04|2026-05-01 10:59:35|ubm-hyogo-db-prod" \
  docs .claude/skills/aiworkflow-requirements
```

期待: 先行 apply の出所または unattributed 判定が追跡できる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| production operation の承認境界が曖昧なまま残る | timestamp / command / approver / workflow evidence を同一レコードで固定する |
| 監査中に write operation を混ぜる | 読み取り専用調査に限定し、必要な write は別承認タスクに分離する |
| secret や account details を過剰記録する | token / secret 実値は記録せず、redacted account / evidence path のみにする |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/main.md`
- `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/local-check-result.md`
- `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/verification-report.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260502-issue359-production-d1-schema-aliases-apply.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-task-issue-191-production-d1-schema-aliases-apply-001-artifact-inventory.md`
- Cloudflare D1 migration ledger (`d1_migrations`) on `ubm-hyogo-db-prod`
- 該当 timestamp: `2026-05-01 08:21:04 UTC` (`0008_schema_alias_hardening.sql`) / `2026-05-01 10:59:35 UTC` (`0008_create_schema_aliases.sql`)

## 9. 備考

このタスクは production operation の出所監査に限定した未割り当てタスクであり、issue-191 本体の DDL 再適用、production への新規 migration 投入、code deploy、rollback、guard 実装は含まない。`task-issue-191-direct-stable-key-update-guard-001` および `task-issue-191-schema-questions-fallback-retirement-001` とは scope が分離されている。承認境界の formalization が必要になった場合は、再発防止策を skill feedback / runbook 側へ昇格させ、本タスクからは cross-reference のみ残す。

## 苦戦箇所【記入必須】

production D1 への先行 apply は CLI wrapper を経由せず wrangler 直接実行で行われた可能性があり、以下の追跡困難性が想定される。

- **CLI wrapper 不在**: `scripts/cf.sh` を経由しない wrangler 直接実行は op-injected token のローカル環境変数しか残らず、コミット履歴・PR・workflow output から command 起点を辿れない。
- **out-of-band apply の検知タイミング**: 既適用は Phase 13 preflight の `d1_migrations` 確認で初めて顕在化したため、apply 直後ではなく数十時間後に検知された。timestamp と applier identity が単一 record で揃わない。
- **承認証跡の二重化**: 当該 workflow の Phase 13 承認は 2026-05-02 だが、実 apply は 2026-05-01。承認 workflow と実行 workflow が時系列で逆転しているように見えるため、`confirmed (別 workflow)` と `unattributed` の境界判定が機械的にできない。
- **PRAGMA shape verification 代替**: 出所が確定しない場合でも shape は安全であるため、unattributed として残すか、再発防止策を runbook へ昇格させるかの判断が属人的になる。

これらを踏まえ、本監査は「出所確定」と「unattributed 分類 + 再発防止策の formalization」の二択で完了条件を閉じる。

## スコープ（含む/含まない）

含む: 先行 production D1 apply の出所監査、cross-reference、再発防止タスク化。

含まない: production D1 への追加 migration apply、rollback、code deploy、fallback retirement、direct update guard 実装。
