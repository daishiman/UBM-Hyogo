# タスク仕様書: Issue #586 — post-switch 7 day close-out（pass_runtime_synced 昇格）

[実装区分: 実装仕様書]

判定根拠: 本タスクは親 Issue #549（CF Audit Logs ML production switch）の close-out として、(1) `.github/workflows/cf-audit-log-monitor.yml` への hourly artifact upload step / leakage grep / fallback-rate alert post-step の組み込み、(2) GitHub Variables `CF_AUDIT_CLASSIFIER=ml` の production env 切替反映、(3) 7 日サマリ集計用 scheduled job (`.github/workflows/cf-audit-log-7day-summary.yml`) の新規追加、(4) SSOT 4 ファイルの `pass_runtime_synced` 昇格反映、を伴う。コード/設定/SSOT の編集を必要とするため、CONST_004 のデフォルトに従い実装仕様書として作成する。Issue #586 は CLOSED だが、ユーザー指示に従い open/close 操作は行わず `Refs #549, Refs #586` で連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-586-post-switch-7day-close-out |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/586 |
| 祖父 Issue | https://github.com/daishiman/UBM-Hyogo/issues/549 |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-01.md` |
| 親タスク仕様 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| 配置先 | `docs/30-workflows/issue-586-post-switch-7day-close-out/` |
| 作成日 | 2026-05-09 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 優先度 | MEDIUM（issue label `priority:medium`） |
| Wave | follow-up（Issue #549 派生 FU-03-D / FU-01）|
| 想定 PR 数 | 1（workflow YAML 改修 + 7day summary workflow 新規 + SSOT 同期 + 7 日完走後の evidence 追加コミット）|
| coverage AC | 適用外（`.github/workflows/` / 既存 observation script 呼び出し追加が中心。新規 unit code はなし） |

## 着手判断（着手 Gate）

本タスクは外部時間依存（CONST_007 例外条件 1）に該当する。production switch merge から 7 日間の hourly run を実 GitHub Actions runtime で蓄積する必要があるため、コード/PR は今サイクルで完成させ、**実 run 結果収集とサマリ生成は時間経過後の close-out コミットで evidence 追加** する 2 段構成とする。各 Gate は次の通り:

- Gate-RUNTIME-CLASSIFIER-SET: GitHub Variables `CF_AUDIT_CLASSIFIER=ml` が production env scope で設定済みであり、`gh variable list` で確認できること。未設定の場合、本タスクの workflow YAML 編集 PR は merge 可能だが production hourly run の ml 切替は発動しない（threshold 期評価のまま 7 日 evidence を取り直す必要が出る）。
- Gate-RUNTIME-7DAY: workflow YAML PR merge 後、7 日 (168 hour) 経過し、artifact retention 内に 168 hourly snapshots すべてが揃っていること。1 件でも欠落した場合は欠損 hour を `outputs/phase-11/evidence/hourly-run-7day.md` に明記し、欠損理由が GitHub Actions infrastructure 障害ならば `pass_runtime_synced` 昇格は許容、欠損が production code 側起因ならば再観測する。
- Gate-LEAKAGE-CLEAN-7DAY: 7 日連続で `secret-leakage-grep.ts` の hourly post-step が clean（exit 0）であること。1 hour でも positive 検出があれば `pass_runtime_synced` 昇格不可。
- Gate-FALLBACK-RATE: 7 日 mean fallback rate ≤ 5% かつ 3 hour 連続超で alert Issue 起票が 0 件であること。

## 苦戦箇所（Issue #586 本文より）

production switch は merge 時点では完了せず、7 日分の hourly evidence が揃うまで runtime synced にできない。次の 4 系統が連動する:

1. **GitHub Variables 切替**: `CF_AUDIT_CLASSIFIER=ml` を production env scope で設定し、`.github/workflows/cf-audit-log-monitor.yml` が production env block で参照する経路を成立させる。
2. **hourly artifact upload**: 既存 hourly run の出力 JSON を `actions/upload-artifact@v4` で 7 日 retention 永続化し、後段サマリ job が cross-run `gh api` artifact zip download で集約できるようにする。
3. **hourly post-step 組み込み**: `secret-leakage-grep.ts --exit-on-detect`（hourly fail 化）と `fallback-rate-alert.ts --threshold 0.05 --consecutive-hours 3`（閾値超で Issue 起票）を hourly job 内に追加する。
4. **7 日サマリ集計 job**: scheduled job として `cf-audit-log-7day-summary.yml` を追加し、`post-switch-monitor.ts --aggregate` で 168 snapshots を集約 → `outputs/phase-11/evidence/hourly-run-7day-summary.json` を生成し、PR にコミットする経路を成立させる（workflow_dispatch でも手動起動可能）。

