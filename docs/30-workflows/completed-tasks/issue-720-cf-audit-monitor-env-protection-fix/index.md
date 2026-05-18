# issue-720-cf-audit-monitor-env-protection-fix - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `.github/workflows/cf-audit-log-monitor.yml` の `environment: production` 行 1 行を削除するコード差分を伴う。設定単独・docs-only では完結しない。さらに repository-level secrets / variables への複製という外部 governance mutation も必須。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-720-cf-audit-monitor-env-protection-fix |
| タスク名 | `cf-audit-log-monitor.yml` の `environment: production` 解除（案B': environment なし + repo-level mirror）による hourly snapshot 復旧 |
| ディレクトリ | docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix |
| 親 Issue | #720 (CLOSED, 2026-05-16T13:02:38Z closed) |
| 親 workflow | docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/ |
| 原典 (unassigned-task) | docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md |
| GitHub Issue URL | https://github.com/daishiman/UBM-Hyogo/issues/720 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | implemented_local_runtime_pending |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | High（hourly snapshot 連続 failure 中。168h 集約前提を満たすため早急復旧が必要） |

## 採用方針 (user 承認済み・固定)

**案B': workflow から `environment: production` 指定を外し、必要 secrets / variables を repository-level で同名参照する**

選定理由:

- `cf-audit-log-monitor.yml` は production resource の読み取り、GitHub Issue 起票、Slack/mail 通知だけを行い、deploy / rollback / schema apply は行わない。本来 deployment environment gate は不要。
- production env の branch policy (`main` のみ許可) はそのまま維持できる → deploy 系経路の保護は弱体化しない。
- 新 environment を増設しないため管理面が最小。
- user 指示「最高品質かつ管理最小」に合致。

## 目的

`cron: '5 * * * *'` で毎時動く `cf-audit-log-monitor.yml` を `dev` ブランチから実行可能にし、post-merge の dry run と hourly success 観測へ進める状態を作る。6 連続 hourly snapshot 成功は復旧安定性 evidence、D'+0 は runbook 正本どおり「root cause 修正 PR merge 後、最初に success となった hourly run」を user が別途宣言する。production environment 保護トポロジーは変更しない。

## スコープ

### 含む

- `.github/workflows/cf-audit-log-monitor.yml` L39 `    environment: production` 1 行の削除（**コード差分はこの 1 行のみ**）
- repository-level secrets / variables への必要値複製計画（実投入は user-gated）
- ADR / runbook 追記: 「監視系 (read-only) workflow と deploy 系 workflow の environment 分離原則」
- workflow_dispatch dry_run 検証手順と placeholder evidence の配置（実行は user-gated）
- hourly schedule の 6 連続 success runtime evidence 手順と placeholder evidence の配置（実行は user-gated）
- production env 側の monitor 専用 secrets 削除手順（**実施は別 followup**・本タスクは記述のみ）

### 含まない

- production environment 自体の branch policy / required reviewers / wait timer 変更
- 新規 environment (`monitor-readonly` 等) の作成
- secrets の値変更（同名 repo 複製のみ）
- `cf-audit-log-7day-summary.yml` の挙動修正（PR-A で完了済）
- `pass_runtime_synced` 昇格作業（PR-B 範疇）
- D'+0 起算（本タスク完了後に user が別途実施）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md | 原典タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/ | 親 workflow / runtime 起動前提 |
| 必須 | .github/workflows/cf-audit-log-monitor.yml | 変更対象 workflow |
| 必須 | CLAUDE.md | Secret 管理 / `scripts/cf.sh` ルール / solo 運用ポリシー |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | runbook 追記対象 |
| 参考 | https://docs.github.com/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment | environment protection rules 仕様 |

## 受入条件 (AC)

### Local Acceptance

