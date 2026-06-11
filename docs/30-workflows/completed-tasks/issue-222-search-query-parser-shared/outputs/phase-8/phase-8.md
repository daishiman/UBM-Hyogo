# Phase 8 — リファクタリング

> SSOT: [`../../shared-context.md`](../../shared-context.md) §3 / §4 を正本とする。

## 1. 方針

本タスク自体が「重複した query 正規化規約を `packages/shared` に SSOT 化する」リファクタリングである。Phase 8 では、その置換内容を `対象 / Before / After / 理由` テーブル形式で記録し（Feedback RT-03）、重複削除（AC-7）と navigation drift なし（NON_VISUAL）を確定する。

## 2. 変更内容テーブル（対象 / Before / After / 理由）

### 2.1 apps/api（`apps/api/src/_shared/search-query-parser.ts`）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| zone 値集合 | ローカル `VALID_ZONES = new Set([...])` | shared `PUBLIC_MEMBER_ZONE_VALUES` 由来（`normalizePublicMemberZone` 利用 or `.includes` 判定） | SSOT 一本化（drift 根絶） |
| status 値集合 | ローカル `VALID_STATUSES = new Set([...])` | shared `PUBLIC_MEMBER_STATUS_VALUES` 由来（`normalizePublicMemberStatus` 利用） | SSOT 一本化 |
| sort enum | ローカル `SortZ = z.enum([...])` | `PublicMemberSortZ` を re-export（`export const SortZ = PublicMemberSortZ;`） | SSOT 一本化 + 既存 import 後方互換 |
| density enum | ローカル `DensityZ = z.enum([...])` | `PublicMemberDensityZ` を re-export（`export const DensityZ = PublicMemberDensityZ;`） | SSOT 一本化 + 後方互換 |
| tag 上限 | ローカル `TAG_LIMIT = 5` | shared `PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT` | SSOT 一本化 |
| q 上限 | ローカル `Q_LIMIT = 200` | shared `PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT` | SSOT 一本化 |
| limit 上下限 | ローカル `LIMIT_MAX = 100` / `LIMIT_MIN = 1` | shared `PUBLIC_MEMBER_SEARCH_LIMITS.LIMIT_MAX` / `.LIMIT_MIN` | SSOT 一本化 |
| q 正規化 | ローカル `normalizeQ`（trim + `\s+`→`" "` + slice） | shared `normalizePublicMemberQ` | アルゴリズム重複削除 |
| tag 正規化 | ローカル dedup + filter(len>0) + slice(5) | shared `normalizePublicMemberTags` | アルゴリズム重複削除 |
| limit clamp | ローカル `clampLimit` | shared `clampPublicMemberLimit` | アルゴリズム重複削除 |
| enum-like 正規化 | ローカル `normalizeEnumLike`（`VALID_*` 参照） | shared `normalizePublicMemberZone` / `normalizePublicMemberStatus` | SSOT 一本化 |

> 不変: `parsePublicMemberQuery` の I/O・返却 shape（`tags` key 名等）、`DEFAULT_PUBLIC_MEMBER_QUERY` の値（`limit: 24` 等）、`expand` whitelist（`["tags"]` は api 固有・shared に出さず api に残す）。

### 2.2 apps/web（`apps/web/src/lib/url/members-search.ts`）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| zone 値集合 | ローカル `ZONE_VALUES = [...]` | shared `PUBLIC_MEMBER_ZONE_VALUES`（`z.enum(...)` 引数へ） | SSOT 一本化 |
| status 値集合 | ローカル `STATUS_VALUES = [...]` | shared `PUBLIC_MEMBER_STATUS_VALUES` | SSOT 一本化 |
| sort 値集合 | ローカル `SORT_VALUES = [...]` | shared `PUBLIC_MEMBER_SORT_VALUES`（または `PublicMemberSortZ`） | SSOT 一本化 |
| density 値集合 | ローカル `DENSITY_VALUES = [...]` | shared `PUBLIC_MEMBER_DENSITY_VALUES`（または `PublicMemberDensityZ`） | SSOT 一本化 |
| tag 上限 | ローカル `TAG_LIMIT = 5` | shared `PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT` | SSOT 一本化 |
| q 上限 | ローカル `Q_LIMIT = 200` | shared `PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT` | SSOT 一本化 |
| q 正規化 | `QSchema.transform`（trim + `\s+`→`" "` + slice） | shared `normalizePublicMemberQ` を呼ぶ transform | アルゴリズム重複削除 |
| tag 正規化 | `TagSchema.transform`（dedup + slice(5)） | shared `normalizePublicMemberTags` を呼ぶ transform | アルゴリズム重複削除 |
| 制限値公開定数 | `MEMBERS_SEARCH_LIMITS = { TAG_LIMIT, Q_LIMIT }`（ローカル値） | shared 値から `{ TAG_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT, Q_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT } as const` で再構築 | 公開 API 名・shape 不変のまま SSOT へ接続 |

