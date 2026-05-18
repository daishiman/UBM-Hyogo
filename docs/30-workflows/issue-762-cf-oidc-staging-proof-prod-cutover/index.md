# issue-762-cf-oidc-staging-proof-prod-cutover

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762) `[issue-717-followup-001] Cloudflare GitHub Actions OIDC Staging Proof and Production Cutover`
> Parent spec: `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md`
> Related workflow: `docs/30-workflows/issue-717-oidc-cf-full-migration/`
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> task classification: code task（shell script 新規 + workflow YAML 新規/編集 + reference doc 編集）
> visual classification: NON_VISUAL（CI/CD security surface 改修。UI/UX 変更なし）
> 実装区分: **条件付き実装仕様書**（CONST_005 必須項目すべて含む / CONST_007 1サイクル完了スコープ）

---

## 1. 概要

Issue #717 で formalize された Cloudflare GitHub Actions OIDC 完全移行のうち、**今サイクルで安全に実装可能な周辺強化** を 1 PR で完了する。Cloudflare 公式 OIDC deploy support および `cloudflare/wrangler-action#402` は 2026-05-17 時点で依然 unsupported / OPEN のため、`.github/workflows/web-cd.yml` 本体の `id-token: write` 切替・OIDC exchange step 追加・実 staging proof / production cutover・legacy long-lived token 物理失効は **後続サイクル送り** とする（CONST_007 例外）。

本サイクルでは以下 5 件の周辺強化を実装する:

1. subject claim pin の事前 dry-run helper script (`scripts/oidc/verify-claim-pin.sh`)
2. `scripts/redaction-check.sh` の OIDC token redaction 拡張（JWT パターン / `cloudflare-aud` claim）
3. observation window CI gate 雛形 workflow (`.github/workflows/oidc-observation-window.yml`) — manual dispatch only / no-op verifier
4. 正本 reference (`deployment-secrets-management.md`) の future supported path gate 追記
5. `.github/workflows/web-cd.yml` への根拠コメント追加（コード挙動不変）

### in scope（今サイクル 1 PR で完了）

1. `scripts/oidc/verify-claim-pin.sh` 新規作成 — subject claim 4 軸（`repository` / `ref` / `environment` / `event_name`）の dry-run 検証
2. `scripts/redaction-check.sh` 編集 — JWT パターン (`eyJ` で始まる Base64URL) と `cloudflare-aud` claim 文字列の検出追加
3. `.github/workflows/oidc-observation-window.yml` 新規作成 — `workflow_dispatch` only、fallback 起動回数 0 を確認する no-op verifier
4. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 編集 — future supported path gate の正本反映
5. `.github/workflows/web-cd.yml` 編集 — `secrets.CLOUDFLARE_API_TOKEN` step-scoped fallback が current safe baseline である根拠コメント追加
6. Phase 11/12/13 outputs の実体化（NON_VISUAL evidence package、strict 7 outputs）

### out of scope（CONST_007 例外として明示）

| 項目 | 理由 | 実施先 |
|---|---|---|
| `.github/workflows/web-cd.yml` への `permissions: id-token: write` 実切替 | Cloudflare 公式 OIDC deploy support / `cloudflare/wrangler-action#402` が 2026-05-17 時点 unsupported。speculative 実装は trust boundary 不明 | 後続サイクル（公式 support 確認後） |
| 実 staging OIDC proof run | 公式 support 前提のため実行不能 | 後続サイクル |
| 実 production OIDC cutover | staging proof + observation 完了後に実行 | 後続サイクル |
| legacy `CLOUDFLARE_API_TOKEN` 物理失効 | observation window 完了まで rollback path 温存が必須 | `docs/30-workflows/issue-718-legacy-cf-token-revocation/`（canonical）/ `docs/30-workflows/completed-tasks/issue-718-legacy-cf-token-revocation/`（completed mirror） |
| 1Password 構造変更本体 | スコープ別 | `issue-717-followup-003-1password-restructure` |
| `apps/api` 側 D1 token cutover | application layer 別 | `issue-717-followup-002-apps-api-d1-token-cutover` |

---

## 2. Phase 一覧

| Phase | 名称 | ステータス | 成果物 |
|-------|------|----------|--------|
| 1 | 要件定義 | completed | [`phase-1-requirements.md`](./phase-1-requirements.md) |
| 2 | 設計 | completed | [`phase-2-design.md`](./phase-2-design.md) |
| 3 | 設計レビュー | completed | [`phase-3-design-review.md`](./phase-3-design-review.md) |
| 4 | テスト計画 | completed | `phase-4-test-plan.md` |
| 5 | 実装 | completed | `phase-5-implementation.md` |
| 6 | テスト拡充 | completed | `phase-6-test-additions.md` |
| 7 | カバレッジ確認 | completed | `phase-7-coverage.md` |
| 8 | リファクタリング | completed | `phase-8-refactor.md` |
| 9 | 品質保証 | completed | `phase-9-qa.md` |
| 10 | 最終レビュー | completed | `phase-10-final-review.md` |
| 11 | 手動テスト（NON_VISUAL） | completed | `phase-11-manual-test.md` / `outputs/phase-11/` |
| 12 | ドキュメント更新 | completed | `phase-12-documentation.md` / `outputs/phase-12/` strict 7 |
| 13 | PR 作成 | pending（ユーザー承認後） | `phase-13-pr.md` |

