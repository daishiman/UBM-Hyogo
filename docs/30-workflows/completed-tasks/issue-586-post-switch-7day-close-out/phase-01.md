# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #586 の要件を確定する。親 Issue #549 で `implemented-local` 状態に止まっている production switch を、**7 日 hourly evidence の自動収集 + サマリ集計 + SSOT `pass_runtime_synced` 昇格** という close-out として完遂する。本サイクルは workflow YAML 改修と SSOT 同期を 1 PR で完成させ、実 168 hourly run の収集は外部時間依存（CONST_007 例外条件 1）として 2 段コミット構成にする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 1-1 | Gate-RUNTIME-CLASSIFIER-SET / Gate-RUNTIME-7DAY / Gate-LEAKAGE-CLEAN-7DAY / Gate-FALLBACK-RATE の 4 Gate を確定する |
| 1-2 | 本サイクル scope を `workflow YAML 改修 + 7day summary job 新規 + SSOT 4 ファイル昇格 + 2 段 evidence コミット` に限定する |
| 1-3 | 4 観測軸（Issue 起票数 / fallback rate / leakage grep / p95 latency）を親 #549 から継承し、`expectedSnapshots: 168` の件数検証を必須化する |

## 真の論点

- 論点 1: 本タスクで `pass_runtime_synced` 昇格まで本当に「実行」するのか
  - 結論: workflow YAML 編集 / 7day summary job 追加 / SSOT 文言更新は本サイクル PR で完遂する。**昇格時刻** は 7 日完走後の close-out コミットで切る。CONST_007 例外条件 1（外部時間依存）を本仕様書に明記。
- 論点 2: `CF_AUDIT_CLASSIFIER=ml` の GitHub Variables 設定を本タスクで行うか
  - 結論: 本タスクは workflow YAML 側に `vars.CF_AUDIT_CLASSIFIER` 参照を追加するまで。Variables 値の `ml` 設定は **`gh variable set --env production --body "ml"` を Phase 6 ステップ 4 でユーザー明示承認のもと実行**する（Cloudflare 系 secret ではないため `scripts/cf.sh` 経由ではないが、PR merge とは独立の手動 1 step として扱う）。
- 論点 3: 7 日サマリ job を既存 `cf-audit-log-monitor.yml` 内 schedule で兼務するか別 workflow にするか
  - 結論: **別 workflow** (`cf-audit-log-7day-summary.yml`) に分離する。理由: hourly job と sched 間隔が異なり（hourly vs 7 日 1 回）、artifact download の粒度も違うため、`if: github.event.schedule == '...'` で分岐させるよりファイル分割の方が観測性が高い。
- 論点 4: 7 日 summary 出力を直 push するか PR 起票か
  - 結論: `peter-evans/create-pull-request@v6` で別ブランチ PR 起票。直 push は `dev` / `main` どちらも禁止（CLAUDE.md branch protection）。
- 論点 5: artifact retention 日数
  - 結論: `retention-days: 8`。7 日 + 1 日のマージン。GitHub 既定 90 日より短縮し、stale artifact の蓄積を防ぐ。
- 論点 6: hourly fail を許容するか
  - 結論: leakage grep positive で hourly job を fail させる（`--exit-on-detect`）。fallback rate alert は **Issue 起票のみで hourly run 自体は fail させない**（false positive で hourly が連続 fail すると observability 自体が壊れるため）。

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | 親 #549 の implemented-local を pass_runtime_synced へ昇格し、ML 切替の 7 日 evidence を恒久 artifact として残す |
| 実現 | workflow YAML 編集 + 7day summary job 1 本追加 + SSOT 文言更新で完結。新規 TS code は 0（既存 observation script の引数追加のみ） |
| 整合 | 親 #549 の Classifier interface / D1 列 / leakage grep / observation script を一切変更せず、呼び出し step の追加に閉じる |
| 運用 | rollback は GitHub Variables の `threshold` 戻し 1 行 + workflow YAML revert PR。D1 schema は不変 |

## Gate decision table

| 判定状態 | 条件 | 結論 |
| --- | --- | --- |
| 本サイクル PR merge 可 | workflow YAML diff + 7day summary YAML + SSOT 4 ファイル diff が揃い focused test pass | merge する（昇格時刻は D+7 まで保留） |
| 本サイクル merge 不可 | focused test fail / leakage grep gate が新規仕様で broken | 修正してから再度 PR |
| D+7 昇格可 | 168 snapshots / leakage 7 日連続 clean / fallback rate mean ≤ 0.05 | `outputs/phase-11/evidence/` に 4 ファイル追加 + SSOT を `pass_runtime_synced` 文言で再 commit |
| D+7 昇格不可 | snapshots 不足 / leakage positive / fallback rate 超 | `pass_runtime_synced` 昇格を見送り、`pass_boundary_synced_runtime_pending` 維持。再観測 7 日サイクルへ |
| 切替後 rollback | 7 日観測中に致命検知 | `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` 1 行戻し + revert PR |

## 確定要件

- production env で `CF_AUDIT_CLASSIFIER=ml` を `vars.` 参照する `env:` ブロックを `.github/workflows/cf-audit-log-monitor.yml` に追加する
- hourly artifact upload step（`actions/upload-artifact@v4`、`retention-days: 8`）を hourly job 末尾に追加する
- hourly post-step に `secret-leakage-grep.ts --exit-on-detect`（hourly fail 化）を追加する
- hourly post-step に `fallback-rate-alert.ts --threshold 0.05 --consecutive-hours 3`（Issue 起票のみ・hourly fail させない）を追加する
- `.github/workflows/cf-audit-log-7day-summary.yml` を新規追加する（schedule + workflow_dispatch）
- 7day summary job は cross-run `gh api` artifact zip download で 168 snapshots と run URL 一覧を取得 → `post-switch-monitor.ts --aggregate --expected-snapshots=168 --require-non-skeleton` → aggregate gate → `peter-evans/create-pull-request@v6` で evidence PR 起票
- SSOT 4 ファイルを `pass_runtime_synced` 文言と canonical evidence path で更新する
- D1 schema は変更しない（forward-safe）
- D+7 close-out コミットで `outputs/phase-11/evidence/` に 4 ファイル追加

## artifacts.json metadata

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created",
  "parent_issue": 549,
  "issue": 586,
  "promotion_target_state": "pass_runtime_synced",
  "external_time_dependency": "168h post merge"
}
```

## AC（再掲）

`index.md` AC-1〜AC-15 を本 Phase で確定とする。

## 完了条件

- [ ] 4 Gate（CLASSIFIER-SET / 7DAY / LEAKAGE-CLEAN-7DAY / FALLBACK-RATE）を `outputs/phase-01/main.md` に記述
- [ ] 本サイクル実装スコープ（workflow YAML + 7day summary YAML + SSOT 4 + 2 段 evidence コミット）を確定
- [ ] 親 #549 の Classifier interface / D1 列 / observation script を変更しない方針を明記
- [ ] forward-safe rollback の手順（GitHub Variables 1 行戻し + workflow YAML revert PR、D1 列残置）を明記

## 出力

- `outputs/phase-01/main.md`

## 成果物/実行手順

- `index.md` の Gate decision table と整合することを確認する。
- `pass_runtime_synced` 昇格は D+7 close-out コミットで行うため、本サイクル merge 時点では `implemented-local` を維持する。

## 参照資料

- `index.md`
- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-01.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/index.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-01.md`

## 統合テスト連携

- 本 Phase は要件確定のみ。test 追加は Phase 7 で計画する。
