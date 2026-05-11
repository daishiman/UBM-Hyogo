# Lessons Learned — task-10 UI Primitives Spec（2026-05-09）

> task: `task-10-ui-primitives-spec`
> 関連 spec: `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/phase-{01..13}.md`、`docs/00-getting-started-manual/specs/09-ui-ux.md`、`docs/00-getting-started-manual/claude-design-prototype/`
> 関連 source: `apps/web/src/components/ui/{Avatar,Badge,Banner,Button,Card,EmptyState,Field,Input,Select,Sidebar,Stat}.tsx`、`apps/web/src/lib/cn.ts`、`apps/web/src/components/ui/__tests__/{primitives,task10-contract}.test.tsx`
> 関連 reference: `references/ui-ux-components.md`（task-10 integration contract セクション）/ `references/task-workflow-active.md`（task-10 行）

## 教訓一覧

### L-T10-001: OpenNext esbuild host/binary version mismatch は `build:cloudflare` を block する。`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` への昇格は禁止

- **背景**: Phase-11 で local `next build` / typecheck / lint / focused test / coverage がすべて PASS したが、`pnpm --filter web build:cloudflare` が `OpenNext` 経由 esbuild の host `0.25.4` と nested binary `0.21.5` の mismatch で fail。`pnpm rebuild esbuild` でも未解消。
- **教訓**: UI primitive 実装が完了し local gate が green でも、Cloudflare Workers ランタイムへの bundle が通らない限り runtime visual evidence は取得不能。close-out 判定は `IMPLEMENTED_LOCAL_BUILD_CLOUDFLARE_BLOCKED_RUNTIME_PENDING`（kebab 表記: `implemented-local-build-blocked / implementation / VISUAL_ON_EXECUTION / existing-ui-integration`）で固定し、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を流用してはならない。
- **将来アクション**: Phase-2 設計時に「local build gate」と「Cloudflare bundle gate」を独立 AC として分離し、esbuild host/binary version pin を pre-flight に入れる。OpenNext 依存版は `apps/web/package.json` で host esbuild を `^0.21.5` に固定するか、OpenNext 側を host 互換版に上げる方針を Phase-3 alternatives で必ず比較する。

### L-T10-002: 既存 Wave 0 baseline と新規 contract の二重正本化は C/M/R 表 + barrel owner 表で抑制する

- **背景**: 既存 15 primitive baseline（Avatar/Button/Field/Input/Select 等）と task-10 で新規追加する 11 primitive contract（Card/Badge/Sidebar/Stat/EmptyState/Banner + 既存 5 拡張）が同居し、何が「拡張」「新規」「維持」かが Phase-2 設計直後に曖昧になった。下流 task-11..17 の barrel import 期待が分岐するリスク。
- **教訓**: UI primitive 系 task は Phase-2 で **C/M/R 表（Created / Modified / Retained）** を必須 artifact として書く。さらに `apps/web/src/components/ui/index.ts` の **barrel export owner 表**（誰が public API として保証するか）を Phase-2 で固定し、`references/ui-ux-components.md` の integration contract セクションに `task-10=11 primitive / Wave 0=15 primitive / prototype=21 primitive` の語彙分離で常時参照可能にする。
- **将来アクション**: `task-specification-creator` の UI primitive template に C/M/R 表 + barrel owner 表 stub を組み込み、Phase-2 deliverable に必須化する。

### L-T10-003: `VISUAL_ON_EXECUTION` UI task は local PASS と runtime screenshot/axe PASS を分離して主張する

- **背景**: phase-12 compliance check で「漏れなし: BLOCKED（runtime screenshot / axe 未取得）」と「依存関係整合: BLOCKED（Cloudflare build gate 未解放）」が同時に立った。local gate と runtime gate の境界が曖昧だと 4 条件判定が機械的に難化。
- **教訓**: `VISUAL_ON_EXECUTION` 属性を持つ UI task は、phase-12 main.md の AC に **「local gate 条件」と「runtime gate 条件（screenshot/axe）」を別箇条書き**で並べ、close-out 判定 enum も `IMPLEMENTED_LOCAL` / `IMPLEMENTED_LOCAL_BUILD_BLOCKED` / `RUNTIME_PASS` の 3 段で運用する。「漏れなし」は local gate のみで PASS 判定可、runtime gate は別 wave の追跡 task として明記する。
- **将来アクション**: `task-specification-creator` の close-out 語彙テーブルに `IMPLEMENTED_LOCAL_BUILD_CLOUDFLARE_BLOCKED_RUNTIME_PENDING` を正式に追加し、Phase-12 4 条件判定 rubric に「VISUAL_ON_EXECUTION の場合 runtime gate を独立条件に分離」ルールを書く。

### L-T10-004: `lint.log` capture は `eslint` コマンドラインを実出力に含める

- **背景**: Phase-11 evidence の `lint.log` 先頭が `tsc -p tsconfig.json --noEmit` の typecheck 表示になっており、log header の信頼性が下がった（実体は lint も完走 PASS）。
- **教訓**: evidence log は `printf '$ pnpm --filter web lint\n'` 等で **実行コマンドを必ず先頭に明示**してから出力を append する。流用テンプレで header だけ前 task のものが残ると compliance check の追検証コストが増す。
- **将来アクション**: Phase-11 evidence template の log capture スニペット（`scripts/evidence/*.sh` 想定）にコマンド明示の先頭行を埋め込み、再利用しても header が乖離しない形にする。

## 適用範囲

- 本 lessons は UI primitive 系 task（Wave 0 拡張・整理含む）と `VISUAL_ON_EXECUTION` UI task に共通で適用する。
- L-T10-001 は OpenNext / Cloudflare Workers bundle を伴う全 task に適用（API 単独 task は対象外）。
- L-T10-004 は phase-11 evidence capture 全般に適用。

## 追跡 / 未解放事項

- Cloudflare build blocker（OpenNext esbuild host/binary mismatch）は task-10 範囲外の environment 課題として未タスク化せず、別 wave で扱う（phase-12 `unassigned-task-detection.md` の判定に従う）。
- runtime screenshot / axe 取得は build:cloudflare 解消後に再実行し、`outputs/phase-11/evidence/` に追補する。
