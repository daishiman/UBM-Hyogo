# Documentation Changelog — issue-1138-smoke-runner-common-lib-extraction

## 作成した仕様書ファイル

| 日付 | 変更 | ファイル |
| ---- | ---- | -------- |
| 2026-06-08 | 仕様書 root 新規作成（`implemented_local_evidence_captured`） | `docs/30-workflows/completed-tasks/issue-1138-smoke-runner-common-lib-extraction/index.md` |
| 2026-06-08 | Phase 1-13 仕様書作成 | `outputs/phase-1..13/phase-N.md` |
| 2026-06-08 | strict 7 outputs 作成 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| 2026-06-08 | `artifacts.json` / `outputs/artifacts.json` 作成・同期（Gate-A passed / Gate-B passed・Gate-C pending） | `artifacts.json`, `outputs/artifacts.json` |
| 2026-06-08 | Phase 11 evidence ledger（NON_VISUAL / 代替証跡 = local test・shellcheck・本サイクルで present）作成 | `outputs/phase-11/phase-11.md`, `outputs/phase-11/manual-test-result.md` |

## Step 別の結果（全 Step 個別明記・「該当なし」も記録）

| Step | 内容 | 結果 |
| ---- | ---- | ---- |
| Step 1-A | タスク記録（root 作成・親タスク紐付け・consumed unassigned 確認） | 実施済み（`implemented_local_evidence_captured` で 30-workflows ledger に記録。親 issue-1081 / consumed unassigned followup-007 を記録） |
| Step 1-B | 実装状況テーブル | 実施済み（仕様書 Phase 1-13 完了 / コード実装・local evidence 取得は完了） |
| Step 1-C | 関連タスクテーブル | 実施済み（親 issue-1081 / issue-1137 4 本目候補 / 既存 3 runner / redact.sh・cf.sh 再利用を記録） |
| Step 2 | aiworkflow-requirements 正本（API/DB/UI）更新 | **該当なし（N/A）**。新規 public インターフェースは内部 bash lib 契約でありドメイン契約変更ではない。smoke lib 公開 surface は本 workflow 内に記録 |

## workflow-local 同期（本 workflow dir 内・本サイクルで実施）

[Feedback BEFORE-QUIT-003] workflow-local 同期は本 workflow dir 内のファイルへの反映であり、global skill sync とは別ブロックで記録する。

| 対象 | 内容 |
| ---- | ---- |
| `index.md` | workflow メタ情報・issue 最適化・MECE 境界・Phase 構成を記録 |
| `outputs/phase-2/phase-2.md` | lib 9 関数の正本シグネチャ・公開変数・MECE 境界表を記録（公開 surface の workflow 内正本） |
| `outputs/phase-12/implementation-guide.md` | Part 2 に bash 9 関数シグネチャ・入出力・エラー・定数一覧を記録 |
| `artifacts.json` | gates / phase12_strict_outputs / verify_commands を記録 |

## global skill sync（`.claude/skills/**` 正本・実施判定）

[Feedback BEFORE-QUIT-003] global skill sync は `.claude/skills/**` の正本ファイルへの反映であり、workflow-local 同期とは別ブロックで記録する。

| 対象 skill | 内容 | 本サイクルでの扱い |
| ---------- | ---- | ------------------ |
| `task-specification-creator` | NON_VISUAL bash refactor タスクの spec パターン（共通 lib 抽出 / 二段 source 非退化検証） | skill-feedback-report.md FB-1/FB-2 で改善観点を記録。本サイクルでは追加の正本ファイル反映不要 で実施 |
| `aiworkflow-requirements` | workflow registration / `task-workflow-active.md` | workflow 登録のみ同期。API/DB/UI ドメイン spec は変更なし（Step 2 = N/A） |

> global skill 正本ファイルへの追加書き込みは不要。改善観点は skill-feedback-report.md に記録済み。

## validator 結果

| validator | コマンド | 期待 |
| --------- | -------- | ---- |
| phase12-compliance | `pnpm verify:phase12-compliance`（CI gate `verify-phase12-compliance`） | canonical 9 見出し逐語一致 + Phase 11 evidence inventory 整合で ok:true |
| gate-metadata | `pnpm gate-metadata:validate` | artifacts.json zod schema 整合・Gate-A passed の evidence_path 実在 |
| indexes | `pnpm indexes:rebuild` | workflow registration を含めて drift 0 |

> 上記 validator は本仕様書作成 wave で実行する。共通 lib 作成・3 runner 移行・lib test 実走・shellcheck は Gate-B user approval 後に実行する。

## current vs baseline

| 観点 | baseline（本タスク前） | current（本タスク後） |
| ---- | ---------------------- | --------------------- |
| smoke runner の共通機構 | 3 runner にコピー重複（`write_summary` キー分岐 routes/checks・`fail_and_exit` 3 シグネチャ・trap 3 shape の drift 顕在化） | 共通 lib `smoke-common.sh`（9 関数 + 3 公開変数）へ抽出する実装仕様書を確定（`implemented_local_evidence_captured`）。コード実装・local evidence 取得は完了 |
| issue #1138 | CLOSED（元 unassigned-task は formalize 候補） | CLOSED 維持。phase1-13 実装仕様書として formalize |
| 共通 lib の公開 surface | なし | 9 関数シグネチャ・array_key 分岐契約・MECE 境界を workflow 内（phase-2 / implementation-guide）に正本化 |

## 変更理由

issue #1138 の真の gap（3 smoke runner の共通機構が SSOT 化されず drift が顕在化）を解消するため、issue 本文を**最新コードへ最適化**して実装仕様書化した。最適化点:

- `assert_target` を共通化候補から外し（3 runner で実装が大きく異なる）、host-allowlist 照合の純粋部品 `smoke_assert_host_allow` のみ抽出。
- `summary_pass` / `run_d1` は現状 tag-bulk のみ（重複でない）だが将来 SSOT として lib 配置。
- issue 未記載の `write_summary` 配列キー分岐（attendance=routes / 他=checks）を `smoke_write_summary` の array_key 引数化で非退化再現（最重要最適化点・AC-9）。
- `assert_all_status` / `extract_count` は tag-bulk test が `source "$RUNNER"` で直接呼ぶため lib へ移さず runner 残置（AC-10）。
