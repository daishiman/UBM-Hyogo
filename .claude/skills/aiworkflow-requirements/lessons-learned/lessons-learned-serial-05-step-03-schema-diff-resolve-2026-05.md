# Lessons Learned: serial-05-step-03 schema-diff-resolve UI

対象 workflow: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/`
状態: `implemented-local-runtime-pending / implementation / VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
作成日: 2026-05-16

## L-S5S3-001: client-side stableKey 正規表現は API 側と literal 同期する

`POST /admin/schema/aliases` は stableKey に `/^[a-zA-Z][a-zA-Z0-9_]*$/` を強制する一方、`SchemaDiffPanel` の client 側 validation がこれと乖離していると、ユーザは 422 サーバ往復で初めて入力ミスを知る。`SchemaDiffPanel.tsx` 内に同一 regex を **literal で重複**させ、grep gate で `/^[a-zA-Z][a-zA-Z0-9_]*$/` を 2 件 hit させる運用にする。共通化（utils 抽出）は将来の D1 schema 拡張時に regex 自体が動的化するリスクを生むため、step-03 wave では明示的に避けた。Input には `pattern` 属性・`aria-invalid` / `aria-describedby` を必ず併設し、不正値で `postSchemaAlias()` を呼ばない gate を component spec で固定する（UI-06）。

## L-S5S3-002: 202 retryable / 409 conflict / 422 collision の feedback-kind は data 属性で固定する

3 種類の非 200 success / error はすべて UI 上 inline feedback として表示するが、`data-feedback-kind` の値を `success` / `retryable` / `conflict_error` / `validation_error` / `error` の **5 値に固定**し、Playwright / RTL から `screen.getByTestId` ではなく `data-feedback-kind` セレクタで観測する。message 文言は日本語化（"続きが必要です" / "別の項目に使われています" / "stableKey が衝突しています"）するが、自動テストは文言ではなく kind を assert することで i18n 化を行う際の test 影響を最小化する。422 payload の `existingQuestionIds[]` は inline で先頭 3 件のみ表示（残数は `+N` 表記）。

## L-S5S3-003: existing-UI hardening で API 仕様は不変条件として固める

step-03 は新規 endpoint を生やさず `SchemaDiffPanel` の hardening のみで完結する wave。`apps/api/src/routes/admin/schema.ts` の `GET /admin/schema/diff` / `POST /admin/schema/aliases` 形状を変更しない不変条件を Phase 11 evidence の `grep-gate.log` で確認し、`docs/00-getting-started-manual/specs/01-api-schema.md` / `11-admin-management.md` への記述は API contract の **既存仕様の明文化**に留める。新 env gate（`ADMIN_SCHEMA_RESOLVE_ENABLED` 等）は導入しないことを skill-feedback-report と implementation-guide §2.4 に明記し、次 wave 以降が誤って gate を生やさないようにする。

## L-S5S3-004: runtime screenshots は staging deploy 待ちで `runtime_pending` と明示する

`SchemaDiffPanel` は Cloudflare Workers + Auth.js + D1 binding が前提のため、ローカル単発実行では Playwright で `/admin/schema` の意味のあるスクリーンショットを取れない。`outputs/phase-11/manifest.json` の `screenshots.status="runtime_pending"` を明示し、`evidence/typecheck.log` / `lint.log` / `test.log` / `build.log` / `grep-gate.log` の 5 点セットで Phase 11 を成立させる。staging deploy 後の Playwright smoke `PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 mise exec -- pnpm e2e:smoke -- admin-schema-diff-resolve` で screenshots を後追い回収する運用を skill index に固定する。

## L-S5S3-005: skill-feedback-report の no-op 章は ledger 同期と pattern 候補のメモを必須化する

step-02 lessons (L-S5S2-004) で指摘した「薄い skill-feedback-report」を踏襲し、本 step では (a) `task-workflow-active.md` / `resource-map.md` / `quick-reference.md` / `SKILL.md` changelog の同期完了、(b) 再利用 pattern 候補（client-side regex literal sync・data-feedback-kind 固定）の **memo line を必ず残す** ことを no-op 章にも記載する。skill-feedback-report が「no-op のみ」で終わると次 wave に pattern が継承されないため、本ファイル L-S5S3-001/002 を pattern entry として残す。

## 関連参照

- workflow root: `docs/30-workflows/serial-05-step-03-schema-diff-resolve/`
- parent workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/`
- 前段 step: [lessons-learned-serial-05-step-02-identity-conflicts-merge-2026-05.md](lessons-learned-serial-05-step-02-identity-conflicts-merge-2026-05.md)
- skill index 同期: `indexes/resource-map.md`, `indexes/quick-reference.md`, `references/task-workflow-active.md`, `references/workflow-serial-05-step-03-schema-diff-resolve-artifact-inventory.md`
- changelog: `changelog/20260516-serial-05-step-03-schema-diff-resolve.md`
