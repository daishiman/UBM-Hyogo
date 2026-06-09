# Phase 12 Task Spec Compliance Check — issue-1138-smoke-runner-common-lib-extraction

## Summary verdict

`implemented_local_evidence_captured`。issue #1138「smoke runner common lib extraction」を Phase 1-13 実装仕様書として作成し、`scripts/smoke/` の 3 runner にコピー重複している共通機構を新規共通 lib `scripts/smoke/lib/smoke-common.sh`（9 関数 + 3 公開変数）へ挙動非退化で抽出した。本サイクルで共通 lib 作成・3 runner 移行・lib test 追加・既存 3 runner 非退化 test・shellcheck clean まで完了。runner の runtime 挙動・UI 表示物は変更しない。issue #1138 は CLOSED 状態を維持し、本作業で state を変更しない。`ok:true` 相当（canonical 9 見出し逐語 + Phase 11 evidence inventory present + Gate-B passed）。

## Changed-files classification

| 分類 | パス | 状態 |
| --- | --- | --- |
| spec（新規） | `docs/30-workflows/completed-tasks/issue-1138-smoke-runner-common-lib-extraction/**` | 本 wave で作成・`implemented_local_evidence_captured` 状態 |
| 実装（新規） | `scripts/smoke/lib/smoke-common.sh` | 実装済み・検証 PASS |
| 実装（編集） | `scripts/smoke/runtime-attendance-provider.sh` | 実装済み・検証 PASS（lib source + 薄ラッパー移行・array_key=routes） |
| 実装（編集） | `scripts/smoke/runtime-admin-web.sh` | 実装済み・検証 PASS（lib source + 薄ラッパー移行・array_key=checks） |
| 実装（編集） | `scripts/smoke/runtime-tag-bulk.sh` | 実装済み・検証 PASS（lib source + 薄ラッパー移行・array_key=checks） |
| test（新規） | `scripts/smoke/__tests__/smoke-common.test.sh` | 実装済み・検証 PASS |
| reused（不変） | `scripts/smoke/redact.sh` / `scripts/cf.sh` | 変更しない（lib が参照 / ラップ） |

> CONST_004/005 に従い、本タスクのコード実装と local 検証は 1 cycle 内で完了した。commit / push / PR は user-gated。

## `workflow_state` and phase status consistency

- `artifacts.json.metadata.workflow_state` = `implemented_local_evidence_captured`。
- Phase 1-12 status = `completed`、Phase 13 = `pending_user_approval`。
- implementation target を列挙しつつ `implemented_local_evidence_captured` で凍結する状態は整合（コード実装・local evidence 取得は完了・Gate-B passed）。
- Gate-B = `passed`（passed_at: 2026-06-08T06:45:00+09:00）・Gate-C = `pending`（commit / push / PR user-gated）。
- Gate-A = `passed`（evidence_path = 本ファイル・物理存在）。

## Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| lib unit test log | outputs/phase-11/evidence/smoke-common-test.log | present |
| attendance non-regression test log | outputs/phase-11/evidence/runtime-attendance-provider-test.log | present |
| admin-web non-regression test log | outputs/phase-11/evidence/runtime-admin-web-test.log | present |
| tag-bulk non-regression test log | outputs/phase-11/evidence/runtime-tag-bulk-test.log | present |
| shellcheck log | outputs/phase-11/evidence/shellcheck.log | present |

> NON_VISUAL（bash runner 内部リファクタリング）のため screenshot / axe は対象外（n/a）。代替証跡は local test 全 PASS + shellcheck clean。全 evidence は本サイクルで `present`。

## Phase 12 strict 7 file inventory

| # | ファイル | 存在 | 本文量 / key sections |
| - | -------- | ---- | --------------------- |
| 1 | main.md | あり | タスク要約 / 成果物 / 実装対象 / 状態 |
| 2 | implementation-guide.md | あり | Part 1（中学生レベル概念・共有道具箱の例え）+ Part 2（背景 / 要約 / 公開変数 / bash 9 関数シグネチャ / 共通冒頭 / array_key 分岐表 / runner 残置 MECE / 定数一覧 / エラー処理 / 視覚証跡）。各 Part 本文 3 行以上・heading-only でない |
| 3 | system-spec-update-summary.md | あり | Step 1-A/1-B/1-C + Step 2 = aiworkflow-requirements 正本変更 N/A（理由明記）・smoke lib 公開 surface は workflow 内記録 |
| 4 | documentation-changelog.md | あり | 作成ファイル一覧 / 全 Step 個別明記（該当なし含む）/ workflow-local sync と global skill sync を別ブロック / validator / current vs baseline / 変更理由 |
| 5 | unassigned-task-detection.md | あり | 4 パターン + current 0 件 + baseline 2 候補（BASELINE-1/2）+ 関連タスク差分確認（issue-1137 等） |
| 6 | skill-feedback-report.md | あり | FB-1/FB-2/FB-3（テンプレート / ワークフロー / ドキュメント観点） |
| 7 | phase12-task-spec-compliance-check.md | あり | 本ファイル（canonical 9 見出し） |

> implementation-guide.md は Part 1（中学生レベル概念）/ Part 2（bash 9 関数シグネチャ・入出力・エラー・定数）とも見出しだけでなく実体を持ち、heading-only reject gate（PARALLEL-01-NAV）に非該当。識別子（関数名）は phase-2.md と完全一致。

## Skill/reference/system spec same-wave sync

