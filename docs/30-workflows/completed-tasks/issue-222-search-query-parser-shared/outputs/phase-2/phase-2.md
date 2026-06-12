# Phase 2: 設計

> SSOT: [`../../shared-context.md`](../../shared-context.md) §3 を正本とする。

## 2.1 topology（モジュール構成）

```
packages/shared/src/public-search/
├── search-query-primitives.ts   # 新規: 値集合 tuple / zod enum / 制限値 / 純関数正規化
├── index.ts                     # 新規: barrel（export *）
└── __tests__/
    └── search-query-primitives.spec.ts   # 新規: SP-01〜SP-12

packages/shared/package.json     # 編集: exports に "./public-search" 追加

apps/api/src/_shared/search-query-parser.ts   # 編集: shared import へ置換（動作不変）
apps/web/src/lib/url/members-search.ts        # 編集: shared import へ置換（動作不変）
```

## 2.2 SubAgent lane（実装時の並列単位・3 並列以下）

| Lane | 関心ごと | 対象ファイル | 依存 | 状態所有権 |
| --- | --- | --- | --- | --- |
| A | shared SSOT 定義 | `public-search/*`, `package.json` | なし（先行） | 検索規約の所有 |
| B | apps/api consumer 配線 | `search-query-parser.ts` | A | 受信 raw→ParsedQuery |
| C | apps/web consumer 配線 | `members-search.ts` | A | searchParams→DTO + serialize |

> **依存順序**: A の export shape 確定 → B/C 並列着手可。validation lane（typecheck/lint/test）は直列で締める。

## 2.3 公開 surface 設計（FB-SDK-07-4 命名一貫性）

新規 export（SSOT §3.1 を正本・逐語）:

| 種別 | 識別子 |
| --- | --- |
| 値集合 tuple | `PUBLIC_MEMBER_ZONE_VALUES` / `PUBLIC_MEMBER_STATUS_VALUES` / `PUBLIC_MEMBER_SORT_VALUES` / `PUBLIC_MEMBER_DENSITY_VALUES` |
| 型 | `PublicMemberZone` / `PublicMemberStatus` / `PublicMemberSort` / `PublicMemberDensity` |
| zod enum | `PublicMemberSortZ` / `PublicMemberDensityZ` |
| 制限値 | `PUBLIC_MEMBER_SEARCH_LIMITS`（`TAG_LIMIT`/`Q_LIMIT`/`LIMIT_MIN`/`LIMIT_MAX`/`LIMIT_DEFAULT`） |
| 純関数 | `normalizePublicMemberQ` / `normalizePublicMemberTags` / `clampPublicMemberLimit` / `normalizePublicMemberZone` / `normalizePublicMemberStatus` / `isPublicMemberZone` / `isPublicMemberStatus` |

## 2.4 内部型 → consumer 適用 変換表（責務境界の明示）

| shared primitive | apps/api での使い方 | apps/web での使い方 |
| --- | --- | --- |
| `PUBLIC_MEMBER_*_VALUES` | `normalizeEnumLike` 代替・`SortZ`/`DensityZ` 派生元 | `z.enum(...)` の引数 |
| `normalizePublicMemberQ` | `normalizeQ` を置換 | `QSchema.transform` 本体 |
| `normalizePublicMemberTags` | tag dedup+slice を置換 | `TagSchema.transform` 本体 |
| `clampPublicMemberLimit` | `clampLimit` を置換 | 未使用（将来ページング用に予約） |
| `PUBLIC_MEMBER_SEARCH_LIMITS` | `TAG_LIMIT`/`Q_LIMIT`/`LIMIT_MAX`/`LIMIT_MIN` を置換 | `TAG_LIMIT`/`Q_LIMIT` を置換・`MEMBERS_SEARCH_LIMITS` 再構築 |

## 2.5 後方互換戦略（既存 import を壊さない）

- apps/api: 既存 `export const SortZ` / `export const DensityZ` は **re-export** で残す（`export const SortZ = PublicMemberSortZ;`）。`list-public-members.ts` / `pagination.ts` / `routes/public/members.ts` の `import { SortZ }` が壊れない。
- apps/web: `MEMBERS_SEARCH_LIMITS` は shared 値から `{ TAG_LIMIT, Q_LIMIT } as const` で再構築し既存テスト（`MEMBERS_SEARCH_LIMITS.TAG_LIMIT === 5`）互換維持。`membersSearchSchema` / `MembersSearch` / `parseSearchParams` / `toApiQuery` の名前・shape 不変。

## 2.6 ライブラリ選定

新規ライブラリ採用なし。`zod`（既に shared/api/web 全てが依存）のみ使用。複合フィールド semantics 確認（FB-CRONVL-001）不要（enum/clamp のみ）。

## 2.7 純関数のエラー戦略（WEEKGRD-02）

正規化関数は**例外を投げない**。不正値は安全側 default（`""` / `"all"` / clamp 値）へ倒す。入力バリデーションの最終責務は呼び出し元（route layer）。これは現コードの `z.catch()` / `clamp` 仕様と一致し、AC-3 の現行解釈（fallback で 200）を保つ。

## 2.8 validation path

```
A 完了 → B/C 並列 → shared typecheck → api/web typecheck → 全 spec 実行 → lint → grep gate（重複定義消滅）
```

## 完了条件

- [x] topology / lane / 依存順序を確定
- [x] 公開 surface 命名を SSOT と一致させ確定
- [x] 後方互換戦略（SortZ/DensityZ re-export・MEMBERS_SEARCH_LIMITS 再構築）を確定
- [x] 純関数エラー戦略（例外なし）を確定
