# Phase 7 — カバレッジ確認

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。本タスクで**変更した関数のみ**を対象に line / branch カバレッジを実測し証跡化する（Feedback BEFORE-QUIT-002 / Feedback 5）。

## 1. カバレッジ対象範囲の明示（局所検証）

NON_VISUAL・少数 read 関数追加タスクのため、coverage は**変更した関数 / endpoint に限定**する。リポジトリ全体や未変更ファイルは対象外とする。

| 対象 | ファイル | カバレッジ目標 |
|------|----------|----------------|
| `detectOrphanMemberTags` | `apps/api/src/repository/memberTags.ts` | line 100% / branch 100%（`results ?? []` の fallback 分岐を含む） |
| `countOrphanMemberTags` | `apps/api/src/repository/memberTags.ts` | line 100% / branch 100%（`row?.n ?? 0` の null/undefined 分岐を含む） |
| `GET /admin/tags/orphans` ハンドラ | `apps/api/src/routes/admin/tags.ts` | line 100%（孤児 0 / 孤児あり 両系列を TC-C01/C02 で通過） |

### 対象外（明示）

- `memberTags.ts` の既存 read/write 関数（`listTagsByMemberId` / `assign*` 群）— 本タスクで未変更。
- `tagDefinitions.ts` の count guard — issue-1070 のカバレッジ責務。非破壊確認は Phase 6 で実施済み。
- `members.ts` の既存 route ハンドラ — fixture 健全性確認のみでロジック未変更。
- `OrphanMemberTag` 型 — 型定義のため coverage 対象外。

## 2. 変更関数の branch カバレッジ要件（Feedback 5）

広域 % 指定ではなく、変更関数の各分岐を網羅する TC を明示する。

| 関数 | 分岐 | 網羅 TC |
|------|------|---------|
| `detectOrphanMemberTags` | `results` が配列を返す（孤児あり） | TC-R01 / TC-C02 / TC-E03 |
| `detectOrphanMemberTags` | `results` が空（孤児なし → `[] ?? []`） | TC-R02 / TC-E01 / TC-E02 |
| `detectOrphanMemberTags` | `NOT IN (空集合)`（tag_definitions 空） | TC-R05 |
| `countOrphanMemberTags` | `row.n > 0`（孤児あり） | TC-R03 / TC-E03 |
| `countOrphanMemberTags` | `row.n === 0` / `row` null（`?? 0`） | TC-R04 / TC-E01 |
| `GET /tags/orphans` | `count === 0` 応答 | TC-C01 |
| `GET /tags/orphans` | `count > 0` + orphans 配列応答 | TC-C02 / TC-C03 |

## 3. カバレッジ計測コマンド

```bash
# 変更ファイルに絞って coverage 計測（vitest coverage を対象 spec で実行）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --coverage \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

> coverage レポートから `memberTags.ts` の `detectOrphanMemberTags` / `countOrphanMemberTags` 行範囲と `tags.ts` の `/tags/orphans` ハンドラ行範囲の line/branch 実測値を抜き出し、`outputs/phase-7/coverage-report.md` に記録する。全体 % ではなく**変更関数の局所実測値**を証跡として残す。

## 4. 証跡フォーマット（coverage-report.md へ記録する実測表）

| 関数 / ハンドラ | line | branch | 根拠 TC |
|-----------------|------|--------|---------|
| `detectOrphanMemberTags` | （実測） | （実測） | TC-R01/R02/R05/R06 |
| `countOrphanMemberTags` | （実測） | （実測） | TC-R03/R04/R07 |
| `GET /tags/orphans` | （実測） | （実測） | TC-C01/C02/C03 |

## 完了条件（Phase 7）

- [ ] カバレッジ対象を変更した 2 関数 + 1 endpoint に限定し、対象外を明示した
- [ ] 各変更関数の branch を網羅する TC 対応表を記載した（Feedback 5）
- [ ] 局所 coverage 計測コマンドを記載した
- [ ] 変更関数の line/branch 実測値を証跡に残す方針を明記した（Feedback BEFORE-QUIT-002）
- [ ] 出力: [outputs/phase-7/coverage-report.md](outputs/phase-7/coverage-report.md)
