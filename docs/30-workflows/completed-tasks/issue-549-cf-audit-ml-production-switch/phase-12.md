# Phase 12: 実装ガイド・SSOT 同期・未タスク・skill feedback（6 必須タスク全網羅）

## 目的

Phase 12 必須 6 タスクを完遂し、`outputs/phase-12/` 配下に **strict 7 ファイル**（`main.md` + 6 補助）を逐語固定の正規ファイル名で実体作成する。1 つでも欠落・短縮名 / 別名で配置された場合は `phase12-task-spec-compliance-check.md` を `FAIL` 判定とする。本サイクルは local observation scripts を含むため `implemented-local / runtime pending` とし、production switch runtime は Gate 後に分離する。

## 前 Phase 依存

- Phase 11（本ワークフローの NON_VISUAL 縮約 3 点 + canonical evidence path 予約）
- 親タスク `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## Phase 12 entry checklist（着手前 gate）

| # | gate | 確認方法 | 失敗時の挙動 |
| --- | --- | --- | --- |
| E1 | placeholder token 0 件（`<TBD>` / `TODO:fill` / `XXX` / `???`） | `rg -n '(<TBD>\|TODO:fill\|XXX\|\?\?\?)' docs/30-workflows/issue-549-cf-audit-ml-production-switch/` | 該当箇所を埋めるまで Phase 12 着手禁止 |
| E2 | `§99 必須項目 content check`（index.md の AC-1〜AC-12 / DoD / refs / Phase 一覧 / 不変条件 / 苦戦箇所 / 検証方法） | 目視 + grep で見出し存在 | 不足見出しを補う |
| E3 | dirty-code gate（`outputs/` 配下に `.tmp` / `.bak` / `*~` / コメントアウト中の旧仕様残骸が無いこと） | `find outputs -name '*.tmp' -o -name '*.bak' -o -name '*~'` | 削除してから着手 |
| E4 | implemented-local 妥当性（`scripts/cf-audit-log/` コード差分と docs 状態語彙が一致） | git diff | コード差分があるのに `spec_created` を維持している場合は `implemented-local` へ昇格 |
| E5 | `outputs/phase-11/` の 3 点（main.md / manual-smoke-log.md / link-checklist.md）が実体配置済み | ls | 不足は Phase 11 へ差戻し |

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

短縮名・別名（例: `impl-guide.md` / `skill-feedback.md` / `compliance-check.md` / `unassigned-tasks.md`）は禁止。

---

## Task 1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

`outputs/phase-12/implementation-guide.md`

### Part 1（中学生レベル / 必須要件）

- 日常生活の例え話を **1 つ以上** 含める。例:
  - 「production 切替」= 「給食の試食版から本番メニューへの切替」
  - 「forward-safe rollback」= 「席替えしたあと、机の位置（D1 列）はそのままで、当番表（env）だけ前のに戻せばすぐ元通り」
  - 「fallback rate」= 「自動採点機が壊れたら先生が手動で採点する割合」
  - 「7 日観測」= 「新メニューを 1 週間続けて、毎時間アンケートを取る」
  - 「leakage grep」= 「うっかり日記に住所を書いていないか、毎晩チェックする習慣」
- 専門用語セルフチェック表を **5 用語以上**:
  - classifier → 「判定する人」
  - threshold → 「合格ライン」
  - ML（機械学習） → 「データから自分で合格ラインを学ぶ仕組み」
  - rollback → 「元に戻す手順」
  - fallback → 「うまくいかない時の代わりの手段」
  - artifact → 「学んだ結果を保存したファイル」
- 「なぜ必要か」（誤検知や見逃しを減らしたい）→「何をするか」（hourly に判定 + 7 日観測 + 危なくなったら 1 行で戻す）の順で書く。
- 中学 2 年生が読んで止まらない語彙に揃える。

### Part 2（技術者レベル / 必須要件）

- `Classifier` interface（親 #515 由来）を再掲し、production 切替で env のみ変更する設計を明記
- TypeScript 型: `PostSwitchMonitorOutput` / `FallbackRateAlertPayload` / `MLClassifierLoadResult` を含める
- API シグネチャ:
  - `post-switch-monitor.ts`: `--input <hourly-json-dir> --out <json>`（互換 alias: `--in`, `--output`, `--aggregate=7d`, `--window`）/ 出力 JSON は `{ windowHours, fallbackRateMean, fallbackRateMax, issuesOpenedTotal, p95LatencyMedianMs, leakageHits, thresholdSnapshots, mlSnapshots }` を必須 field とする
  - `fallback-rate-alert.ts`: 3 hour 連続で fallback rate > 5% を検出したら GitHub Issue 起票（`gh issue create`）
- 設定可能パラメータ:
  - `CF_AUDIT_CLASSIFIER` ∈ `{ threshold, ml }`（production env で `ml`）
  - `ML_MODEL_PATH`（`op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照のみ）
  - `CF_AUDIT_FALLBACK_RATE_THRESHOLD` = `0.05`
  - `CF_AUDIT_FALLBACK_RATE_CONSECUTIVE_HOURS` = `3`
