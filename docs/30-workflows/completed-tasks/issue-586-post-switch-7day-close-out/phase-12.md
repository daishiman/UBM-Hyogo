# Phase 12: 実装ガイド・SSOT 同期・未タスク・skill feedback（strict 7 outputs）

## 目的

Phase 12 必須 6 タスクを完遂し、`outputs/phase-12/` 配下に **strict 7 ファイル**（`main.md` + 6 補助）を逐語固定の正規ファイル名で実体作成する。1 つでも欠落・短縮名 / 別名で配置された場合は `phase12-task-spec-compliance-check.md` を `FAIL` 判定とする。本サイクルは workflow YAML 改修を含むため `implemented_local_runtime_pending`（merge 前）→ `pass_boundary_synced_runtime_pending`（merge 後）→ `pass_runtime_synced`（D+7）の 3 段昇格を明記する。

## 前 Phase 依存

- Phase 11（NON_VISUAL 縮約 3 点 + local 5 evidence + canonical evidence path 予約）
- 親タスク `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md`

## Phase 12 entry checklist（着手前 gate）

| # | gate | 確認方法 | 失敗時の挙動 |
| --- | --- | --- | --- |
| E1 | placeholder token 0 件（`<TBD>` / `TODO:fill` / `XXX` / `???`） | `rg -n '(<TBD>\|TODO:fill\|XXX\|\?\?\?)' docs/30-workflows/issue-586-post-switch-7day-close-out/` | 該当箇所を埋めるまで Phase 12 着手禁止 |
| E2 | `§99 必須項目 content check`（index.md の AC-1〜AC-15 / DoD / refs / Phase 一覧 / 不変条件 / 苦戦箇所 / 検証方法） | 目視 + grep | 不足見出しを補う |
| E3 | dirty-code gate（`outputs/` 配下に `.tmp` / `.bak` / `*~` の残骸 0） | `find outputs -name '*.tmp' -o -name '*.bak' -o -name '*~'` | 削除してから着手 |
| E4 | implemented_local_runtime_pending 妥当性（workflow YAML 編集が PR diff に存在し、状態語彙が runtime pending） | git diff | 不一致なら状態を訂正 |
| E5 | `outputs/phase-11/` 3 点 + evidence 5 点が実体配置済み | ls | 不足は Phase 11 へ差戻し |

## strict 7 ファイル（逐語固定 / 短縮名禁止）

| # | 正規ファイル名 | 由来 Task | 欠落時 |
| --- | --- | --- | --- |
| 1 | `main.md` | Phase 12 本体（index） | FAIL |
| 2 | `implementation-guide.md` | Task 1 | FAIL |
| 3 | `system-spec-update-summary.md` | Task 2 | FAIL |
| 4 | `documentation-changelog.md` | Task 3 | FAIL |
| 5 | `unassigned-task-detection.md` | Task 4（0 件でも必須） | FAIL |
| 6 | `skill-feedback-report.md` | Task 5（改善なしでも必須） | FAIL |
| 7 | `phase12-task-spec-compliance-check.md` | Task 6 | FAIL |

短縮名・別名（例: `impl-guide.md` / `skill-feedback.md` / `compliance-check.md`）は禁止。

---

## Task 1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

`outputs/phase-12/implementation-guide.md`

### Part 1（中学生レベル / 必須要件）

- 日常生活の例え話を **1 つ以上** 含める。例:
  - 「7 日 close-out」=「新しい給食メニューを 1 週間試して、毎時間の感想を集めて、最後に『これでいこう』と決める儀式」
  - 「hourly artifact upload」=「毎時間のアンケート用紙を箱に入れて 8 日間しまっておく」
  - 「7day summary workflow」=「1 週間分のアンケート用紙を全部出してきて集計する係」
  - 「pass_runtime_synced」=「1 週間ちゃんと運用してから初めて『本番採用』のハンコを押す状態」
  - 「forward-safe rollback」=「机の位置（D1 列）はそのまま、当番表（GitHub Variables）だけ前のに戻せばすぐ元通り」
- 専門用語セルフチェック表を **5 用語以上**:
  - workflow → 「自動でやる手順表」
  - artifact → 「実行結果として残るファイル」
  - retention-days → 「ファイルを何日保管するか」
  - aggregation → 「ばらばらの情報をまとめる作業」
  - leakage grep → 「秘密がうっかり漏れていないかの抜き打ちチェック」
  - baseline → 「比較するための基準値」
- 「なぜ必要か」（merge した瞬間ではなく 7 日運用してから本物の OK にしたい）→「何をするか」（毎時間のスナップショットを 168 個集めて集計して比較する）の順で書く。

