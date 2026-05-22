# issue-640-oidc-cf-token-cutover

> Source issue: [#640](https://github.com/daishiman/UBM-Hyogo/issues/640) `[issue-331-followup-003] OIDC / step-scoped CLOUDFLARE_API_TOKEN cutover (re-tracking)`
> implementation_mode: `new`（新規実装）
> task classification: code task（GitHub Actions workflow YAML + scripts/cf.sh 互換性）
> visual classification: NON_VISUAL（UI/UX 変更なし。CI/CD security surface 改修）
> 実装区分: **実装仕様書**（CONST_005 必須項目すべてを含む / CONST_007 1サイクル完了スコープ）

---

## 1. 概要

GitHub Actions の Cloudflare deploy credential を **step-scoped** に閉じ込め、long-lived `CLOUDFLARE_API_TOKEN` の漏洩 blast radius を最小化する。

OIDC への完全移行は `cloudflare/wrangler-action@v3` および Cloudflare 側の OIDC サポートが GitHub Actions に対して production-ready ではないため、**今回サイクルでは step-scoped fine-grained token 方式を採用する**（CONST_007 の例外条件に該当せず、1 サイクルで完了させる現実解）。

OIDC への将来移行余地は `outputs/phase-12/unassigned-task-detection.md` に formalize し、本サイクルでは扱わない。

### in scope（今回サイクル 1 PR で完了させる）

1. `.github/workflows/web-cd.yml` の job-level `env: CLOUDFLARE_API_TOKEN` を **deploy step-scoped `env:` に降格**
2. `.github/workflows/backend-ci.yml` の `cloudflare/wrangler-action@v3` 4 箇所の token 露出範囲が step 限定であることを実 yaml で確認・補強
3. `scripts/cf.sh` ラッパーは env var 名 `CLOUDFLARE_API_TOKEN` を維持（ローカル互換性）
4. `.github/workflows/cf-audit-log-cold-storage.yml` / `cf-audit-log-monitor.yml` / `d1-migration-verify.yml` / `post-release-dashboard.yml` の token 参照を grep で再確認し、必要箇所のみ step-scoped 化
5. `deployment-secrets-management.md`（aiworkflow-requirements references）への正本反映
6. redaction-check の自動 grep gate 設計（後段検出ガード）

### out of scope（CONST_007 例外として明示）

| 項目 | 理由 | 実施先 |
|---|---|---|
| OIDC 完全移行 | Cloudflare 公式の GitHub OIDC IdP は workers deploy 用途では未 GA。仕様未確定で今回サイクルに含めると整合性破綻 | `outputs/phase-12/unassigned-task-detection.md` で formalize |
| 旧 long-lived token の物理失効 | 進行中 deploy への影響回避のため staging → production 段階的移行後の別 PR | 別 unassigned task |
| 1Password 構造変更 | 参照 path 変更を伴う場合のみ別 issue | 別 issue |

---

## 2. Phase 一覧

| Phase | 名称 | ステータス | 成果物 |
|-------|------|----------|--------|
| 1 | 要件定義 | completed | `phase-1-requirements.md` |
| 2 | 設計 | completed | `phase-2-design.md` |
| 3 | 設計レビュー | completed | `phase-3-design-review.md` |
| 4 | テスト作成 | completed | `phase-4-test-plan.md` |
| 5 | 実装 | completed | `phase-5-implementation.md` |
| 6 | テスト拡充 | completed | `phase-6-test-additions.md` |
| 7 | カバレッジ確認 | completed | `phase-7-coverage.md` |
| 8 | リファクタリング | completed | `phase-8-refactor.md` |
| 9 | 品質保証 | completed | `phase-9-qa.md` |
| 10 | 最終レビュー | completed | `phase-10-final-review.md` |
| 11 | 手動テスト（NON_VISUAL） | runtime_pending | `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント更新 | completed | `outputs/phase-12/{strict 7成果物}` |
| 13 | PR 作成 | blocked（ユーザー承認待ち） | `outputs/phase-13/pr-body.md` |

---

## 3. 不変条件

1. `scripts/cf.sh` が要求する env var 名 `CLOUDFLARE_API_TOKEN` は維持（GitHub Secret 名は別名化してよいが env への注入名は固定）
2. job-level `env:` で `CLOUDFLARE_API_TOKEN` を定義しない（step-scoped のみ許可）
3. deploy step 以外の step（build / lint / typecheck / install）から token への参照経路をゼロにする
4. PR 作成は Phase 13 のユーザー明示承認を経て実施（自動 push 禁止）
5. token 値・suffix・Cloudflare Account ID の log への漏洩ゼロ
6. CI required status check（`backend-ci` / `web-cd`）の green を維持

---

## 4. 主要成果物

| パス | 役割 |
|------|------|
| `.github/workflows/web-cd.yml` | staging / production deploy step を step-scoped 化 |
| `.github/workflows/backend-ci.yml` | wrangler-action 4 箇所の token 露出を step 限定で再確認 |
| `.github/workflows/redaction-check.yml`（新規）または既存 workflow への追加 step | log 上の token leak を grep で検出 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 正本仕様反映 |
| `scripts/redaction-check.sh`（新規） | redaction grep ロジック |

---

## 5. 依存関係

| 種別 | タスク | 状態 |
|------|--------|------|
| 上流 | Issue #331（CICD runtime warning cleanup） | 完了 |
| 関連 | `docs/30-workflows/unassigned-task/issue-331-followup-003-oidc-step-scoped-cf-token-cutover.md` | 本仕様書の原典 |
| 並列可 | なし（CI yml の同時編集は競合リスクあり） |

---

## 6. 実装区分判定根拠（CONST_004）

- 対象タスクは `.github/workflows/*.yml` の **実ファイル変更** および新規 `scripts/redaction-check.sh` の追加を含む
- 「動作させる」（staging deploy が新方式で green）が完了条件に含まれる
- よって CONST_004 に従い **実装仕様書**（コード変更を伴う）として作成

## 7. CONST_007 スコープ判定

- 全 Phase 1-13 を今回の実装プロンプト 1 サイクルで完了する設計
- OIDC 完全移行のみ「Cloudflare 側 GA 待ち」という技術的整合性破綻条件に該当するため **未タスク化** へ分離（Phase 12 で formalize）
- それ以外は本サイクルで完結