- task-specification-creator へ NON_VISUAL bash lib 抽出タスクの spec パターン（二段 source 非退化検証 / 公開 surface ≠ ドメイン正本変更の Step 2 判定）を skill-feedback-report.md FB-1/FB-2 として記録。追加の global skill 正本変更は不要と判定。
- aiworkflow-requirements へ workflow registration / task-workflow-active を反映。API endpoint schema / D1 schema / IPC / UI route / auth / Cloudflare Secret は変更なし（Step 2 = N/A）。新規 public surface は内部 bash lib 契約であり aiworkflow-requirements ドメイン正本ではないため、本 workflow 内（phase-2 関数仕様表 + implementation-guide Part 2）に記録する。
- 本仕様書は既存 skill 規約（canonical 9 見出し / strict 7 / Phase 11 evidence inventory テーブル / 3-state verdict）に準拠して作成済み。新規ルールの即時追加は不要。

## Runtime or user-gated boundary

| 項目 | 境界 |
| ---- | ---- |
| 仕様書作成（Phase 1-13 / strict 7 / artifacts.json） | 本 cycle で完了 |
| コード実装（smoke-common.sh 作成 / 3 runner 移行 / lib test 追加） | 本 cycle で完了（Gate-B passed） |
| local 検証（lib test / 3 runner 非退化 test 全 PASS / shellcheck clean） | 本 cycle で取得済み（Gate-B passed） |
| commit / push / PR | user-gated（Gate-C / Phase 13） |
| issue #1138 state 変更 | 実施しない（CLOSED 維持） |

> delivery（commit / push / PR）のみ user-gated。実装と検証は本サイクルで完了済み。

## 30種思考法 compact evidence

| カテゴリ | 適用した思考法 | 結論 |
| --- | --- | --- |
| 論理分析系 | 批判的思考 / 演繹思考 / 帰納的思考 / アブダクション / 垂直思考 | issue 本文の共通化候補（assert_target）が 3 runner で実装 3 通りであることから「共通化対象外・host-allowlist 照合のみ抽出」へ再分類。drift（write_summary キー分岐）を真の gap と切り分け |
| 構造分解系 | 要素分解 / MECE / 2軸思考 / プロセス思考 | 共通機構を redact / summary 状態 / write_summary / host-allow / env prefix / D1 ラッパーに分解し、共通化対象（lib 9 関数）と runner 固有（entry shape / assert_target / request 系 / trap）を MECE 境界として 2 軸で分離 |
| メタ・抽象系 | メタ思考 / 抽象化思考 / ダブル・ループ思考 | 「公開 surface 追加だが aiworkflow-requirements ドメイン正本は N/A」という前提を見直し、内部 bash lib 契約は workflow 内記録に留める判定へ収束 |
| 発想・拡張系 | ブレインストーミング / 水平思考 / 逆説思考 / 類推思考 / if思考 / 素人思考 | 「3 人が同じ道具を 1 個ずつ持つ → 共有道具箱に 1 セット」の中学生レベル類推で共通 lib 概念を表現。array_key 引数化で両 shape を非退化再現する逆説的解（全統合ではなく引数化）を採用 |
| システム系 | システム思考 / 因果関係分析 / 因果ループ | lib SSOT 化 → 4 本目 runner 追加コスト低下 → さらに共通化価値増大の強化ループと、過剰共通化 → 引数膨張 → 柔軟性喪失のバランスループを整理し、MECE 境界で後者を抑制 |
| 戦略・価値系 | トレードオン思考 / プラスサム思考 / 価値提案思考 / 戦略的思考 | entry shape 統一 / request 系の共通化を初回スコープ外（baseline）に抑え、shape 一致部分 + array_key 引数化の最小抽出で最大の SSOT 価値を確保 |
| 問題解決系 | why思考 / 改善思考 / 仮説思考 / 論点思考 / KJ法 | 真の論点を「重複削除ではなく、挙動を 1 ビットも変えずに SSOT 化する」と定義し、AC-1〜AC-10（特に AC-3 非退化 / AC-9 array_key / AC-10 二段 source）へ集約 |

## Archive/delete stale-reference gate

- 本 wave で削除・移動した root は無し（新規作成のみ）。
- 消費した未タスク `unassigned-task/task-issue-1036-followup-007-smoke-runner-common-lib-extraction.md`（存在する場合）は本仕様書で formalize（phase1-13 化）し、`unassigned-task/` に consumed trace として残置する（completed-tasks への移動は PR merge / close-out 時に user-gated）。#1138 は CLOSED 継続、コード実装 / delivery のみ user-gated。
- live inventory / active workflow / consumed trace / quick-reference / resource-map / task-workflow を破壊する削除は無し。

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented_local_evidence_captured` / Gate-B passed / Gate-C pending の境界が一致。array_key 分岐（routes/checks）が phase-2・implementation-guide・実コードで一致 |
| 漏れなし | PASS | Phase 1-13 + strict 7 + artifacts.json×2 + Phase 11 evidence ledger present。lib 9 関数 + 3 公開変数 + MECE 境界を実装 |
| 整合性あり | PASS | 用語（`smoke_*` 9 関数 / `SMOKE_*` 3 変数 / array_key=routes/checks / `e2e_test_issue1081_` 非干渉）・パス・JSON metadata（workflow_state=implemented_local_evidence_captured / Gate-A,B passed・C pending）・evidence_path が全 phase で一致 |
| 依存関係整合 | PASS | 親 issue-1081（runner 雛形・変更しない）/ consumed unassigned followup-007（formalize）/ issue-1137（4 本目候補・直交）/ 既存 3 runner（共通化対象）/ redact.sh・cf.sh（再利用）の関係を明記。削除 root なし |
