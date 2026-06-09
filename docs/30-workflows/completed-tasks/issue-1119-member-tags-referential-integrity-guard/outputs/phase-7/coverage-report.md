# Phase 7 出力 — カバレッジ報告（局所・変更関数のみ）

タスク: `task-issue-1119-member-tags-referential-integrity-guard`
方針: NON_VISUAL・少数 read 関数追加のため、**変更した関数 / endpoint のみ**を対象に line/branch を局所実測する（Feedback BEFORE-QUIT-002 / Feedback 5）。

## 1. カバレッジ対象

| 対象 | ファイル | 目標 |
|------|----------|------|
| `detectOrphanMemberTags` | `apps/api/src/repository/memberTags.ts` | line 100% / branch 100% |
| `countOrphanMemberTags` | `apps/api/src/repository/memberTags.ts` | line 100% / branch 100% |
| `GET /admin/tags/orphans` ハンドラ | `apps/api/src/routes/admin/tags.ts` | line 100% |

## 2. 対象外（明示）

- `memberTags.ts` の既存 read/write 関数（未変更）
- `tagDefinitions.ts` count guard（issue-1070 責務・Phase 6 で非破壊確認のみ）
- `members.ts` 既存 route（fixture 健全性確認のみ・ロジック未変更）
- `OrphanMemberTag` 型（型定義は coverage 対象外）

## 3. branch 網羅 TC 対応表（Feedback 5）

| 関数 | 分岐 | 網羅 TC |
|------|------|---------|
| `detectOrphanMemberTags` | 孤児あり（results 配列） | TC-R01 / TC-C02 / TC-E03 |
| `detectOrphanMemberTags` | 孤児なし（`[] ?? []`） | TC-R02 / TC-E01 / TC-E02 |
| `detectOrphanMemberTags` | tag_definitions 空（`NOT IN (空集合)`） | TC-R05 |
| `countOrphanMemberTags` | `n > 0` | TC-R03 / TC-E03 |
| `countOrphanMemberTags` | `n === 0` / `row` null（`?? 0`） | TC-R04 / TC-E01 |
| `GET /tags/orphans` | `count === 0` | TC-C01 |
| `GET /tags/orphans` | `count > 0` + orphans 配列 | TC-C02 / TC-C03 |

## 4. 計測コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --coverage \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

## 5. 実測値証跡（Phase 5/6 Green 後に埋める）

| 関数 / ハンドラ | line | branch | 根拠 TC |
|-----------------|------|--------|---------|
| `detectOrphanMemberTags` | _（実測）_ | _（実測）_ | TC-R01/R02/R05/R06 |
| `countOrphanMemberTags` | _（実測）_ | _（実測）_ | TC-R03/R04/R07 |
| `GET /tags/orphans` | _（実測）_ | _（実測）_ | TC-C01/C02/C03 |

> coverage レポートから対象行範囲の実測値を抜き出し、上表の `_（実測）_` を埋める。全体 % ではなく変更関数の局所値を証跡とする。

## 6. 判定基準

- 変更 2 関数の line/branch が 100% であること（fallback `?? []` / `?? 0` 分岐を含む）。
- `GET /tags/orphans` ハンドラの両応答系列（count 0 / count>0）が通過していること。
- 未達分岐があれば Phase 6 へ TC を追加して再計測する。
