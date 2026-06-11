# Phase 7 — カバレッジ確認

> SSOT: [`../../shared-context.md`](../../shared-context.md) §5 を正本とする。

## 1. 対象範囲（Feedback BEFORE-QUIT-002 / Feedback 5）

本タスクで新規追加する純関数群（`packages/shared/src/public-search/search-query-primitives.ts`）の **line / branch カバレッジ目標 100%** とする。検証は新規 spec `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts`（SP-01〜SP-12）で行う。

| 対象（新規・純関数） | line 目標 | branch 目標 |
|------|----------|------------|
| `normalizePublicMemberQ` | 100% | 100% |
| `normalizePublicMemberTags` | 100% | 100% |
| `clampPublicMemberLimit` | 100% | 100% |
| `normalizePublicMemberZone`（`isPublicMemberZone` 経由） | 100% | 100% |
| `normalizePublicMemberStatus`（`isPublicMemberStatus` 経由） | 100% | 100% |

> tuple 定数（`PUBLIC_MEMBER_*_VALUES`）・型 alias・`PublicMemberSortZ`/`PublicMemberDensityZ`・`PUBLIC_MEMBER_SEARCH_LIMITS` は実行可能分岐を持たない宣言であり、SP-11（`PublicMemberSortZ.catch`）・SP-12（tuple drift guard）で参照され到達する。

## 2. branch ↔ ケース対応表（網羅の証明）

各純関数の到達すべき分岐（fallback 経路 / clamp 上下限 / 空文字除去 / trunc）が SP-01〜SP-12 で漏れなく踏まれることを示す。

| 関数 | 到達すべき branch | カバーするケース |
|------|------------------|------------------|
| `normalizePublicMemberQ` | 連続空白 → 単一空白へ縮約（`\s+`→`" "`） | SP-01 |
| `normalizePublicMemberQ` | `Q_LIMIT=200` 超過 → `slice(0,200)` で切詰 | SP-02 |
| `normalizePublicMemberTags` | 空文字除去（`filter(t.length>0)`） | SP-03 |
| `normalizePublicMemberTags` | 重複除去（`Set` dedup） | SP-03 |
| `normalizePublicMemberTags` | `TAG_LIMIT=5` 超過 → `slice(0,5)` で truncate | SP-04 |
| `clampPublicMemberLimit` | 上限超過 → `LIMIT_MAX=100` で clamp（`Math.min`） | SP-05 |
| `clampPublicMemberLimit` | 下限未満 → `LIMIT_MIN=1` で clamp（`Math.max`） | SP-06 |
| `clampPublicMemberLimit` | 小数 → `Math.trunc` で整数化 | SP-07 |
| `isPublicMemberZone` / `normalizePublicMemberZone` | whitelist 外 → `"all"` fallback（false 分岐） | SP-08 |
| `isPublicMemberZone` / `normalizePublicMemberZone` | whitelist 内 → 入力値保持（true 分岐） | SP-09 |
| `isPublicMemberStatus` / `normalizePublicMemberStatus` | whitelist 内 → 入力値保持（true 分岐） | SP-10 |
| `PublicMemberSortZ`（派生 enum） | 不正値 → `.catch("recent")` で fallback | SP-11 |
| `PUBLIC_MEMBER_*_VALUES`（4 tuple） | 要素完全一致（drift guard） | SP-12 |

> `normalizePublicMemberStatus` の false 分岐（不正値→`"all"`）は SP-08 と同型ロジックで担保される。明示が望ましい場合は SP-10 にペア assert を加えてもよいが、`isPublicMemberZone` と `isPublicMemberStatus` は同一構造のため既存ケースで両 branch が踏まれる前提とする。

## 3. 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared exec vitest run \
  --coverage \
  src/public-search/__tests__/search-query-primitives.spec.ts
```

coverage 出力で `search-query-primitives.ts` の Statements / Branches / Functions / Lines が 100% であることを目視確認する。

## 4. 既存 spec のカバレッジ維持（新規低下なし）

既存の api / web parser（`search-query-parser.ts` / `members-search.ts`）は**本タスクで挙動不変**（shared import への置換のみ・I/O と返却 shape は完全不変）。そのため:

- 既存 2 spec（`search-query-parser.spec.ts` / `members-search.spec.ts`）は**無変更で実行**し、従来通り pass することでカバレッジを維持する。
- 切替によりカバレッジが低下しないこと（新規未到達行を生まないこと）を確認する。`SortZ` / `DensityZ` は re-export 化されるが、既存 spec の参照経路は不変。

## 5. 未カバー許容範囲

- shared の純関数は外部依存・I/O を持たないため未カバー行は想定しない（許容範囲 0 行）。
- api/web の parser 内部分岐は既存 spec で担保済み。本タスクは新規分岐を増やさない。

## 6. 失敗時対応

- 到達不能行が出た場合は不要分岐の有無を Phase 8 で再評価する。
- ケース不足の場合は Phase 6（テスト設計）へ戻り SP ケースを追加する。

## 7. ゲート

- [ ] `search-query-primitives.ts` line/branch coverage = 100%
- [ ] SP-01〜SP-12 が全 branch を網羅（§2 対応表）
- [ ] 既存 2 spec が無変更 pass（カバレッジ低下なし）

## 完了条件

- [x] 新規純関数 5 群の line/branch カバレッジ目標 100% を明示
- [x] 各 branch と SP-01〜SP-12 の網羅対応表を提示
- [x] 既存 api/web parser のカバレッジ維持（新規低下なし）を記録