## リスクと対策（forward-safe rollback）

| リスク | 検知 | 対策（rollback） |
| --- | --- | --- |
| `CF_AUDIT_CLASSIFIER=ml` 切替後の誤検知率上昇 | hourly run の Issue 起票数が baseline（threshold 期）の 1.5 倍超 | `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"`（env 1 行戻し）|
| fallback rate > 5% を 3 hour 連続で観測 | `fallback-rate-alert.ts` が GitHub Issue を自動起票 | 同上 + FU-03-C #548 へ artifact 再選定差戻し |
| Issue body / hourly log への raw secret 混入 | `secret-leakage-grep.ts --exit-on-detect` が hourly run を fail | 即時 env 戻し + Issue 削除 + token revoke runbook 起動 |
| GitHub Actions artifact retention 切れ | 7 日後に cross-run artifact zip download が 404 | retention を 7 日以上（`retention-days: 8` を既定）に固定。再収集を 1 回だけ許容 |
| 7 日サマリ job の `outputs/phase-11/evidence/` への commit 競合 | scheduled job が他 PR と競合 | `peter-evans/create-pull-request@v6` 経由で別ブランチに PR を作る経路を採用（直 push しない）|
| D1 追加列への影響 | 親 #515 で追加済み列を本タスクは触らない | forward-safe（D1 schema 変更なし） |

> **forward-safe rollback 原則**: 本タスクでの rollback は GitHub Variables の env 戻し 1 行と、必要に応じて workflow YAML の post-step を `if: false` 化する revert PR で完結する。D1 schema 変更は行わないため、`apps/api/migrations/` への影響はゼロ。

## 検証方法（post-switch 7 日 close-out）

- **本サイクル merge 直後（D+0）**: workflow YAML が production env で `CF_AUDIT_CLASSIFIER` を参照し、hourly run の post-step に leakage grep / fallback alert / artifact upload が組み込まれていることを 1 hour 後の actual run URL で確認する。
- **D+1 / D+3 / D+5 daily check**: `gh run list --workflow cf-audit-log-monitor.yml --limit 25` を読み取り専用で実行し、success rate と artifact 件数を `outputs/phase-11/evidence/hourly-run-daily-check.md` に追記する。
- **D+7（168 hour 完走時）**: `cf-audit-log-7day-summary.yml` を手動 trigger するか、scheduled run の自動起動で `post-switch-monitor.ts --aggregate --window 168` を実行し、`outputs/phase-11/evidence/hourly-run-7day-summary.json` を生成する。
- **fallback rate / p95 latency / Issue 起票数**: 集計 JSON の `fallbackRateMean ≤ 0.05` / `p95LatencyMedianMs` / `issuesOpenedTotal` を threshold 期 baseline（親 #549 `outputs/phase-11/evidence/threshold-baseline.md`）と比較し、`outputs/phase-11/evidence/issue-rate-comparison.md` に書き出す。
- **leakage grep 7 日連続 clean**: 168 hourly logs に対する grep 結果を `outputs/phase-11/evidence/leakage-grep-7day.log` に集約し、すべて `clean` であることを確認する。

## スコープ

### 含む（scope in）

- `.github/workflows/cf-audit-log-monitor.yml` の編集:
  - production env scope で `CF_AUDIT_CLASSIFIER=ml` を参照する `env:` ブロック設定（`vars.CF_AUDIT_CLASSIFIER` 参照）
  - hourly run の出力 JSON を `actions/upload-artifact@v4` で `retention-days: 8` として永続化
  - hourly post-step に `secret-leakage-grep.ts --exit-on-detect` を追加（hourly fail 化）
  - hourly post-step に `fallback-rate-alert.ts --threshold 0.05 --consecutive-hours 3` を追加（閾値超で Issue 起票）
- `.github/workflows/cf-audit-log-7day-summary.yml` の新規追加:
  - schedule: `cron: '0 1 */7 * *'`（UTC 7 日 1 回）+ `workflow_dispatch`
  - 直近 168 hourly run の artifact を cross-run `gh api workflows/cf-audit-log-monitor.yml/runs` + artifact zip download で取得（`actions/download-artifact@v4` は same-run 限定のため使わない）
  - run URL 一覧を `hourly-run-7day.md` に保存
  - `post-switch-monitor.ts --aggregate --expected-snapshots 168 --require-non-skeleton --input <download-dir> --out outputs/phase-11/evidence/hourly-run-7day-summary.json` を実行
  - `outputs/phase-11/evidence/hourly-run-7day.md`（run URL 一覧 + 集計サマリ + leakage grep 7 日連続 clean 確認）を生成
  - `peter-evans/create-pull-request@v6` で `chore/issue-586-7day-evidence-<YYYYMMDD>` ブランチに PR 起票（直 push 禁止）
