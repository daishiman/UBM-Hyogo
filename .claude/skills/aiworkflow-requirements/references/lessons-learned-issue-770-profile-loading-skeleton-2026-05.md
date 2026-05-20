# Lessons Learned: Issue #770 Profile Loading Skeleton

## L-770-001: Skeleton block count は実コンポーネントの DOM 構造に一致させる

`apps/web/app/profile/loading.tsx` の skeleton は avatar (1) + heading (1) + KV rows (4) = 6 ブロック構成にした。`apps/web/app/profile/page.tsx` の実 DOM と block 数・縦リズム・rounded shape を一致させることで、loading → resolved 遷移時の CLS (Cumulative Layout Shift) を最小化する。

**結論**: skeleton は装飾ではなく実 DOM のシルエットを写す。block 数・height・gap は実コンポーネントから採寸する。

**再発防止**: `docs/00-getting-started-manual/specs/` の loading boundary spec、および後続の loading.tsx 実装は同方針に従う。task-25 followup の loading state observation fixture (`lessons-learned-task-25-followup-*`) と組み合わせて regression を検知する。

## L-770-002: OKLch トークン正本化下で skeleton 色は `bg-surface-2` を採用

`apps/web/src/styles/tokens.css` の OKLch トークン群が正本（task-08 / task-09 / task-18 verify-design-tokens gate）であるため、skeleton 背景は HEX や `bg-gray-200` ではなく `bg-surface-2` を採用。`motion-safe:animate-pulse` で `prefers-reduced-motion` を尊重する。

**結論**: 新規 UI で背景 / accent / border 色を選ぶときは、HEX 直書きや tailwind palette 直参照ではなく、`tokens.css` の semantic class (`bg-surface-1` / `bg-surface-2` / `text-fg-1` ...) を必ず採用する。

**再発防止**: Phase 11 で `grep-hex-profile-loading.txt` を「no-hit (exit 1)」として証跡化する pattern を踏襲する。`verify-design-tokens` CI gate が dev/main で fail させる。

## L-770-003: A11y はロール + 状態 + sr-only テキストの三点セットを必須化する

loading boundary では `role="status"` + `aria-busy="true"` + `aria-live="polite"` + sr-only テキスト（例: `マイページを読み込み中`）を同時に提供する。`role="status"` 単独では screen reader が状態変化を読み上げないケースがあり、sr-only テキストを補助として置く。`aria-live="polite"` は完了時の自動アナウンスを抑制し、UX 騒音を避ける。

**結論**: 同種 loading コンポーネントでは三点セット + 日本語 sr-only テキストを必須要件として再利用する。

**再発防止**: `apps/web/app/profile/loading.spec.tsx` の assertion 4 件（role / aria-busy / aria-live / sr-only text）を template として、後続 `app/**/loading.tsx` テストに移植する。

## L-770-004: Parent workflow 3 点同期は same-wave で実施する

i07 task の親 workflow `ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/` には `parallel-i07-profile-loading-skeleton/spec.md` / `index.md` / `artifacts.json` の 3 ファイルがあり、子の state を変更したら必ず 3 つ揃えて同一 wave で更新する。1 ファイルだけ更新すると `index.md` と `artifacts.json` 間で state drift が発生し、後続 task が古い state を参照する事故が起きる。

**結論**: parent workflow に `spec.md` / `index.md` / `artifacts.json` の 3 点セットがある場合、子の state 移行と同じ commit で 3 ファイル同時更新する。

**再発防止**: `task-specification-creator` Phase 12 の `system-spec-update-summary.md` テンプレに `parent workflow 3 点同期確認` 行を含める方針は既に確立済み。本 lessons を実例として参照。

## L-770-005: Source unassigned-task は consumed trace として保持する

`docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md` は削除せず、`status: consumed` と `canonical_workflow: docs/30-workflows/issue-770-profile-loading-skeleton/` の 2 行を追記して trace として保持する。これにより、後続が「i07 は誰が拾ったか」を unassigned-task 一覧から追跡できる。

**結論**: unassigned-task の物理削除は採用しない。consumed marker + canonical pointer の 2 段で論理削除する。

**再発防止**: `task-specification-creator` の `Phase 12 unassigned-task-detection` ルールで promoted 済。

## L-770-006: `implemented_local_runtime_pending` 中間ステータスの再利用

Issue #720 で導入された `implemented_local_runtime_pending / implementation / VISUAL` を本タスクでも適用した。local component screenshot (`outputs/phase-11/screenshots/profile-loading-local-component-desktop.png`) は scope 内、authenticated browser screenshot / staging runtime visual evidence は user-gated として境界を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で明示する。

**結論**: VISUAL 系タスクでも `implemented_local_runtime_pending` は再利用可能。`VISUAL` discriminator を付け、isolated component screenshot を scope 内、authenticated runtime screenshot を user-gated に分離する。

**再発防止**: `task-specification-creator` `v2026.05.09 IMPLEMENTED_LOCAL_RUNTIME_PENDING` 行に追記必要な点はなし。本 lessons は VISUAL 系の実例として参照される。

## L-770-007: aiworkflow-requirements の same-wave sync は 5 ファイル定型

issue 単位の sync は次の 5 ファイル同時更新が定型である:

1. `indexes/resource-map.md` — canonical set テーブルに 1 行追加
2. `indexes/quick-reference.md` — issue サマリ 1 ブロック追加
3. `references/task-workflow-active.md` — active ledger 行追加
4. `references/workflow-issue-{N}-{slug}-artifact-inventory.md` — 新規ファイル
5. `changelog/{YYYYMMDD}-issue{N}-{slug}.md` — 新規ファイル

`SKILL-changelog.md` / `LOGS/_legacy.md` は umbrella で追記。`indexes/topic-map.md` と `indexes/keywords.json` は `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` で再生成する（手書き禁止）。

**結論**: 5 ファイル定型 + topic-map/keywords 再生成 + SKILL-changelog/LOGS 追記、で 1 issue 分の sync が完了する。

**再発防止**: `task-specification-creator` Phase 12 `documentation-changelog.md` テンプレに 5 ファイルチェックリストを含める。`pnpm indexes:rebuild` を Phase 12 完了直前に必ず実行する（CI `verify-indexes-up-to-date` で fail を回避）。
