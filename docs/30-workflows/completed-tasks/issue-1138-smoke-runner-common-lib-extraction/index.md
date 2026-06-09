# issue-1138-smoke-runner-common-lib-extraction

[実装区分: 実装仕様書]

> **判定根拠（CONST_004/005）**: issue #1138 が要求するのは `scripts/smoke/` 配下の 3 本の runtime smoke runner にコピー重複している共通機構を、新規共通 lib `scripts/smoke/lib/smoke-common.sh` へ抽出して SSOT 化すること。本サイクルで共通 lib 作成、3 runner 移行、lib test 追加、既存 runner 非退化 test、shellcheck clean まで完了した。commit / push / PR は user-gated。

## メタ情報

| 項目 | 値 |
| ---- | -- |
| Task ID | TASK-ISSUE-1138-SMOKE-RUNNER-COMMON-LIB-EXTRACTION-001 |
| Feature 名 | issue-1138-smoke-runner-common-lib-extraction |
| Task type | refactoring |
| visualEvidence | NON_VISUAL（bash runner 内部リファクタリング。UI 表示物・runtime 挙動の変更なし） |
| implementation_mode | `new` |
| workflow_state | `implemented_local_evidence_captured`（実装・local evidence 取得完了。commit・PR は user-gated） |
| 関連 issue | #1138（CLOSED 状態を維持。本作業で issue state は変更しない） |
| 親タスク | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/` |
| 対象ファイル群 | `scripts/smoke/runtime-attendance-provider.sh` / `runtime-admin-web.sh` / `runtime-tag-bulk.sh` / `redact.sh` |
| 新規作成 | `scripts/smoke/lib/smoke-common.sh` / `scripts/smoke/__tests__/smoke-common.test.sh` |

## 実装結果

| 区分 | パス | 状態 |
| ---- | ---- | ---- |
| NEW | `scripts/smoke/lib/smoke-common.sh` | 共通 lib 実装済み |
| NEW | `scripts/smoke/__tests__/smoke-common.test.sh` | lib 単体 test 実装済み |
| EDIT | `scripts/smoke/runtime-attendance-provider.sh` | lib source + `routes` summary shape 維持 |
| EDIT | `scripts/smoke/runtime-admin-web.sh` | lib source + `checks` summary shape 維持 |
| EDIT | `scripts/smoke/runtime-tag-bulk.sh` | lib source + `checks` summary shape / 二段 source contract 維持 |

## 検証結果

| 検証 | evidence |
| ---- | -------- |
| `bash scripts/smoke/__tests__/smoke-common.test.sh` | `outputs/phase-11/evidence/smoke-common-test.log` |
| `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | `outputs/phase-11/evidence/runtime-attendance-provider-test.log` |
| `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` | `outputs/phase-11/evidence/runtime-admin-web-test.log` |
| `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | `outputs/phase-11/evidence/runtime-tag-bulk-test.log` |
| `shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-attendance-provider.sh scripts/smoke/runtime-admin-web.sh scripts/smoke/runtime-tag-bulk.sh` | `outputs/phase-11/evidence/shellcheck.log` |

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [outputs/phase-1/phase-1.md](outputs/phase-1/phase-1.md) | completed |
| 2 | 設計 | [outputs/phase-2/phase-2.md](outputs/phase-2/phase-2.md) | completed |
| 3 | 設計レビュー | [outputs/phase-3/phase-3.md](outputs/phase-3/phase-3.md) | completed |
| 4 | テスト作成 | [outputs/phase-4/phase-4.md](outputs/phase-4/phase-4.md) | completed |
| 5 | 実装 | [outputs/phase-5/phase-5.md](outputs/phase-5/phase-5.md) | completed |
| 6 | テスト拡充 | [outputs/phase-6/phase-6.md](outputs/phase-6/phase-6.md) | completed |
| 7 | カバレッジ確認 | [outputs/phase-7/phase-7.md](outputs/phase-7/phase-7.md) | completed |
| 8 | リファクタリング | [outputs/phase-8/phase-8.md](outputs/phase-8/phase-8.md) | completed |
| 9 | 品質保証 | [outputs/phase-9/phase-9.md](outputs/phase-9/phase-9.md) | completed |
| 10 | 最終レビュー | [outputs/phase-10/phase-10.md](outputs/phase-10/phase-10.md) | completed |
| 11 | 手動テスト | [outputs/phase-11/phase-11.md](outputs/phase-11/phase-11.md) / [manual-test-result.md](outputs/phase-11/manual-test-result.md) | completed |
| 12 | ドキュメント更新 | [outputs/phase-12/phase-12.md](outputs/phase-12/phase-12.md) | completed |
| 13 | PR 作成 | [outputs/phase-13/phase-13.md](outputs/phase-13/phase-13.md) | pending_user_approval |

## 4 条件

| 条件 | 判定 | 根拠 |
| ---- | ---- | ---- |
| 矛盾なし | PASS | workflow_state / Gate-B passed / Gate-C pending が一致 |
| 漏れなし | PASS | strict 7、Phase 11 evidence、実コード、test を同一サイクルで反映 |
| 整合性あり | PASS | `smoke_*` 公開関数、`SMOKE_*` 変数、`routes/checks` summary shape が仕様と実装で一致 |
| 依存関係整合 | PASS | 既存 runner 固有 contract は runner に残し、redact / summary / allowlist / env prefix / D1 wrapper のみ共通化 |
