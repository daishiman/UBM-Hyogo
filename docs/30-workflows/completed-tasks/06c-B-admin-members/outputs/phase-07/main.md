# Phase 07 Main — AC マトリクス

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `07 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |

## AC × 検証 × 実装 × 失敗 ケース 4 軸表

| AC | 検証層 (Phase 4) | 実装箇所 (Phase 5) | 失敗ケース (Phase 6) | 不変条件 |
| --- | --- | --- | --- | --- |
| 検索 q/zone/status/tag/sort が動作 | unit (query builder) + contract | apps/api list handler | sort 範囲外 422 / q 長大 422 / density 不正 422 | — |
| ページングが動作 | contract | apps/api list handler | page 過大 → 空配列 200 | — |
| 詳細が `{member, auditLogs}` を返す | contract | apps/api detail handler | 404 | #13 |
| delete 成功 | contract + authz | apps/api delete handler | 409 重複 / 404 / 5xx audit fail | #13 |
| restore 成功 | contract + authz | apps/api restore handler | 409 / 404 | #13 |
| role mutation 不在 | contract + authz | apps/api routing | role mutation route 不在 (404/405) | #11 |
| admin 以外で 403 | authz | require-admin middleware | guest 401 / member 403 | — |
| apps/web は cookie forwarding のみ | unit (web fetch helper) | apps/web/src/lib/fetch/admin.ts | D1 import 構造的禁止（lint） | #5 |
| audit_log 必須記録 | contract | apps/api/src/lib/audit.ts | 書込み失敗 5xx + rollback | #13 |
| admin 本文編集なし | contract（更新系 endpoint 不在） | apps/api routes に PUT/PATCH なし | 405 | #4 #11 |

## gap 検出（Phase 8 / 9 への申し送り）

- **G1**: query builder のテストを `packages/shared` に置くか `apps/api` に置くかの配置決定（Phase 8 DRY で確定）
- **G2**: audit 書込みの actor 識別子（memberId vs sessionId）を `11-admin-management.md` の audit 仕様に再確認（Phase 9 secret hygiene チェック）
- **G3**: `density` パラメータが UI のみで API に送る必要があるか再点検（unit テストでカバー）
- **G4**: 検索 index（B4 blocker）の migration timing を 09a staging smoke 前に確認

## 完了条件チェック

- [x] 全 AC（10 件）が少なくとも 1 検証層を持つ
- [x] 全 failure case（12 件）が責任 layer を持つ
- [x] 不変条件 #4 / #5 / #11 / #13 が AC に対応する検証層で担保される

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと gap G1〜G4 を渡す。
