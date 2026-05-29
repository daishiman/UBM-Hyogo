# Lessons Learned — admin-requests-prototype-alignment-and-404-fix (2026-05-27)

`/admin/requests` の UI prototype 整合 + staging `ADMIN_FETCH_404` 根本修正サイクルから得た再利用可能な知見。

## L-ADMREQ-001: contract spec は createXxxRoute() を直接呼ぶため、worker entry mount drift を検出できない

- 症状: `apps/api/src/routes/admin/requests.contract.spec.ts` は `createAdminRequestsRoute()` を直接 instantiate してテストしているため、`apps/api/src/index.ts` の `app.route("/admin", adminRequestsRoute)` mount が落ちても全 PASS する。staging で `ADMIN_FETCH_404` が runtime 発火して初めて検出する構図。
- 対策: route 個別 contract spec とは別に `*.mount.spec.ts` を追加し、`import worker from "../../index"` → `worker.fetch(req, env, ctx)` 経由で dispatch を検証する。auth 段で 401 まで進めば mount は生きている。404 が返れば mount 落ち。
- 適用条件: 全 admin 系 worker route（mount drift が 4xx UI fallback で隠蔽されやすい層）。

## L-ADMREQ-002: Phase 11 evidence status enum は `present|pending|n/a` のみ。`pending_user_approval` は invalid

- 症状: `outputs/phase-12/phase12-task-spec-compliance-check.md` の Phase 11 evidence 表に `pending_user_approval` を記載すると `verify:phase12-compliance` が `invalid status=pending_user_approval` で fail。
- 原因: `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` の `VALID_STATUSES = new Set(["present", "pending", "n/a"])`。
- 対策: staging baseline 等の user-gated 未採取証跡は `pending`（zod enum 適合）と記載する。承認ニュアンスは Section 7 (Runtime or user-gated boundary) の散文に書く。
- 適用条件: Phase 11 で local 撮影済 + staging 撮影 user-gated の two-tier evidence パターン全般。

## L-ADMREQ-003: route page が primary h1 を所有・panel は hidden h2 (filter aria-labelledby) で分担する

- 症状: `RequestQueuePanel` 内に visible h1 を持つと page.tsx の `page-head h1` と重複し semantic gate (`h1 count === 1`) が fail。
- 対策: page.tsx は `page-enter / page-head / h1 "依頼キュー"` を所有し、panel は `<h2 id="admin-requests-filter-h" className="sr-only">` を持ち `section[aria-labelledby="admin-requests-filter-h"]` で referent を満たす。
- 適用条件: admin shell 配下の全ページ（topbar/sidebar 統合済の admin 9 route）。

## L-ADMREQ-004: Playwright local screenshot evidence は `ADMIN_REQUESTS_EVIDENCE=1` + `PLAYWRIGHT_EVIDENCE_DIR` で env-gated 起動する

- 症状: 通常の playwright 実行で screenshot を必ず採取すると CI smoke/visual matrix で重複生成・flaky 化。
- 対策: spec 側で `test.skip(!process.env.ADMIN_REQUESTS_EVIDENCE, ...)` し、撮影先は `PLAYWRIGHT_EVIDENCE_DIR` を baseline として相対展開（workflow `outputs/phase-11/screenshots/` へ直接出力）。CI matrix は default off で smoke 走り、evidence capture は手動 1 回。
- 適用条件: Phase 11 local authenticated screenshot を `outputs/phase-11/screenshots/` に格納する全 admin workflow。

## L-ADMREQ-005: dual-task (UI 整合 + API 404 fix) を 1 サイクルで同期する場合、artifacts.json root/outputs mirror を byte-identical に保つ

- 症状: Task A (API) と Task B (UI) を 1 cycle で実装する際、`local_evidence_files` / `planned_visual_evidence_files` を片方の artifacts.json にだけ追記すると `cmp artifacts.json outputs/artifacts.json` が drift し gate-metadata が fail。
- 対策: root `artifacts.json` の変更後は必ず `cp` で outputs mirror を上書きする。検証は `cmp <root>/artifacts.json <root>/outputs/artifacts.json` を Phase 12 compliance check に明示記録する。
- 適用条件: 2 task 以上を 1 ワークフローでまとめる全 dual-track 実装。
