# issue-717-oidc-cf-full-migration

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717) `Cloudflare GitHub Actions OIDC Full Migration`
> Parent spec: `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md`
> implementation_mode: `verified_current_no_code_change_pending_pr`（一次情報再検証により現時点の repo 実装変更なし）
> task classification: code task（GitHub Actions workflow YAML + claim 設計 + 正本ドキュメント反映）
> visual classification: NON_VISUAL（UI/UX 変更なし。CI/CD security surface 改修）
> 実装区分: **conditional 実装仕様書**（Cloudflare 公式 OIDC deploy support が確認できた場合のみ workflow 実装へ進む）

---

## 1. 概要

GitHub Actions の Cloudflare deploy credential を **OIDC（OpenID Connect）ベースの短命 credential** へ完全移行できるかを一次情報で再検証する。2026-05-16 時点では Cloudflare Workers GitHub Actions docs / `cloudflare/wrangler-action` README が API token authentication を正規手順としており、OIDC deploy exchange は確認できないため、本 cycle では `.github/workflows/web-cd.yml` を変更しない。

本タスクは **公式 support revalidation + no-code decision + future rollout gate の formalize** をスコープとする。staging proof、production 実切替、legacy long-lived token の物理失効は、公式 OIDC support / staging proof / observation window の成立後に別 PR / 別 unassigned task で扱う。

### in scope（今回サイクル 1 PR で完了させる）