- エラーハンドリング:
  - model artifact load 失敗 → threshold fallback 自動発動（`MLClassifier` skeleton 経由）
  - fallback rate > 5% 連続 3 hour → GitHub Issue 起票 + env 戻し検討
  - leakage grep positive → hourly run fail（exit 1）+ Issue 削除 + token revoke runbook へ
- runtime path × evidence 表（service-binding ではないが 2 path に分岐）:

  | runtime path | evidence | 取得サイクル |
  | --- | --- | --- |
  | hourly classifier path | `evidence/test.log`（focused test） + `evidence/hourly-run-7day.md` | 実装 + 7 日観測 |
  | model artifact load path | `evidence/dry-run-ml.log` | 実装サイクル |
  | leakage grep post-step path | `evidence/grep-gate.log`（clean / positive 両方） | 実装サイクル |

- forward-safe rollback の 1 step:
  - `gh variable set CF_AUDIT_CLASSIFIER --body "threshold"`
  - D1 列（`classifier_used` / `classifier_version` / `confidence`）は **削除しない**

> 親 `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md` を canonical absolute path で参照し、本タスクは「production env 切替 + 7 日観測 + alert + leakage grep gate」の差分のみ記述する。

### Part 1 ドラフト採用ルール

本仕様書 phase-12.md に Part 1 ドラフトを直接書いている場合、`implementation-guide.md` Part 1 には **このドラフトをそのままコピーペースト** する。AI による「自然な書き直し」は禁止。

---

## Task 2: システム仕様書更新（Step 1-A/B/C + 条件付き Step 2 + Step 1-D / 1-H）

`outputs/phase-12/system-spec-update-summary.md`

### Step 1-A: 完了タスク記録（spec_created close-out）

| 同期先 | 追記内容 |
| --- | --- |
| `docs/30-workflows/issue-549-cf-audit-ml-production-switch/index.md` | 「Phase 完了状況」表を `phases[1〜13].status = spec_created` で更新 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 1 行 entry: canonical absolute path + `state: spec_created` |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | 1 行 entry: canonical absolute path + `state: spec_created` |
| `.claude/skills/aiworkflow-requirements/references/topic-map.md` | `cf-audit-log` topic に本タスクの absolute path を追加（generator がある場合は `mise exec -- pnpm indexes:rebuild` 実行記録） |

### Step 1-B: 実装状況テーブル更新

`workflow_state = spec_created` を維持する（`completed` / `verified` に上げない）。Issue #549 が CLOSED でも reopen はせず、`Refs #549` で連携する旨を `index.md` Decision Log に記録する。

### Step 1-C: 関連タスクテーブル更新

| 関連タスク | 更新後 status |
| --- | --- |
| 親 #515（Classifier abstraction） | `completed` を維持 |
| FU-03-A 90 日 baseline | `unassigned`（本タスク Phase 12 Task 4 で再起票） |
| FU-03-B モデル学習 | `unassigned` |
| FU-03-C #548 offline replay | `external_dependency`（Gate-A〜C の前提） |
| 本タスク #549 production switch | `spec_created` |

### Step 1-D: 上流 runbook 差分追記タイミング判定

`runbook-diff-plan.md`（または本ファイル内セクション）で、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への rollback runbook 追記タイミングを `same-wave`（本サイクル spec として記述するが、本番 apply 手順は実装サイクルで `applied` に切替）と確定する。

### Step 1-H: skill feedback routing