- **AC-1**: `cf-audit-log-monitor.yml` から `environment: production` 行が削除され、他の差分が無い（最小差分原則）ことが Phase 02 設計 / Phase 06 実装手順に明文化されている。
- **AC-2**: workflow が参照する secrets / vars の repository-level 複製計画が `outputs/phase-02/secret-migration-plan.md` に列挙されている（実投入は user-gated）。
- **AC-3**: Phase 11 に dry run / 6h success / heartbeat / inventory の `PENDING_USER_GATE` placeholder evidence が物理配置され、runtime PASS と混同していない。
- **AC-4**: 監視系 / deploy 系の environment 分離原則 ADR が `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に追記されていることが Phase 08 で確認されている。
- **AC-5**: production env 側 secret は本タスク完了時点で削除しない（移行期間の安全弁）。削除は user-gated followup として `outputs/phase-12/unassigned-task-detection.md` に記録されている。
- **AC-6**: Phase 12 で 7 必須 output（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が揃っており、`phase12-task-spec-compliance-check` が local readiness PASS / runtime pending を明記している。
- **AC-7**: CLOSED Issue #720 への状態同期方針（Phase 12 fold-state sync）が `outputs/phase-12/unassigned-task-detection.md` に記録されている。
- **AC-8**: aiworkflow-requirements / task-specification-creator の正本索引と skill feedback が同一 wave で更新されている。

### Runtime Acceptance (Phase 13 / post-merge)

- **RAC-1**: user 承認・repo secret/variable 投入・push/merge 後に `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev` が success であることが Phase 11 evidence に run URL 付きで記録されている。
- **RAC-2**: user 承認・merge 後 hourly schedule の **6 連続 run が success** であることが Phase 11 NON_VISUAL evidence (`outputs/phase-11/runtime-evidence/6h-success.md`) に run URL 付きで記録されている。
- **RAC-3**: D'+0 は runbook 正本どおり、root cause 修正 PR merge 後の最初の successful hourly run を user が別途宣言する。

## Phase 一覧（本仕様書の対象範囲）

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | phase-01.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{workflow-diff,secret-migration-plan,environment-separation-adr}.md |
| 3 | 設計レビュー | phase-03.md | completed | phase-03.md |
| 4 | タスク分解 | phase-04.md | completed | phase-04.md |
| 5 | 実装計画 | phase-05.md | completed | phase-05.md |
| 6 | 実装手順 | phase-06.md | completed | phase-06.md |
| 7 | テスト計画 | phase-07.md | completed | phase-07.md |
| 8 | ドキュメント更新 | phase-08.md | completed | phase-08.md |
| 9 | local 受入確認 | phase-09.md | completed | phase-09.md / outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | phase-10.md |
| 11 | NON_VISUAL evidence | phase-11.md | runtime_pending | outputs/phase-11/{visual-verification-skip,inventory-before,workflow-dispatch-dryrun,runtime-evidence/6h-success,runtime-evidence/hourly-runs,runtime-evidence/heartbeat-after}.md/json/txt |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked_pending_user_approval | outputs/phase-13/pr-summary.md |

## 不変条件

1. **コード差分は L39 削除のみ**: `.github/workflows/cf-audit-log-monitor.yml` の他箇所、特に secrets 参照名 (`secrets.CF_AUDIT_D1_TOKEN_PROD` 等) は **変更しない**（repo secret に同名で複製するため）。
2. **`gh secret set` / `gh variable set` 等の repository-level secret 操作は user 明示承認後のみ実行**。Claude 自律禁止。
3. **`gh api -X PUT repos/:owner/:repo/environments/production` 等の environment mutation は実施しない**。production env はそのまま維持。
4. **移行順序厳守**: (a) repo secrets / vars 複製 → (b) workflow yaml の `environment: production` 行削除を user 承認後に commit / push / merge → (c) user 承認後に workflow_dispatch dry_run success 確認 → (d) hourly 6 連続 success 確認 → (e) production env 側 secret 削除（別 followup）。
5. **CLOSED Issue を reopen しない**。Phase 12 fold-state sync で `superseded` / `consumed` 等の状態を unassigned-task 原典に同期する方針を記述。
6. **recovery 2nd cycle の D'+0 起算は本タスクスコープ外**。runbook 正本は「root cause 修正 PR merge 後、最初の successful hourly run」。6 連続 success は安定性 evidence であり D'+0 定義ではない。
7. **CONST_007 遵守**: 本サイクル内で Phase 1〜12 と local implementation を完了。commit / push / PR / `gh secret set` / `gh variable set` / `gh workflow run` 等の external mutation は user-gated。
8. **CLAUDE.md secret 管理ルール準拠**: 実値は 1Password に保管。Claude は `.env` の中身を読まない。`gh secret set` の body は `op read op://...` 経由で動的注入する手順を明示。

