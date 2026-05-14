# task-issue-577-followup-002-miniflare-undici-upstream-tracking — タスク仕様書 index

## 実装区分

**実装仕様書（条件付き）/ A/B 検知時のみ `apps/api/package.json#test:coverage` の `--maxWorkers` を編集。**

上流改善なし時はドキュメント更新のみで完了（package.json は未変更）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-issue-577-followup-002-miniflare-undici-upstream-tracking |
| ディレクトリ | docs/30-workflows/task-issue-577-followup-002-miniflare-undici-upstream-tracking |
| 親タスク / 親 workflow | docs/30-workflows/completed-tasks/issue-577-api-coverage-rerun-miniflare-port-exhaustion |
| GitHub Issue | #616（CLOSED — 再オープンせず仕様書化のみ） |
| 発見元 | Issue #577 Phase 12 implementation-guide.md / unassigned-task placeholder |
| 発見日 | 2026-05-09 |
| 作成日 | 2026-05-11 |
| Wave | followup |
| 実行種別 | sequential（triage → 条件分岐 A/B） |
| 担当 | qa-tests / infra-runbook |
| 状態 | verified_current_no_code_change_pending_pr |
| タスク種別 | implementation / NON_VISUAL（CLI evidence 主体） |
| visualEvidence | NON_VISUAL |

## purpose

Issue #577 で `EADDRNOTAVAIL` 抑制のために導入した軸B（`--maxWorkers=1 --minWorkers=1`）は症状抑制であり、Miniflare / undici / workerd 側で socket pool / keep-alive / port reuse 関連の改善が入れば worker cap を 2/4/auto に戻して CI 速度を回復できる可能性がある。本タスクは (a) 上流追跡フローを明文化し、(b) 直近リリースを実トリアージし、(c) 改善検知時は A/B 評価で採用可否を判定し、(d) `apps/api/package.json#test:coverage` の `--maxWorkers` 値の更新可否を結論づける。

**CONST_007: 本仕様書は単独で 1 サイクル完了するスコープ。「上流改善が出たら別タスク化」という先送りは禁止。今回サイクル内で現時点の上流リリースをトリアージし、結論（採用 or 維持）を必ず出す。**

## scope in / out

### scope in

- 追跡対象 repo 3 件（`cloudflare/workers-sdk` / `nodejs/undici` / `cloudflare/workerd`）の release / changelog 取得手順
- triage キーワード 6 件（`socket`, `EADDRNOTAVAIL`, `keep-alive`, `agent pool`, `port`, `TIME_WAIT`）と判定基準の明文化
- 月次 + Miniflare メジャー更新 trigger の運用フロー
- 直近（仕様書作成時点）のリリース 1 サイクル分の実トリアージ表
- 改善検知時の A/B 実験手順（`--maxWorkers=2/4/auto` で連続 3 回 vitest 実行 / 133/133 PASS / 0 EADDRNOTAVAIL 採用条件）
- 改善検知時に限る `apps/api/package.json#test:coverage` 編集案の仕様書記載
- secret hygiene（CLOUDFLARE_API_TOKEN / GH_TOKEN 値を log に転記しない）
- 既存 `unassigned-task/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md` の consumed trace 化手順記載

### scope out

- 上流 repo への PR 提出
- `apps/api` 実装ロジック / API contract 変更
- D1 schema / migration 変更
- 改善が検知されない場合の package.json 編集
- commit / push / PR 作成（user 明示承認後 Phase 13 でのみ実施）
- Issue #616 の reopen
- 上流改善検知時の「別タスク化」による先送り（CONST_007 違反）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | issue-577-api-coverage-rerun-miniflare-port-exhaustion | 軸B 採用根拠と現状 maxWorkers=1 設定の正本 |
| 並列 | task-issue-577-followup-001 (shard CI) | 同親由来の独立 followup |
| 並列 | task-issue-577-followup-003 (D1 grouping) | 同上 |
| 下流 | （なし） | 採用 / 維持結論で完了 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md | 元 placeholder（Phase 12 で consumed trace 化） |
| 必須 | apps/api/package.json | `test:coverage` script の現状値（`--maxWorkers=1 --minWorkers=1`） |
| 必須 | CLAUDE.md | secret hygiene / scripts/cf.sh 運用ルール |
| 参考 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | CI runbook（軸B 由来記述） |

## AC（Acceptance Criteria）

