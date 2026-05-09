# Phase 6: 実装（変更対象ファイル詳細 / 関数シグネチャ / 差分方針）

> **CONST_004 / CONST_005 準拠の実装仕様書**。本ドキュメントは production smoke スクリプト・redact filter 拡張・runbook 追加 の差分方針を確定するための spec であり、本サイクルで実コードとrunbookに反映済みであり、production本実行のみuser gate後に行う。

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-6/phase-6.md` |
| 実装区分 | 実装仕様書（差分方針確定） |
| 親 Issue | #572（CLOSED） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的
Phase 5 の 4 ワークストリームを実装する際の変更対象ファイル・関数 / 環境変数 / 引数のシグネチャ・入出力・副作用・エラーハンドリングを確定する。本 Phase は spec の最終固定であり、別タスクの実装担当はこの差分方針のみを参照すれば実装可能となる粒度に揃える。

## 実行タスク
詳細は `outputs/phase-6/phase-6.md` を正本とする。

## 変更対象ファイル（要約）
| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `apps/api/scripts/runtime-smoke/run-smoke.sh` | 新規 | production GET smoke 実行・redact 通し・evidence 出力 |
| `apps/api/scripts/runtime-smoke/lib/assert-attendance.sh` | 新規 | `.attendance \| type == "array"` を jq で検証する小関数 |
| `scripts/lib/redaction.sh` | 既存編集 | cf-* token / OAuth secret / email / fullName / profile body 実値の sed パターン追加 |
| `tests/unit/redaction.test.sh` | 既存編集 | 追加パターンの assert 追加（実値除外を 0-hit で検証） |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 | session 注入 / wrangler binding diff / 実行順序の runbook |
| `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/outputs/phase-12/main.md` | 既存編集 | `workflow_state` を `PASS_RUNTIME_VERIFIED` / `completed` へ昇格 |

## 統合テスト連携
- Phase 7 の単体テストが PASS してから本 Phase の実装へ進む（`scripts/lib/redaction.sh` 拡張は test-first）。
- 本 Phase の実装後、Phase 11 で production の本実行 evidence を取得する。

## 参照資料
- `outputs/phase-6/phase-6.md`
- `scripts/lib/redaction.sh` / `tests/unit/redaction.test.sh`
- `apps/api/src/routes/admin/members.ts` / `apps/api/src/routes/me/index.ts`
- `scripts/cf.sh`

## 成果物
- `outputs/phase-6/phase-6.md`
- 本ドキュメント（差分方針確定）

## 完了条件
- 6 ファイルの変更種別（新規 / 既存編集）が明示されている。
- `run-smoke.sh` のコマンドラインインターフェース（環境変数・引数・終了コード）が確定。
- `redact_stream` に追加する sed パターン 5 種（cf-* / OAuth secret / email / fullName / profile body 実値）が確定。
- session cookie / Bearer / token 値は `op run --env-file=.env` 経由で揮発的に環境変数に入れ、ファイル / shell 履歴 / プロセス引数 / evidence に残さない方針が明記。
- 実装は本タスクで行わず、別タスクで参照される spec として固定される旨が冒頭で明示。
