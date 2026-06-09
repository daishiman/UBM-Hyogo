# Phase 11 Manual Test Result（NON_VISUAL 非退化 ledger・実行 runbook） — issue-1138-smoke-runner-common-lib-extraction

[実装区分: 実装仕様書] / NON_VISUAL

## 区分

| 項目 | 値 |
| ---- | -- |
| visualEvidence | NON_VISUAL（bash 共通 lib 抽出。UI 表示物の変更なし・screenshot 不要・生成禁止） |
| workflow_state | `implemented_local_evidence_captured`（実装・local test・shellcheck 完了。commit・PR は user-gated） |
| 状態語彙 | `implemented_local_evidence_captured`（全 evidence present。commit・PR のみ user-gated） |
| 実行者 | Codex / 2026-06-08 本サイクル |

> 本ファイルは **非退化検証の実行結果と evidence 対応表**である。secret 実値は一切記載しない。

## NON_VISUAL メタ — 証跡の主ソースとスクリーンショット非生成理由 [Feedback 4]

| 項目 | 内容 |
| ---- | ---- |
| 証跡の主ソース（自動テスト名 / 件数） | (1) `scripts/smoke/__tests__/smoke-common.test.sh`（新規 lib test・全 `smoke_*` 関数の単体ケース）、(2) `scripts/smoke/__tests__/runtime-attendance-provider.test.sh`（**11 ケース**）、(3) `scripts/smoke/__tests__/runtime-admin-web.test.sh`（**16 ケース**）、(4) `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（assert ケース群: assert-assigned / assert-noop / assert-unassigned / assert-empty-fails / assert-mixed-fails / assert-batch-required / summary-pass / redaction）、(5) `shellcheck`（対象 4 ファイル clean） |
| スクリーンショットを作らない理由 | 本タスクは `scripts/smoke/` 配下の shell 内部リファクタリングであり、レンダリングされる UI 画面・コンポーネント・ルートが存在しない（`ui_routes` 空 / `visualEvidence=NON_VISUAL`）。視覚的変化が無いため screenshot は false green を招く。NON_VISUAL では screenshot 生成を**禁止**し、自動テスト結果 + shellcheck を代替証跡とする |

## 非退化基準テーブル（各 test の想定 PASS ケース数）

> **非退化が絶対基準**: 既存 runner の挙動を 1 ビットも変えない。リファクタ前後で下表の各 test が同一に全 PASS することが完了条件（AC-3）。

| test ファイル | 想定 PASS ケース | 検証する非退化観点 | 対応 AC |
| ------------- | ---------------- | ------------------ | ------- |
| `smoke-common.test.sh`（新規） | lib 公開 9 関数の単体ケース（`smoke_redact_filter` / `smoke_redact_line` / `smoke_summary_init` / `smoke_summary_pass` / `smoke_summary_fail_entry` / `smoke_write_summary`（routes/checks 両 array_key）/ `smoke_assert_host_allow`（match / non-match）/ `smoke_env_prefix` / `smoke_run_d1`（cf.sh stub））+ redact SSOT 参照ケース | lib 共通関数の単体挙動が正しい。array_key 切替が両 shape を生成する | AC-1 / AC-6 / AC-8 / AC-9 |
| `runtime-attendance-provider.test.sh` | **11 ケース** | summary.json の `.routes[]` shape・reason 任意 entry・production guard・redaction の非退化 | AC-3 / AC-9 |
| `runtime-admin-web.test.sh` | **16 ケース** | summary.json の `.checks[]` shape・`record_check` 単一形・render-error 検出・allowlist guard の非退化 | AC-3 |
| `runtime-tag-bulk.test.sh` | assert ケース群（assert-assigned / assert-noop / assert-unassigned / assert-empty-fails / assert-mixed-fails / assert-batch-required / summary-pass / redaction） | `source "$RUNNER"` 二段 source 後の `assert_all_status` / `extract_count` 直接呼び出しが成立。`.checks[]` shape・production guard の非退化 | AC-3 / AC-10 |
| `shellcheck`（対象 4 ファイル） | 指摘 0（clean） | `source` 解決・未定義変数・SC2034・`SMOKE_` prefix 隔離・内部 `local` 化 | AC-7 / AC-8 |

> ケース数の正本は Phase 1（`outputs/phase-1/phase-1.md` 4.1.3 / AC-3）。attendance=11 / admin-web=16 は既存 test の現状ケース数であり、リファクタで増減させない（test 本体は原則変更しない＝非退化の絶対基準）。

## 実行 runbook（本サイクルで実行済み）

> 下記を本サイクルで実行し、出力を canonical ファイル名で `outputs/phase-11/evidence/` に配置した。

```bash
ROOT=docs/30-workflows/completed-tasks/issue-1138-smoke-runner-common-lib-extraction
EV="$ROOT/outputs/phase-11/evidence"

# 1. 新規 lib test（AC-1 / AC-6 / AC-9）
bash scripts/smoke/__tests__/smoke-common.test.sh | tee "$EV/smoke-common-test.log"

# 2. 既存 3 runner test 非退化（AC-3 / AC-9 / AC-10）
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh | tee "$EV/runtime-attendance-provider-test.log"
bash scripts/smoke/__tests__/runtime-admin-web.test.sh | tee "$EV/runtime-admin-web-test.log"
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh | tee "$EV/runtime-tag-bulk-test.log"

# 3. shellcheck clean（AC-7 / AC-8・対象 4 ファイル）
shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-*.sh | tee "$EV/shellcheck.log"
```

- 期待: 1〜2 は全ケース PASS（attendance 11 / admin-web 16 / tag-bulk assert 群 / lib test 全ケース）、3 は出力なし（clean）。

## 実行記録

| evidence | file path（canonical） | 実行状態 | status |
| -------- | ---------------------- | -------- | -------------- |
| lib test log | `outputs/phase-11/evidence/smoke-common-test.log` | **実行済み（2026-06-08・本サイクル）** | present / PASS |
| attendance test log | `outputs/phase-11/evidence/runtime-attendance-provider-test.log` | **実行済み（2026-06-08・本サイクル）** | present / PASS |
| admin-web test log | `outputs/phase-11/evidence/runtime-admin-web-test.log` | **実行済み（2026-06-08・本サイクル）** | present / PASS |
| tag-bulk test log | `outputs/phase-11/evidence/runtime-tag-bulk-test.log` | **実行済み（2026-06-08・本サイクル）** | present / PASS |
| shellcheck log | `outputs/phase-11/evidence/shellcheck.log` | **実行済み（2026-06-08・本サイクル）** | present / PASS |

> **固定フレーズ（証跡範囲の固定）**: 本サイクルの証跡範囲は「自動 shell test（既存 3 runner の非退化 + 新規 lib test）+ shellcheck 静的検証」に限定する。screenshot・実 staging 実走・実 D1 接続は本タスクの証跡に**含めない**（NON_VISUAL かつ local 完結のリファクタリングのため）。

## 完了判定

- [x] NON_VISUAL メタに証跡の主ソース（自動テスト名 / 件数）とスクリーンショット非生成理由を明記した [Feedback 4]
- [x] 非退化基準テーブル（attendance 11 / admin-web 16 / tag-bulk assert 群 / 新規 lib test / shellcheck clean）を固定した
- [x] 実行 runbook（実装着手後の user-gated コマンド列）を記載した
- [x] 実行記録を「実行済み（2026-06-08・本サイクル）」で固定し、固定フレーズで証跡範囲を限定した
- [x] secret 実値を載せていない
