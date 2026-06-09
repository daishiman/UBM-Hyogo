# Phase 13: PR作成（user-gated） — issue-1137-bulk-tag-production-runtime-smoke

## 目的

user の明示承認後にのみ PR を作成する。**本サイクルは `implemented_local_runtime_pending`**（local implementation complete）であり、commit / push / PR は **実行しない**。Phase 13 は user 承認後に実施する。

## 状態

| 項目 | 値 |
| ---- | -- |
| workflow_state | `implemented_local_runtime_pending`（runner・SQL・CI・test 実装済み。production 実走のみ pending）|
| Phase 13 status | `pending_user_approval`（user 承認後に実施）|
| Gate-C | **pending**（commit / push / PR 作成。user-gated）|
| PR base ブランチ | `dev`（CLAUDE.md 既定。production リリース時のみ `dev → main`）|

> 本プロンプトでは commit / push / PR を実行しない（CLAUDE.md: commit / push / PR は user 明示承認後のみ）。本サイクルは実コード実装と仕様書同期まで完了であり、Phase 13 は user 承認後にのみ実施する。issue #1137 は **CLOSED 状態を維持**する（reopen / close しない）。PR 本文では「#1137 の bulk tag production runtime smoke gate を実装」と参照のみ行う。

## PR 作成時の手順（user 承認後）

1. 既定 base ブランチは `dev`。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward → 作業ブランチへ merge → conflict は CLAUDE.md 既定方針で解消。
3. 品質検証 4 コマンド: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. runner / shell test 固有検証:
   - `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` GREEN（production guard / dual marker / production allowlist / staging 非退化）
   - `bash -n scripts/smoke/runtime-tag-bulk.sh` / `bash -n scripts/smoke/__tests__/runtime-tag-bulk.test.sh`
   - `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/production-runtime-smoke.yml` GREEN
   - `shellcheck scripts/smoke/runtime-tag-bulk.sh`
5. `gh pr create --base dev` で作成。本文は `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様 + `outputs/phase-12/implementation-guide.md` を反映。
6. NON_VISUAL のためスクリーンショット項目は作らない（`outputs/phase-11/` に画像なし）。

## 想定 PR タイトル

```
feat(issue-1137): bulk tag endpoint の production real D1 runtime smoke 拡張（production guard / 二重承認 / seed・cleanup SQL / CI job / local test）
```

## PR 本文骨格

```markdown
## 概要
issue #1137（=task-issue-1036-followup-006）。issue-1081 が確立した staging bulk tag mutation
runtime smoke を、production Workers（ubm-hyogo-api）+ ubm-hyogo-db-prod real D1 に対する mutation
smoke へ拡張する。endpoint 実装自体は issue-1036 で landed 済（apps/api 非変更）。staging guard
（assert_staging_guard）は逐語不変で温存し、production 経路は別 guard 関数 assert_production_guard +
二重承認 gate として共存させる。#1137 の回帰防止 gate を実装（issue は CLOSED 維持）。

## 変更内容
- runner: scripts/smoke/runtime-tag-bulk.sh（production env 受理 + assert_production_guard +
  dual approval marker + env 別 prefix/SQL/D1/allowlist 分岐。assert_staging_guard は逐語不変）
- seed/cleanup SQL: apps/api/migrations/seed/bulk-tag-production-{seed,cleanup}.sql
  （e2e_test_prod_tagbulk_ 限定・staging prefix と完全分離）
- CI job: .github/workflows/production-runtime-smoke.yml に bulk-tag-production-runtime-smoke job
  追加（workflow_dispatch 限定 + input 明示 opt-in + environment: production-runtime-smoke 承認 + runner dual marker）
- local test: scripts/smoke/__tests__/runtime-tag-bulk.test.sh（production guard / dual marker /
  production allowlist / staging 非退化。real D1 接続なし・curl/cf.sh stub）

## 実 contract（runner が検証する shape）
POST /admin/members/tags/bulk
  body: { memberIds, tagIds, op: "assign"|"unassign" }
  200:  { batchId, results:[{memberId,tagId,status}] }
  status ∈ assigned | noop | unassigned | skipped_deleted | tag_not_found
  audit: assigned→admin.member.tag_assigned / unassigned→admin.member.tag_unassigned / 他→append なし

## production 経路の安全設計（staging との差分）
- 許可 env: production を追加受理（staging 受理も維持）
- guard: assert_production_guard（新設・別関数。allowlist regex + dual marker + D1 名 ubm-hyogo-db-prod）
- 二重承認: GitHub environment production-runtime-smoke 承認（第 1）+ runner marker
  BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke + BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1（第 2）