### Part 2（技術者レベル / 必須要件）

- 親 #549 で確定した `Classifier` interface / D1 列 / leakage grep を再掲し、**本タスクは呼び出し step の追加 + 7day summary workflow 新規** に閉じる設計を明記
- TypeScript 型: `SevenDaySummary`（`expectedSnapshots: 168` / `actualSnapshots` / `fallbackRateMean` / `leakageHits` / `issuesOpenedTotal` / `p95LatencyMedianMs` / `thresholdSnapshots` / `mlSnapshots`）
- workflow contract:
  - `cf-audit-log-monitor.yml` 編集: `environment: production` / `permissions: { issues: write }` / `env: { CF_AUDIT_CLASSIFIER: ${{ vars.CF_AUDIT_CLASSIFIER }}, ML_MODEL_PATH: ${{ secrets.CF_AUDIT_ML_MODEL_PATH_PROD }} }` / 末尾 3 post-step
  - `cf-audit-log-7day-summary.yml` 新規: `schedule: '0 1 */7 * *'` + `workflow_dispatch` + cross-run `gh api` artifact zip download + aggregation gate + `peter-evans/create-pull-request@v6`
- 設定可能パラメータ:
  - `vars.CF_AUDIT_CLASSIFIER` ∈ `{ threshold, ml }`（production env で `ml`）
  - `secrets.CF_AUDIT_ML_MODEL_PATH_PROD` ← 1Password 由来
  - `CF_AUDIT_FALLBACK_RATE_THRESHOLD` = `0.05`
  - `CF_AUDIT_FALLBACK_RATE_CONSECUTIVE_HOURS` = `3`
  - `EXPECTED_SNAPSHOTS_7DAY` = `168`
- エラーハンドリング:
  - artifact upload 失敗 → hourly run fail。1 hour 後に retry
  - leakage grep positive → hourly run fail（exit 1）+ Issue 削除 + token revoke runbook
  - fallback rate 連続超 → Issue 起票（hourly run は fail させない）
  - 7day summary aggregation の `actualSnapshots < 168` → PR 起票せず exit 1 → 再観測 7 日サイクル
- runtime path × evidence 表:

  | runtime path | evidence | 取得サイクル |
  | --- | --- | --- |
  | hourly classifier path | `evidence/test.log` + 168 hourly artifact | 本サイクル + 7 日 |
  | hourly leakage grep post-step | `evidence/grep-gate.log`（local）+ hourly run の log | 本サイクル + 7 日 |
  | hourly fallback alert post-step | `evidence/test.log`（local）+ Issue 起票履歴 | 本サイクル + 7 日 |
  | 7day summary workflow | dry-run の workflow run URL + D+7 evidence PR | 本サイクル D+0 + D+7 |

- forward-safe rollback の 1 step:
  - `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"`
  - 必要なら workflow YAML revert PR
  - D1 列（`classifier_used` / `classifier_version` / `confidence`）は **削除しない**

> 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md` を canonical absolute path で参照し、本タスクは「hourly post-step + artifact upload + 7day summary workflow + SSOT 4 ファイル昇格」の差分のみ記述する。

### Part 1 ドラフト採用ルール

本仕様書 phase-12.md の Part 1 ドラフトをそのままコピーペースト。AI による「自然な書き直し」は禁止。

---

## Task 2: システム仕様書更新

`outputs/phase-12/system-spec-update-summary.md`

### Step 1-A: 完了タスク記録

| 同期先 | 追記内容 |
| --- | --- |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/index.md` | 「Phase 完了状況」表を `phases[1〜13].status = spec_created` で更新 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 1 行 entry: canonical absolute path + `state: spec_created` |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 1 行 entry: canonical absolute path + `state: spec_created` |
| `.claude/skills/aiworkflow-requirements/references/topic-map.md` | `cf-audit-log` topic に本タスクの absolute path を追加（generator がある場合は `mise exec -- pnpm indexes:rebuild` 実行記録） |

### Step 1-B: 実装状況テーブル更新

`workflow_state = implemented_local_runtime_pending`（merge 前）→ `pass_boundary_synced_runtime_pending`（merge 後）→ `pass_runtime_synced`（D+7）の 3 段昇格を記録。Issue #586 が CLOSED でも reopen はせず、`Refs #549, Refs #586` で連携する旨を `index.md` Decision Log に記録。

### Step 1-C: 関連タスクテーブル更新

