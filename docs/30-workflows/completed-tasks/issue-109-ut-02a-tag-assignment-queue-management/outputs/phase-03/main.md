# Phase 3: 設計レビュー — 成果物

## Alternative 4 案 + 採用

| 案 | 内容 | pros | cons | 判定 |
| --- | --- | --- | --- | --- |
| A | idempotency key を `(memberId, tagCode)` のみ | key 短い | 再回答で再評価不可 | MINOR（不採用） |
| B | DLQ を別 table に分離 | 通常 query が clean | migration コスト増 | MINOR（不採用） |
| C | 02a memberTags.ts read-only を runtime のみ | 実装簡単 | 開発時事故防げない | MAJOR（不採用） |
| D | enqueue を Cloudflare Queues に切り出し | latency 削減 | 追加サービス・スコープ膨張 | MINOR（不採用） |
| **採用** | Phase 2 設計（`(memberId, responseId)` key + status='dlq' 拡張 + type-level test + 同期 hook） | 既存 schema を最小拡張 | — | **PASS** |

## simpler alternative 検討（YAGNI）

- retry 回数 3 → 1: 失敗時の admin 影響大、3 維持。
- DLQ 廃止: 永久 retry 事故源、残す。
- aliasMap 省略: grep ずれ恒久バグ化、省略不可。
- 複数形 path への移動: 既存 monorepo 規約破壊、不採用。

結論: Phase 2 案より単純な代替で価値を維持できるものなし。

## Phase 4 開始条件

| 項目 | 状態 |
| --- | --- |
| state machine | 確定（dlq 含む） |
| idempotency | 確定（複合 unique index → partial unique on idempotency_key） |
| retry / DLQ | 確定（指数バックオフ 30s/60s/120s + status='dlq' 拡張） |
| schema ownership | 確定（`apps/api/src/repository/tagQueue.ts`） |
| migration × repo 照合表 | Phase 2 で作成済 |
| 02a read-only test 案 | 提示済（vitest --typecheck） |
| 既存 02b schema | 確認済（0002_admin_managed.sql） |

## 02a memberTags.ts read-only 確認手順

1. `pnpm --filter @repo/api test memberTags` で既存 read API（`listTagsByMemberId / listTagsByMemberIds`）を pass 維持。
2. `assignTagsToMember` は 07a workflow 専用 helper として後方互換維持（現状: `tagQueueResolve.ts` から呼ばれる）。本タスクで write 関数を新規追加しない。
3. type-level test: `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` で「`insert*/update*/delete*` 接頭辞の export が存在しないこと」を assert。
4. grep: `rg -n "from .*repository/memberTags" apps/web/src` が 0 件。

## PASS 判定

採用案: Phase 2 設計。

## Handoff to Phase 4

| 項目 | 内容 |
| --- | --- |
| 採用設計 | 既存 `tagQueue.ts` 拡張 + 0009 migration で idempotency / retry / DLQ 列追加 |
| open question | D1 transient error の判定基準（現状: 全 throw を transient 扱い） |
| blocker | なし |
