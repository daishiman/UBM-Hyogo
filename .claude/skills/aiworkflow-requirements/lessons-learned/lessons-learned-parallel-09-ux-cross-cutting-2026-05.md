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

## L-P09-006: archived parent canonical へ後発 recovery が evidence を流し込む場合は path default を completed-tasks 側に向け、env override で recovery root にも書込可能にする (Issue #746)

Issue #746 recovery で parent workflow が既に `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/` へ lifecycle path move された後、Playwright spec が旧 active root (`docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`) を hardcode して capture failure を起こした。`apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` の evidence 出力先を `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` を default、`PARALLEL09_EVIDENCE_DIR` env で recovery root (`docs/30-workflows/issue-746-...`) も書込可能にする 2-target 方式へ補正。archived 後 workflow に後発 evidence を流す場合は **parent canonical を default / recovery root を override** の 1 方向に固定する（逆を許すと canonical が後発 wave から見えなくなる）。`artifacts.json` / `outputs/artifacts.json` の `canonicalRoot=completed-tasks/...` + `archivedFrom=旧 active root` を二重保持し、両ファイルがバイト一致することを Phase 12 strict check で必須化。

## L-P09-007: Playwright config の webServer を recovery workflow では auto-spawn 固定にする (Issue #746)

最初の recovery 試行は外部に `pnpm dev` を起動した状態で `playwright test` を回した結果、recovery 中に dev server が落ちて再現性が失われた。`apps/web/playwright.parallel09.config.ts` で `webServer` を auto-spawn 既定、`PLAYWRIGHT_BASE_URL` 指定時のみ外部 server 経由、と分岐させ、recovery workflow では env 未指定で必ず auto-spawn を踏ませる。HTML report は recovery 中の disk 圧迫を避けるため `--reporter=line` を default 化し、Phase 7 evidence collection も line reporter のログを保存する。

## L-P09-008: ENOSPC は backlog ではなく runtime precondition だが、解消手順は phase-11 guide に常設する (Issue #746)

local Playwright が `ENOSPC: no space left on device` を返した件は L-P09-002 で「product backlog 化しない環境 precondition」と分類済み。一方、解消手順 (`~/Library/Caches/ms-playwright/` クリア / `playwright/__snapshots__/*.png` 旧版整理 / `--reporter=line` で HTML report 抑止 / `du -sh` で root 占有確認 → 解放) を毎回 ad hoc に追跡すると recovery time が伸びるため、`task-specification-creator` の `references/phase-11-screenshot-guide.md` に ENOSPC リカバリ節を常設し、Phase 11 で visual evidence を取る全 task が同 guide を citation できる構造にする。`__visual__` 私的 route 404 件と合わせ、Phase 11 着手前の precondition check リストとしてまとめる。
