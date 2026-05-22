# Phase 8: コードレビュー（self review）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. レビュー観点チェックリスト

### 1.1 不変条件

| # | 観点 | 確認方法 | 期待 |
|---|------|---------|------|
| 1 | 既存 API endpoint surface のみ参照 | spec 内で参照する 7 endpoint が `apps/api/src/routes/admin/` の既存 route であることを目視確認 | OK |
| 2 | D1 / network / FS / binding 直接アクセスなし | spec 内 `D1` / `binding` / `fetch(` / `fs` / `Miniflare` grep | 0 件 |
| 3 | `apps/web` import なし | spec 内 `apps/web` / `@ubm-hyogo/web` grep | 0 件 |
| 4 | `z.object(` 0 件（CONST_007 schema 重複禁止） | grep | 0 件 |
| 5 | shared schema が正本（`MergeIdentityResponseZ` shape は `archivedSourceMemberId` + `auditId` 含む） | fixture `mergeResponseBody` の key を目視確認 | OK |
| 6 | `DeleteBodyZ` の shared 昇格は no-op | `packages/shared/` に `DeleteBodyZ` が新規追加されていない | OK |
| 7 | skip 0 件 | `test.skip` / `it.skip` / `describe.skip` / `test.fixme` / `it.fixme` grep | 0 件 |
| 8 | route 3 ファイルの diff が小差分 | `git diff` の hunk 数 | 各 ≤ 1 hunk |

### 1.2 test 構造

| # | 観点 | 確認 |
|---|------|------|
| 1 | describe 名が `<METHOD> <path>` 形式 | `GET /admin/requests` 等 |
| 2 | 7 describe ブロックがすべて存在 | OK |
| 3 | 各 endpoint の query / request body / response shape を最低 1 つカバー | OK |
| 4 | 失敗系（throw 期待）が merge / dismiss / member-delete / audit でカバーされている | OK |
| 5 | `expectTypeOf` 使用箇所が zod 未 export な response shape のみ | OK |
| 6 | fixture object はすべて `as const` 固定 | OK |

### 1.3 import 戦略

| # | 観点 | 確認 |
|---|------|------|
| 1 | shared schema は `@ubm-hyogo/shared` barrel から取得 | OK |
| 2 | route schema は相対 import (`../member-delete` 等) | OK |
| 3 | `apps/web` 経路の import なし | OK |
| 4 | 未使用 import なし | `@ubm-hyogo/api` lint で確認 |

### 1.4 ドキュメント整合

| # | 観点 | 確認 |
|---|------|------|
| 1 | spec 内コメントは最小限（what コメント禁止） | OK |
| 2 | `MergeIdentityResponseZ` 正本ズレ補正の根拠コメントが fixture 周辺に 1 行ある（あれば望ましい、必須ではない） | optional |
| 3 | spec 行数 251 | `wc -l` |

## 2. 自己 review 結果記録テンプレート

```text
| 観点 | 判定 | 備考 |
|------|------|------|
| 不変条件 1-8 | OK | — |
| test 構造 1-6 | OK | — |
| import 戦略 1-4 | OK | — |
| ドキュメント | OK | — |
```

## 3. 修正が発生した場合のループ

修正 → Phase 7 §3 静的検証 → Phase 7 §1 単体実行 → 本 Phase に戻る。最大 3 反復（CONST 反復制限）。
