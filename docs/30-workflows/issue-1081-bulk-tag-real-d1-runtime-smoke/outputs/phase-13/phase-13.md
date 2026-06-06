# Phase 13: PR作成（user-gated） — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

local 実装完了後、user の明示承認後にのみ PR を作成する。本サイクルは `implemented_local_evidence_captured` であり、commit / push / PR は **実行しない**。

## 状態

| 項目 | 値 |
| ---- | -- |
| Phase 13 status | `pending_user_approval` |
| Gate-C | **pending**（commit / push / PR 作成。user-gated） |
| PR base ブランチ | `dev`（CLAUDE.md 既定。production リリース時のみ `dev → main`） |

> 本プロンプトでは commit / push / PR を実行しない（CLAUDE.md: commit / push / PR は user 明示承認後のみ）。issue #1081 は **CLOSED 状態を維持**する（reopen / close しない）。PR 本文では「#1081 の bulk tag real D1 runtime smoke gate を実装」と参照のみ行う。

## PR 作成時の手順（承認後）

1. 既定 base ブランチは `dev`。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward → 作業ブランチへ merge → conflict は CLAUDE.md 既定方針で解消。
3. 品質検証 4 コマンド: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. runner / shell test 固有検証: `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` GREEN / `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml` GREEN / `shellcheck scripts/smoke/runtime-tag-bulk.sh`。
5. `gh pr create --base dev` で作成。本文は `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様 + `outputs/phase-12/implementation-guide.md` を反映。
6. NON_VISUAL のためスクリーンショット項目は作らない（`outputs/phase-11/` に画像なし）。

## 想定 PR タイトル

```
feat(issue-1081): bulk tag endpoint の staging real D1 runtime smoke 基盤（runner / seed・cleanup SQL / CI job / local test）
```

## PR 本文骨格

```markdown
## 概要
issue #1081（=task-issue-1036-followup-005）。`POST /admin/members/tags/bulk` を Cloudflare
Workers staging + ubm-hyogo-db-staging real D1 で実走させ、bulk assign / 再送 no-op / unassign /
audit count parity / cleanup の runtime 証跡を自動取得する基盤を新設する。endpoint 実装自体は
issue-1036 で landed 済（apps/api 非変更）。本 PR は「その endpoint が staging real D1 で contract
通り動く証跡を自動取得する gate」を追加する。#1081 の回帰防止 gate を実装（issue は CLOSED 維持）。

## 変更内容
- runner: scripts/smoke/runtime-tag-bulk.sh（seed→assign→retry noop→unassign→audit count→cleanup）
- seed/cleanup SQL: apps/api/migrations/seed/bulk-tag-staging-{seed,cleanup}.sql（e2e_test_issue1081_ 限定）
- CI job: .github/workflows/runtime-smoke-staging.yml に bulk-tag-runtime-smoke job 追加（user approval gate）
- local test: scripts/smoke/__tests__/runtime-tag-bulk.test.sh（real D1 接続なし・curl/cf.sh stub）

## 実 contract（runner が検証する shape）
POST /admin/members/tags/bulk
  body: { memberIds, tagIds, op: "assign"|"unassign" }
  200:  { batchId, results:[{memberId,tagId,status}] }
  status ∈ assigned | noop | unassigned | skipped_deleted | tag_not_found
  audit: assigned→admin.member.tag_assigned / unassigned→admin.member.tag_unassigned / 他→append なし

## 受入条件
- AC-1 assign → 全 assigned / AC-2 再送 → 全 noop + audit count 不変 / AC-3 unassign → 全 unassigned + audit 増分
- AC-4 cleanup は e2e_test_issue1081_% 限定・残件 0 / AC-5 command log（endpoint/redaction/summary/audit query）
- AC-6 production guard（exit 2）/ AC-7 local test PASS

## 検証
- bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh（AC-6/AC-7）
- bash -n runtime-tag-bulk.sh / runtime-tag-bulk.test.sh
- actionlint runtime-smoke-staging.yml
- pnpm smoke:test / pnpm typecheck / pnpm lint
- staging real D1 runtime smoke（AC-1〜AC-5）は user-gated。evidence は outputs/phase-11/evidence/ 配下。

## 不変条件
- apps/api / apps/web / D1 schema / Google Form 仕様は非変更（既存 endpoint surface のみ叩く）
- D1 操作は scripts/cf.sh 経由（wrangler 直叩きなし）。secret は op 参照 / redact。

## 状態
implemented_local_evidence_captured / staging_runtime_pending_user_gate（runner/CI/local test 実装済、staging 実走は user-gated）
```

## PR に含めるファイル一覧

### 実装成果物（実装 wave 完了後・5 点）

| 区分 | パス |
| ---- | ---- |
| NEW | `scripts/smoke/runtime-tag-bulk.sh` |
| NEW | `apps/api/migrations/seed/bulk-tag-staging-seed.sql` |
| NEW | `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql` |
| EDIT | `.github/workflows/runtime-smoke-staging.yml`（`bulk-tag-runtime-smoke` job 追加） |
| NEW | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` |

### 仕様書群

- 本仕様書 root（`docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/`）一式: `index.md` / `artifacts.json` / `outputs/phase-1..13/` / Phase 12 strict 7 outputs
- Phase 11 evidence ledger（`outputs/phase-11/phase-11.md` / `manual-test-result.md` / `outputs/phase-11/evidence/`）

> staging 実走後に取得した runtime evidence（`runtime-tag-bulk-smoke.log` / `audit-count.log` / `summary.json` / `cleanup.log`）は、取得後に同 PR もしくは後続 evidence PR で `outputs/phase-11/evidence/` に tracked file として追加する。

## 完了判定

- [ ] user 承認まで commit / push / PR を実行しない（Gate-C pending）
- [x] PR base = `dev`、想定タイトル・本文骨格・含めるファイル一覧（実装 5 点 + 仕様書群）を固定
- [x] issue #1081 は CLOSED 維持（PR で参照のみ）
- [x] NON_VISUAL のためスクリーンショット項目を作らない旨を明記
- [x] staging 実走 evidence は user-gated（Gate-B）で、PR には実装 + 仕様書を含める旨を明記
