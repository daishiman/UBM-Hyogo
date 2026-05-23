# Phase 7 サマリ: カバレッジ確認

詳細: [`../../phase-7-coverage.md`](../../phase-7-coverage.md)

## threshold

- **80%**（lines/branches/functions/statements）。issue-617 / coverage-80-enforcement 正本を維持（変更しない）。
- 判定経路 `scripts/coverage-guard.sh`（本タスクで判定ロジック不変）。

## mint helper 分岐網羅（admin/me/欠落/TTL）

| 分岐 | ケース |
|---|---|
| admin 発行（isAdmin=true） | T-A1, F-A6 |
| me 発行（isAdmin=false） | T-A2, F-A6 |
| memberId 出力契約 | T-A3 |
| TTL 既定 600 | T-A5 |
| TTL 明示 / 境界 | T-A4, F-A3, F-A4 |
| 必須 env 欠落 | T-A7, F-A5 |
| 鍵不一致 / 改ざん | T-A6, F-A1, F-A2 |

純粋関数のため到達不能経路なし。全分岐がケースに紐づき 80% 以上を満たす。

## reason 分類分岐網羅

| 分岐 | reason |
|---|---|
| 500 auth misconfigured | `auth-secret-binding-missing` |
| 401 unauthorized | `auth-token-invalid-or-expired` |
| 403 forbidden | `auth-not-admin` |
| 200 | reason 無し |

shell の分岐は redacted body の jq 判定経路を全列挙。実 status は CI（staging）で観測、ローカルは擬似 body で確認。

## Lane B/C

shell / YAML は数値 coverage 対象外。代替担保: `--no-run` メッセージ確認 + step 順序の actionlint/目視。aggregate 80% は従来通り強制。

## NON_VISUAL 代替証跡（Phase 11）

- mint parity unit ログ（PASS）
- workflow lint: local actionlint は command not found のため未実行（ci.yml / runtime-smoke-staging.yml は構造レビュー済み）
- coverage-guard `--no-run` ログ
- CI 観測（admin-list 200 + `.members` array、`coverage-gate` PASS。secret 投入後・ユーザー gated）

secret 実値・JWT は証跡に含めない（`::add-mask::` 前提）。
