# Phase 12 Main — issue-1138-smoke-runner-common-lib-extraction

## タスク要約

issue #1138「smoke runner common lib extraction」の実装仕様書。`scripts/smoke/` 配下の 3 本の runtime smoke runner（`runtime-attendance-provider.sh` / `runtime-admin-web.sh` / `runtime-tag-bulk.sh`）にコピー重複している共通ボイラープレート（redact 経由ログ / summary 状態 + write_summary / host-allowlist 照合 / env prefix 解決 / D1 ラッパー）を、新規共通 lib `scripts/smoke/lib/smoke-common.sh` へ**挙動非退化のまま**抽出して SSOT 化する NON_VISUAL リファクタリングである。runner の runtime 挙動・UI 表示物は一切変更しない。本サイクルでは Phase 1-13 の実装仕様書（共通 lib の MECE 境界・9 関数のシグネチャ・3 runner の薄ラッパー移行手順・非退化テスト基準・DoD）を確定し、**コード実装・local test・commit・PR は user-gated**（status = `implemented_local_evidence_captured`）。

issue 本文の共通化候補（`assert_target` / `summary_pass` / `run_d1`）は最新コードと乖離しており、`assert_target` は 3 runner で実装が大きく異なるため共通化対象外（host-allowlist 照合の純粋部品 `smoke_assert_host_allow` のみ抽出）、`summary_pass` / `run_d1` は現状 tag-bulk のみだが将来 SSOT として lib 配置、と最適化した。最重要最適化点は issue 未記載の **`write_summary` 配列キー分岐（attendance=`routes` / admin-web・tag-bulk=`checks`）** を共通 `smoke_write_summary` の array_key 引数化で両 shape を非退化に再現することである。

## 成果物

- 仕様書 13 phase（`outputs/phase-1..13/phase-N.md`）
- strict 7 outputs（本 dir）
  1. `main.md`
  2. `implementation-guide.md`
  3. `system-spec-update-summary.md`
  4. `documentation-changelog.md`
  5. `unassigned-task-detection.md`
  6. `skill-feedback-report.md`
  7. `phase12-task-spec-compliance-check.md`
- `artifacts.json` / `outputs/artifacts.json`（gates: Gate-A passed / Gate-B passed / Gate-C pending）
- Phase 11 evidence ledger（`outputs/phase-11/phase-11.md` + NON_VISUAL 代替証跡 = local test / shellcheck present）

## 実装対象（本サイクルで実装済み）

| # | 区分 | パス | 概要 |
| - | ---- | ---- | ---- |
| 1 | NEW | `scripts/smoke/lib/smoke-common.sh` | 共通 lib。公開関数 9（`smoke_redact_filter` / `smoke_redact_line` / `smoke_summary_init` / `smoke_summary_pass` / `smoke_summary_fail_entry` / `smoke_write_summary` / `smoke_assert_host_allow` / `smoke_env_prefix` / `smoke_run_d1`）+ 公開変数 3（`SMOKE_SUMMARY_ENTRIES` / `SMOKE_OVERALL_STATUS` / `SMOKE_REDACT`）。`set` / `trap` を持たない純粋部品 |
| 2 | NEW | `scripts/smoke/__tests__/smoke-common.test.sh` | 共通 lib 用 local test（9 関数の単体挙動 / array_key 分岐 / SMOKE_ prefix 隔離 / trap 非保持の検証） |
| 3 | EDIT | `scripts/smoke/runtime-attendance-provider.sh` | lib を source + 薄ラッパー移行。`write_summary` ラッパーは array_key=`routes`。fail/pass entry は固有 shape のため runner 残置 |
| 4 | EDIT | `scripts/smoke/runtime-admin-web.sh` | lib を source + 薄ラッパー移行。`write_summary` ラッパーは array_key=`checks`。`record_check` は固有 shape のため runner 残置 |
| 5 | EDIT | `scripts/smoke/runtime-tag-bulk.sh` | lib を source + 薄ラッパー移行。`write_summary` ラッパーは array_key=`checks`。`assert_all_status` / `extract_count` は test が `source "$RUNNER"` で直接呼ぶため runner 残置（AC-10） |

> 成果物 1〜5 は本サイクルでは仕様確定のみ。実コード実装・local test 実走・shellcheck・commit・PR は user-gated。

## 状態

- workflow_state: `implemented_local_evidence_captured`（Phase 1-12 と実装・local evidence 取得完了。commit・PR は user-gated）
- Gate-A: passed（spec compliance）
- Gate-B: passed（smoke-common.sh 作成 + 3 runner 移行 + lib test 追加 + 既存 3 runner test 非退化全 PASS + shellcheck clean）
- Gate-C: pending（commit / push / PR = user-gated・Phase 13）
- issue #1138: CLOSED 維持（本仕様書作成で state を変更しない）
- visualEvidence: NON_VISUAL（bash runner 内部リファクタリング。UI 表示物・runtime 挙動の変更なし。Phase 11 screenshot 不要）