- **AC-1**: 追跡対象 repo（3 件）/ キーワード（6 件）/ 頻度（月次 + Miniflare メジャー更新）が `outputs/phase-02/main.md` に固定されている。
- **AC-2**: 仕様書作成時点の `workers-sdk` / `undici` / `workerd` リリースを `gh api repos/{owner}/{repo}/releases` で取得し、改善 commit/PR の有無を `outputs/phase-11/evidence/triage-table.md` に記録している。
- **AC-3**: 改善なしの場合は「現状 `--maxWorkers=1 --minWorkers=1` 維持」を Phase 11 で明示し、`apps/api/package.json` が未変更であることを `git status apps/api/package.json` で示す evidence を保存している。
- **AC-4**: 改善ありの場合は `--maxWorkers=2` から段階評価する。候補 N は `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers={N}` を連続 3 回実行し、evidence を `outputs/phase-11/evidence/ab-{N}-run-{1,2,3}.log` に保存する。N が 1 回でも fail / EADDRNOTAVAIL / coverage regression ならその N を不採用にし、より大きい候補（`4` / `auto`）は `ab-summary.md` に `skipped_due_to_lower_candidate_failure` と明記して打ち切る。採用根拠は **133/133 PASS かつ 0 EADDRNOTAVAIL** の候補だけに限定する。
- **AC-5**: secret hygiene を `grep -E "CLOUDFLARE_API_TOKEN|GH_TOKEN|ghp_|cf_" outputs/phase-11/evidence/` 等で 0 件確認している。
- **AC-6**: 不変条件 #5（D1 直接アクセスは `apps/api` 経由のみ）と `apps/api` 実装ロジック / D1 schema 不変であることを Phase 12 で `git diff --stat apps/api/src apps/api/migrations` 0 件 evidence で確認している。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | Why（軸B 永続化リスク）/ AC-1〜6 確定 / 不変条件 trace / CONST_007 先送り禁止 |
| 2 | 設計（追跡フロー） | phase-02.md | 対象 repo 3 件 / キーワード 6 件 / 月次 + メジャー更新 trigger |
| 3 | 設計レビュー | phase-03.md | 代替案（手動 vs cron / Renovate / Dependabot）と採用根拠 |
| 4 | テスト戦略 | phase-04.md | A/B 採用判定基準（連続 3 回 PASS / 0 EADDRNOTAVAIL）/ evidence 命名規則 |
| 5 | 実装ランブック | phase-05.md | `gh api` での release 取得 → triage 表記入 → A/B 実行 runbook |
| 6 | 異常系検証 | phase-06.md | A/B flaky 化 / Miniflare major breaking / macOS↔Linux CI 差分 |
| 7 | AC マトリクス | phase-07.md | AC × verify × evidence × 不変条件 trace |
| 8 | DRY 化 | phase-08.md | triage 表テンプレート / A/B 結果記録テンプレート |
| 9 | 品質保証 | phase-09.md | secret hygiene / coverage 閾値を下げない |
| 10 | 最終レビュー | phase-10.md | GO/NO-GO 判定（改善なし=GO に維持、改善あり=A/B 完了が条件） |
| 11 | 手動評価実行 | phase-11.md | 実 release triage 結果 + （該当時）A/B evidence 保存 |
| 12 | ドキュメント更新 | phase-12.md | unassigned placeholder の consumed trace 化 / changelog / aiworkflow-requirements 同期 |
| 13 | PR 作成 | phase-13.md | user 承認後のみ。base=dev。Issue #616 は CLOSED のまま |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-05/main.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/        # triage-table.md + （該当時）ab-*-run-*.log
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/documentation-changelog.md
outputs/phase-13/main.md
```

Phase 11 evidence は実行時に生成。改善検知なし時は `triage-table.md` + `pkg-unchanged.log`（`git status` 出力）のみ。検知時は加えて `ab-{N}-run-{1,2,3}.log`（N=2,4,auto）を保存。

## CONST_005 必須項目

| 項目 | 値 |
| --- | --- |
| 変更対象ファイル | `apps/api/package.json`（A/B 採用時のみ） / `outputs/phase-11/evidence/` 配下（追跡表 + A/B evidence 新規追加） / `docs/30-workflows/unassigned-task/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md`（consumed trace 化） |
| 関数シグネチャ | なし（package.json scripts 値変更のみ） |
| 取り得る値範囲 | `--maxWorkers` ∈ {`1`, `2`, `4`, `auto`}。現状は `1`。採用候補は `2` / `4` / `auto`。`0` / 負値禁止 |
| 入出力 | 入力 = 上流 release / changelog、出力 = triage 表 + 採用 `--maxWorkers` 値 + （該当時）package.json 編集案 |
| テスト方針 | `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers={N}` を連続 3 回 / 133/133 PASS / 0 EADDRNOTAVAIL のみ採用 |
| 実行コマンド | `gh api repos/cloudflare/workers-sdk/releases` / `gh api repos/nodejs/undici/releases` / `gh api repos/cloudflare/workerd/releases` |
| DoD | (a) 上流改善なし → triage 表 + 「現状 maxWorkers=1 維持」 + `pkg-unchanged.log` で完了 / (b) 上流改善あり → A/B evidence + package.json 編集案を Phase 12 implementation-guide に記載 |

## invariants touched

- **#5（中心）** D1 直接アクセスは `apps/api` 経由のみ — 本タスクは package.json scripts のみ編集対象で D1 binding に触れない
- **CONST_002** commit/push/PR は user 指示前は禁止 — Phase 13 は user 明示承認後のみ実行
- **aiworkflow-requirements 不変** Cloudflare runtime / Workers binding 仕様は変更しない

## completion definition

### verified_current_no_code_change_pending_pr completion

- Phase 1〜13 の仕様ファイル（13 個）と `outputs/phase-12/` 必須 7 ファイルが存在する
- root `artifacts.json` を作成済み（Phase 1〜12 status = `completed`、Phase 13 = `blocked`）
- 2026-05-11 の Phase 11 実 triage evidence が存在し、改善なし / package 未変更 / secret hygiene / apps-api untouched を確認済み
- aiworkflow-requirements の current task inventory に本 workflow を `verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / conditional` として同期済み

### executed completion

- AC-1〜6 が Phase 7 マトリクスで完全トレース
- triage 表 + （該当時）A/B evidence + `pkg-unchanged.log` or 採用 maxWorkers 値が evidence/ に保存
- secret hygiene grep 0 件確認済み
- unassigned placeholder が consumed trace 化済み（Phase 12）
- Phase 13 で user 承認後に PR 作成完了
- GitHub Issue #616 は CLOSED のままで再オープンしない
