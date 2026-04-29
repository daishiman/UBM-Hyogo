# Phase 8 — DRY 化 main

## 目的

実装中に出現した重複・抽象漏れを共通モジュールへ集約し、後続 Wave 5+ や 06a で再利用可能な形に整える。同時にやり過ぎ抽象化（過剰汎化）を避けるため、3 箇所以上で実利用される箇所のみを共通化する。

## 共通化対象（Yes）

| # | 共通化対象 | 配置 | 利用箇所 | 理由 |
| --- | --- | --- | --- | --- |
| D-1 | 公開フィルタ条件 (`publicConsent='consented' AND publishState='public' AND is_deleted=0`) | `apps/api/src/_shared/public-filter.ts` | list / count / exists / aggregate / profile converter | SQL where と converter で 5 箇所、leak リグレッションを単一定義に |
| D-2 | search query parser (q/zone/status/tag/sort/density/page/limit + clamp + truncate) | `apps/api/src/_shared/search-query-parser.ts` | members handler / use-case (将来 06a も流用予定) | AC-5 / AC-6 / AC-11 を一箇所で保証 |
| D-3 | pagination meta builder | `apps/api/src/_shared/pagination.ts` | members list / 将来 me 配下 list 全般 | totalPages / hasNext / hasPrev のロジック重複防止 |
| D-4 | visibility index / public-only filter | `apps/api/src/_shared/visibility-filter.ts` | profile converter / form-preview view | schema_questions.visibility 判定の一元化 |
| D-5 | sync_jobs status mapper (`mapJobStatus`) | `use-cases/public/get-public-stats.ts` 内 (現状) | stats のみ | 現状 1 箇所のみ → ✗ 共通化見送り（再利用要件が出たら抽出） |

## 共通化見送り（No）

| # | 候補 | 理由 |
| --- | --- | --- |
| N-1 | response_fields の JSON.parse helper | `JSON.parse` の薄ラッパで利益小、parse 失敗時の挙動が呼出ごとに異なる |
| N-2 | Cache-Control 文字列の定数化 | 4 endpoint で各 1 行、文字列の意味が異なる（max-age=60 / no-store）為敢えて散在 |
| N-3 | `ApiError` factory | shared/errors の既存 ApiError で十分、wrapper は不要 |

## 抽象化レベル評価

- 共通化した 4 モジュールは全て pure function、副作用なし、test 容易。
- 早期抽象化を避け、`mapJobStatus` 等は 2 箇所目の利用が見えるまで private に留める。
- 将来 06a（Public Landing / Directory pages）が `apps/web` 側で同じパース仕様を必要とするが、`apps/web` から `apps/api` の helper を import するのは monorepo 規約上避け、`packages/shared` に同等仕様を再実装する方針（現時点では未着手で良い）。

## 重複指標 before / after

| 観点 | before | after |
| --- | --- | --- |
| 公開フィルタ SQL の重複 | 5 箇所 | 1 helper + bind |
| limit clamp 実装 | 2 箇所案 | 1 helper |
| visibility 判定 | 2 箇所案 | 1 helper |
| FORBIDDEN_KEYS list | 2 箇所 (list / profile converter) | 各 view-model 内で local 定義 (合計 2) — list / profile で対象 key が異なる為共通化見送り |

## 完了条件チェック

- [x] 共通化対象を `_shared/` に集約。
- [x] 共通化見送りを理由付きで列挙。
- [x] 過剰抽象化のリスクを評価。
