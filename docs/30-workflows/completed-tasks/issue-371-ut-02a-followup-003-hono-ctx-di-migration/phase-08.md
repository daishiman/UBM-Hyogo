# Phase 8: 単体・統合テスト実行

実装区分: 実装仕様書

## 8.1 実行コマンド

```bash
# 単体テスト全体
mise exec -- pnpm --filter @ubm-hyogo/api test

# 関心領域だけを実行する場合
mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers
mise exec -- pnpm --filter @ubm-hyogo/api test -- builder
mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/me
mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/admin/members
```

## 8.2 期待結果

| テスト群 | 期待 |
| --- | --- |
| `repository-providers.test.ts` | 新規 T1, T2 PASS |
| `_shared/builder.test.ts` | T3 (型) / T4 / T5 PASS、既存テスト regression なし |
| `__tests__/builder.test.ts` | T6 (型) / T7 / T8 PASS、既存 regression なし |
| `routes/me/__tests__/index.test.ts` | T9 PASS、既存 regression なし |
| `routes/admin/members.test.ts` | T10 PASS、既存 regression なし |
| 全体 | total skip 0（増加なし）、total fail 0 |

## 8.3 失敗時の典型原因と対処

| 失敗 | 原因 | 対処 |
| --- | --- | --- |
| T1 / T2 fail | middleware 内 `c.set` の key typo | `"attendanceProvider"` のキー一致を確認 |
| T4 / T7 fail with `attendanceProvider not bound` | テスト fixture で `c.var.attendanceProvider` を set していない | mock helper でセット |
| T5 / T8 が PASS せず `[]` を返す | `fetchAttendanceFor` の throw 化が未適用 | Phase 5 Step 5 を再実施 |
| T9 / T10 fail（500 / `not bound` 文言） | route で middleware 結線が漏れている | Phase 5 Step 2 を再確認、`app.use("*", attendanceProviderMiddleware)` を追加 |
| 既存 regression（`me.test.ts` 等） | mock 注入経路移行漏れ | Phase 5 Step 6 を再実施 |

## 8.4 統合テスト範囲

D1 binding を fakeD1 で起動し、`createAttendanceProvider(c)` 経路の `findByMemberIds` が
ctx 経由で正しく動作することを `repository-providers.test.ts` の T2 で担保する。

「実 D1 / staging に対する E2E」は本タスクの scope out（09a/09b 責務）。
ただし、Phase 11 で `wrangler dev` ローカル smoke のログを evidence として保存することを推奨。

## 8.5 coverage（任意）

`pnpm --filter @ubm-hyogo/api test --coverage` を実行する場合、以下が新規 cover される想定:

- `apps/api/src/middleware/repository-providers.ts` (100%)
- `apps/api/src/repository/_shared/builder.ts` の `fetchAttendanceFor` 分岐 (provider undefined throw)

既存 builder の `buildMemberProfile` / `buildAdminMemberDetailView` の coverage は維持または微増を期待。

## 8.6 完了条件

- 8.1 全コマンド exit 0
- 新規テスト T1〜T8 全 PASS
- 既存テスト regression 0
- skip 数の増加 0