| 関連タスク | 更新後 status |
| --- | --- |
| 親 #549（CF Audit Logs ML production switch） | `implemented-local` → 本タスク D+7 完走で `pass_runtime_synced` に昇格 |
| 親 #515（Classifier abstraction） | `completed` を維持 |
| FU-03-A 90 日 baseline | `unassigned`（再起票しない） |
| FU-03-C #548 offline replay | `completed`（前提）|
| 本タスク #586 7-day close-out | `implemented_local_runtime_pending`（本サイクル merge 時）|

### Step 1-D: 上流 runbook 差分追記タイミング判定

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への追記タイミングを `same-wave`（本サイクル PR で実反映 / D+7 で `pass_runtime_synced` の section を再 commit）と確定。

### Step 1-H: skill feedback routing

Task 5 の各 item を `promote` / `defer` / `reject` のいずれかに routing し、本ファイルに promotion target / no-op reason / evidence path を記録（詳細は Task 5）。

### Step 2: 新規インターフェース追加

**判定: 適用**（`SevenDaySummary` 型を実質的に新規追加・本タスクは 7day summary workflow の集約 schema として正本化）。

| 同期先 | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | `pass_runtime_synced` 状態定義 / canonical evidence path / 4 観測軸の閾値 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 親 #549 entry の `state` 昇格手順 |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | legacy stub 注記の昇格文言（D+7 で実反映） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 7 日観測 runbook + `pass_runtime_synced` 昇格 + canonical evidence path |

### `outputs/artifacts.json` 不在ケース parity 文言（逐語コピー必須）

> root `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。

---

## Task 3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md`

canonical absolute path で列挙:

- workflow 2 ファイル（`.github/workflows/cf-audit-log-monitor.yml` / `cf-audit-log-7day-summary.yml`）
- SSOT 4 ファイル（observability-monitoring / task-workflow-active / 親 #549 phase-13.md / 15-infrastructure-runbook）
- LOGS 2 ファイル（aiworkflow-requirements / task-specification-creator）
- 本ワークフロー root: `artifacts.json` / `index.md` / `phase-01.md`〜`phase-13.md`
- `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` + `evidence/` 配下 5 ファイル
- `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- topic-map / quick-reference / resource-map（更新がある場合）

各 entry に `path / change-summary / wave (same-wave / D+7 / Wave N+1)` を 3 列で記録。

---

## Task 4: 未タスク検出レポート（0 件でも必須）

`outputs/phase-12/unassigned-task-detection.md`

スコープ外を `already_formalized` / `new_unassigned` に分離:

- **already_formalized**:
  - `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-01.md`（本タスクで formalize 済 → 仕様書 root へ昇格。再起票しない）
  - 親 #549 の `unassigned-task-detection.md` で formalize 済の FU-03-D-FOLLOWUP-02〜05 はそのまま再リンクのみ
  - `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md`（90 日 baseline / モデル学習・選定の親候補）
- **new_unassigned**（必要に応じ起票）:
  - `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01-RECOVERY`: D+7 で snapshots 不足だった場合の 2 周目 7 日観測（再走 sub-task）
  - `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01-METRICS-DASH`: 7day summary 出力を可視化するダッシュボード（Cloudflare Pages 上の静的 chart）— FU-03-D-FOLLOWUP-03（Slack 通知）と重複しない範囲

`new_unassigned` の各エントリは `docs/30-workflows/unassigned-task/` 配下に新規 md として起票し、本ファイルに canonical absolute path で list する。0 件でも「本サイクルでは 0 件」と明記する。

---

## Task 5: スキルフィードバックレポート（改善点なしでも必須）

`outputs/phase-12/skill-feedback-report.md`

3 章固定:

### テンプレ改善

- 「N 日 close-out + `pass_runtime_synced` 昇格」を Phase 11 NON_VISUAL evidence matrix の 2 段 evidence テンプレ化する提案
- workflow YAML への `vars.<KEY>` 参照 + `secrets.<KEY>` 参照 + `permissions:` の最小 set を Phase 5/6 テンプレに「production env block 必須」セクション化する提案

### ワークフロー改善

- artifact upload `retention-days` を Phase 3/5 設計テンプレに「観測ウィンドウ + 1 日マージン」を default 化する案
- `peter-evans/create-pull-request@v6` で evidence を別 PR 起票するパターンを Phase 11 / Phase 13 に汎用テンプレ化する案

### ドキュメント改善

- aiworkflow-requirements の `observability-monitoring.md` に「N 日 close-out evidence canonical path」セクションを新設
- `task-workflow-active.md` の状態語彙に `pass_boundary_synced_runtime_pending` → `pass_runtime_synced` の昇格条件を構造化

改善なしの章があっても「本サイクルでは改善提案なし」と明記する。

### Step 1-H promotion / defer / reject 判定

| item | 判定 | 反映先 / 起票先 |
| --- | --- | --- |
| 2 段 evidence テンプレ化 | promote（same-wave） | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| `vars` + `secrets` + `permissions` 必須化 | promote | 同上 |
| `retention-days` default 化 | promote（same-wave） | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| evidence 別 PR 起票汎用テンプレ | promote（same-wave） | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| observability-monitoring 追記 | promote（same-wave） | Task 2 Step 2 で実反映 |
| `task-workflow-active` 状態語彙構造化 | promote（same-wave） | 同上 |

---

## Task 6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md`

