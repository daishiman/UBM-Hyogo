# ci-env-secret-inventory-and-preflight-gate

## 概要

CI workflow が参照する GitHub Secrets を全件棚卸しし、`staging-runtime-smoke` 発火中 fail の完全解消と、潜在 fail 15 件の解消、および「Environment 作成済み・Secret 未投入」を CI 発火前に検知する preflight gate の導入までを 1 サイクルで完了させる。

## Metadata

| Key | Value |
| --- | --- |
| workflow | `ci-env-secret-inventory-and-preflight-gate` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `implementation_complete_runtime_pending` |
| verdict | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |

**[実装区分: 実装仕様書]**
- 主作業の一部（`gh secret set` の実値投入）は AI 禁止の user 操作だが、preflight gate script・workflow YAML 修正・docs 更新はコード変更を伴う。CONST_004 に従い実装仕様書として作成し、user 操作セクションを併設する。

## 背景

直前の調査（30 思考法レビュー反映済み）で次が判明した:

1. **直接事象**: `.github/workflows/runtime-smoke-staging.yml` が `environment: staging-runtime-smoke` で起動するが、当該 Environment の secrets 件数は **0 件**（`gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets` で確認）。Repository scope にも `STAGING_*` 系は無く、`daishiman` は user account のため Org scope は存在しない（`gh api orgs/daishiman` → 404）。
2. **隣接リスク 15 件**: workflow 内に `secrets.*` で参照されるが、どの scope にも未登録または scope 不整合の secret が 15 件存在（`CLOUDFLARE_API_TOKEN_STAGING`、`CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`、`CF_AUDIT_*` 4 件、`CLOUDFLARE_ACCOUNT_TAG`、`CLOUDFLARE_ALERTS_TOKEN_READ`、`CLOUDFLARE_ANALYTICS_API_TOKEN`、`CLOUDFLARE_ZONE_TAG`、`AUTH_SECRET`、`EMAIL_WEBHOOK_URL`、`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK`、`SLACK_WEBHOOK_URL`、`CLOUDFLARE_ALERT_RELAY_URL`）。本仕様では `SLACK_WEBHOOK_URL` を独立項目として数えた 15 件を正とする。
3. **構造的欠陥（真の論点）**: env-scope secret 欠落を CI 発火前に検知する仕組みが無い。preflight gate 不在のため、Environment を作成だけして Secret 未投入のまま放置されるパターンが繰り返される。

過去 workflow `completed-tasks/ci-runtime-smoke-staging-secrets-recovery/` は (B) stale runbook path 修正・(C) doc-ref CI gate を導入したが、(A) secret 実投入と隣接リスクおよび (D) env-scope preflight gate は積み残し。本 workflow が follow-up として最終収束させる。

## スコープ

| 含む | 含まない |
|------|----------|
| (A) `staging-runtime-smoke` Environment への 5 件必須 secret 投入手順の確定と user 実行用 runbook 整備 | secret 実値投入の AI 実行（user 単独） |
| (B) 隣接未登録・scope 不整合 secret 15 件の棚卸し・分類（投入 / workflow 修正 / workflow 削除）と各 workflow YAML 修正 | OIDC federation への大規模移行（中期ロードマップへ） |
| (C) env-scope secret preflight gate 実装（`scripts/ci/verify-env-secrets.sh` + `.github/workflows/verify-env-secrets.yml`） | runtime-smoke-staging.yml 本体ロジック変更（前 workflow で完了済み） |
| (D) サイクル完了確認（再 run PASS evidence + preflight gate green） | production 用 runtime smoke 新設（別 workflow へ） |

## CONST_007 スコープ判断

本 workflow は 3 タスクに分割するが、すべて 1 実装サイクル内で完了させる。「将来 Phase」「別 PR」への先送りは無し。OIDC federation 化と production runtime smoke 新設のみ「明確に独立した大規模スコープ」として除外し、本 index と各 task spec 末尾に「サイクル外候補」として理由・想定実施場所を併記する。

## 不変条件

1. secret 実値を AI コンテキストに露出させない（chat / file / commit message / PR description）
2. `op read` / `gh secret set` の実行は user 単独。AI は手順記述・検証 script・evidence 受け入れ枠の準備のみ
3. preflight gate は false-positive を生まないこと（workflow 起動条件 / `if:` ガード考慮、未発火 workflow を fail 扱いしない）
4. CLAUDE.md 既定: PR base は `dev`、main は production リリース時のみ
5. `daishiman` は user account のため Org-scope secret は使用不可。検査は Environment scope + Repository scope のみで完結する設計とする

## タスク構成

| タスク ID | 名称 | 並列性 | 主担当 |
|----------|------|--------|--------|
| task-01 | staging-runtime-smoke secret finalization | task-03 と並列可（user 操作待ちで blocking しない） | user (mutation) + AI (runbook 整備) |
| task-02 | adjacent unregistered secret inventory | task-03 と並列可 | AI (分類 / workflow 修正) + user (実投入が必要な分のみ) |
| task-03 | env-scope secret preflight gate | task-01 / task-02 と並列可 | AI |

> 依存関係: task-03 の gate は task-01 / task-02 の secret 投入後に green になる前提で設計する。逆順依存（task-03 を先に red 状態で merge）は禁止。

## Phase 構成（workflow 共通）

| Phase | 名称 | 主要成果物 |
|-------|------|-----------|
| 1 | 要件定義 | `phase-1.md` |
| 2 | 設計 | `phase-2.md` |
| 3 | 設計レビュー | `phase-3.md` |
| 4-10 | 各タスク内 phase | 各 task ディレクトリ配下 |
| 11 | 手動テスト（NON_VISUAL） | `outputs/phase-11/main.md` + `outputs/phase-11/evidence/*` |
| 12 | ドキュメント更新 | `outputs/phase-12/implementation-guide.md` 他 6 成果物 |
| 13 | PR 作成 | user 明示承認後のみ |

## 完了条件（DoD）

- task-01 / task-02 / task-03 の DoD がすべて PASS
- `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets --jq '.secrets | length'` が **5** を返す
- PR/push context の `bash scripts/ci/verify-env-secrets.sh --event-name <event>` が exit 0 を返す
- `.github/workflows/verify-env-secrets.yml` job が PR・push (dev/main) で green
- `runtime-smoke-staging` job が 1 度の re-run で `verify required staging secrets` を pass し、`run runtime smoke` step まで進む
- 隣接 15 件の secret が「user-gated provision / vars 整合 / workflow 整合」のいずれかで確定済み。実値投入は Phase 13 user-gated runtime evidence

## References

- 直前調査レポート（本会話 prior turn）
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/` （前 workflow）
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`
- `scripts/smoke/provision-staging-secrets.sh`
