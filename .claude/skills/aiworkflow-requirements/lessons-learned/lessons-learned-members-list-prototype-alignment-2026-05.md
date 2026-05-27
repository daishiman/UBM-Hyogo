# lessons-learned — members-list-prototype-alignment (2026-05)

| 項目 | 値 |
| --- | --- |
| workflow | `members-list-prototype-alignment` |
| status | implemented_local_evidence_captured / VISUAL / visual_runtime_pending |
| recorded_at | 2026-05-26 |
| branch | `feat/members-list-prototype-alignment` |

## 範囲

`/members` 公開会員一覧を prototype の card / list density に整える実装で得た苦戦箇所。`PublicMemberListItem` contract を変更せず density を `MemberGrid` 一本へ統一した過程の知見。

## L-MLPA-001 — density 切替は route 分岐ではなく primitive 内部で吸収する

- **学び**: 初期実装では `/members/page.tsx` が `density === 'list'` のとき `MemberTable`、それ以外で `MemberGrid` を render する分岐を持っていた。density UI を増やすたびに route 側 if が増殖し、focused spec が `MemberTable` を import 続けて prototype 仕様と乖離する。
- **解決**: `MemberGrid` の variant 内部で comfy / dense / list を切替え、route 側は density value を渡すだけにした。`MemberTable` は legacy 互換として残し、`/members` route からは未参照にする。
- **逆パターン禁止**: route 直下で primitive を分岐させると、storybook / visual baseline が density 単位で増殖し、prototype と差分が読めなくなる。

## L-MLPA-002 — `PublicMemberListItem` に prototype 専用 field を追加しない

- **学び**: prototype の card には `businessOverview` / list 用の追加 `tags` が並ぶが、現行 D1 / API contract には存在しない。`PublicMemberListItem` に optional field を生やすと API 側未保証データを UI が前提化する。
- **解決**: zone chip / status / occupation icon / location icon の 4 meta を既存 field（`zone`, `status`, `occupation`, `location`）で再構成し、prototype 寄せは表示層 token / icon の rearrangement で吸収。
- **適用条件**: 既存 API surface を変えずに prototype 寄せする UI alignment 全般。Form schema / D1 schema 変更を要求する density は別 task に切り出す。

## L-MLPA-003 — Playwright spec の `webServer.url` readiness が body 実行前に失敗する

- **学び**: focused spec を新規追加した直後、Playwright が `webServer` の readiness probe で timeout し、screenshot 取得前に suite ごと fail した。trace.zip / report は残るが `EV-*.png` は存在しない状態になる。
- **解決**: 仕様書側で `phase-11/screenshots/EV-*.png` を `pending_runtime` として ledger に明記し、physical absence のまま PASS と書かない。実 capture は staging 経路または別ホストでの再 run へ user-gate する。
- **逆パターン禁止**: `outputs/phase-11/` 配下に dummy PNG を置いて PASS にしてはならない（screenshot-coverage ledger が空想 evidence を抱える）。

## L-MLPA-004 — Playwright spec ファイル名 rename 後の path drift

- **学び**: 旧 `members-page-prototype-alignment.spec.ts` を `members-prototype-alignment.spec.ts` に rename した際、CI workflow / playwright.config.ts の testIgnore / focused test path 指定が古い名前を参照し続け、suite が空集合で PASS する silent failure を起こした。
- **解決**: rename を伴う Playwright spec は (a) 旧 path を含む grep gate、(b) `playwright.config.ts` の testIgnore / testMatch 同 wave 更新、(c) focused spec を 1 度 watch mode で起動して空集合でないことを physical 確認、の 3 点をセットで満たす。
- **適用条件**: `apps/web/playwright/tests/**` の spec rename / 移動。

## L-MLPA-005 — focused component spec から legacy component を切り離す

- **学び**: `MemberCard.spec.tsx` / `MemberGrid.spec.tsx` を更新したとき、route から外した `MemberTable` を import している assertion が残っており、prototype 寄せの DOM 構造 assert と legacy table 構造 assert が同居して読みづらくなった。
- **解決**: focused spec は「route から実際に到達する primitive」のみを import する。legacy 互換維持の `MemberTable` には独立した `MemberTable.spec.tsx` を残し、prototype 寄せ assertion を混ぜない。
- **逆パターン禁止**: 「念のため legacy も assert する」は spec の責務境界を壊す。互換確認は独立 spec で行う。

## L-MLPA-006 — DOM 構造置換後の legacy critical-route e2e spec drift

- **学び**: prototype alignment で `MemberTable` (`<table data-component="member-table">`) を `MemberGrid` (`<ul data-component="member-grid" data-density="list">`) に置換した際、focused spec (`members-prototype-alignment.spec.ts`) は更新したが、別 ファイルにある legacy critical-route spec `public-top-and-list.spec.ts:65` が旧 selector を残しており、PR 後の `e2e-tests-coverage-gate` で 3 browser project 全件 FAIL を起こした。
- **解決**: `data-component="*"` のような stable selector を置換する場合、`apps/web/playwright/**` 全体を grep して旧 selector の残存を回収する。同一 wave で legacy critical-route spec の assertion も `<新 selector>` に同期する。
- **適用条件**: `data-component="*"` / `data-role="*"` / DOM tag (`table` / `ul` / `section`) を伴うコンポーネント置換。
- **逆パターン禁止**: 「focused spec を更新したから他 spec はそのうち気づく」と先送りすると、CI が PR 直前まで通って merge ブロックされる。同一 commit / 同一 wave で全 spec 同期する。

## L-MLPA-007 — visual baseline は DOM 寸法変動時に必ず stale 化

- **学び**: prototype alignment で page-head / filter chip layout が変わると `full-visual-{root,members}-{desktop,tablet,mobile}.png` の expected height がずれ、`visual-full` / `playwright-smoke visual (chromium, 4 screens)` が 100% fail する。
- **解決**: DOM 構造を変える PR は同一 wave で `playwright-visual-baseline-update.yml` (`workflow_dispatch` + `visual-baseline-approval` environment) を user-gate で trigger し、`-linux.png` baseline を更新する。`.baseline-meta.json` の `captured_at_commit_sha` を新 HEAD に合わせる。
- **適用条件**: `apps/web/app/(public)/**` / `apps/web/src/components/public/**` の DOM 構造変更を含む PR。
- **逆パターン禁止**: ローカル macOS で `--update-snapshots` し commit してはならない（`-darwin.png` が混入し Linux runner で再失敗する）。

## 関連リソース

- `docs/30-workflows/completed-tasks/members-list-prototype-alignment/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-list-prototype-alignment-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` (members-list-prototype-alignment 節)
