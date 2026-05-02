# U-FIX-CF-ACCT-01-DERIV-01: GitHub OIDC → Cloudflare short-lived credential 連携

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-01 |
| タスク名 | GitHub Actions OIDC を起点とした Cloudflare short-lived credential への移行（長命 API Token 廃止） |
| 優先度 | HIGH |
| 推奨Wave | U-FIX-CF-ACCT-01 完了後（最小権限 Token 検証済み）、UT-25-DERIV-04 と併走可 |
| 状態 | unassigned |
| 作成日 | 2026-05-02 |
| 既存タスク組み込み | なし（U-FIX-CF-ACCT-01 本体は最小権限化で完結。OIDC 移行は CI 認証アーキテクチャ変更のため別タスクに分離） |
| 組み込み先 | - |
| 検出元 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/unassigned-task-detection.md（HIGH 行）/ phase-03 Option D |

## 目的

長命 Cloudflare API Token（GitHub Secrets に保管）を CI deploy パイプラインから廃止し、GitHub Actions の OIDC token を起点として short-lived credential を取得する経路に置き換える。Token の漏洩ブラスト半径を「permission scope の最小化」（U-FIX-CF-ACCT-01）から「lifetime の最小化」へ更に縮小する。

> **着手判断基準**: U-FIX-CF-ACCT-01 で staging / production の最小権限 Token 運用が安定し、Phase 11 verified に到達した後。UT-25-DERIV-04（secret 自動配置）と OIDC 設定を共有できる時期に着手する。

## スコープ

### 含む

- Cloudflare 側で GitHub OIDC を受け入れる経路の確立（現実的には intermediate IdP 経由 or short-lived API Token 発行 API の利用）
- `.github/workflows/*.yml` の deploy job における長命 Token 参照箇所の OIDC 経路への置換
- staging-first 適用（staging 経路で short-lived 化を先行検証 → production へ展開）
- 旧長命 Token の段階的失効（24h 並行運用 → 失効）
- runbook 化（OIDC 失敗時の rollback、long-lived Token 一時再注入手順）

### 含まない

- Cloudflare Access for SaaS による Worker 直接アクセス制御
- secret 値そのものの rotation 自動化（U-FIX-CF-ACCT-01-DERIV-03 で扱う）
- D1 / KV / Pages の scope 別 Token 分割（U-FIX-CF-ACCT-01-DERIV-02 で扱う）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | U-FIX-CF-ACCT-01 | 最小権限 Token の運用が安定し、必要 scope が確定していること |
| 上流 | UT-25-DERIV-04 | OIDC + Cloudflare 認可基盤を共有する可能性 |
| 関連 | UT-GOV-002（OIDC + workflow_run 評価） | OIDC 信頼境界の設計知見を共有 |
| 下流 | rotation runbook（DERIV-03） | OIDC 化後は rotation 概念が「Token rotation」から「Trust Policy 更新」に移行する |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| U-FIX-CF-ACCT-01 が Phase 11 verified | 必要 scope が実測で確定していないと OIDC 後の credential scope を設計できない |
| Cloudflare 側で OIDC 受け入れ経路が技術的に確立 | Cloudflare API は GitHub OIDC を直接 IAM 統合しないため、intermediate IdP or 短命 Token 発行経路の検証が必要 |
| GitHub Environments の required reviewers 運用が確立 | production 経路の保護が前提 |

## 苦戦箇所・知見

**1. Cloudflare の OIDC 直接受入れ非対応**
Cloudflare API は GitHub OIDC を IAM に直接統合しない。現実的経路は (a) AWS / GCP / Vault などの intermediate IdP で OIDC を受け、そこから Cloudflare API Token を取得、(b) 1Password Connect の Service Account JWT を OIDC ベースで取得し Cloudflare API Token を pull、(c) Cloudflare の short-lived Token 発行 API があれば直接利用、の 3 通り。MVP では (a) または (b) で開始する。

**2. 「short-lived」の lifetime 設計**
job 単位で credential を取得し、job 完了で破棄する。lifetime は最大 1 時間以内を目標。retry や long-running deploy では re-issue 経路を用意する。

**3. fork PR と pull_request_target からの OIDC 漏洩防止**
`pull_request_target` を採用しない。fork PR の workflow から OIDC token が intermediate IdP に到達できないよう、`permissions: id-token: write` を付与する job を `workflow_dispatch` か `push` (protected branch) に限定する。

**4. rollback 経路の確保**
OIDC 経路が壊れた場合、緊急 rollback として長命 Token を 24h 一時再注入できる runbook を残す。完全廃止は OIDC 経路で 30 日連続 green 確認後とする。

**5. U-FIX-CF-ACCT-01 で確定した最小 4 scope を OIDC 後 credential にも継承**
`Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read` の 4 scope を short-lived credential 側でも維持する。OIDC 化を機に scope を緩めない。

## 実行概要

1. U-FIX-CF-ACCT-01 Phase 11 verified を確認し、最小 scope を確定
2. intermediate IdP 経路（AWS STS or 1Password Connect）の PoC を staging で実施
3. `.github/workflows/deploy-*.yml` の `secrets.CLOUDFLARE_API_TOKEN` 参照を OIDC 経路に置換
4. staging で 7 日連続 green を確認
5. production へ展開、24h 並行運用後に旧長命 Token を失効
6. runbook（緊急 rollback / OIDC 失敗時の長命 Token 一時再注入）を整備

## 完了条件

- [ ] deploy workflow が長命 `CLOUDFLARE_API_TOKEN` Secret を参照しない
- [ ] short-lived credential の lifetime が 1 時間以内
- [ ] staging / production それぞれで OIDC 経路が独立に成立する
- [ ] 旧長命 Token が失効済み（Cloudflare Dashboard で確認）
- [ ] 緊急 rollback 手順が runbook 化されている
- [ ] short-lived credential の scope が最小 4 scope に限定されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-03.md | Option D の長命 Token 廃止経路詳細 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 正本仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | GitHub Actions deploy 経路の正本 |
| 関連 | docs/30-workflows/unassigned-task/UT-25-DERIV-04-cf-secrets-oidc-cd.md | secret 配置 OIDC との設計共有 |
| 関連 | docs/30-workflows/unassigned-task/UT-GOV-002-EVAL-oidc-and-workflow-run.md | OIDC 信頼境界の評価 |
| 参考 | https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect | GitHub OIDC ハードニング |
| 参考 | https://developers.cloudflare.com/fundamentals/api/get-started/create-token/ | Cloudflare API Token scope |