- evidence 収集 contract の確定:
  - 168 hourly snapshots count 検証（aggregation script 内で `expectedSnapshots: 168` を必須 field 化）
  - fallback rate mean ≤ 5% / fallback rate max のレコード化
  - leakage grep 7 日連続 clean
  - Issue 起票数 baseline 比較（threshold 期 baseline は親 #549 outputs から参照）
  - p95 latency median 記録
- SSOT 4 ファイルの更新:
  - `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`: `pass_runtime_synced` 状態への昇格条件と evidence path（canonical absolute path 列挙）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`: 親 #549 entry を `pass_runtime_synced` に更新
  - `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` のクローズアウト注記更新（legacy stub 注記の撤去手順）
  - `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`: 7 日観測ランブックの evidence path 反映
- Phase 11 evidence 収集 (NON_VISUAL):
  - 本サイクル: `typecheck.log` / `lint.log` / `test.log`（既存 observation focused test の再走）/ `build.log` / `grep-gate.log` の local evidence 5 点セット
  - 7 日完走時: `hourly-run-7day.md` / `hourly-run-7day-summary.json` / `leakage-grep-7day.log` / `issue-rate-comparison.md`

### 含まない（scope out / 別タスク）

- ML model 再選定（FU-03-C #548 で完了済み）
- 90 日 baseline（FU-03-A 別タスク `U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md`）
- D1 schema 変更（forward-safe で不変）
- 親 #549 / #586 の reopen / 別 issue 起票（未然エスカレーションは Phase 12 `unassigned-task-detection.md` で formalize）
- Slack / メール alerting 拡張（親 #408 既知の alert 拡張と重複しない範囲のみ FU-03-D-FOLLOWUP-03 で扱う）
- 次世代 model artifact ローテーション（FU-03-D-FOLLOWUP-02）

## 不変条件・正本仕様との整合

- 不変条件 #5（D1 直接アクセス禁止 / `apps/api` 経由）: 本タスクは `.github/workflows/` と `scripts/cf-audit-log/observation/` のみであり対象外
- Cloudflare CLI: `bash scripts/cf.sh` 経由のみを使用（`wrangler` 直接実行禁止）
- シークレット: `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照のみ。実値は記載・コミットしない
- 親 #549 の Classifier interface / D1 列 / leakage grep / observation script は変更せず、**呼び出し step の追加**に閉じる
- aiworkflow-requirements skill > 親 #549 spec > 本仕様書の正本順位を維持

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #549（CF Audit Logs ML production switch） | workflow YAML / observation script / leakage grep の正本 |
| 上流 | Issue #515（ML-ready abstraction） | classifier 抽象 / D1 列 / leakage grep の祖父 |
| 上流 | FU-03-C #548（offline replay） | ML model artifact 選定の evidence |
| 上流 | `.github/workflows/cf-audit-log-monitor.yml` | hourly artifact upload / post-step 組込み対象 |
| 上流 | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | aggregation 機能の正本（既存） |
| 上流 | `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | hourly alert step の正本（既存） |
| 上流 | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | hourly post-step leakage gate の正本（既存） |
| 関連 | aiworkflow-requirements observability-monitoring / task-workflow-active / 15-infrastructure-runbook | SSOT 同期先 |
| external | Gate-RUNTIME-CLASSIFIER-SET 通過 | production env で `CF_AUDIT_CLASSIFIER=ml` が反映されていること |
| external | Gate-RUNTIME-7DAY 通過 | 168 hourly snapshots 蓄積（時間経過依存） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-01.md` | 親 unassigned-task 正本（本仕様書で formalize する元） |
| 必須 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/index.md` | 親タスク仕様書 |
| 必須 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md` | 親タスク実装ガイド |
| 必須 | `.github/workflows/cf-audit-log-monitor.yml` | hourly run 編集対象 |
| 必須 | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | aggregation 呼び出し対象 |
| 必須 | `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | hourly alert post-step |
| 必須 | `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | hourly leakage grep post-step |
| 参考 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 7 日観測ランブック同期先 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | SSOT 同期先 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | SSOT 同期先 |

