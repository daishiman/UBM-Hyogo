# Lessons Learned: task-15 admin dashboard and members (2026-05)

> Workflow: `docs/30-workflows/task-15-admin-dashboard-and-members/`
> Date: 2026-05-10
> State: `IMPLEMENTED_LOCAL_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / runtime_pending`

## L-TASK15-001: shared schema 不変条件は web 側 mapper で吸収する

`AdminDashboardView` shared schema には `byZone` / `byStatus` が無いが、`/admin/dashboard` UI は zone / status 分布を出したい。FB-W0-01（shared 不変）を守るため、`apps/web/src/lib/admin/admin-dashboard-ui.ts` に `toAdminDashboardUi()` mapper を導入し、API レスポンスを loose parse して optional に吸収した。shared schema 変更や新 endpoint 追加には踏み込まない。

- **Why:** shared zod を mutate すると `apps/api` の contract / shared / packages の test が一気に波及する。VISUAL タスクで API surface を動かすと task-15 の境界が崩れる。
- **How to apply:** UI 側で必要な投影は `apps/web/src/lib/<feature>/<feature>-ui.ts` に mapper として閉じ込める。shared schema を変える前に必ず web mapper で吸収できないか先に検討する。

## L-TASK15-002: VISUAL evidence は local mock API / fixture server を経由する

`/admin` / `/admin/members` は Server Component で `await fetch()` するため、Playwright `page.route()` ではブラウザ経路だけ intercept されサーバ fetch には効かない。task-15 では local Playwright fixture（`playwright/tests/task15-admin-screenshots.spec.ts`）で fixture server / mock API を立て、`unresolvedSchema = 5` を含む 9 PNG を取得した。

- **Why:** Server Component fetch はブラウザ層で intercept できない。staging 待ちでは Phase 11 が永遠に閉じない。
- **How to apply:** RSC + fetch を含む VISUAL タスクの Phase 11 では「browser route mock」を選択肢から外す。`webServer` で fixture API を立てる、または既存の API mock を Workers binding 越しに差し込む方式を Phase 9 設計時から決めておく。

## L-TASK15-003: `it.todo` a11y placeholder は同 cycle で解消する

task-15 component 5 file の a11y check を当初 `it.todo` で残したが、Phase 6 close-out で「runtime blocker でない `todo` は許容しない」運用に揃えるため、`jest-axe` を導入し 5 件すべて実テスト化（528 pass / 1 skip）。

- **Why:** `it.todo` は実装漏れを runtime blocker と区別なく永続化させる。VISUAL implementation 系では a11y は AC 直結のため Phase 6 の合格条件に直接組み込むべき。
- **How to apply:** a11y 検証を Phase 6 close-out 時点で `jest-axe` 等の実テストに変換する。`it.todo` を残す場合は明確な runtime blocker（例：staging-only fixture 不在）に紐付け、Phase 12 limitation に明示する。

## L-TASK15-004: Phase 12 strict 7 は物理ファイルとして生成する

Phase 12 strict 7 docs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を `main.md` 内のセクション集約で済ませると、artifact inventory / output parity の検証で参照先 file が存在せず PASS にできない。task-15 では 7 個を物理ファイル分離して保存した。

- **Why:** root/output artifacts parity は JSON 等価性だけでなく referenced file の物理存在まで確認する。集約形式は inventory 検証で fail する。
- **How to apply:** Phase 12 close-out ではテンプレ違反として「main.md にセクション集約」を禁止し、`phase-12/` 配下に 7 物理ファイルを作る。`compliance-check.md` で file 存在を一次証拠にする。

## L-TASK15-005: 非同期 UI race は cancelled flag と try/finally で構造的に消す

`MembersTable` の Drawer は行クリック → fetch → set state の間に行が変わると stale 反映が起きる。`useEffect` 内 cancelled flag で破棄判定し、`BulkActionBar` の bulk action は `try/finally` で busy state を必ずリセットしている（throw 時の押下不能事故を防ぐ）。

- **Why:** Server fetch + Client island の race は表面上見えにくい。staging で初めて顕在化すると影響範囲が大きい。
- **How to apply:** Server-fetch を含む drawer / dialog client island では cancelled flag を invariant にし、bulk action は `try/finally` で busy リセット、submit ボタンは `aria-busy` で UI 状態を一致させる。
