# Artifact Inventory: issue-222-search-query-parser-shared

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-222-search-query-parser-shared/` |
| status | `implemented_local_evidence_captured / refactoring / NON_VISUAL` |
| issue | #222 CLOSED（reopen / Issue mutation は user-gated） |
| purpose | 公開メンバー検索 query 正規化規約の web/api 二重定義を `@ubm-hyogo/shared/public-search` へ SSOT 化し drift を防ぐ |

## Implementation Targets

| Path | Role |
| --- | --- |
| `packages/shared/src/public-search/search-query-primitives.ts` | zone/status/sort/density 値集合、派生型、zod enum、制限値、q/tag/limit 正規化 helper |
| `packages/shared/src/public-search/index.ts` | subpath barrel |
| `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` | SP-01〜SP-12 drift guard |
| `packages/shared/package.json` | `./public-search` export |
| `apps/api/src/_shared/search-query-parser.ts` | shared import へ切替。`SortZ` / `DensityZ` export 名は後方互換維持 |
| `apps/web/src/lib/url/members-search.ts` | shared import へ切替。`parseSearchParams` / `toApiQuery` / `MEMBERS_SEARCH_LIMITS` は公開 shape 不変 |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` | PASS: 1 file / 12 tests |
| `mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | PASS: 2 files / 30 tests |
| `mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts` | PASS: 1 file / 11 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |

## Invariants

- API endpoint surface unchanged.
- D1 schema / migration unchanged.
- Google Form schema unchanged.
- UI pixels / routes unchanged.
- `apps/web` does not import `apps/api`; both apps depend on shared primitives through `@ubm-hyogo/shared/public-search`.
- issue #222 AC-3 stale "400" wording is corrected to current silent fallback behavior.

## User-Gated

commit, push, PR, deploy, and Issue mutation remain user-gated.

## Lessons Learned

- **L-ISSUE222-001（shared 型追加の 4 点同一 wave）**: shared に新規プリミティブを追加するタスクは `definition`（実体）/ `barrel index`（re-export）/ `package exports`（subpath 公開）/ `consumer wiring`（利用側 import 置換）の 4 点を同一 wave で揃える（[UT-W3]）。一つでも欠けると import 不能 / drift の温床になる。本タスクは search-query-primitives.ts → index.ts → package.json `./public-search` → api/web import の順で 4 点を実装済み。
- **L-ISSUE222-002（重複対比表で抽出対象を確定）**: drift 解消系リファクタは「真に重複している核」を表（# / 概念 / api 表現 / web 表現）で対比してから抽出対象を確定する。これにより責務の異なる部分（api の expand whitelist 等）を誤って共有化する事故を防ぐ。SSOT §1.3 の重複対比表で具体化。
- **L-ISSUE222-003（CLOSED issue を再オープンせず spec 作成）**: issue #222 は CLOSED だが実コード未着手（doc 移動のみ）と判明。再オープンせず CLOSED のまま現コード最適化 spec を作成し、PR 本文で「issue #222 の現コード最適化解決」と参照する。判断根拠（completed-tasks doc 本文「未実施」+ `grep ZONE_VALUES packages/shared` ヒット 0 + 着手条件到達済）を Phase 1 に記録。
- **L-ISSUE222-004（古い AC を現コードに最適化して読み替え）**: issue AC-3「不正値は 400」は現コードの `z.catch()` / `clamp` による silent fallback（200）と乖離。公開検索は「不正値でも安全 default で 200」が正仕様のため、issue の記述を古いものとして是正し AC-3 を silent fallback へ読み替えた。読み替え根拠を AC 表に明記して追跡可能にする。
- **L-ISSUE222-005（NON_VISUAL Phase 11 は自動テスト名/件数を主証跡）**: NON_VISUAL の Phase 11 は screenshot 不要だが、自動テスト名/件数（SP-01〜SP-12 + 既存 2 spec 回帰）を主証跡として明記し、screenshot を作らない理由（視覚差分ゼロ）を併記する。`screenshots/.gitkeep` は作らない（Feedback 4 / WEEKGRD-03）。
- **L-ISSUE222-006（source PASS 見込みと実機 PASS を区別）**: source-level の設計 PASS 見込みと実機実行 PASS を混同しない（WEEKGRD-01）。実行済み証跡は計画表とは別にコマンド・件数・PASS 結果（shared 12 / api 30 / web 11 = 53 PASS）で記録する。

anti-pattern:
- ❌ shared 型追加で definition だけ足し barrel / package exports / consumer wiring を別 wave に先送りして import 不能 drift を生む。
- ❌ 責務の異なる部分（api の expand whitelist）まで「似ているから」と一括共有化する。
- ❌ CLOSED issue を機械的に再オープンする / 古い AC（400）を現コード仕様（silent fallback）に読み替えず spec へ転記する。
- ❌ NON_VISUAL なのに source PASS 見込みを実機 PASS と同一視して件数・コマンド証跡を残さない。
