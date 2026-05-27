# Phase 10: 最終レビュー / Gate-B 判定

> Refs #913
> 前提: Phase 9 QA 5 コマンド全 PASS。Phase 11 手動テスト着手の可否を判断する関門。

## AC 達成判定枠（実装後に埋める）

Phase 1 要件定義で定義した受け入れ基準（AC-1 〜 AC-8）について、Phase 5-9 で生成された証跡を貼り付けて判定する。

| AC | 内容 | 判定 | 証跡 |
|---|---|---|---|
| AC-1 | admin mutation endpoint で `Idempotency-Key` header を受信し、初回は handler を実行・結果を D1 に保存する | (実装後に PASS/FAIL を記入) | contract.spec「初回」ケースログ |
| AC-2 | 同一 key + method + path + fingerprint の 2 回目は handler を再実行せず、保存済結果を再生する | (同上) | contract.spec「再生」ケースログ |
| AC-3 | 同一 key で in_flight 中の並行リクエストは 409 を返す | (同上) | contract.spec「並行 409」ケースログ |
| AC-4 | 同一 key で fingerprint 不一致は 422 を返す | (同上) | contract.spec「fingerprint 422」ケースログ |
| AC-5 | handler が 5xx / throw した場合、in_flight 行を削除し再送で再実行可能にする | (同上) | contract.spec「5xx rollback」ケースログ |
| AC-6 | TTL 期限切れの key は新規 key として扱われる（lazy GC が INSERT 前に走る） | (同上) | contract.spec「TTL」ケースログ |
| AC-7 | header 未送信の mutation は middleware を通過し、既存挙動を維持する | (同上) | contract.spec「header 不在 pass-through」ケースログ |
| AC-8 | `apps/web` admin client（`useAdminMutation`）からの実呼び出しが既存通り 2xx を返す（regression 不在） | (同上) | unit lane + 既存 admin routes spec の green ログ |

## 不変条件遵守チェック

| # | 不変条件 | 確認方法 | 判定 |
|---|---|---|---|
| 1 | D1 直接アクセスが `apps/api` 内に閉じている（CLAUDE.md 不変条件 5） | `grep -r "c.env.DB\|D1Database" apps/web/src` が 0 件であること | (記入) |
| 2 | handler shape 不変 | `apps/api/src/routes/admin/*.ts` の export 一覧 diff（リファクタ前後）が空であること | (記入) |
| 3 | wrangler 直接実行なし | 仕様書および追加スクリプト内に `wrangler ` 単独呼び出しが無く、`bash scripts/cf.sh` 経由のみであること | (記入) |
| 4 | 新規 test ファイルが `*.spec.{ts,tsx}` のみ | `find apps/api -name "*.test.ts*"` が新規分 0 件であること（CLAUDE.md 不変条件 8） | (記入) |
| 5 | Google Form schema 不変 | `apps/api/migrations/0021_*.sql` が Form schema 由来テーブル（`responses` 等）に触れていないこと | (記入) |
| 6 | admin scope 限定 | middleware 配線が `apps/api/src/routes/admin/_shared.ts` のみで、公開 / 会員 mypage に波及していないこと | (記入) |
| 7 | 既存 endpoint surface 不変 | `apps/api/src/routes/admin/*.ts` の path / method 集合が変わっていないこと | (記入) |
| 8 | 失敗時冪等化しない原則 | contract.spec「5xx rollback」「throw rollback」両ケースで in_flight 行が削除されることを再確認 | (記入) |

## Gate-B 判定

- Phase 9 5 コマンド: typecheck / lint / unit / D1 lane / build 全 exit 0 ── (記入)
- AC-1 〜 AC-8 全 PASS ── (記入)
- 不変条件 1〜8 全遵守 ── (記入)
- 既存 admin routes に regression なし（unit lane green） ── (記入)
- `apps/web` 側に予期せぬ差分なし（git diff `apps/web/` が小さい / 意図的範囲のみ） ── (記入)

上記全 OK で Gate-B 通過 → Phase 11 手動テスト（NON_VISUAL 代替証跡取得）に進む。

## Phase 11 進行条件

- Gate-B PASS 後のみ Phase 11 を開始する
- Phase 11 では staging 環境への `d1 migrations apply` および `deploy` を **ユーザー明示承認後にのみ** 実行する（不可逆 mutation）
- read-only な事前 evidence（`bash scripts/cf.sh d1 migrations list`）は Gate-C 承認前でも取得可能