Task 5 の各 item を `promote` / `defer` / `reject` のいずれかに routing し、本ファイルに promotion target / no-op reason / evidence path を記録する（詳細は Task 5）。

### Step 2: 新規インターフェース追加

**判定: 適用**（本タスクでは `PostSwitchMonitorOutput` / `FallbackRateAlertPayload` / `MLModelArtifactDistributionTarget` 型を新規追加する）。

| 同期先 | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | production switch 手順 / fallback rate alert / 7 日観測 telemetry の必須 field（本 implemented-local cycle で実更新） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `CF_AUDIT_CLASSIFIER=ml`（Gate 後のみ） / `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` / `CF_AUDIT_FALLBACK_RATE_THRESHOLD`（本 implemented-local cycle で実更新） |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback runbook（env 戻し 1 行 / D1 列残置 / model artifact 不整合対応）/ post-switch 7 日観測手順（本 implemented-local cycle で実更新） |

### `outputs/artifacts.json` 不在ケース parity 文言（逐語コピー必須）

> root `artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。

---

## Task 3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md`

以下を canonical absolute path で列挙:

- SSOT 3 ファイル（observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook）
- LOGS 2 ファイル（aiworkflow-requirements / task-specification-creator）
- 本ワークフロー root: `artifacts.json` / `index.md` / `phase-01.md` 〜 `phase-13.md`
- `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md`
- `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- topic-map / quick-reference / resource-map（更新がある場合）

各 entry に `path / change-summary / wave (same-wave / Wave N+1 / baseline)` を 3 列で記録する。

---

## Task 4: 未タスク検出レポート（0 件でも必須）

`outputs/phase-12/unassigned-task-detection.md`

スコープ外として以下を `already_formalized` / `new_unassigned` に分離する。既存 unassigned は再起票せず canonical path へ再リンクする（テンプレ必須 4 セクション = 苦戦箇所 / リスクと対策 / 検証方法 / スコープ）。

- **already_formalized**: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md`（90 日 baseline / ML モデル学習・選定 / offline replay の親候補を包含。Gate-A の前提として再リンク）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-01`: 7 日完走後の `pass_runtime_synced` close-out（hourly run URL 取得 + Issue 起票数 baseline 比較 + leakage grep clean 7 日連続）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-02`: model artifact ローテーション（次世代 model 投入時の env 切替 + canary 評価）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-03`: fallback rate alert の Slack / メール通知拡張（親 #408 既知の alert 拡張と重複しない範囲のみ）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-04`: Gate metadata 構造化（`artifacts.json.metadata.gates[].passed_at`）
- **new_unassigned**: `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-05`: `phase11-evidence-canonical-paths.json` evidence path 予約フォーマット

`new_unassigned` の各エントリは `docs/30-workflows/unassigned-task/` 配下に新規 md として起票し、本ファイルに canonical absolute path で list する。既存 unassigned を再起票して重複させない。

---

## Task 5: スキルフィードバックレポート（改善点なしでも必須）

`outputs/phase-12/skill-feedback-report.md`

3 章固定:

### テンプレ改善

- 「production switch + post-switch N 日観測 + forward-safe rollback」の 3 点セットを Phase 11 OIDC / deploy auth migration NON_VISUAL evidence matrix の派生テンプレ化する提案
- workflow YAML の post-step 追加（leakage grep / fallback alert / observation snapshot）の Phase 5/6 テンプレに「3 つの post-step を必須化」セクション化する提案

### ワークフロー改善

- Gate-A〜D の通過判定を `artifacts.json.metadata.gates[].passed_at` のように構造化する案（複数タスクで使い回し可能に）
- `phase11-evidence-canonical-paths.json` のような evidence path 予約フォーマットの導入（spec_created → 実装サイクルで path drift しない）

### ドキュメント改善

- aiworkflow-requirements の `observability-monitoring.md` に「production switch + N 日観測 + alert」セクションを追加し、本タスクと親 #515 をリンク
- forward-safe rollback の「D1 列を消さない」原則を `15-infrastructure-runbook.md` 冒頭の不変条件に昇格

改善点なしの章があっても「本サイクルでは改善提案なし」と明記する（章ごと削除しない）。

### Step 1-H promotion / defer / reject 判定