> 不変: `membersSearchSchema` / `MembersSearch` 型 / `parseSearchParams` / `toApiQuery` / `MEMBERS_SEARCH_LIMITS` の名前・shape・挙動。`clampPublicMemberLimit` は web では未配線（将来ページング用 SSOT として予約・本タスクでは未使用）。

## 3. 重複削除確認（AC-7）

SSOT §1.3 の 8 概念が web/api の各ローカル定義から消え、`packages/shared/src/public-search/search-query-primitives.ts` の 1 箇所に集約されることを記録する。

| # | 概念 | Before（重複定義 2 箇所） | After（SSOT 1 箇所） |
|---|------|--------------------------|----------------------|
| 1 | zone 値集合 | api `VALID_ZONES` + web `ZONE_VALUES` | `PUBLIC_MEMBER_ZONE_VALUES` |
| 2 | status 値集合 | api `VALID_STATUSES` + web `STATUS_VALUES` | `PUBLIC_MEMBER_STATUS_VALUES` |
| 3 | sort 値集合 | api `SortZ` + web `SORT_VALUES` | `PUBLIC_MEMBER_SORT_VALUES` / `PublicMemberSortZ` |
| 4 | density 値集合 | api `DensityZ` + web `DENSITY_VALUES` | `PUBLIC_MEMBER_DENSITY_VALUES` / `PublicMemberDensityZ` |
| 5 | tag 上限 | api `TAG_LIMIT` + web `TAG_LIMIT` | `PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT` |
| 6 | q 上限 | api `Q_LIMIT` + web `Q_LIMIT` | `PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT` |
| 7 | q 正規化 | api `normalizeQ` + web `QSchema.transform` | `normalizePublicMemberQ` |
| 8 | tag 正規化 | api dedup+slice + web `TagSchema.transform` | `normalizePublicMemberTags` |

重複消滅は grep gate で機械確認する（SSOT §5.3）:

```bash
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" \
  apps/api/src/_shared/search-query-parser.ts \
  apps/web/src/lib/url/members-search.ts
```

期待: ローカルでの値集合 / 制限値の**再定義行が 0 hit**（import 経由参照のみ）。

## 4. navigation drift なし（NON_VISUAL）

- 本タスクは内部リファクタであり、ルート / UI / 画面遷移を一切変更しない（`visualEvidence: NON_VISUAL`）。
- `/members` の query 解釈結果（`parsePublicMemberQuery` / `parseSearchParams` / `toApiQuery` の出力）は変更前と完全一致するため、ユーザーから見た挙動・導線に差分は発生しない。
- 新規 UI primitive の追加なし（プロトタイプ正本順位に影響なし）。

## 5. その他リファクタ

- naming / formatting は既存 lint / prettier 規約に従い、追加の手動整形は行わない。
- import 順序は既存 convention（外部 → workspace → 相対）を踏襲し、`@ubm-hyogo/shared/public-search` を workspace import 群に追加する。

## 6. ゲート

- [ ] §2 の対象すべてが shared import へ置換され、I/O・公開 shape 不変
- [ ] AC-7: §3 grep gate で重複定義 0 hit
- [ ] navigation / UI drift なし（NON_VISUAL）

## 完了条件

- [x] 変更内容を `対象/Before/After/理由` テーブルで記録（Feedback RT-03）
- [x] 重複 8 概念の SSOT 集約（AC-7）と grep gate を記載
- [x] navigation drift なし（NON_VISUAL）を明記