| 条件 | 確認内容 | 判定根拠 |
| --- | --- | --- |
| 矛盾なし | 13 phase の AC / DoD / 不変条件が衝突していない | 各 phase 横断 grep |
| 漏れなし | strict 7 file 実体配置 / canonical evidence path 5 点（local）+ 4 点（D+7）予約 / SSOT 4 ファイル更新 | `ls outputs/phase-12/` + `ls outputs/phase-11/` + `git diff` |
| 整合性 | 状態語彙が `implemented_local_runtime_pending` / `pass_boundary_synced_runtime_pending` / `pass_runtime_synced` で統一 / `PASS` 単独表記なし | `rg -n 'PASS\b' outputs/` |
| 依存関係整合 | 親 #549 / FU-03-C #548 / `.github/workflows/cf-audit-log-monitor.yml` 参照リンクが OK | `link-checklist.md` 再利用 |

総合判定行は **`implemented_local_runtime_pending` close-out（merge 前）/ `pass_boundary_synced_runtime_pending`（merge 後）/ `pass_runtime_synced`（D+7）** とし、`PASS` / `verified` 単独表記は禁止。Implementation evidence path 状態揃え checklist 6 項目を全て `OK` または `PENDING_RUNTIME_GATE` で埋める。

`outputs/artifacts.json` 不在ケース parity 文言を必ず再掲。

---

## 完了条件（Phase 12 全体）

- [ ] strict 7 file が逐語固定の正規名で `outputs/phase-12/` に実体配置されている（短縮名・別名 0 件）
- [ ] Task 1 Part 1 / Part 2 の必須要件をすべて満たしている（例え話 1 つ以上 / 用語 5 以上 / TypeScript 型 / runtime path × evidence 表 / rollback 1 step）
- [ ] Task 2 Step 1-A〜1-D + Step 2 + Step 1-H が記載
- [ ] SSOT 4 ファイルの差分要約が記載されている（実反映は same-wave + D+7）
- [ ] LOGS 2 ファイルへの 1 行 entry が canonical absolute path で記録されている
- [ ] Task 4 未タスク（0 件でも明記）が起票され list されている
- [ ] Task 5 が 3 章すべて存在し、Step 1-H routing が記録
- [ ] Task 6 の 4 条件 + Implementation evidence path checklist 6 項目がすべて埋まっている
- [ ] `workflow_state = implemented_local_runtime_pending` に昇格（merge 前）
- [ ] placeholder token 0 件 / dirty-code 0 件 / `PASS` 単独表記 0 件

## 出力

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Handoff（→ Phase 13）

- 本サイクル成果物は workflow YAML 改修 + 7day summary YAML 新規 + SSOT 4 ファイル + Phase 11 local 5 evidence + Phase 12 strict 7 outputs。PR は **feature ブランチ**（`feat/issue-586-post-switch-7day-close-out`）で base=`dev`
- D+7 で 7day summary workflow が起票する evidence PR を merge し、SSOT 4 ファイルを `pass_runtime_synced` で再 commit する別 PR を出す
- `Refs #549, Refs #586` のみ。Issue は CLOSED のまま open / close 操作なし
- PR 自動作成は禁止。ユーザー明示許可後にのみ Phase 13 を実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 12-1 | implementation-guide.md を Part 1 / Part 2 構成で配置 |
| 12-2 | system-spec-update-summary.md と SSOT 同期を記録 |
| 12-3 | documentation-changelog.md を作成 |
| 12-4 | unassigned-task-detection.md を作成 |
| 12-5 | skill-feedback-report.md を routing 付きで作成 |
| 12-6 | phase12-task-spec-compliance-check.md で 4 条件を確認 |

## 参照資料

- `index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-12.md`

## 成果物/実行手順

strict 7 files を `outputs/phase-12/` に配置し、SSOT 4 ファイルと LOGS 2 ファイルを same-wave で更新する。D+7 で `pass_runtime_synced` 反映の別 PR を出す。
