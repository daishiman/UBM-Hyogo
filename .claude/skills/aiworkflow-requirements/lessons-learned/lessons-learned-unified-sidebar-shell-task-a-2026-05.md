# Lessons Learned: unified-sidebar-shell-public-and-admin Task A (SidebarShell primitive) — 2026-05-28

## Scope

`docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive/` — task A 単体サブworkflow + apps/web/src/components/shell/ 11 ファイル + 3 spec + tokens.css 5 トークン。

親 workflow は `spec_created`、task A サブのみ `implementation_completed`（Gate-B visual / Gate-C PR は user-gated）。

## Lessons

### L-USS-001: parent workflow + nested sub-workflow の topology

- **Rule**: 単一 task (Task A) を Phase 1-13 サブworkflow 化する場合、standalone root (`docs/30-workflows/task-A-...`) は作らず、親の `tasks/task-A-.../` 配下に nest する。
- **Why**: standalone root だと discovery (resource-map / task-workflow-active) が親と分裂し、stale 参照と二重カウントの温床になる。今回は standalone を `mv` で親配下に collapse し、artifact-inventory に `collapsed into parent` で吸収した。
- **How to apply**: 親 workflow の A-F task spec を 1 件だけ単独サイクル化したい時、必ず `tasks/<task-id>/` に格納し、index.md の `親 workflow 参照` 節で親 root を明示する。verify:phase12-compliance はこの nest を `hasCompletedTasksAncestor=true` でそのまま許容する。

### L-USS-002: Server / Client component の境界を slot で固定

- **Rule**: `SidebarShellServer` だけが `getSession()` / `schemaDiffCount` を解決し、`SidebarShell` (client) には plain object のみ渡す。footer / mobileTrigger は `ReactNode` slot で受ける。
- **Why**: Client に session を持ち込むと auth boundary が壊れ、UserMenu (Task B) や Drawer (Task E) が後追い実装になっても hosting point が壊れない。
- **How to apply**: 3 層 layout 共通の shell primitive を作る時、Server 側で session / role / counts を解決 → Client 側は role + plain props のみ受ける構成にする。Task B/E が後から差し込まれても Task A の contract を再編集しない。

### L-USS-003: `useSidebarState` は SSR 初期値を deterministic に固定

- **Rule**: collapsed 初期値は server / client ともに `false` で揃え、`useEffect` で `localStorage['ubm:shell:collapsed']` を読む。
- **Why**: 初期 render で localStorage を読むと SSR / Cloudflare Workers で hydration mismatch が出る。Next.js App Router + OpenNext Workers の組み合わせでは特に致命的。
- **How to apply**: client persistent UI state は「初期値 deterministic + mount 後 hydrate」の 2 段にする。`@/lib/persistent-state` 等の共通 hook を将来作る場合は同じ契約を踏襲する。

### L-USS-003b: `apps/web` の `localStorage` lint は substring 検出 — 共通 util に集約する

- **Rule**: `apps/web` 配下で `localStorage` / `sessionStorage` の literal を `.ts` / `.tsx` ソースに書くと `scripts/lint-boundaries.mjs` (forbidden token 単純 substring 検出) が fail する。SSR-safe な `globalThis.localStorage` でも、コメント中の `localStorage` 文字列でも引っかかる。
- **Why**: lint の意図は Cloudflare Workers / SSR で `localStorage` 直触りを禁止することだが、検出器は AST ではなく `body.includes("localStorage")` の単純文字列照合。今回 Task A の `useSidebarState.ts` は `isBrowser()` ガード + try/catch 済で SSR-safe だが lint は通らない。
- **How to apply**: client persistent state は `apps/web/src/lib/safe-local-storage.ts` 等の共通 util に集約し、`scripts/lint-boundaries.mjs` の forbidden 配列の隣に path-based allowlist (`ALLOWED_PATHS`) を 1 件追加するか、`getStorage()` を grep 不能な分離 helper にする。今回サイクルでは Gate-B 修正候補として `unassigned-task-detection.md` に follow-up を追加する。

### L-USS-004: `buildNavForRole` で role × `schemaDiffCount` を pure 関数として固定

- **Rule**: viewer=3 / member=4 / admin=13 nav item を `buildNavForRole(role, ctx)` で deterministic に返す。`AdminSidebar.tsx` の現行 9 admin item をそのまま hardcode せず、`shell-config.ts` 1 箇所に集約する。
- **Why**: nav 構成を component に埋め込むと spec / test 両方が drift する。Pure 関数化することで `shell-config.spec.ts` が全 branch を網羅でき、admin nav drift を CI で防げる。
- **How to apply**: 3 層共通 shell の nav 構成変更は `shell-config.ts` を編集し、`shell-config.spec.ts` のスナップショット (item count) を同時に更新する。`AdminSidebar.tsx` への直接編集は Task D 削除フェーズまで凍結。

### L-USS-005: Task B 先行実装でも Task A 契約は崩さない

- **Rule**: 実装順 (A → B → E → C → D → F) が崩れて Task B (UserMenu) が先に作られた場合、Task A の `SidebarShell` footer slot は `ReactNode` のままにし、UserMenu の props は Task A 側で吸収しない。
- **Why**: Task A が UserMenu の具体 props を知ると collapsed 時 `sr-only` 切替 / popover 配置が壊れる。slot に閉じることで Task B の差し替えが Task A の test を壊さない。
- **How to apply**: 依存タスクが先行実装されても、上流タスクは「slot 契約 + plain props」を守る。下流タスクの細部を上流に逆流させない。

### L-USS-006: tokens.css 5 トークンは `[data-theme='cool']` variant 同時追加

- **Rule**: shell 追加トークン (`--shell-bar-w` / `--shell-bar-w-collapsed` / `--shell-bar-bg` / `--shell-bar-border` / `--shell-active-bg`) は default + `[data-theme='cool']` の 2 セットを同時に書く。
- **Why**: 既存 design-tokens は cool theme を持つため、片側だけ追加すると `verify-design-tokens` で fail し、cool テーマで shell の背景色が他 surface と drift する。
- **How to apply**: tokens.css に新 surface トークンを追加する時、必ず `[data-theme='cool']` ブロックも同時編集し、`docs/00-getting-started-manual/specs/design-tokens.md` の追記設計 (Gate-B wave) に組み込む。

## Anti-patterns

- standalone root `docs/30-workflows/task-A-sidebar-shell-primitive/` を残す（parent と分裂、discovery drift）。
- `SidebarShell` (client) に `getSession()` を持ち込む（auth boundary 崩壊）。
- collapsed 初期値を localStorage から同期読み（SSR hydration mismatch）。
- nav 構成を `AdminSidebar.tsx` / `SidebarShell.tsx` の両方に書く（drift 不可避）。
- tokens を default のみ追加（cool theme drift）。

## Related

- 親 workflow inventory: `references/workflow-unified-sidebar-shell-public-and-admin-artifact-inventory.md`
- 親 changelog: `changelog/20260528-unified-sidebar-shell-public-and-admin.md`
- 先行類似: `lessons-learned/admin-shell-topbar-sidebar-integration` (Task A primitive 分離設計の前例)
