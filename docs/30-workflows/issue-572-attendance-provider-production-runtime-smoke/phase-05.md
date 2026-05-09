# Phase 5: 実装計画策定（production smoke / redact filter / session 注入 / wrangler binding）

> **CONST_004 / CONST_005 準拠の実装仕様書**。本ドキュメントは production runtime smoke を成立させるための実装計画（ステップ・順序・依存）を確定するための spec であり、コード実装そのものは行わない（実装手順は記述必須）。

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-5/phase-5.md` |
| 実装区分 | 実装計画仕様書 |
| 親 Issue | #572（CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的
production smoke を読み取り専用で PASS させるために必要な 4 ワークストリーム（production smoke スクリプト / redact filter 拡張 / session 注入手順 / wrangler binding 検証手順）の実装ステップ・前後依存・evidence 取得順序を確定する。

## 実行タスク
詳細は `outputs/phase-5/phase-5.md` を正本とする。

## 4 ワークストリーム
| ID | 計画対象 | 出力先 |
| --- | --- | --- |
| WS-1 | production smoke スクリプト（read-only GET / redact 通し） | `apps/api/scripts/runtime-smoke/run-smoke.sh`（新規） |
| WS-2 | redact filter 拡張（cf-* token / OAuth secret / email / fullName / profile body 実値） | `scripts/lib/redaction.sh`（既存編集） |
| WS-3 | session 注入手順（shell 履歴漏洩防止） | `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`（新規） |
| WS-4 | wrangler binding 検証手順（staging / production diff） | 同 runbook 内セクション |

## 統合テスト連携
- WS-1〜WS-4 の順で実行する。WS-2 が PASS（unit test 緑）してから WS-1 を本実行する。
- WS-4 の binding diff が空（または許容差分のみ）であることを確認してから Phase 11 の本番実行に移る。

## 参照資料
- `outputs/phase-5/phase-5.md`
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- `scripts/cf.sh`
- `scripts/lib/redaction.sh` / `tests/unit/redaction.test.sh`

## 成果物
- `outputs/phase-5/phase-5.md`
- 本ドキュメント（4 ワークストリームの実装ステップ確定）

## 完了条件
- WS-1〜WS-4 の前後依存が確定（WS-2 → WS-1 / WS-4 → WS-1 の順序が明記）。
- 各 WS のローカル検証コマンド（実行・redact zero-hit grep gate・wrangler diff）が記述されている。
- redact filter 拡張で追加すべき 5 パターン（cf-*, OAuth secret, email, fullName, profile body 実値）の網羅が確定。
- session 注入は `op run --env-file=.env` 経由とし shell 履歴・プロセス引数・evidence ファイルへの実値混入を防ぐ手順が明記。
- 苦戦項目（wrangler binding 差分 / shell 履歴漏洩 / API URL 取り違え / redact filter production 偽陰性）に対する mitigation が各 WS に紐付いている。
