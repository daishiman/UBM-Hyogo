# タスク仕様書: Issue #655 — D+7 snapshots 不足時の 2 周目 7 日観測 (recovery)

[実装区分: 実装仕様書]

判定根拠: 本タスクは親 Issue #586 (post-switch 7 day close-out) の D+7 集計で `Gate-RUNTIME-7DAY` / `Gate-LEAKAGE-CLEAN-7DAY` が満たされなかった場合の recovery タスクである。実体として (1) production code / workflow YAML 側の root cause 修正 PR、(2) `cf-audit-log-monitor.yml` の D'+0 再起点運用、(3) `cf-audit-log-7day-summary.yml` への `--recovery-mode` 出力分離、(4) SSOT 4 ファイル (`observability-monitoring.md` / `task-workflow-active.md` / Issue #549 `phase-13.md` / `15-infrastructure-runbook.md`) の `pass_runtime_synced` 昇格反映、を伴う。ユーザー指定は docs-only ではないが、目的（pass_runtime_synced 昇格）達成にコード/設定/SSOT 変更が必須のため CONST_004 デフォルトに従い実装仕様書として作成する。Issue #655 は OPEN だが、ユーザー指示に従い open/close 操作は行わず `Refs #549, Refs #586, Refs #655` で連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-655-d7-recovery-2nd-cycle |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/586 |
| 当該 Issue | https://github.com/daishiman/UBM-Hyogo/issues/655 |
| 祖父 Issue | https://github.com/daishiman/UBM-Hyogo/issues/549 |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-recovery.md` |
| 親タスク仕様 | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/` |
| 配置先 | `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/` |
| 作成日 | 2026-05-14 |
| 状態 | implemented-local-runtime-pending (`IMPLEMENTED_LOCAL_RUNTIME_PENDING`; recovery 固有ラベルは workflow_state にしない) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 優先度 | MEDIUM (issue label `priority:medium`) |
| Wave | follow-up (Issue #549 派生 FU-03-D-FU-01 / 条件付き recovery) |
| 想定 PR 数 | 2（PR-A: root cause 修正 + recovery 機能追加 / PR-B: 2 周目 evidence 追加）|
| coverage AC | 適用外（`.github/workflows/` / `scripts/cf-audit-log/observation/` 既存 helper 拡張中心。新規 unit code は `--recovery-mode` flag 追加分のみ） |

## 着手判断（着手 Gate）

本タスクは **条件起動型** + **外部時間依存** (CONST_007 例外条件 1 該当)。recovery 1 周目（168 hour）が D'+0 から開始されるため、コード/PR は今サイクル (PR-A) で完成させ、**実 run 結果収集とサマリ生成は時間経過後の close-out コミット (PR-B) で evidence 追加** する 2 段構成。各 Gate は次の通り:

- Gate-RECOVERY-TRIGGERED: 親 #586 の D+7 集計 evidence (`outputs/phase-11/evidence/hourly-run-7day-summary.json`) が `actualSnapshots < 168` または `leakageHourlyClean == false` を示していること。`recovery-rootcause.md` に欠損 root cause 分類（infrastructure / production-code / configuration / unknown のいずれか）が記載されていること。
- Gate-ROOT-CAUSE-FIXED: production-code 起因の場合、修正 PR が merge 済みで、その merge commit が `cf-audit-log-monitor.yml` の hourly run を fail させていないこと（D'-1 hour の `gh run list` で success を確認）。
- Gate-RUNTIME-7DAY-RECOVERY: PR-A merge 後、D'+0 を再設定し 168 hour 経過した時点で `outputs/phase-11/evidence/hourly-run-7day-recovery.md` に 168 hourly snapshots の URL が揃っていること。
- Gate-LEAKAGE-CLEAN-7DAY-RECOVERY: 2 周目 168 hour 連続で `secret-leakage-grep.ts` post-step が clean (exit 0)。1 hour でも positive 検出があれば本タスクでは昇格不可、上位エスカレーション。
- Gate-MAX-CYCLE-2: recovery は最大 2 周まで。2 周目でも欠損 / positive が発生した場合は本タスク内で打ち切り、infrastructure team へ escalation する旨を `recovery-rootcause.md` に追記する。canonical workflow state は `runtime_pending` に据え置き、運用ラベルとして `escalated` を記録する（独自 workflow_state は追加しない）。

## 苦戦箇所（Issue #655 本文 + 親 #586 の実観測より）

1. **artifact retention の罠**: `actions/upload-artifact@v4` の `retention-days: 8` を runbook で固定しないと、recovery 集計起動時 (D'+7) に過去 artifact が 404 になる。recovery でも同じ罠を踏むため、本タスクで retention 値を再確認する step を必須化する。
2. **cross-run artifact 取得**: `actions/download-artifact@v4` は same-run 限定。recovery でも `gh api workflows/cf-audit-log-monitor.yml/runs` + artifact zip download の 2 段経路を使う必要がある。
3. **1 周目 / 2 周目 evidence 混在**: evidence path 分離規約を最初に決めないと、aggregation script が混在 snapshots を集計し false PASS を生む。`*-recovery.*` suffix で分離する規約を本タスクで初出にする (1 周目: `hourly-run-7day*.{md,json,log}` / 2 周目: `hourly-run-7day-recovery*.{md,json,log}`)。
4. **D'+0 リセット運用**: production code 修正 PR と recovery を同 PR にまとめると、修正前 hour が recovery snapshots に混入する。code PR (PR-A) merge 後に **scheduled run の次サイクル開始時刻** を D'+0 と定義し、recovery aggregation の `--since` flag に明示する運用を本タスクで初出にする。
5. **2026-05-14 時点の実観測**: `gh run list --workflow=cf-audit-log-monitor.yml` で 2026-05-13 以降 hourly run が全件 failure (job 2 秒で startup_failure)。production-code 側の root cause 修正が PR-A 内で必須。

## リスクと対策 (forward-safe rollback)

| リスク | 検知 | 対策 (rollback) |
| --- | --- | --- |
| recovery でも snapshots 欠損が再発 | D'+7 集計 JSON の `actualSnapshots < 168` | Gate-MAX-CYCLE-2 に従い 2 周目で打ち切り、infrastructure team へ escalation。3 周目自動起動はしない |
| 1 周目 / 2 周目 evidence 混在 | aggregation script が両 suffix の snapshots を同時集計 | `--recovery-mode` flag で input dir を `hourly-snapshots-recovery/` に固定。non-recovery aggregation は従来通り `--mode normal` |
| recovery 中の追加 production code 変更 | `cf-audit-log-monitor.yml` / `scripts/cf-audit-log/observation/` への新規 commit | recovery window 中は cf-audit-log 関連 code freeze (runbook に明記)。違反検知用 grep gate を CI に追加 |
| `pass_runtime_synced` 早期昇格 | 1 周目 evidence のまま昇格 PR を出してしまう | SSOT 4 ファイル更新は **PR-B (recovery evidence 追加 PR) 内でのみ** 行う。PR-A では canonical state を `runtime_pending` に保ち、運用ラベル `recovery_active` のみを evidence に記録する |
| GitHub Actions infrastructure 障害再発 | runner 起動失敗 / artifact upload 失敗の連続 | infrastructure 起因と分類した上で、1 周目 evidence を欠損 hour を明記して採用する経路（親 #586 の Gate-RUNTIME-7DAY 後段 fallback）に切替 |

> **forward-safe rollback 原則**: 本タスクの rollback は `--recovery-mode` flag を `if: false` 化する revert PR と、`recovery-rootcause.md` への打ち切り追記のみで完結する。D1 schema 変更なし、production runtime への破壊的変更なし。

## 検証方法 (post-recovery 7 日 close-out)

- **PR-A merge 直後 (D'-1〜D'+0)**: PR-A 内で root cause を修正した production-code (`apps/api/src/...` または `.github/workflows/cf-audit-log-monitor.yml`) の hourly run が D'-1 hour で success していることを `gh run list --workflow=cf-audit-log-monitor.yml --limit 3 --json conclusion,createdAt` で確認し `outputs/phase-11/evidence/recovery-d-minus-1.log` に保存。
- **D'+1 / D'+3 / D'+5 daily check**: `gh run list --workflow cf-audit-log-monitor.yml --limit 25` を read-only で実行し、success rate / artifact 件数を `outputs/phase-11/evidence/hourly-run-daily-check-recovery.md` に追記する。
- **D'+7 (168 hour 完走時)**: `cf-audit-log-7day-summary.yml --recovery-mode --since <D'+0 ISO8601>` を手動 trigger するか scheduled run で起動。`post-switch-monitor.ts --aggregate --window 168 --recovery-mode --input <download-dir>` を実行し `outputs/phase-11/evidence/hourly-run-7day-summary-recovery.json` を生成する。
- **fallback rate / p95 latency / Issue 起票数 比較**: 集計 JSON の `fallbackRateMean ≤ 0.05` / `p95LatencyMedianMs` / `issuesOpenedTotal` を、(a) threshold 期 baseline (親 #549 `outputs/phase-11/evidence/threshold-baseline.md`) と (b) 1 周目 result (親 #586 `outputs/phase-11/evidence/hourly-run-7day-summary.json`) の両方と比較し `outputs/phase-11/evidence/issue-rate-comparison-recovery.md` に書き出す。
- **leakage grep 7 日連続 clean**: 2 周目 168 hourly logs への grep 結果を `outputs/phase-11/evidence/leakage-grep-7day-recovery.log` に集約し、全件 `clean` であることを確認する。

## スコープ

### 含む (scope in)

- `scripts/cf-audit-log/observation/post-switch-monitor.ts` に `--recovery-mode` / `--since <ISO8601>` flag を追加し、recovery input dir / output filename を分離する変更
- `.github/workflows/cf-audit-log-7day-summary.yml` に `recovery_mode` (`workflow_dispatch` input boolean) を追加し、true の場合 `--recovery-mode` で起動する分岐を追加
- `scripts/cf-audit-log/observation/recovery-rootcause-helper.ts` の新規追加（D+7 summary JSON が存在する場合は入力に取り、存在しない場合は `parent_summary_json: missing` を記録し、欠損 hour 一覧と root cause 候補を Markdown stub として出力する read-only helper）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に recovery 運用 (D'+0 定義 / artifact retention / max 2 周制限 / code freeze 規約) を追記
- SSOT 4 ファイル (`observability-monitoring.md` / `task-workflow-active.md` / 親 #549 `phase-13.md` / `15-infrastructure-runbook.md`) の `pass_runtime_synced` 昇格反映は **PR-B 内のみ**
- production-code 起因の root cause 修正（2026-05-14 観測の hourly startup_failure の根本対応）— 具体的修正対象は Phase 1 で確定するが、現時点での候補は `.github/workflows/cf-audit-log-monitor.yml` の secrets / permissions 不整合

### 含まない (scope out)

- D1 schema 変更
- 3 周目 recovery の自動起動（Gate-MAX-CYCLE-2 で打ち切り）
- `apps/web` / `apps/api` runtime コード（cf-audit-log observation script 以外）への変更
- 新規 unit test の大量追加（`--recovery-mode` 分岐 focused test のみ）

## 変更対象ファイル一覧

| パス | 種別 | 役割 |
| --- | --- | --- |
| `scripts/cf-audit-log/observation/post-switch-monitor.ts` | 編集 | `--recovery-mode` / `--since` flag 追加、output filename 分離 |
| `scripts/cf-audit-log/observation/recovery-rootcause-helper.ts` | 新規 | 欠損 hour + root cause 候補の Markdown stub 生成 (read-only) |
| `scripts/cf-audit-log/observation/post-switch-monitor.recovery.spec.ts` | 新規 | `--recovery-mode` flag focused test (正例 / 負例 / mode 切替) |
| `.github/workflows/cf-audit-log-7day-summary.yml` | 編集 | `workflow_dispatch.inputs.recovery_mode` 追加、`--recovery-mode` 起動分岐 |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集 (条件付き) | 2026-05-14 hourly startup_failure の root cause 修正（Phase 1 確定後に必要なら） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | recovery 運用追記 (D'+0 定義 / retention / max 2 周 / code freeze) |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 (PR-B) | `pass_runtime_synced` 昇格 evidence path に recovery suffix を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 (PR-B) | 親 #549 entry を `pass_runtime_synced` に昇格 |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | 編集 (PR-B) | recovery 完走で close-out 状態を `pass_runtime_synced` に確定 |

## Phase 一覧

| Phase | 内容 | ファイル |
| --- | --- | --- |
| 1 | 要件定義 / root cause 確定 / 変更ファイル fix | phase-01.md |
| 2 | 設計 (`--recovery-mode` 仕様 / evidence path 規約) | phase-02.md |
| 3 | データ / evidence schema 設計 | phase-03.md |
| 4 | テスト戦略 (focused test 範囲確定) | phase-04.md |
| 5 | 実装 (scripts / workflow / runbook) | phase-05.md |
| 6 | テスト実装 (`*.spec.ts`) | phase-06.md |
| 7 | local 検証 (typecheck / lint / focused test) | phase-07.md |
| 8 | CI 検証 (PR-A 上の workflow lint / dry-run) | phase-08.md |
| 9 | 運用準備 (D'+0 reset / daily check 経路 / code freeze 通達) | phase-09.md |
| 10 | 段階デプロイ (PR-A merge → D'+0 開始 → daily check) | phase-10.md |
| 11 | Phase 11 evidence (PR-B で D'+7 完走後の 7 件 evidence 追加) | phase-11.md |
| 12 | Phase 12 close-out compliance | phase-12.md |
| 13 | PR 作成 (PR-A / PR-B 各 PR の本文要件) | phase-13.md |

## 完了条件 (DoD)

- [ ] PR-A merge 済み: `--recovery-mode` flag / `cf-audit-log-7day-summary.yml` 編集 / runbook 追記 / root cause 修正が dev に入っている
- [ ] D'+0 が `recovery-rootcause.md` に絶対時刻 (ISO8601 UTC) で記載されている
- [ ] D'+7 集計 JSON (`hourly-run-7day-summary-recovery.json`) が `actualSnapshots: 168 / leakageHourlyClean: true / fallbackRateMean <= 0.05` を満たす
- [ ] `outputs/phase-11/evidence/hourly-run-7day-recovery.md` に 168 hourly run URL が揃っている
- [ ] `outputs/phase-11/evidence/leakage-grep-7day-recovery.log` が 168 hour 連続 clean
- [ ] `outputs/phase-11/evidence/issue-rate-comparison-recovery.md` で baseline + 1 周目との比較が完了
- [ ] SSOT 4 ファイルが `pass_runtime_synced` 文言と recovery evidence path で更新済み (PR-B)
- [ ] Phase 12 compliance check の 7 outputs が `outputs/phase-12/` に揃っている

## 参照情報

- 親 Issue #586 仕様: `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/`
- 祖父 Issue #549 仕様: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/`
- 起票元 single-file spec: `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-recovery.md`
- SSOT: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` (`pass_runtime_synced` 昇格契約)
- SSOT: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- 既存 workflow: `.github/workflows/cf-audit-log-monitor.yml` / `.github/workflows/cf-audit-log-7day-summary.yml`
- 既存 helper: `scripts/cf-audit-log/observation/post-switch-monitor.ts`