- CI トリガ: workflow_dispatch 限定 + `run_bulk_tag_mutation=true` / `bulk_tag_confirmation=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1` 明示 opt-in（auto trigger なし）
- fixture prefix: e2e_test_prod_tagbulk_（staging e2e_test_issue1081_ と完全分離）
- cleanup: 6 table の e2e_test_prod_tagbulk_% 残件 0 assert（残件あれば FAIL・本番露出/audit 汚染防止）

## 受入条件
- AC-1 production allowlist 限定（staging と独立評価）/ AC-2 fixture prefix 分離
- AC-3 二重承認後のみ実行（CI 自動実行不可）/ AC-4 cleanup 残件 0 / AC-5 audit parity
- AC-6 staging guard 非退化（既存 local test PASS）/ AC-7 command log + redaction / AC-8 @ubm-hyogo/api + results[].status

## 検証
- bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh（AC-6/AC-7 + production guard 群）
- bash -n runtime-tag-bulk.sh / runtime-tag-bulk.test.sh
- actionlint production-runtime-smoke.yml / shellcheck runtime-tag-bulk.sh
- pnpm typecheck / pnpm lint / bash scripts/verify-pr-ready.sh
- production real D1 runtime smoke（AC-1〜AC-5）は user 二重承認後に実行（Gate-B）。
  runtime evidence パス: outputs/phase-11/evidence/runtime-tag-bulk-prod-smoke.log /
  runtime-tag-bulk-prod-audit-count.log / runtime-tag-bulk-prod-cleanup.log / summary.json

## 二重承認手順（production 実走時）
1. 第 1 承認: GitHub environment production-runtime-smoke の reviewer 承認
2. 第 2 承認: workflow_dispatch input BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke +
   BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1

## staging 非退化確認
- assert_staging_guard 本体を逐語変更しない（AC-6 / I-7）
- 既存 staging local test ケース（production-env-refused 等）が引き続き PASS
- staging seed/cleanup SQL（bulk-tag-staging-*.sql）は不変
- bulk-tag-runtime-smoke（staging）job は変更しない

## 不変条件
- apps/api / apps/web / D1 schema / Google Form 仕様は非変更（既存 endpoint surface のみ叩く）
- D1 操作は scripts/cf.sh 経由（wrangler 直叩きなし）。secret は op 参照 / redact。
- production 誤実行禁止: allowlist regex + dual marker + D1 名のいずれか欠落で exit 2。

## 状態
implemented_local_runtime_pending → production 実走（user 二重承認）で completed
（runner/CI/local test 実装後、production 実走は user-gated = Gate-B）
```

## PR に含めるファイル一覧

### 実装成果物（実装 wave 完了後・5 点）

| 区分 | パス |
| ---- | ---- |
| EDIT | `scripts/smoke/runtime-tag-bulk.sh`（production env 受理 + `assert_production_guard` + dual marker + env 別分岐。`assert_staging_guard` 逐語不変）|
| NEW | `apps/api/migrations/seed/bulk-tag-production-seed.sql` |
| NEW | `apps/api/migrations/seed/bulk-tag-production-cleanup.sql` |
| EDIT | `.github/workflows/production-runtime-smoke.yml`（`bulk-tag-production-runtime-smoke` job 追加）|
| EDIT | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（production guard / dual marker / allowlist / staging 非退化テスト追加）|

### 仕様書群

- 本仕様書 root（`docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/`）一式: `index.md` / `artifacts.json` / `outputs/phase-1..13/` / Phase 12 strict 7 outputs
- Phase 11 evidence ledger（`outputs/phase-11/phase-11.md` / `manual-test-result.md` / `outputs/phase-11/evidence/`）

> production 実走後に取得した runtime evidence（`runtime-tag-bulk-prod-smoke.log` / `runtime-tag-bulk-prod-audit-count.log` / `runtime-tag-bulk-prod-cleanup.log` / `summary.json`）は、user 二重承認後の取得後に同 PR もしくは後続 evidence PR で `outputs/phase-11/evidence/` に tracked file として追加する。

## 完了判定

- [ ] user 承認まで commit / push / PR を実行しない（Gate-C pending）
- [x] 本サイクルは `implemented_local_runtime_pending` のため、Phase 13 は user 承認後に実施する旨を明記
- [x] PR base = `dev`、想定タイトル・本文骨格（変更ファイル一覧 / AC 充足 / runtime evidence パス / 二重承認手順 / staging 非退化確認）を固定
- [x] issue #1137 は CLOSED 維持（PR で参照のみ）
- [x] NON_VISUAL のためスクリーンショット項目を作らない旨を明記
- [x] production 実走 evidence は user 二重承認後（Gate-B）で、PR には実装 + 仕様書を含める旨を明記
- [x] commit / push / PR は本プロンプトでは実行しないことを明記