## AC（Acceptance Criteria）

- AC-1: production env で `CF_AUDIT_CLASSIFIER=ml` が GitHub Variables に設定され、`.github/workflows/cf-audit-log-monitor.yml` が production env block で `vars.CF_AUDIT_CLASSIFIER` を参照する。`gh variable list --env production` の出力（実値は伏せる）が evidence として記録される。
- AC-2: hourly artifact upload が workflow に追加され、`actions/upload-artifact@v4` で `retention-days: 8` 以上を指定し、`name: hourly-snapshot-${{ github.run_id }}` で一意化されている。
- AC-3: hourly post-step に `secret-leakage-grep.ts --exit-on-detect` が組み込まれ、positive 検出時 hourly run が fail（exit 1 が hourly job の status に伝搬）する。focused test で正例 / 負例 fixture が pass する。
- AC-4: hourly post-step に `fallback-rate-alert.ts --threshold 0.05 --consecutive-hours 3` が組み込まれ、3 hour 連続超で `gh issue create` が発動する。focused test で発火 / 非発火条件が pass する。
- AC-5: 7 日サマリ集計 workflow `.github/workflows/cf-audit-log-7day-summary.yml` が新規追加され、`schedule: cron` + `workflow_dispatch` の両方で起動可能であり、cross-run `gh api` artifact download で 168 hourly snapshots と run URL 一覧を取得し `post-switch-monitor.ts --aggregate` で集約する。
- AC-6: 168 hourly snapshots 件数検証が aggregation script 出力 JSON の `actualSnapshots` / `expectedSnapshots: 168` field で行われ、不足時は `pass_runtime_synced` 昇格を fail させる仕様が `outputs/phase-12/implementation-guide.md` に明記される。
- AC-7: leakage grep 7 日連続 clean が `outputs/phase-11/evidence/leakage-grep-7day.log` で確認できる（168 行すべて `clean` を含む）。
- AC-8: Issue 起票数 baseline 比較が `outputs/phase-11/evidence/issue-rate-comparison.md` に threshold 期数値（親 #549 から取得）と並記される。
- AC-9: SSOT 4 ファイルが `pass_runtime_synced` 文言と evidence path を含むよう更新される（observability-monitoring / task-workflow-active / 親 #549 phase-13.md / 15-infrastructure-runbook）。
- AC-10: Phase 12 strict 7 outputs が `outputs/phase-12/` に実体配置される（短縮名・別名 0 件）。
- AC-11: PR 本文に `Refs #549, Refs #586` を含み、issue は閉じない（`Closes` を使わない / Issue は CLOSED のまま）。
- AC-12: focused Vitest（既存 `post-switch-monitor` / `fallback-rate-alert` / `secret-leakage-grep`）すべて pass。新規追加 test がある場合も pass。
- AC-13: `pnpm typecheck` / `pnpm lint` 既存基準を満たす（新規エラー 0 件。既存 `@sentry/*` dependency missing は known-failure 境界として記録）。
- AC-14: Phase 11 evidence に `typecheck.log` / `lint.log` / `test.log` / `build.log` / `grep-gate.log` の local evidence 5 点セットが揃う（NON_VISUAL canonical path）。
- AC-15: 7 日完走後の close-out コミットで `outputs/phase-11/evidence/hourly-run-7day.md` / `hourly-run-7day-summary.json` / `leakage-grep-7day.log` / `issue-rate-comparison.md` が同 PR または同ブランチに追加される（外部時間依存のため 2 段コミット可）。