1. Cloudflare 公式 OIDC サポートの一次情報再検証（`cloudflare/wrangler-action` 最新 release の `id-token` 入力対応含む）
2. unsupported 判定時に `.github/workflows/web-cd.yml` へ `permissions: id-token: write` を追加しないことの明文化
3. future supported path 用の subject claim pin 設計条件（`repo` / `ref` / `environment` の 3 軸）
4. staging 限定 OIDC deploy proof は後続実装 task の gate として保持
5. step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路の rollback path 温存条件の明文化
6. production rollout 段階手順の **条件付き設計** 文書化（本タスクで production 切替は実行しない）
7. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` への no-code 判定・current secret boundary の canonical 反映
8. root/output artifacts parity と Phase 12 strict 7 outputs の実体化

### out of scope（CONST_007 例外として明示）

元仕様 `issue-640-followup-001-oidc-full-migration.md` §2.3 を引用:

| 項目 | 理由 | 実施先 |
|---|---|---|
| Cloudflare dashboard 上での legacy API Token **物理失効** | staging → production 段階的移行後の別 PR で扱う。本タスクで失効すると rollback path が消失 | `issue-640-followup-002-legacy-token-revocation` が所有 |
| `apps/api` 側の D1 token cutover 全般 | スコープが別 application layer。本タスクは `web-cd.yml` 集中 | 別 issue 化候補 |
| 1Password 正本の構造変更本体 | 参照更新の判断材料作成にとどめる | 別 issue |
| HEALTH_DB_TOKEN 等、他 rotation SOP 文書の本体改訂 | 本タスク範囲外 | 別 issue |
| `scripts/cf.sh` ラッパー仕様変更 | env var 名 `CLOUDFLARE_API_TOKEN` 互換性は維持 | — |
| staging / production environment への OIDC 実切替実行 | 本タスクでは実行しない。公式 support 確認後の staging proof から開始 | 後続 task（`issue-717-followup-001-production-oidc-cutover`） |

---

## 2. Phase 一覧

| Phase | 名称 | ステータス | 成果物 |
|-------|------|----------|--------|
| 1 | 要件定義 | completed | [`phase-1-requirements.md`](./phase-1-requirements.md) |
| 2 | 設計 | completed | [`phase-2-design.md`](./phase-2-design.md) |
| 3 | 設計レビュー | completed | [`phase-3-design-review.md`](./phase-3-design-review.md) |
| 4 | テスト計画 | completed | `phase-4-test-plan.md` |
| 5 | 実装 | skipped | `phase-5-implementation.md`（unsupported 判定により workflow 変更なし） |
| 6 | テスト拡充 | skipped | `phase-6-test-additions.md`（unsupported 判定により追加 script なし） |
| 7 | カバレッジ確認 | completed | `phase-7-coverage.md` |
| 8 | リファクタリング | completed | `phase-8-refactor.md` |
| 9 | 品質保証 | completed | `phase-9-qa.md` |
| 10 | 最終レビュー | completed | `phase-10-final-review.md` |
| 11 | 手動テスト（NON_VISUAL） | completed | [`phase-11-manual-test.md`](./phase-11-manual-test.md) / `outputs/phase-11/cloudflare-oidc-support-revalidation.md` |
| 12 | ドキュメント更新 | completed | [`phase-12-documentation.md`](./phase-12-documentation.md) / `outputs/phase-12/` strict 7 |
| 13 | PR 作成 | blocked（ユーザー承認待ち） | [`phase-13-pr.md`](./phase-13-pr.md) |

---

## 3. 不変条件

1. `scripts/cf.sh` が要求する env var 名 `CLOUDFLARE_API_TOKEN` は維持（ローカル deploy 経路の互換性のため）
2. `permissions: id-token: write` は公式 support が確認されるまで付与しない
3. future OIDC token の subject claim は `repo` / `ref` / `environment` の 3 軸で pin する
4. step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路は current runtime contract として維持する
5. OIDC token 値・subject claim 実値・Cloudflare Account ID は本 cycle で発生させず、成果物に残さない
6. PR 作成は Phase 13 のユーザー明示承認を経て実施（自動 push 禁止）
7. CI required status check（`web-cd` / `verify-indexes-up-to-date` / `actionlint`）の green を維持
8. production environment への OIDC 実切替は本タスクで **実行しない**（設計のみ）

---

## 4. 主要関連ファイル

| パス | 役割 |
|------|------|
| `.github/workflows/web-cd.yml` | **変更なし**。公式 support が確認できるまで `id-token: write` / OIDC exchange step を追加しない |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | OIDC 採用方式・claim mapping・rollback 条件の canonical 反映 |
| `outputs/phase-11/cloudflare-oidc-support-revalidation.md` | Cloudflare 公式 OIDC サポートの一次情報サマリ |
| `outputs/phase-11/cloudflare-oidc-support-revalidation.md` | 2026-05-16 時点の一次情報再検証と no-code 判定 |
| `outputs/phase-12/unassigned-task-detection.md` | 後続 unassigned task 検出 |
| `scripts/cf.sh` | 確認のみ（env var 名 `CLOUDFLARE_API_TOKEN` 互換性維持） |

---

## 5. 関連 Issue / PR / Spec

| 種別 | リンク / パス | 状態・関係 |
|------|---------------|-----------|
| 本タスク Issue | [#717](https://github.com/daishiman/UBM-Hyogo/issues/717) | OPEN |
| 親 Issue（前身完了） | [#640](https://github.com/daishiman/UBM-Hyogo/issues/640) | step-scoped CF token cutover（completed） |
| 元仕様（unassigned-task 原典） | `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md` | 本タスクで formalize |
| 依存後続 unassigned task | `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md` | 公式 support 確認後の staging proof / production cutover |
| 依存後続 unassigned task | `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` | production cutover + observation 後に enable |
| 前身完了 workflow | `docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/` | Phase 1-13 完了 |
| 関連正本 reference | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 反映先 |
| 関連正本 reference | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | クロスリファレンス候補 |
| 関連正本 reference | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 参照のみ |

---

## 6. 実装区分判定根拠（CONST_004）

- 対象タスクは本来 `.github/workflows/web-cd.yml` の実ファイル変更を含む implementation task だが、Phase 1 一次情報再検証で公式 OIDC deploy support が確認できなかった。
- unsupported な workflow 実装は安全性と正本整合を損なうため、本 cycle は `implementationCategory=conditional` / `verified_current_no_code_change_pending_pr` として閉じる。
- 正本 reference、Phase 12 strict outputs、unassigned task formalization は実ファイルへ反映する。

## 7. CONST_007 スコープ判定

- 全 Phase 1-13 を今回の実装プロンプト 1 サイクルで完了する設計。
- staging / production OIDC 実切替および legacy long-lived token の物理失効は「公式 support 未確認」「rollback path 温存」「観察期間必要」という技術的整合性破綻条件に該当するため **未タスク化** へ分離。
- それ以外は本サイクルで完結。
