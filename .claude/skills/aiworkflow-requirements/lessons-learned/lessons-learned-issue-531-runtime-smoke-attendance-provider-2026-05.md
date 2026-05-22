---
name: Lessons Learned — Issue #531 attendanceProvider staging runtime smoke
description: read-only GET smoke の route 契約整合・POST 副作用回避・persistent evidence の summary-only 化に関する教訓集（runtime evidence は user credential 待ち）
type: project
---

# Lessons Learned — Issue #531 attendanceProvider staging runtime smoke（2026-05-07）

> task id: `issue-531-runtime-smoke-attendance-provider-migration`
> branch: `feat/issue-531-runtime-smoke-attendance-provider`
> wave: 2026-05-07 / spec_created / implementation / NON_VISUAL / runtime_evidence_pending_user_credentials
> canonical root: `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/`
> 親: `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/`（runtime_pending 維持）
> 関連 reference:
> - `references/task-workflow-active.md`（Issue #531 行）
> - `references/workflow-issue-531-runtime-smoke-attendance-provider-artifact-inventory.md`
> - `indexes/quick-reference.md`（attendanceProvider runtime smoke 早見）
> - `indexes/resource-map.md`（Issue #531 workflow 行）
> 関連 lessons-learned: `lessons-learned-issue-494-09a-A-exec-staging-smoke-runtime-2026-05.md`（runtime evidence boundary の前段教訓）

## サマリ

本 wave は Issue #371 の `c.var.attendanceProvider` middleware DI 移行を staging で runtime smoke する spec 整備サイクル。実 staging 実行は credential 提供後に行う前提で、**executable smoke tooling と summary-only evidence path のみ**を整備した。route 形状の誤推測・POST 副作用混入・raw body 永続の 3 リスクを spec phase で除去した。

## 教訓一覧

### L-ISSUE531-001: route response 契約は **実 source** から確定する（テンプレ推測禁止）

- **背景**: 初稿では全 attendance 系 endpoint を「`.attendance | type == "array"`」で統一していたが、実装上は `/admin/members` が `.members[]`、`/admin/members/:id/attendance` が `.records[]`、`/me/` が `.user.memberId` 文字列と route ごとに異なる。jq contract を均一化すると runtime smoke は false PASS / false FAIL を量産する。
- **教訓**: smoke jq contract は **`apps/api/src/routes/` の実 handler 戻り値**から逆算する。`outputs/phase-02/route-inventory.md` を route-by-route に分解し、Phase 11 evidence の `runtime-smoke.log` フォーマットも同じ contract に揃える。
- **適用条件**: Hono / API Gateway 系のすべての runtime smoke spec。
- **再利用方法**: Phase 02 の route inventory section に「per-route response contract」テーブルを必須化。skill 側 `phase12-skill-feedback-promotion.md` Applied Examples に Issue #531 行として参照する。

### L-ISSUE531-002: DI-bound evidence は **provider が呼ばれる route のみ**に限定する（inventory ≠ runtime evidence）

- **背景**: `attendanceProvider` の DI 解決は `/admin/members/:memberId` と `/me/profile` のみで実体的にバインドされ、その他 attendance 系は route-local provider path をたどる。「inventory にあるから DI evidence になる」と扱うと、provider の挙動と関係ない経路で runtime PASS を主張してしまう。
- **教訓**: route inventory（観測対象一覧）と DI-bound evidence（middleware 実体検証）を Phase 02 で **2 軸テーブル**に分離する。NON_VISUAL runtime smoke template（automation-30 / aiworkflow-requirements）に同分離を引き上げる。
- **適用条件**: Hono `c.var.<X>Provider` 形式の middleware DI 検証 wave 全般。
- **再利用方法**: skill-feedback-report.md の「テンプレ改善」項を template 改修依頼として残し、`aiworkflow-requirements` 側の runtime smoke template に DI-bound 列を追加する。

### L-ISSUE531-003: POST self-request routes は **inventory-only**として扱う（staging queue を汚さない）

- **背景**: 初稿は POST `/me/attendance` を smoke 対象に含めていたが、実行成功時に staging Cloudflare Queue に書き込みが発生する。read-only smoke を称しつつ副作用 path を踏むと、後続 wave の D1 / Queue inspection が汚染される。
- **教訓**: smoke の対象 verb を GET に絞り、POST / PATCH / DELETE 系は `outputs/phase-02/route-inventory.md` に「inventory-only」と明記する。`runtime-attendance-provider.sh` も `case` 分岐で GET 以外を実行しない。
- **適用条件**: staging 副作用を伴うあらゆる runtime smoke。
- **再利用方法**: `scripts/smoke/runtime-attendance-provider.sh` のヘッダコメントに「GET only by design」と明示。同型 smoke 追加時は本 lessons の本セクションを直接 cite する。

### L-ISSUE531-004: persistent evidence は **summary-only**に限定する（PII / secret hygiene）

- **背景**: 初稿の runtime-smoke.log は `curl` 戻り値の raw body を保存していた。会員 PII（email / member ID）と staging 側 cookie / session token がログに残ると、commit 前 redact をすり抜ける可能性が残る。
- **教訓**: 永続 evidence は `label / status / jq contract / count or type` の 4 列だけ保存し、raw body は `mktemp` 一時ファイル + `trap rm` に閉じる。さらに `scripts/smoke/redact.sh` を grep gate として通す。
- **適用条件**: production / staging を問わず、外部応答を evidence として残すすべての smoke / probe。
- **再利用方法**: `aiworkflow-requirements` の secret/PII hygiene 節（observability-monitoring / deployment-secrets-management）に「summary-only persistent + mktemp+trap raw + redact gate」の 3 点ルールとして格上げ。skill-feedback-report.md「ドキュメント改善」項として既反映。

### L-ISSUE531-005: parent state は **fresh runtime evidence**まで更新しない（spec 作成で親を完了化させない）

- **背景**: 親 Issue #371 は middleware DI 移行を「実装済み・runtime 未検証」状態で固定している。本 wave で smoke spec を整えた直後に親 state を `PASS_RUNTIME_VERIFIED` へ進めると、spec 整備と runtime PASS の混同が起こる。
- **教訓**: spec 作成 wave は親 state を変えず `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持し、staging 実行で `runtime-smoke.log` が live PASS を示した後に限り親 state を昇格する。`outputs/phase-11/evidence/runtime-smoke.log` には `pending_user_credentials` 行を残し、live 取得時に上書きする。
- **適用条件**: parent workflow の runtime evidence を独立 issue / 別 wave で取得するすべての case。
- **再利用方法**: `aiworkflow-requirements` の `task-workflow-active.md` に Issue #531 行として state 境界を明示済み。Phase 12 skill-feedback-report.md「ワークフロー改善」項として promotion を依頼している。

## 関連 promotion

- task-specification-creator skill 側 promotion: 既存 Phase 12 strict 7 files / artifacts parity / NON_VISUAL evidence path / no false runtime PASS の 4 ルールが本 wave で全適用されたため、Applied Examples に Issue #531 行を追加する候補。
- aiworkflow-requirements skill 側 SKILL.md changelog entry: `v2026.05.07-issue531-runtime-smoke-attendance-provider`。
