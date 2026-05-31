<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 1 -->

[実装区分: 実装仕様書]

# Phase 1 — 要件定義

## 1. 背景

`members-list-ux-clarity`（#1009）で `/members` の density / filter / empty state を 24 PNG で記録したが、Phase 11 runtime notes では full Playwright spec が cold start で完全 green にならず、欠けた PNG（mobile comfy）を direct Playwright script で補完していた。Issue #1005（`task-members-ux-playwright-baseline-stabilization-001`）はこの安定化を求める follow-up。

### 1.1 path topology 実測（Phase 1 必須ゲート）

stale path 引用を防ぐため、現行コードベースを実測した。

| 項目 | 実測値 |
| ---- | ------ |
| spec 本体 | `apps/web/playwright/tests/members-ux-clarity.spec.ts`（実在） |
| route | `apps/web/app/(public)/members/page.tsx`（実在。`apps/web/src/app` ではない） |
| 依存 DOM marker | `data-component="member-filters"` / `data-role="filters-summary-mobile"` / `data-role="filters-body"` / `data-component="empty-state"` / `data-role="pagination-meta"` — 全て現存 |
| 完了タスク dir | `docs/30-workflows/completed-tasks/members-list-ux-clarity/`（移動済み） |
| spec 内 `workflowRoot` | `docs/30-workflows/members-list-ux-clarity`（**旧 active path・stale**） |
| 既存 warm-up 参照実装 | `playwright.config.ts` の `isMembersPrototypeAlignment`（ready URL `/login`）が同型先行例 |

## 2. 根本原因

| ID | 根本原因 | 観測根拠 |
| --- | -------- | -------- |
| RC-1 | route warm-up 不在。`dev:webpack` は on-demand compile のため、matrix 先頭テスト（`viewports[0]=mobile` × `densities[0]=comfy`）が `/members` cold-compile に当たり、per-test timeout（60s）/ assertion timeout（10s）を超過し flaky 化。 | runtime-notes: 「first test in a fresh dev-server run hit a local mock/API warm-up race ... missing **mobile comfy** PNGs were captured with a direct Playwright script」。matrix 順序と欠落 PNG が一致。 |
| RC-2 | 出力先 path drift。spec の `workflowRoot` が旧 active path 固定で、移動後の `completed-tasks/...` を指していない。再実行で誤った新規 dir に書き込む。 | spec L6-8 が `../../docs/30-workflows/members-list-ux-clarity` を `process.cwd()` 基準でハードコード。実 dir は `completed-tasks/` 配下。 |
| RC-3 | multi-project 冗長実行。spec が default の desktop-chromium / desktop-firefox / mobile-webkit の 3 project で実行され、同名 24 PNG を 3 重に上書きし flake 面と実行時間を増やす。 | `playwright.config.ts` で `members-ux-clarity.spec.ts` は `fixtureGatedTestIgnore` 対象外。各 project の testIgnore にも該当しない。 |
| RC-4 | runtime-notes が direct-script 補完前提の記述で、安定化後も誤誘導する。 | spec `afterAll` が固定文言を書き出す（補完前提ではないが、cold-start PASS の証跡を残せていない）。 |

## 3. 受け入れ基準 (AC)

| AC | 内容 | 検証方法 |
| --- | ---- | -------- |
| AC-1 | `playwright test apps/web/playwright/tests/members-ux-clarity.spec.ts` が **cold start（reuseExistingServer 無効・dev server 新規起動）で PASS** する。 | クリーンな状態から 1 回目実行で全 12 test（24 screenshot）が PASS。 |
| AC-2 | 24 PNG（4 viewport × 3 density × 2 state）が **Playwright spec 本体から生成**され、direct Playwright script 補完が不要。 | `find <evidence>/screenshots -name 'members-ux-clarity-*.png' | wc -l` ≥ 24。 |
| AC-3 | 生成された PNG / runtime-notes が **補正後の正しい出力先** に書き込まれる（誤った `docs/30-workflows/members-list-ux-clarity/` 新規 dir を作らない）。 | run 後に旧 path（`docs/30-workflows/members-list-ux-clarity/`）が新規生成されていないこと。 |
| AC-4 | evidence run 時、spec が **単一 project で 1 回だけ実行**される（3 重上書きしない）。 | Playwright report の test 件数が 12（24 screenshot）であり、project 重複がない。 |
| AC-5 | `runtime-notes.md` に **direct script 補完不要** の証跡が記録される。 | runtime-notes に warm-up race 解消・cold-start PASS の記述。 |
| AC-6 | `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm lint` が GREEN。 | exit code 0。 |
| AC-7 | 既存の他 Playwright run（members-prototype-alignment 等）の挙動を破壊しない。 | 既存 evidence flag 分岐に回帰がないこと（config diff レビュー）。 |

## 4. 制約・不変条件

- INV-1: API endpoint / D1 schema / Google Form 仕様を変更しない。
- INV-2〜INV-4: token / primitive / D1 直接アクセスに関する既存不変条件を維持（本タスクは Playwright 層のみ）。
- INV-5: 新規 test ファイルを増やさない（既存 `.spec.ts` / `playwright.config.ts` の編集のみ）。
- CONST_007: 1 サイクルで完了。warm-up / path 補正 / project gating / runtime-notes を分割しない。

## 5. スコープ外

- staging deploy / staging visual baseline PNG 更新（Gate-C, user-gated）
- `/members` UI component の内部実装変更
- GitHub Issue #1005 の state 変更（user-gated）

## DoD

- [x] path topology を実測し stale path 引用を排除した
- [x] 根本原因 RC-1〜RC-4 を観測根拠付きで特定した
- [x] AC-1〜AC-7 を検証方法付きで定義した
- [x] 不変条件・スコープ外を明示した
