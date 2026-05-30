# lessons-learned: admin-sidebar-public-return-link (2026-05-28)

`/admin/*` の AdminSidebar から旧 `ホーム` grouped nav を撤去し、footer 直前の `data-role="public-return"` anchor に公開サイト復帰 link を再配置したタスクの知見。

## L-ADMRET-001 grouped nav → footer 隣接 anchor 移設の責務分離

- **Rule**: 管理画面から公開サイトに戻る link は **AdminSidebarNavItem の集合(GROUPS)に含めず**、`<aside>` 内 footer 直前に `<a data-role="public-return" aria-label="公開サイトに戻る" href="/">` として独立配置する。
- **Why**: 「ナビゲーション項目」と「コンテキスト離脱 link」は IA 上の責務が異なる。grouped nav 内に置くと管理 route の isActive 判定と意味的に競合し、`getByRole('navigation')` × `getByRole('link', { name })` の strict-mode で「現在地ハイライト」誤検出を招く。
- **How to apply**: AdminSidebar 改修時は GROUPS 配列 → footer 隣接 anchor のどちらに置くかを Phase 4 risk table で必ず明示。`data-role="public-return"` を contract として spec 側で `getByTestId` / `[data-role=public-return]` で参照する。
- 参照: [[workflow-admin-sidebar-public-return-link-artifact-inventory]]、[[lessons-learned-admin-shell-topbar-sidebar-integration-2026-05]]。

## L-ADMRET-002 AdminSidebarNavItem 拡張不採用の判断基準

- **Rule**: 単一 call site の特殊用途（`dataRole` 注入、footer 位置指定 等）のために shared primitive (`AdminSidebarNavItem`) に prop を追加しない。call site が 1 つしかないなら、専用の anchor を inline 実装する。
- **Why**: shared primitive への optional prop 追加は他 nav item の test surface（spec snapshot, axe scan, isActive 計算）を巻き込み、scope が膨張する。今回も `dataRole?: string` を増やす案は機械的には可能だったが、artifact inventory が増え regression spec も全 nav item を再走査する必要が生じる。
- **How to apply**: Phase 12 `unassigned-task-detection.md` で「shared primitive 拡張」候補が出たら、call site 数 ≥ 2 を必達条件として明示。1 件なら "Rejected. One dedicated anchor is simpler" と決め打ちで rejected の根拠にする。
- 参照: skill-feedback-report.md 「Workflow Improvement」節と整合。

## L-ADMRET-003 「直前 (immediately before)」の DOM 順序 assertion

- **Rule**: 「`<footer>` の直前」のような relative-order 要件は、`getByRole(...).first()` + `nextElementSibling` の 1-hop 比較で assertion する。`toBeVisible()` や `getAllByRole(...)` の存在チェックは "immediately before" の意味を満たさない。
- **Why**: 「順序の存在」と「直前 hop」は別の不変条件。後者が崩れても前者は通るため、Phase 6 で broad assertion を採用すると後続の primitive 再配置 PR が無自覚に regression を入れる。
- **How to apply**: Vitest spec で `const link = screen.getByRole('link', { name: '公開サイトに戻る' }); expect(link.nextElementSibling?.tagName.toLowerCase()).toBe('footer');` の形を採る。Playwright 側は `await expect(page.locator('[data-role=public-return] + footer')).toHaveCount(1)`（CSS adjacent combinator）で 1-hop を contract 化する。
- 参照: Phase 12 skill-feedback-report 「Documentation Improvement」。

## L-ADMRET-004 implementation_files 明示時の workflow_state 早期昇格

- **Rule**: 仕様書 Phase 5 で `implementation_files` が列挙されているタスクは、同サイクル内で実コード変更が確定した瞬間に `spec_created` → `implemented_local_evidence_captured` へ昇格を Phase 12 closeout 前に完了する。`spec_created` のまま compliance-check を流すと strict7 が pass しても workflow_state 矛盾で gate-metadata fail。
- **Why**: artifacts.json の `workflow_state` と Phase 12 main.md の状態語彙は zod enum で照合される。code 着地後も `spec_created` を残すと、後続 Phase 13 PR で `verify:phase12-compliance` が「implementation evidence あり / state は spec_created」の dual-state を検出して reject する。
- **How to apply**: skill-feedback-report の「Template Improvement」節に "implementation_files が空でない場合の state 自動昇格" を必達 AC として追加。Phase 12 main.md 冒頭 1 行目で `workflow_state:` 行を機械可読 metadata として固定する。

## L-ADMRET-005 local Playwright visual fixture による screenshot 取得経路

- **Rule**: admin 単一 component の screenshot evidence を `Phase 11 present` 化するには、staging 環境を待たず **local Playwright visual fixture spec** で取得する。fixture は実 `AdminSidebar.tsx` を import して mount し、`data-role="public-return"` の overview / hover / focus 3 枚を `outputs/phase-11/screenshots/` に保存する。
- **Why**: staging deploy は user-gated（commit/push/PR 後）であり、Phase 11 evidence を staging に依存させると workflow_state が `implemented_local_runtime_pending` で滞留する。local fixture で取得すれば `implemented_local_evidence_captured` まで自走できる。
- **How to apply**: `apps/web/playwright/tests/<workflow-slug>.spec.ts` を新設し `test.use({ viewport })` + `page.setContent(<AdminSidebar />)` 相当の fixture mount で 3 state（overview/hover/focus）を取得。`outputs/phase-11/visual-capture-metadata.json` にビューポート/取得時刻/spec path を残す。raw `test-results/` 配下は frozen 扱いで Phase 12 inventory に含めない。
- 参照: [[workflow-admin-sidebar-public-return-link-artifact-inventory]] Phase 11 evidence 列。

## Anti-pattern

- `AdminSidebarNavItem` に `dataRole?: string` を追加して全 nav item の test surface を拡張する（call site 1 件のために shared primitive を汚す）
- 「`<footer>` より前にある」を `toBeVisible()` だけで満たしたとみなす（直前 hop 検証なし）
- screenshot 取得を staging deploy まで待つ（local fixture で取得可能なら同サイクル内に完結させる）
- `workflow_state: spec_created` のまま code 変更を commit する（artifacts.json と Phase 5 evidence の dual-state 矛盾を残す）