---

## 3. 不変条件

1. `.github/workflows/web-cd.yml` の **deploy 挙動は不変**。`permissions: id-token: write` を追加しない。OIDC exchange step を入れない。step-scoped `secrets.CLOUDFLARE_API_TOKEN` を維持
2. `scripts/cf.sh` の env var 名 `CLOUDFLARE_API_TOKEN` 契約を維持（ローカル deploy 互換性）
3. 新規 `scripts/oidc/verify-claim-pin.sh` は **dry-run only** — 実 OIDC token を発行しない / 外部エンドポイントを叩かない
4. 新規 `.github/workflows/oidc-observation-window.yml` は `workflow_dispatch` only — `push` / `schedule` trigger を持たせない
5. `scripts/redaction-check.sh` 拡張は既存 exit code semantics（leak あり=非ゼロ）を破壊しない
6. subject claim pin の固定値は `repository` / `ref=refs/heads/main` / `environment=production` / `event_name=push`（production）/ `ref=refs/heads/dev` / `environment=staging`（staging）
7. OIDC token 値・JWT 実値・Cloudflare Account ID は本サイクルで発生させず、成果物に残さない
8. CI required status check の green を維持。`actionlint` を新規 workflow YAML にも適用
9. PR 作成は Phase 13 のユーザー明示承認を経て実施
10. 後続実 OIDC 切替は Cloudflare 公式 docs / `wrangler-action#402` closed-as-released を一次情報で確認した後にのみ着手する

---

## 4. 主要関連ファイル

| パス | 役割 | 変更種別 |
|------|------|---------|
| `scripts/oidc/verify-claim-pin.sh` | subject claim 4 軸の dry-run 検証 helper | 新規 |
| `scripts/redaction-check.sh` | JWT / `cloudflare-aud` claim 検出パターン追加 | 編集 |
| `.github/workflows/oidc-observation-window.yml` | fallback 起動 0 件 observation の manual gate 雛形 | 新規 |
| `.github/workflows/ci.yml` | `workflow-shell-lint` actionlint 対象に `oidc-observation-window.yml` を追加 | 編集 |
| `package.json` | `observation:lint` ローカル再現コマンドに `oidc-observation-window.yml` を追加 | 編集 |
| `.github/workflows/web-cd.yml` | step-scoped token が current safe baseline である根拠コメント追加 | 編集（挙動不変） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | future supported path gate（G1-G4）の正本反映 | 編集 |
| `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md` | 周辺強化 consumed trace / canonical pointer 追記 | 編集 |
| `outputs/phase-11/cloudflare-oidc-support-revalidation-2026-05-17.md` | 公式 support 一次情報再検証サマリ（2026-05-17 時点） | 新規 |
| `outputs/phase-12/` strict 7 outputs | 仕様同期・unassigned 検出など | 新規 |

---

## 5. 関連 Issue / PR / Spec

| 種別 | リンク / パス | 状態・関係 |
|------|---------------|-----------|
| 本タスク Issue | [#762](https://github.com/daishiman/UBM-Hyogo/issues/762) | CLOSED（2026-05-17, state_reason=completed）※ クローズ済みのまま仕様書を作成 |
| 親 Issue | [#717](https://github.com/daishiman/UBM-Hyogo/issues/717) | Closed（`verified_current_no_code_change_pending_pr` で完了） |
| 元仕様（unassigned-task） | `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md` | status: blocked。本タスクで周辺強化のみ formalize |
| 関連完了 workflow | `docs/30-workflows/issue-717-oidc-cf-full-migration/` | 構造テンプレート |
| 依存後続 revocation workflow | `docs/30-workflows/issue-718-legacy-cf-token-revocation/` | observation 完了後の canonical path。completed mirror: `docs/30-workflows/completed-tasks/issue-718-legacy-cf-token-revocation/` |
| 上流 blocker | `cloudflare/wrangler-action#402` | OPEN（2026-05-17 時点） |
| 上流 docs | `https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/` | API Token 方式のみ案内 |
| 正本 reference | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 反映先 |

---

## 6. 実装区分判定根拠（CONST_004）

- 本タスクは元来 `.github/workflows/web-cd.yml` の `id-token: write` 切替を含む implementation task だが、Cloudflare 公式 OIDC deploy support が 2026-05-17 時点で確認できない。
- speculative な OIDC exchange step を入れると trust boundary 不明 + rollback path 不全になるため、本サイクルは **周辺強化のみ実装** とする。
- 周辺強化（claim pin dry-run helper / JWT redaction / observation window 雛形 / 正本 reference 反映 / 根拠コメント）は公式 support 状況に依存せず単独で価値を持ち、後続実切替時の前提を整える。
- したがって `implementationCategory=conditional_implementation_with_peripheral_hardening`。

## 7. CONST_007 スコープ判定

- 本サイクルの in-scope（周辺強化 5 件 + Phase 1-13 全成果物）を 1 PR で完了する設計。
- 実 OIDC 切替・実 staging proof・実 production cutover・legacy token 物理失効は「公式 support 未確認」「rollback path 温存必須」「observation 期間必要」という技術的整合性破綻条件に該当するため **未タスク化** に分離。
- それ以外の周辺強化は本サイクルで完結。
