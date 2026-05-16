# Lessons Learned: parallel-09 UX cross-cutting primitives (2026-05)

## L-P09-001: `apps/` dirty diff があるサイクルは `spec_created` を残してはならない

本 wave は当初 `spec_created` で artifacts.json を記録していたが、`git status` に `apps/web/src/components/ui/{FormField,Pagination,Icon,Breadcrumb}.tsx` 等の実装ファイルが存在していた。task-specification-creator skill の既存ルール「workflows with `apps/` / `packages/` dirty diffs must not remain `spec_created`」を強制し、同一 wave 内で `implemented_local_runtime_pending` に reclassify した。Phase 12 の `phase12-task-spec-compliance-check.md` で必ず changed-files classification を作成し、root/output `artifacts.json` の `workflow_state` / `implementation_status` / `visualEvidence` を一致させる。

## L-P09-002: VISUAL_ON_EXECUTION は local 環境 precondition で runtime_pending 化できる

local Playwright 実行が `ENOSPC: no space left on device` で繰り返し失敗した。本件は product backlog task ではなく環境 precondition と分類し、`unassigned-task-detection.md` には起票せず、`outputs/phase-11/main.md` と `documentation-changelog.md` に「`runtime_pending` because of local `ENOSPC`」を明示するだけに留める。disk 解放後の rerun 手順は phase-11 main に記録する。

## L-P09-003: focused Vitest の起動失敗は esbuild host/binary mismatch を疑う

`pnpm --filter @ubm-hyogo/web test ...` が test 実行前に exit 1 で停止した。原因は esbuild `0.27.3` (host) vs `0.25.4` (binary) の不一致。task-10 follow-up 001 の `pnpm.overrides.esbuild` 解決 (L-T10FU001-001) は wrangler 4.85.0 移行で `0.27.3` 側に SSOT が移っており、Vitest 側の bundler が古い binary を引きずる構造になる。同様の事象は host/binary 双方を `pnpm why esbuild` で先に揃え、test 結果より先に dependency graph を evidence 化する。

## L-P09-004: `__visual__` private route は App Router で 404 化する

Playwright visual fixture を `apps/web/app/__visual__/[name]` に置いた最初の試行で 404 が発生した。Next.js App Router の private folder convention は `_xxx`（先頭 1 アンダースコア）のみ。`__xxx__` は private 解釈されず、本来 build 出力に含まれるべき route も dev server に登録されなかった。fixture は `apps/web/app/visual-harness/[name]/` のように通常の公開セグメント名で配置し、`robots.txt` / 認可で公開抑止する。

## L-P09-005: shared primitive 提供 wave と consumer adoption wave を分離する

本 wave は 19 routes 横断 primitive (`FormField` / `EmptyState` / `Pagination` / `Icon` / `Breadcrumb` / `useAdminMutation`) を `apps/web/src` 配下に置くまでが scope。各 route 画面への primitive 適用は parallel-01〜08 の責務として残し、本 workflow の `artifacts.json` には `implementation_status=implementation_complete_visual_pending` のみを記録する。consumer adoption を本 wave に紛れ込ませると review 範囲が膨張するため、Phase 1 の scope 表で明示的に「downstream adoption は out of scope」と固定する。