## リスクと緩和策

| リスク | 影響度 | 発生確率 | 緩和策 |
| --- | --- | --- | --- |
| repo secret 複製漏れで workflow が 401/403 fail | 高 | 中 | Phase 02 で必要 secrets / vars を全数列挙し、Phase 07 で `gh secret list` の差分検証手順を明示 |
| `environment: production` 削除直後の最初 run が secret 不在で fail | 高 | 中 | 順序を「repo secret 投入 → workflow 差分 merge」に厳格化（Phase 06 / Phase 09） |
| production env 側 secret を性急に削除して rollback 不能化 | 中 | 低 | 移行期間中は production env 側 secret を維持。削除は別 followup として記録（AC-6） |
| repo-level secret は private repo 全 workflow からアクセス可能になり security boundary が広がる | 中 | 高（仕様） | ADR で「監視系 read-only secret に限定」原則を明文化し、deploy 系 secret は production env 側に維持し repo に複製しない |
| dev ブランチでの workflow_dispatch test 中に本物 hourly 経路と重複起動 | 低 | 中 | `concurrency.group: cf-audit-log-monitor` が既に設定済（`cancel-in-progress: false`）で直列化される。Phase 07 で確認 |
| CLOSED Issue が再発見扱いされ workflow 状態管理と乖離 | 低 | 中 | Phase 12 fold-state sync で原典 unassigned-task を `consumed_via_issue_720_followup_spec` 等で同期 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | phase-01.md | 要件定義主成果物 |
| ドキュメント | outputs/phase-02/workflow-diff.md | workflow yaml 差分計画（AC-1） |
| ドキュメント | outputs/phase-02/secret-migration-plan.md | secrets / vars 複製計画（AC-2） |
| ドキュメント | outputs/phase-02/environment-separation-adr.md | 監視系 / deploy 系の environment 分離 ADR（AC-5 ドラフト） |
| ドキュメント | phase-03.md | 設計レビュー結果 |
| ドキュメント | outputs/phase-11/runtime-evidence/6h-success.md | hourly 6 連続 success placeholder / post-merge 記録（RAC-2） |
| ドキュメント | outputs/phase-11/workflow-dispatch-dryrun.md | dry_run placeholder / post-merge 記録（RAC-1） |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 strict compliance 検証 |
| 管理 | artifacts.json | root workflow state / Phase 1-13 status |
| 管理 | outputs/artifacts.json | outputs parity marker |

## Phase マップ

```
phase-01 (要件定義)
  └─ phase-01.md
       │
       ▼
phase-02 (設計)
  ├─ outputs/phase-02/workflow-diff.md
  ├─ outputs/phase-02/secret-migration-plan.md
  └─ outputs/phase-02/environment-separation-adr.md
       │
       ▼
phase-03 (設計レビュー)
  └─ phase-03.md
       │
       ▼
phase-04〜10 (実装〜リファクタ / local spec のみ)
       │
       ▼
phase-11 (NON_VISUAL runtime evidence)
  ├─ outputs/phase-11/workflow-dispatch-dryrun.md
  └─ outputs/phase-11/runtime-evidence/6h-success.md
       │
       ▼
phase-12 (正本同期 / 7 必須 output)
       │
       ▼
phase-13 (PR・振り返り / user approval gate)
```

## 注意点

- GitHub Issue #720 は CLOSED 済みだが、原典 unassigned-task は **未実施** だった。本仕様書で local implementation 計画と正本同期まで完了し、external ops (repo secret 投入 / PR merge) は user-gated として残す。
- 本タスクは hourly snapshot 復旧が目的であり、運用復旧後の D'+7 集計や `pass_runtime_synced` 昇格は親 workflow (issue-655) 側で扱う。
- recovery 2nd cycle の D'+0 起算は runbook 正本に従い、root cause 修正 PR merge 後の最初の successful hourly run を user が別途宣言する。
