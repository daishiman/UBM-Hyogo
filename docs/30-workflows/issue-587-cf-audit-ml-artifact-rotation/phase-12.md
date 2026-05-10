# Phase 12: 実装ガイド・SSOT 同期・未タスク・skill feedback（6 必須タスク全網羅）

## 目的

Phase 12 必須 6 タスクを完遂し、`outputs/phase-12/` 配下に **strict 7 ファイル**（`main.md` + 6 補助）を逐語固定の正規ファイル名で実体作成する。本サイクルは implemented_local_runtime_pending（rotation scripts / canary workflow / local fixture canary evidence 実装済み、production promotion pending）として閉じる。

## 前 Phase 依存

- Phase 11（NON_VISUAL 縮約 3 点 + canonical evidence path 予約）
- 親タスク `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md`

## Phase 12 entry checklist（着手前 gate）

| # | gate | 確認方法 | 失敗時の挙動 |
| --- | --- | --- | --- |
| E1 | placeholder token 0 件（`<TBD>` / `TODO:fill` / `XXX` / `???`） | `rg -n '(<TBD>\|TODO:fill\|XXX\|\?\?\?)' docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/` | 該当箇所を埋めるまで Phase 12 着手禁止 |
| E2 | index.md の AC-1〜AC-12 / DoD / refs / Phase 一覧 / 不変条件 / 苦戦箇所 / 検証方法 | 目視 + grep で見出し存在 | 不足見出しを補う |
| E3 | dirty-code gate（`.tmp` / `.bak` / `*~` 無し） | `find outputs -name '*.tmp' -o -name '*.bak' -o -name '*~'` | 削除してから着手 |
| E4 | spec_created 妥当性（`scripts/cf-audit-log/rotation/` 配下に新規コードが無い） | `ls scripts/cf-audit-log/rotation/ 2>/dev/null` | 既に新規コードがあれば `implemented_local_evidence_captured` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に昇格 |
| E5 | `outputs/phase-11/evidence/` の予約 path（typecheck / lint / test / canary / leakage / dataset grep）が Phase 11 に確定 | phase-11.md 確認 | 不足は Phase 11 へ差戻し |

## strict 7 ファイル（逐語固定 / 短縮名禁止）

| # | 正規ファイル名 | 由来 Task |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 本体（index） |
| 2 | `implementation-guide.md` | Task 1 |
| 3 | `system-spec-update-summary.md` | Task 2 |
| 4 | `documentation-changelog.md` | Task 3 |
| 5 | `unassigned-task-detection.md` | Task 4（0 件でも必須） |
| 6 | `skill-feedback-report.md` | Task 5（改善なしでも必須） |
| 7 | `phase12-task-spec-compliance-check.md` | Task 6 |

短縮名・別名（例: `impl-guide.md` / `compliance-check.md`）は禁止。

---

## Task 1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

`outputs/phase-12/implementation-guide.md`

### Part 1（中学生レベル / 必須要件）

- 日常生活の例え話を **1 つ以上**:
  - 「artifact rotation」=「教科書を新しい版に交換するときに、古い版もすぐ手に取れる場所に残しておく作業」
  - 「candidate evaluation」=「新しい教科書をいきなり全クラスで使わず、まず 1 クラスだけで試す」
  - 「canary」=「炭鉱で先に行ってもらうカナリア。危険があれば本番より先に教えてくれる」
  - 「rollback（rotation）」=「新しい教科書で問題が出たら、古い版に 1 行で戻す」
  - 「leakage grep」=「新しい教科書のコピーをするときに、住所や電話番号が紛れ込んでいないかチェックする」
- 専門用語セルフチェック表（5 用語以上）:
  - artifact → 「学習結果を保存したファイル」
  - candidate → 「次に使う候補（まだ正式採用ではない）」
  - promotion → 「候補を本番に正式採用すること」
  - rollback → 「元に戻す手順」
  - precision/recall proxy → 「正解率と取りこぼし率を簡単に近似した指標」
- 「なぜ必要か」（次世代モデルを安全に切替えたい）→「何をするか」（候補を staging で試す → カナリア結果を JSON で集める → OK なら本番に切替 → 危なくなったら 1 行で戻す）の順で書く

### Part 2（技術者レベル / 必須要件）

- `Classifier` interface（親 #515 由来）を変更しない設計を明記
- TypeScript 型: `ArtifactPathRefs` / `CanaryOutput` / `CanaryMetrics` / `RotationEvidence` / `RotationGate`
- API シグネチャ:
  - `runArtifactCanary(opts: ArtifactCanaryOptions): Promise<CanaryOutput>`
  - `collectRotationEvidence(opts: CollectorOptions): Promise<RotationEvidence>`
