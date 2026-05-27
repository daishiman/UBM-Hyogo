# lessons-learned — public-dashboard-prototype-alignment (2026-05)

| 項目 | 値 |
| --- | --- |
| workflow | `public-dashboard-prototype-alignment` |
| source_issue | n/a (prototype alignment) |
| status | implementation_reviewed / VISUAL |
| recorded_at | 2026-05-26 |

## 範囲

公開ダッシュボード (Hero / Stats / ZoneIntro / MemberGrid / Timeline / About) のプロトタイプ整合実装と、empty-state を含む e2e visual regression 整備で得た 7 件の教訓。

## L-PDPA-001 — 既存 variant 残し新 variant 追加

- **Rule**: variant prop を持つ component に新表現を足すときは、既存 variant を破壊変更せず、新 variant 値 (`card` / `panel` 等) を追加して呼び出し元を順次切替する。
- **Why**: prototype 整合は呼び出し元が複数 (legacy public + dashboard) で、同一 component を共有しているケースが多いため、既存 variant を再定義すると別 surface が一斉に崩れる。
- **How to apply**: union 型を `'card' | 'panel'` の形で拡張し、default を従来値に固定。新 variant は dashboard 専用 path から opt-in する。switch case に exhaustiveness check (`satisfies Record<Variant, ...>`) を入れ追加忘れを compile error で検出する。

## L-PDPA-002 — 空状態は section header 残し中身だけ EmptyState

- **Rule**: dashboard の section が空でも、heading / CTA / a11y landmark を保ったまま、本文部分のみを `EmptyState` primitive に差し替える。
- **Why**: section ごと unmount すると visual regression baseline が大きく変わり、tab order / aria-labelledby も壊れる。
- **How to apply**: `if (items.length === 0) return <EmptyState/>` を section root ではなく list 領域 (`<ul>` / grid container) のスコープに置く。section header と footer CTA は常時 render する。

## L-PDPA-003 — prototype 固定値は const 化 + 出所コメント

- **Rule**: prototype HTML に書かれている数値 (`ZONE_COUNT=4`, `MEETINGS_PER_YEAR=12` 等) は magic number 化せず、module top-level `const` に固定し、出所コメント (`// from claude-design-prototype/public/index.html L:NN`) を必ず添える。
- **Why**: 後で prototype 側が変わった時に grep で追跡できる。inline 直書きすると prototype 改訂時に乖離が静かに進む。
- **How to apply**: 1 const = 1 出所コメント。複数 component で共有するなら `const/dashboard.ts` 等に集約し、export 経由で参照。

## L-PDPA-004 — e2e empty-state は /__test__/<scope> toggle endpoint + 共有 state

- **Rule**: empty-state を e2e で観測するには、production code に test flag を散らさず、`/__test__/<scope>/empty` のような test-only route で in-memory state を toggle する。standalone / inline 両方の dashboard 実装が同じ state を参照すること。
- **Why**: `?empty=1` query / cookie 方式は本番 SSR cache や RSC payload に漏れるリスクがある。toggle endpoint は build から exclude しやすい。
- **How to apply**: `app/__test__/dashboard/empty/route.ts` で `globalThis.__test_dashboard_empty__` を flip し、SSR fetch が boolean を見て fixture を切替える。Playwright は `request.post('/__test__/dashboard/empty')` で setup する。

## L-PDPA-005 — /__test__/reset への state 追加忘れ防止

- **Rule**: 新しい test-only toggle state を作ったら、必ず `/__test__/reset` (test setup の冒頭で叩く endpoint) にも reset 処理を足す。
- **Why**: 1 test だけ通って、後続 test が前 test の empty 状態を引き継ぎ flaky 化する典型事例。standalone (Next dev) と inline (workers) 2 経路あるとき、片方だけ reset すると半数が flaky 化する。
- **How to apply**: lessons-learned に「`/__test__/reset` への state 追加」のチェック行を残す。Phase 6 test 追加時に 2 経路点検をレビュー項目に入れる。

## L-PDPA-006 — PLAYWRIGHT_EVIDENCE_TASK ベース evidence dir 分岐の追加 3 点セット

- **Rule**: 複数 workflow が同じ Playwright config を共有する場合、`PLAYWRIGHT_EVIDENCE_TASK` env 変数で evidence dir を切替えるが、変更箇所は必ず 3 つセットで触る。
  1. `EVIDENCE_DIR` 三項演算子の追加
  2. `localServerReadyURL` の `||` フォールバック追加
  3. `process.argv.some(...)` での task 名一致判定
- **Why**: 1 箇所だけ足すと、別 task が走るときに evidence が混入したり server 起動を待たずに spec が走り flaky 化する。
- **How to apply**: `playwright.config.ts` の diff レビューでこの 3 点が揃っているか必ず check。pre-commit grep gate 候補。

## L-PDPA-007 — legacy-public.css を workflow-slug ブロックの token bridge として使う条件

- **Rule**: prototype 由来の CSS 変数 (`--legacy-public-*`) を新 token 体系 (`tokens.css`) に流す bridge として `legacy-public.css` を使うのは、(a) prototype と新 token の値が **意味的に同じ** で名前だけ違うケースに限る。値の意味が変わるなら bridge せず、component 側で新 token を直接参照する。
- **Why**: bridge を乱用すると、新 token の改訂が legacy 経由で吸収されてしまい、design system 変更が dashboard に効かなくなる。
- **How to apply**: `legacy-public.css` には冒頭コメントで workflow slug (`/* bridge for: public-dashboard-prototype-alignment */`) を書き、bridge entry は workflow 完了時に削除候補とする。