## 実装ファイル一覧（抜粋・Phase 5/6 で詳細確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集 | production env block で `vars.CF_AUDIT_CLASSIFIER` 参照、hourly artifact upload、leakage grep / fallback-rate alert post-step を追加 |
| `.github/workflows/cf-audit-log-7day-summary.yml` | 新規 | 7 日サマリ集計の scheduled / workflow_dispatch job |
| `scripts/cf-audit-log/observation/post-switch-monitor.ts` | 参照 | `--aggregate --input <dir> --out <json>` 呼び出し（既存機能。改修不要） |
| `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | 参照 | hourly post-step 呼び出し（既存。改修不要） |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | 参照 | `--exit-on-detect` フラグでの hourly post-step 呼び出し（既存。改修不要） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | 7 日観測ランブックに evidence path / `pass_runtime_synced` 昇格条件を反映 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | `pass_runtime_synced` 状態定義 + evidence canonical path |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | 親 #549 entry を `pass_runtime_synced` に昇格 |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | 編集 | legacy stub 注記の撤去（7 日完走後）|
| `outputs/phase-11/evidence/hourly-run-7day.md` | 新規（D+7）| 7 日 run URL 一覧 + 集計サマリへの参照 |
| `outputs/phase-11/evidence/hourly-run-7day-summary.json` | 新規（D+7）| 168 snapshots aggregation 出力 |
| `outputs/phase-11/evidence/leakage-grep-7day.log` | 新規（D+7）| 168 hour leakage grep 集約 |
| `outputs/phase-11/evidence/issue-rate-comparison.md` | 新規（D+7）| baseline 比較 |

## Phase 一覧

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / Gate 整理 / 真の論点 | phase-01.md |
| 2 | 既存実装調査（親 #549 成果物 / workflow / observation script） | phase-02.md |
| 3 | 設計（hourly artifact upload / 7day summary job / SSOT 昇格） | phase-03.md |
| 4 | 環境準備 / 前提条件確認（着手 Gate と production verify） | phase-04.md |
| 5 | 実装計画（変更対象ファイル / I/O 契約） | phase-05.md |
| 6 | 実装手順（ステップバイステップ / 1 PR + close-out コミット） | phase-06.md |
| 7 | テスト計画（focused / dry-run / 7 日 regression） | phase-07.md |
| 8 | 品質ゲート / セキュリティ / governance | phase-08.md |
| 9 | 運用準備 / observability（pass_runtime_synced 昇格手順） | phase-09.md |
| 10 | 実装後検証 / Definition of Done | phase-10.md |
| 11 | 実行 evidence（NON_VISUAL: local 5 点 + 7 日 hourly observation 4 点） | outputs/phase-11/main.md |
| 12 | 実装ガイド・SSOT 同期・未タスク・skill feedback（strict 7 outputs） | outputs/phase-12/* |
| 13 | PR 作成（`Refs #549, Refs #586`、base=`dev`） | outputs/phase-13/main.md |

各 Phase 詳細は `phase-NN.md` を参照。

- [Phase 1](phase-01.md) ・ [Phase 2](phase-02.md) ・ [Phase 3](phase-03.md) ・ [Phase 4](phase-04.md) ・ [Phase 5](phase-05.md) ・ [Phase 6](phase-06.md) ・ [Phase 7](phase-07.md) ・ [Phase 8](phase-08.md) ・ [Phase 9](phase-09.md) ・ [Phase 10](phase-10.md) ・ [Phase 11](phase-11.md) ・ [Phase 12](phase-12.md) ・ [Phase 13](phase-13.md)

## DoD（Definition of Done・全 Phase 共通）

- [ ] AC-1〜AC-15 すべての evidence が `outputs/phase-11/` 配下に保存されている（D+7 evidence は close-out コミットで追加）。
- [ ] `pnpm typecheck` は新規エラー 0 件であることを記録する。
- [ ] `pnpm lint` は新規エラー 0 件であることを記録する。
- [ ] focused Vitest（post-switch-monitor / fallback-rate-alert / secret-leakage-grep）すべて pass。
- [ ] `.github/workflows/cf-audit-log-monitor.yml` の hourly post-step 追加が PR diff に含まれ、production env block で `vars.CF_AUDIT_CLASSIFIER` を参照している。
- [ ] `.github/workflows/cf-audit-log-7day-summary.yml` が新規追加され、`schedule: cron` + `workflow_dispatch` で起動可能。
- [ ] hourly artifact upload `retention-days: 8` 以上が指定されている。
- [ ] secret leakage grep gate が hourly run の post-step で `--exit-on-detect` 付きで起動することが test で確認されている。
- [ ] D1 schema 変更が **行われていない**（forward-safe で `apps/api/migrations/` 配下に diff 0）。
- [ ] SSOT 4 ファイル（observability-monitoring / task-workflow-active / 親 #549 phase-13.md / 15-infrastructure-runbook）が `pass_runtime_synced` 文言と evidence path で更新されている。
- [ ] Phase 12 の strict 7 ファイルが `outputs/phase-12/` に実体として存在する（短縮名・別名 0 件）。
- [ ] PR 本文に `Refs #549, Refs #586` を含み、issue は閉じない（`Closes` を使わない / Issue #586 は CLOSED のまま）。
- [ ] D+7 close-out コミットで `outputs/phase-11/evidence/hourly-run-7day.md` / `hourly-run-7day-summary.json` / `leakage-grep-7day.log` / `issue-rate-comparison.md` が追加されている。