- 設定可能パラメータ:
  - `inputs.candidatePath`（workflow_dispatch input）
  - `inputs.replayWindowHours`（default: 1）
  - `..._CANDIDATE` / `..._PREVIOUS` op 参照（実値は op に登録）
  - canary fail 閾値: `fallbackRate >= 0.05` / `p95 > baseline * 1.5` / `leakageHits > 0` / `precision/recall < baseline`
- エラーハンドリング:
  - candidate load 失敗 → `MLClassifier` skeleton の threshold fallback（staging のみ）
  - leakage grep positive → canary fail（exit 1） + log redact
  - metrics fail → promotion 不可。FU-03-C #548 へ差し戻し
- runtime path × evidence 表:

  | runtime path | evidence | 取得サイクル |
  | --- | --- | --- |
  | canary dry-run path | `evidence/canary-dry-run.json` + `evidence/test.log` | 実装サイクル |
  | leakage grep path | `evidence/leakage-grep.log`（clean / positive 両方） | 実装サイクル |
  | dataset grep path | `evidence/dataset-grep.log` | 実装サイクル |
  | promotion / rollback path | `evidence/hourly-run-after-promotion.json`（本サイクル外） | Gate 後 |

- forward-safe rollback の 1 step:
  - `op item edit ubm-hyogo-env CF_AUDIT_ML_MODEL_PATH_PROD=<previous 値>`
  - D1 列（`classifier_used` / `classifier_version` / `confidence`）は **削除しない**

> 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md` を canonical absolute path で参照し、本タスクは「artifact rotation の 4 段（candidate / canary / promotion / rollback）」の差分のみ記述する。

### Part 1 ドラフト採用ルール

本仕様書 phase-12.md に Part 1 ドラフトを直接書いている場合、`implementation-guide.md` Part 1 には **このドラフトをそのままコピーペースト** する。AI による「自然な書き直し」は禁止。

---

## Task 2: システム仕様書更新

`outputs/phase-12/system-spec-update-summary.md`

### Step 1-A: 完了タスク記録

| 同期先 | 追記内容 |
| --- | --- |
| `docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/index.md` | 「Phase 完了状況」表 `phases[1〜12].status = completed / completed_local_evidence` |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 1 行 entry: canonical absolute path + `state: implemented_local_runtime_pending` |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 同上 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `observability-monitoring.md` / `deployment-secrets-management.md` / `task-workflow-active.md` の再生成反映として本タスク導線を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` / `keywords.json` | Issue #587 の検索導線を追加 |

### Step 1-B: 実装状況テーブル更新

`workflow_state = implemented_local_runtime_pending` に再分類。Issue #587 / #549 は CLOSED 維持で、open/close 操作は行わない。`Refs #549, #587` で連携する旨を `index.md` Decision Log に記録する。

### Step 1-C: 関連タスクテーブル更新

| 関連タスク | 更新後 status |
| --- | --- |
| 親 #549 production switch | `pass_runtime_synced` または `completed`（実状態を確認） |
| 上位親 #515 ML-ready abstraction | `completed` 維持 |
| FU-03-C #548 offline replay | `external_dependency` |
| FU-03-D-FU-01 7 日完走 close-out | `unassigned`（#549 phase-12 起票済み） |
| 本タスク #587 artifact rotation | `implemented_local_runtime_pending` |
| 次世代 model 学習 | `unassigned`（本タスク Phase 12 Task 4 で起票） |
| 自動 rotation スケジューラ | `unassigned`（同上） |

### Step 1-D: 上流 runbook 差分追記タイミング判定

`15-infrastructure-runbook.md` への rotation セクション追記タイミングを `same-wave`（本サイクル spec として記述、本体 runbook は `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` に置く）と確定する。

### Step 1-H: skill feedback routing

Task 5 の各 item を `promote` / `defer` / `reject` のいずれかに routing する（詳細は Task 5）。

### Step 2: 新規インターフェース追加

**判定: 適用**（`ArtifactPathRefs` / `CanaryOutput` / `RotationEvidence` 型を新規追加）。

| 同期先 | 追記内容 |
| --- | --- |
| `observability-monitoring.md` | rotation telemetry / canary evidence schema |
| `deployment-secrets-management.md` | `..._CANDIDATE` / `..._PREVIOUS` op 参照（field 名のみ） |
| `15-infrastructure-runbook.md` | rotation セクション + 本体 runbook 相互リンク |

### `artifacts.json` parity 文言

> root `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。本サイクルでは scripts / canary workflow / local evidence を実装済みとして、workflow state / phase state / runtime evidence boundary を root + outputs に同値で配置する。

---

## Task 3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md`

canonical absolute path で列挙:

- SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）
- LOGS 2 ファイル（aiworkflow-requirements / task-specification-creator）
- 本ワークフロー root: `index.md` / `phase-{01..13}.md`
- `outputs/phase-11/.gitkeep`
- `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- `outputs/phase-13/.gitkeep`
- topic-map / quick-reference / resource-map（更新ある場合）

各 entry に `path / change-summary / wave (same-wave / Wave N+1 / baseline)` を 3 列で記録する。

---

## Task 4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md`

`already_formalized` / `new_unassigned` に分離:

- **already_formalized**: `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md`（本タスクの起票元）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-A`: 次世代 ML model 学習・選定（artifact 自体の再学習）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-B`: 自動 rotation スケジューラ（cron / scheduled workflow による定期 canary）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-C`: rotation evidence の長期保管（artifact upload retention 90 日 → R2 への copy）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-D`: candidate path の op vault entry 自動 lifecycle（promotion 後 PREVIOUS への自動退避）

`new_unassigned` の各エントリは `docs/30-workflows/unassigned-task/` 配下に新規 md として起票し、本ファイルに canonical absolute path で list する（同 same-wave で実施済み）。

---

## Task 5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md`

3 章固定:

### テンプレ改善

- artifact rotation を「candidate / canary / promotion / rollback の 4 段」テンプレ化する提案
- canary workflow（`workflow_dispatch` + op 参照 input）の Phase 5/6 テンプレ化

### ワークフロー改善

- candidate path の op vault lifecycle（PROD → PREVIOUS への自動退避）構造化
- rotation evidence canonical path 予約フォーマット（`phase11-evidence-canonical-paths.json` 同案・FU-04 と統合）

### ドキュメント改善

- aiworkflow-requirements `observability-monitoring.md` に「rotation の 4 段」セクション追加
- forward-safe rollback の「D1 列を消さない」原則を rotation でも継続することを `15-infrastructure-runbook.md` 冒頭の不変条件に追記

改善点なしの章があっても「本サイクルでは改善提案なし」と明記する（章ごと削除しない）。

### Step 1-H promotion / defer / reject 判定

| item | 判定 | 反映先 / 起票先 |
| --- | --- | --- |
| 4 段 rotation テンプレ化 | promote | `.claude/skills/task-specification-creator/references/phase-templates.md`（実反映は別タスク） |
| op vault lifecycle 構造化 | defer | `unassigned-task/` へ formalize（FU-02-D） |
| canonical path 予約 | defer | #549 FU-04 と統合 |
| observability-monitoring 追記 | promote（same-wave） | Task 2 Step 2 で反映 |
| 不変条件追記 | promote（same-wave） | `15-infrastructure-runbook.md` 冒頭 |

---

## Task 6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md`

| 条件 | 確認内容 | 判定根拠 |
| --- | --- | --- |
| 矛盾なし | 13 phase の AC / DoD / 不変条件が衝突していない | 各 phase 横断 grep |
| 漏れなし | strict 7 file 実体配置 / canonical evidence path 7 点予約 / SSOT 3 ファイル更新 | `ls outputs/phase-12/` + `git diff` |
| 整合性 | 状態語彙が `implemented_local_runtime_pending` で統一 / `PASS` 単独表記なし | `rg -n 'PASS\b' outputs/` |
| 依存関係整合 | 親 #549 / #515 / 起票元 unassigned-task / `secret-leakage-grep.ts` 参照リンク OK | `link-checklist.md` 再利用 |

総合判定行は **`implemented_local_runtime_pending` close-out** とし、`PASS` / `verified` 単独表記は禁止。

---

## 完了条件（Phase 12 全体）

- [ ] strict 7 file が逐語固定の正規名で `outputs/phase-12/` に実体配置されている
- [ ] Task 1 Part 1 / Part 2 の必須要件をすべて満たしている
- [ ] Task 2 Step 1-A〜1-C + Step 2 + Step 1-D / 1-H が記載
- [ ] SSOT 3 ファイルの差分要約が記載されている
- [ ] LOGS 2 ファイルへの 1 行 entry が canonical absolute path で記録
- [ ] Task 4 未タスク 4 件（および already_formalized 1 件）が記録
- [ ] Task 5 が 3 章すべて存在し、Step 1-H routing が記録
- [ ] Task 6 の 4 条件がすべて埋まっている
- [ ] `workflow_state = implemented_local_runtime_pending` に再分類
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

- 本サイクルの成果物は local implementation + evidence（`implemented_local_runtime_pending`）。PR は **feature ブランチ**（`feat/issue-587-cf-audit-ml-artifact-rotation`）で base=`dev`。
- rotation scripts / canary workflow / runbook 本体の実装は Gate-R0 通過後の implementation cycle。
- `Refs #549, #587` のみ。Issue #587 / #549 は CLOSED 維持で state mutation しない。
- PR 自動作成は禁止。ユーザー明示許可後にのみ Phase 13 を実行。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## Next Phase

- [Phase 13](phase-13.md): PR 作成
