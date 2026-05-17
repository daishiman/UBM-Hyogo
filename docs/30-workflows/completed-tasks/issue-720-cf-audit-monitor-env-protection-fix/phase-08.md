# Phase 8: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント更新 |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (受入確認) |
| 状態 | completed |

## 目的

本タスクで生じた運用変更を正本ドキュメントに反映する。具体的には:

1. `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に operation note を追加
2. environment-separation-adr を `accepted` に昇格 + 正本パスに転記
3. CLAUDE.md / unassigned-task 原典の状態同期

## 更新対象ドキュメント

### 1. `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

末尾に以下のセクションを追加（具体的 diff 案）:

```markdown
## 監視系 workflow と deploy 系 workflow の environment 分離原則

### 背景

`cf-audit-log-monitor.yml` (hourly read-only snapshot) が `environment: production` を
指定していたため、`dev` ブランチからの schedule trigger が branch policy で
拒否され、issue #720 として 30 日以上 silently fail を続けた。

### 原則

- **監視系 workflow** (read-only / mutation を伴わない): `environment:` を指定しない。
  必要な secrets は **repository-level secret** として管理する。
- **deploy 系 workflow** (deploy / rollback / schema apply 等): 引き続き
  `environment: production` 等を指定し branch policy で保護する。
- 監視系 secret は **read-only token に限定** する。mutation 権限のある token を
  repo-level に複製してはならない。

### 該当 workflow

| workflow | 種別 | environment 指定 |
| --- | --- | --- |
| `cf-audit-log-monitor.yml` | 監視系 (hourly read-only) | なし |
| `cf-audit-log-7day-summary.yml` | 集計系 (read-only) | なし |
| (deploy workflows) | deploy 系 | `production` / `staging` 等 |

### 関連

- issue #720
- ADR: docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/outputs/phase-02/environment-separation-adr.md
```

### 2. ADR の昇格

`outputs/phase-02/environment-separation-adr.md` の `status: proposed` を `status: accepted` に書き換え、本 PR 内で commit する。

### 3. unassigned-task 原典の状態同期

`docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md` のステータスを以下のように更新:

```yaml
# Before
| ステータス | 未実施（user 承認待ち：GitHub environment 保護変更） |

# After
| ステータス | consumed_via_issue_720_followup_spec (採用方針: 案B' / spec at docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/) |
```

または fold-state sync ルールに従い `completed-tasks/` 配下に移送する（Phase 12 で確定）。

### 4. CLAUDE.md への追記要否確認

CLAUDE.md は本仕様書では更新不要（運用原則は `15-infrastructure-runbook.md` 側に集約）。CLAUDE.md は project 直下の正本だが「workflow の environment 分離」は infrastructure layer の話題のため runbook 側に置く。

## 更新しないドキュメント

| パス | 理由 |
| --- | --- |
| `docs/00-getting-started-manual/specs/00-overview.md` | システム全体概要に影響しない |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | API schema 不変 |
| `apps/api/` / `apps/web/` 配下 docs | application code 変更なし |

## 不変条件

- runbook 追記は **既存セクションを破壊しない**。末尾追加のみ。
- ADR のファイルパスは `outputs/phase-02/` のまま正本とする（重複転記しない）。runbook からの参照 link で対応。
- unassigned-task 原典の `completed-tasks/` 移送タイミングは Phase 12 fold-state sync で決定。

## documentation-changelog への記録

Phase 12 `outputs/phase-12/documentation-changelog.md` に以下を記録:

| 種別 | パス | 変更内容 |
| --- | --- | --- |
| 更新 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 末尾に「監視系 workflow と deploy 系 workflow の environment 分離原則」セクション追加 |
| 更新 | `outputs/phase-02/environment-separation-adr.md` | status を accepted に昇格 |
| 更新 (or 移送) | `docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md` | ステータスを consumed_via_issue_720_followup_spec に更新、または completed-tasks/ に移送 |

## 実行タスク

- [ ] `outputs/phase-08/docs-updates.md` を作成し、上記 4 件の更新計画を列挙
- [ ] 15-infrastructure-runbook.md に追加するセクション案を確定

## 次 Phase

- 次: 9 (受入確認)
- 引き継ぎ事項: 上記 4 件の更新が Phase 09 受入確認の対象になる