| item | 判定 | 反映先 / 起票先 |
| --- | --- | --- |
| production switch + N 日観測 + rollback テンプレ化 | promote | `.claude/skills/task-specification-creator/references/phase-templates.md` の派生テンプレ追加候補（実反映は別タスク） |
| Gate 構造化 | defer | `docs/30-workflows/unassigned-task/` へ formalize |
| evidence path 予約フォーマット | defer | 同上 |
| observability-monitoring 追記 | promote（same-wave） | Task 2 Step 2 の SSOT 更新で反映 |
| forward-safe rollback 不変条件昇格 | promote（same-wave） | `15-infrastructure-runbook.md` 冒頭 |

---

## Task 6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md`

以下 4 条件 × 各 check 列で実体記録:

| 条件 | 確認内容 | 判定根拠 |
| --- | --- | --- |
| 矛盾なし | 13 phase の AC / DoD / 不変条件が衝突していない | 各 phase 横断 grep |
| 漏れなし | strict 7 file 実体配置 / canonical evidence path 5 点予約 / SSOT 3 ファイル更新 | `ls outputs/phase-12/` + `ls outputs/phase-11/` + `git diff` |
| 整合性 | 状態語彙が `implemented-local / runtime pending` で統一されている / `PASS` 単独表記なし | `rg -n 'PASS\b' outputs/` |
| 依存関係整合 | 親 #515 / FU-03-C #548 / `.github/workflows/cf-audit-log-monitor.yml` 参照リンクが OK | `link-checklist.md` 再利用 |

総合判定行は **`implemented-local / runtime pending` close-out** とし、`PASS` / `verified` 単独表記は禁止。Implementation evidence path 状態揃え checklist 6 項目（phase-12-spec.md 参照）を全て `OK` または `PENDING_RUNTIME_GATE` で埋める。

`outputs/artifacts.json` 不在ケースの parity 文言（Task 2 と同じ逐語）を必ず再掲する。

---

## 完了条件（Phase 12 全体）

- [ ] strict 7 file が逐語固定の正規名で `outputs/phase-12/` に実体配置されている（短縮名・別名 0 件）
- [ ] Task 1 Part 1 / Part 2 の必須要件をすべて満たしている（例え話 1 つ以上 / 用語 5 以上 / TypeScript 型 / runtime path × evidence 表 / rollback 1 step）
- [ ] Task 2 Step 1-A〜1-C + Step 2 + Step 1-D / 1-H が本ファイル `system-spec-update-summary.md` に記載
- [ ] SSOT 3 ファイルの差分要約が記載されている（実反映は same-wave で実施）
- [ ] LOGS 2 ファイルへの 1 行 entry が canonical absolute path で記録されている
- [ ] Task 4 未タスク 5 件（または 0 件宣言）が `unassigned-task/` 配下に起票され、本ファイルに list されている
- [ ] Task 5 が 3 章すべて存在し、Step 1-H routing が記録されている
- [ ] Task 6 の 4 条件 × Implementation evidence path checklist 6 項目がすべて埋まっている
- [ ] `workflow_state = implemented-local` に昇格。production switch runtime は `runtimePending` に明記
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

- 本サイクルの成果物は local scripts + docs/SSOT（`implemented-local`）。PR は **feature ブランチ**（`feat/issue-549-cf-audit-ml-production-switch`）で base=`dev` 出す。
- workflow YAML 編集 / production env switch / model artifact 本番配布 / hourly post-step 組込みは Gate-0〜C 通過後の runtime cycle で実施。
- `Refs #549` のみ。Issue は CLOSED のまま open / close 操作なし。
- PR 自動作成は禁止。ユーザー明示許可後にのみ Phase 13 を実行。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented-local |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 12-1 | implementation-guide.md を Part 1 / Part 2 構成で配置する |
| 12-2 | system-spec-update-summary.md と SSOT 同期を記録する |
| 12-3 | documentation-changelog.md を作成する |
| 12-4 | unassigned-task-detection.md と formalized tasks を作成する |
| 12-5 | skill-feedback-report.md を routing 付きで作成する |
| 12-6 | phase12-task-spec-compliance-check.md で 4 条件を確認する |

## 参照資料

- `index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

## 成果物/実行手順

strict 7 files を `outputs/phase-12/` に配置し、SSOT 3 ファイルと LOGS 2 ファイルを same-wave で更新する。
