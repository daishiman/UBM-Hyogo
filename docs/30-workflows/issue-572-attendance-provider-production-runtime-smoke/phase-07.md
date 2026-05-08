# Phase 7: 単体テスト（redact filter / wrangler env vars 解析）

> **CONST_004 / CONST_005 準拠の実装仕様書**。本ドキュメントは追加すべき単体テストのケース仕様を確定するための spec であり、本タスク内ではテスト実装を行わない（実装手順の記述は必須）。

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-7/phase-7.md` |
| 実装区分 | 単体テスト仕様書 |
| 親 Issue | #572（CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的
Phase 6 で確定した redact filter 拡張・wrangler binding 解析ロジックの仕様を、`tests/unit/redaction.test.sh` および新規 wrangler binding 解析テストで網羅する。production smoke 偽陰性（redact 漏れ）を unit 層で先に潰し、Phase 11 で実行する production 本実行の evidence 信頼性を担保する。

## 実行タスク
詳細は `outputs/phase-7/phase-7.md` を正本とする。

## 追加テストファイル
| パス | 変更種別 | 対象 |
| --- | --- | --- |
| `tests/unit/redaction.test.sh` | 既存編集 | redact_stream の追加パターン（cf-* / OAuth secret / email / fullName / profile body 実値）の 0-hit assert |
| `tests/unit/wrangler-binding-parse.test.sh` | 新規 | `wrangler deployments list` / `wrangler whoami` 系の出力解析（D1 binding name / KV namespace id / vars 一覧）の正規化が staging vs production で diff 0 を返すこと |

## 統合テスト連携
- 本 Phase の test PASS が Phase 6 の実装着手の前提（test-first）。
- Phase 11 の `redact-filter-zero-hit.log` / `wrangler-binding-diff.md` evidence は本 Phase の単体テストが緑であることを前提に取得する。

## 参照資料
- `outputs/phase-7/phase-7.md`
- `tests/unit/redaction.test.sh`
- `scripts/lib/redaction.sh`
- `apps/api/wrangler.toml`

## 成果物
- `outputs/phase-7/phase-7.md`
- 本ドキュメント（単体テスト仕様）

## 完了条件
- redact filter の追加 5 パターンに対し、合成サンプル（実 token / 実 secret / 実 email / 実 fullName を含まない）での 0-hit assert ケースが列挙されている。
- wrangler binding 解析テストで「staging のみに存在する binding」「production のみに存在する binding」「双方共通だが値が異なる binding」の 3 シナリオが describe 単位で網羅。
- ローカル検証コマンドが明示（`bash tests/unit/redaction.test.sh` / `bash tests/unit/wrangler-binding-parse.test.sh`）。
- 実 token / 実 secret / 実 email を test fixture に書かない方針が明記（合成サンプルのみ）。
- 本 Phase のテスト仕様は tests/unit/runtime-smoke.test.sh と tests/unit/redaction.test.sh に反映済みである。
