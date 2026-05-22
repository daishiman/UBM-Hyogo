# Phase 4: タスク分解

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | completed |

## 目的

Phase 3 GO 後の設計から、実行可能な最小タスク単位に分解し、依存関係 / クリティカルパス / user-gate 境界を明確化する。

## タスク分解一覧

| ID | タスク | 種別 | 担当 | 依存 | user-gate | 所要 |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 | 事前 inventory: repo / production env の secrets / vars 一覧取得 | read-only | Claude | なし | no | 5 min |
| T-02 | 1Password 正本パス確認チェックリスト作成 | docs | Claude | T-01 | no | 10 min |
| T-03 | 必要 secrets 5 件の repo-level 投入 | mutation | user | T-02 | **yes** | 10 min |
| T-04 | 必要 variables 9 件の repo-level 投入 | mutation | user | T-02 | **yes** | 10 min |
| T-05 | repo-level 投入完了確認 (`gh secret list` / `gh variable list`) | read-only | Claude | T-03, T-04 | no | 2 min |
| T-06 | `.github/workflows/cf-audit-log-monitor.yml` L39 削除 | code | Claude | T-05 | no（local file edit only） | 5 min |
| T-07 | actionlint / yaml 構文確認 | verify | Claude | T-06 | no | 2 min |
| T-08 | feature ブランチに commit、push、PR を `dev` ベースに作成 | git | user/Claude after explicit approval | T-07 | **yes** | 10 min |
| T-09 | PR を `dev` に merge | git | user | T-08 | **yes** | 5 min |
| T-10 | `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev` 実行 | runtime | user/Claude after explicit approval | T-09 | **yes** | 5 min |
| T-11 | dry_run の run URL を `outputs/phase-11/workflow-dispatch-dryrun.md` に記録 | docs | Claude | T-10 | no | 5 min |
| T-12 | hourly schedule の最初 6 run を観察 (wallclock 6 hours+) | runtime | Claude | T-11 | no | 6h+ |
| T-13 | 6 連続 success の run URL を `outputs/phase-11/runtime-evidence/6h-success.md` に記録 | docs | Claude | T-12 | no | 10 min |
| T-14 | 15-infrastructure-runbook.md / ADR を追記 | docs | Claude | T-13 | no | 30 min |
| T-15 | Phase 12 の 7 必須 output を作成 | docs | Claude | T-14 | no | 60 min |
| T-16 | Phase 13 PR 振り返り、最終承認 | gate | user | T-15 | **yes** | 30 min |
| T-17 | 後続 followup: production env 側 secret 削除タスクを unassigned-task に登録 | docs | Claude | T-13 | no | 10 min |

## クリティカルパス

```
T-01 → T-02 → T-03/T-04 (parallel, user-gated)
            → T-05 → T-06 → T-07 → T-08
            → T-09 (user-gated merge)
            → T-10 → T-11
            → T-12 (6h wallclock) → T-13
            → T-14 → T-15 → T-16
```

クリティカルパス上の wallclock 最長は T-12 (6h+ runtime 観察)。設計 / コード作業は数時間で完了するが、6 連続 success 確認のため最低 6 時間のリードタイムが必要。

## user-gate 境界

| ゲート | 操作 | Claude 自律実行 |
| --- | --- | --- |
| T-03 | `gh secret set` 5 件 | **禁止** |
| T-04 | `gh variable set` 9 件 | **禁止** |
| T-08 | `git commit` / `git push origin <feature>` / `gh pr create` | **禁止**。user 明示承認後のみ |
| T-09 | PR merge to `dev` | **禁止**。user 明示承認後のみ |
| T-10 | `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev` | **禁止**。merge 後かつ user 明示承認後のみ |
| T-16 | 最終承認 | **必須** |

## 並列化可能タスク

- T-03 (secrets) と T-04 (vars) は並列実行可
- T-14 (docs 追記) と T-12 (6h 観察) は並列実行可

## ブロッキング条件

| ID | ブロック条件 |
| --- | --- |
| T-06 | T-05 で secrets / vars 揃いを確認するまで yaml 差分を commit / push しない。ただし local file edit と spec sync は可能 |
| T-10 | T-09 で merge 完了するまで dry_run しない（dev ブランチに変更が乗っていないと意味がない） |
| T-13 | T-12 で 6 run 全 success を確認するまで evidence 記録しない |
| T-17 | T-13 で 6h success 確定後でないと「production env 側 secret 削除」followup の前提が成立しない |

## DoR / DoD

### DoR (Definition of Ready, タスク開始可能条件)

- Phase 3 GO 判定済
- ADR が accepted 状態
- 1Password 正本パスが Phase 06 までに確認済

### DoD (Definition of Done, タスク完了条件)

index.md の AC-1〜AC-8 を全て満たすこと:
- workflow yaml diff applied (T-06, T-07)
- secrets / vars repo-level 投入完了 (T-03, T-04, T-05)
- dry_run success (T-10, T-11)
- 6 連続 hourly success (T-12, T-13)
- runbook / ADR 追記 (T-14)
- Phase 12 の 7 必須 output 揃い (T-15)
- 後続 followup 登録 (T-17)
- PR merged (T-09) / 最終振り返り完了 (T-16)

## 実行タスク

- [ ] `outputs/phase-04/task-breakdown.md` を作成
- [ ] `outputs/phase-04/critical-path.md` を作成

## 次 Phase

- 次: 5 (実装計画)
- 引き継ぎ事項: T-01〜T-17 の依存関係と user-gate 境界、wallclock 6h+ の計画
