# Phase 6 outputs: テスト戦略サマリ

Phase 6 で確定したテスト戦略のサマリ。詳細は `phase-06.md` を参照。

## 4 軸

| 軸 | 内容 | 検証コマンド / 手段 | AC |
| --- | --- | --- | --- |
| 1: 既存 02c unit test 維持 | `_shared/db.test.ts` 等が refactor 後も全 pass | `mise exec -- pnpm test --filter @ubm/api` | AC-3 / AC-6 |
| 2: 型レベル契約テスト（設計記述のみ） | `expectTypeOf<Env["DB"]>` / `Pick<Env, "DB">` の擬似コード | 実コード化は本タスク範囲外（Phase 12 未タスク候補） | AC-1 / AC-3 |
| 3: boundary lint negative test | apps/web → apps/api/src/env import で lint exit non-zero | apps/web ダミー配置 → `pnpm lint` 観測 → 削除 | AC-5 |
| 4: 回帰範囲 | 02c 由来 test の影響棚卸し | `pnpm test --filter @ubm/api` | AC-3 / AC-6 |

## 期待 coverage

- 新規 LOC: < 100 行
- 新規 test: 0〜数件（型レベル契約テストは任意）
- 既存 coverage: 02c baseline 維持
- boundary lint negative: 1 ケース追加

## 回帰対象 02c 由来 test カテゴリ

| カテゴリ | 影響可能性 |
| --- | --- |
| `_shared/db` 系 | 高 |
| repository module 系 | 中 |
| helper 系 | 低 |

## Phase 7 への引き継ぎ

各軸 ↔ AC の対応、回帰 test 一覧、boundary lint negative ケースを AC マトリクス内の verify 列に転記。
