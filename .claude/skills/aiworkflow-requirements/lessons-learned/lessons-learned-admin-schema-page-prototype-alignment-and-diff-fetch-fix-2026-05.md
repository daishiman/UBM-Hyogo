# Lessons Learned — admin-schema-page-prototype-alignment-and-diff-fetch-fix (2026-05-27)

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/` |
| state | `implemented_local_evidence_captured` |
| parent | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment/` |
| trigger | staging `/admin/schema/diff` 404 + `/admin/schema` page が prototype `SchemaDiffPage` (L508-656) と乖離 |

## L-ASCHEMA-001 — staging-only API 404 切り分け先行

UI 整合タスクで「API 取得失敗が observed」場合、UI 着手前に Lane A（`scripts/cf.sh tail` / `curl` / deploy 同期 / mount 順）で根本原因を確定する。Phase 2 design に「切り分け表」を必須化し、API surface 不変条件を破る修復に流れない gate を置く。

- **Why**: 本サイクルでは観測 404 を「stale staging deploy + UI 側 fallback の silent absorb」と切り分けた結果、API endpoint surface を不変に保てた。
- **How to apply**: prototype 整合 + observed runtime error の同居タスクは Lane A（runtime triage）→ Lane B-E（UI + regression）の順で Phase 2 表に明記する。

## L-ASCHEMA-002 — `hideInlineStats` 後方互換 prop

parent page で stats grid を集約し、child panel 側に stats 抑止 prop を持たせる際は `hideInlineStats?: boolean`（default `false`）として既存呼び出し点を破壊しない。`_shared` Primitive へ昇格させず page-local helper に閉じる。

- **Why**: `SchemaDiffPanel` は 8 ファイルから参照されており、destructive な stats 削除は admin-tags / meetings の派生 panel に波及するリスクがあった。
- **How to apply**: panel-in-page composition で stats を二重表示しないため、child 側に `hideInline*` 名前空間で abort flag を入れる。default は false（既存挙動）。

## L-ASCHEMA-003 — sidebar 表記統一は併修 1 行 PR

`/admin/<route>` label の日本語統一（"schema" → 「スキーマ」）は単独 issue 化せず、関連 UI prototype 整合タスクと同 PR に併合する。`AdminSidebar.component.spec.tsx` のラベル assertion 追記もチェックリストに含める。

- **Why**: label 変更 1 行が単独 PR になると review コストに対する価値が低く、prototype 整合の wave に乗せた方が回帰 spec も一気通貫で揃う。
- **How to apply**: admin sidebar の表記 drift を見つけた場合、現に走っている admin UI wave の Phase 5 変更ファイル一覧に追記する。

## L-ASCHEMA-004 — contract spec lane 明示

`*.contract.spec.ts` は D1 lane（`vitest.d1.config.ts` + `singleFork`）で実行され、`pnpm --filter api test`（unit lane）では skip される。Phase 4 test plan に必ず lane 名と実行コマンドを明示する。

- **Why**: 過去に「contract spec を増やしたのに CI で実行されていなかった」事例が複数発生（[[project_contract_spec_d1_lane]]）。
- **How to apply**: 仕様書 phase-6 / phase-7 で contract spec を追加する場合、`vitest.d1.config.ts` のパターンに合致するファイル名・配置を採り、`pnpm test:coverage:d1` で実 run することを Phase 9 QA に固定する。

## L-ASCHEMA-005 — Playwright-only fixture fallback の局所化

`apps/web/src/lib/admin/server-fetch.ts` の Playwright fallback は task-specific fixture の **後ろ** に置く。新 endpoint（`/admin/schema/diff`）の fallback を fixture チェーン末尾に追加し、上位 fixture が先に hit する順序を保つ。

- **Why**: fallback を chain 先頭に置くと既存 smoke spec が新 fixture を踏んで silent 200 を返し、UI 側の 404 分岐 regression が捕捉できない。
- **How to apply**: `server-fetch.ts` で新 endpoint の Playwright fixture 分岐を増やすとき、必ず既存 task-specific fixture の **後** に append し、fallback chain の隣接 spec が変わらないことを `grep -n "if (req.path" apps/web/src/lib/admin/server-fetch.ts` で目視する。

## Anti-patterns

- prototype 整合タスクで API surface 改修に手を伸ばす（不変条件 #1 違反）。
- `SchemaDiffPanel` の stats を destructive に削除し default 挙動を壊す。
- contract spec を unit lane に置いて「実行されない緑」を量産する。
- Playwright fallback を chain 先頭に挿入し、既存 spec の expected fixture を上書きする。

## Related

- [[lessons-learned-issue-777-schema-diff-resolve-history-view-2026-05]]
- [[project_admin_ui_prototype_alignment_tasks_AE]]
- [[lessons-learned-admin-ui-prototype-alignment]]（admin-shell / admin-task-C..E 系列）
