# Phase 11: 手動テスト結果（NON_VISUAL）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。

## NON_VISUAL 宣言

- **タスク種別**: `refactoring`（公開検索 query 正規化プリミティブの `packages/shared` 集約）
- **workflow_state**: `implemented_local_evidence_captured`（実装・focused tests・typecheck・lint 完了。commit / push / PR は user-gated）
- **非視覚的である理由**: UI / UX / DOM / 画面遷移・スタイルに一切触れない**純粋な内部リファクタ**。web/api で二重定義されている query 正規化の規約（値集合・制限値・正規化アルゴリズム）を `packages/shared/src/public-search` へ SSOT 化し、両 app が import へ切替えるのみ。`/members` の見た目・挙動は変更前と完全一致（contract 不変）。
- **代替証跡**: 自動テスト（新規 `search-query-primitives.spec.ts` の **SP-01〜SP-12** + 既存 2 spec の無変更回帰）、3 package の typecheck、root lint、AC-7 の重複定義消滅 grep。

## screenshot を作らない理由（Feedback 4 / WEEKGRD-03）

- 本タスクは UI/UX 変更ゼロのため、スクリーンショットは「証跡として無意味」（同一画面・同一描画を撮るだけ）。
- 視覚差分が存在しないので `outputs/phase-11/screenshots/` および `screenshots/.gitkeep` は**作らない**。
- 代替として、振る舞いの正しさは「純関数 / zod schema の自動テスト」で機械的に保証する。drift 根絶という本タスクの価値は、値集合 tuple の drift guard（SP-12）と既存 2 spec の無変更 pass で証明する。

## 実行済み証跡

2026-06-10 に実コード実装後、以下をローカル実行しすべて PASS を確認した。source-level の計画と実機実行結果を分離し、PASS 証跡として本節に固定する。

## 主証跡: 新規 shared unit test `search-query-primitives.spec.ts`

| ID | ケース | 期待 |
| --- | --- | --- |
| SP-01 | `normalizePublicMemberQ("  a   b  ")` | `"a b"`（trim + 連続空白圧縮） |
| SP-02 | `normalizePublicMemberQ("x".repeat(250))` | length 200（Q_LIMIT 切詰） |
| SP-03 | `normalizePublicMemberTags(["a","a","b",""])` | `["a","b"]`（dedup + 空文字除去） |
| SP-04 | `normalizePublicMemberTags(7件)` | 5 件で truncate（TAG_LIMIT） |
| SP-05 | `clampPublicMemberLimit(999)` | `100`（LIMIT_MAX clamp） |
| SP-06 | `clampPublicMemberLimit(0)` | `1`（LIMIT_MIN clamp） |
| SP-07 | `clampPublicMemberLimit(30.9)` | `30`（trunc） |
| SP-08 | `normalizePublicMemberZone("invalid")` | `"all"`（whitelist 外 fallback） |
| SP-09 | `normalizePublicMemberZone("0_to_1")` | `"0_to_1"` |
| SP-10 | `normalizePublicMemberStatus("non_member")` | `"non_member"` |
| SP-11 | `PublicMemberSortZ.catch("recent").parse("bad")` | `"recent"`（silent fallback） |
| SP-12 | 各値集合 tuple の要素が期待通り（drift guard） | 完全一致 assert |

> 件数: **12 ケース / 1 spec ファイル**。これが本タスクの主証跡。

実行結果: `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` 1 file / 12 tests PASS。

## 回帰証跡: 既存 spec を無変更で pass

| spec | 役割 | 期待 |
| --- | --- | --- |
| `apps/api/src/_shared/__tests__/search-query-parser.spec.ts` | `parsePublicMemberQuery` の contract 不変（AC-2） | 12 tests PASS |
| `apps/web/src/lib/url/__tests__/members-search.spec.ts` | `parseSearchParams` / `toApiQuery` / `MEMBERS_SEARCH_LIMITS` の contract 不変（AC-6） | 11 tests PASS |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | shared import 切替後も use-case 動作不変 | 18 tests PASS |

## 実行コマンドと結果

```bash
# 1. shared 新規テスト（主証跡 SP-01〜SP-12）
mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts
# 期待: 1 file / 12 tests PASS
# 結果: PASS

# 2. apps/api 回帰（contract 不変の証明）
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
# 期待: 既存 spec 無変更で PASS
# 結果: 2 files / 30 tests PASS

# 3. apps/web 回帰（contract 不変の証明）
mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts
# 期待: 既存 spec 無変更で PASS
# 結果: 1 file / 11 tests PASS

# 4. 型チェック（3 package）
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
# 期待: 全 PASS（subpath export / re-export の型整合）
# 結果: 全 PASS

# 5. lint
mise exec -- pnpm lint
# 期待: PASS（apps/web → apps/api 直接参照ゼロの boundary lint 維持）
# 結果: PASS

# 6. AC-7: 重複定義消滅確認
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts apps/web/src/lib/url/members-search.ts
# 期待: ローカル重複定義がヒットしない（shared import に一本化済み）
```

## 到達不能・対象外境界

- `apps/web` のページング（`page`/`limit` を web で実使用）は本タスク非接触（SSOT §2.2）。shared に `LIMIT_MIN`/`LIMIT_MAX`/`clampPublicMemberLimit` を SSOT として置くが、web 配線は将来タスク。
- D1 schema / API endpoint surface / Google Form schema は不変（実行検証の対象外＝触らない）。

## 結論

NON_VISUAL の代替証跡（自動テスト 12 + api/web 回帰 41 + typecheck + lint）を実行し、全て PASS した。commit・push・PR は user-gated のまま未実行。
