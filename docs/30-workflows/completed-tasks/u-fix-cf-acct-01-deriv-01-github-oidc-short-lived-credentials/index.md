# u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | post-u-fix-cf-acct-01（U-FIX-CF-ACCT-01 Phase 11 verified 後に着手する DERIV-01） |
| mode | parallel（DERIV-02 / DERIV-03 / DERIV-04 と独立に進められる。共有面は OIDC trust policy の更新のみ） |
| owner | - |
| 状態 | spec_created / implementation-spec / Phase 1-13 outputs present / Phase 12 strict outputs present / runtime evidence pending_user_approval |
| visualEvidence | NON_VISUAL（CI/CD 認証経路の置換であり画面 UI の変更を伴わない） |
| related_issue | #405（closed） |

## purpose

GitHub Actions の deploy workflow が長命 `secrets.CLOUDFLARE_API_TOKEN` を参照している現行経路を、GitHub OIDC を起点とした短命クレデンシャル（lifetime ≤ 1 時間、job スコープ）に置換し、Token 漏洩のブラスト半径を「permission scope の最小化（U-FIX-CF-ACCT-01 で達成）」から「lifetime の最小化」へ更に縮小する。

ビジネス価値: 長命 Token の偶発的漏洩・リポジトリ secret 同期事故・元コラボレーターの secret 露見といった rotation 起因のリスクを、Token そのものを GitHub Secrets に持たない構造で排除する。

## why this is not a restored old task

本タスクは U-FIX-CF-ACCT-01 本体の再実装ではない。U-FIX-CF-ACCT-01 は `Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read` の 4 scope に最小化することで完結している。本 DERIV-01 はそこから派生する CI 認証アーキテクチャ変更（長命→短命 / Secrets→OIDC trust）を扱う独立タスクであり、`unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md` を正本として展開する。

## scope in / out

### Scope In
- Cloudflare 側で GitHub OIDC を受け入れる経路の確立（intermediate IdP 経由 or short-lived API Token 発行 API 利用）
- 現行 `.github/workflows/web-cd.yml` / `backend-ci.yml`（必要に応じて `d1-migration-verify.yml`）で参照されている長命 `secrets.CLOUDFLARE_API_TOKEN` の OIDC 経由短命 token への置換
- `permissions: id-token: write` を deploy job 単位で付与
- staging-first（staging で 7 日連続 green を確認 → production 展開 → 24h 並行運用 → 旧長命 Token 失効）
- `scripts/cf.sh` の token 注入経路改修（OIDC モード / 旧モードの切替フラグ）
- 緊急 rollback runbook（長命 Token を 1Password に退避し 24h 限定で再注入する手順）
- 仕様正本の更新（`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` および `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` / `deployment-gha.md`）

### Scope Out
- D1 / KV / Pages の scope 別 Token 分割（DERIV-02）
- 90 日 rotation runbook の整備（DERIV-03）
- audit logs / monitoring 整備（DERIV-04）
- secret 値そのものの自動 rotation 機構
- Cloudflare Access for SaaS による Worker 直接アクセス制御
- 新規 deploy workflow の追加（既存 workflow の認証経路置換のみ）

## dependencies

### Depends On
- U-FIX-CF-ACCT-01 Phase 11 verified（最小 4 scope の実測確定）
- intermediate IdP 経路（AWS STS / 1Password Connect / Vault 等）の技術的成立確認
- GitHub Environments の required reviewers 運用（production 経路の保護前提）

### Blocks
- U-FIX-CF-ACCT-01-DERIV-03（rotation runbook 改訂。OIDC 化後は「Token rotation」が「Trust Policy 更新」に置換されるため設計が変わる）

### Related
- UT-25-DERIV-04（CF Secrets OIDC CD）: secret 配置 OIDC との設計共有
- UT-GOV-002（OIDC + workflow_run 評価）: OIDC 信頼境界の設計知見を共有

## refs

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`（上流タスク仕様・正本）
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-02-scope-split-tokens.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`
- `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-03.md`（Option D 詳細）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`（インフラ runbook 正本）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（Cloudflare Secrets 正本）
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（GitHub Actions deploy 正本）
- `scripts/cf.sh`（Cloudflare CLI ラッパー / token 注入の正本）
- `CLAUDE.md`（cf.sh 経由必須 / `.env` 取扱 / branch / governance）
- 参考: GitHub OIDC ハードニング公式（`https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect`）
- 参考: Cloudflare API Token scope（`https://developers.cloudflare.com/fundamentals/api/get-started/create-token/`）

## canonical matrix

| Axis | Canonical Value |
| --- | --- |
| primary IdP | AWS STS（GitHub OIDC federation）。1Password Connect / Cloudflare direct short-lived API は PoC 成立時のみ差替候補 |
| real workflow inventory | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| current token references | `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_API_TOKEN_STAGING` are current facts until runtime cutover |
| credential boundary | Cloudflare API Token 自体の短命発行が PoC 不成立の場合は、GitHub Secret 排除 + AWS STS session <= 3600s + job-scoped retrieval を target とし、`short-lived Cloudflare credential` と断言しない |
| non-existent names | 旧 draft の deploy 専用 workflow 名は使わず、現行 workflow 名へ正規化する |
| evidence count | Phase 11 runtime evidence は 13 件（11 runtime categories + fork PR isolation + approval-gates log） |
| approval gates | G1 trust policy / G2 staging cutover / G3 production cutover / G4 long-lived token revoke。commit / push / PR は独立 user approval |
| runtime boundary | 本 spec_created cycle では workflow YAML 改修・deploy・token revoke・commit・push・PR を実行しない |

## AC

上流の完了条件 6 項目を継承し、DERIV 固有の OIDC 信頼境界ハードニング項目を追加する。

- [ ] AC1: deploy workflow が長命 `secrets.CLOUDFLARE_API_TOKEN` を**一切参照しない**（grep で hit 0）
- [ ] AC2: 取得される短命 credential の lifetime が **1 時間以内** であることを Cloudflare API で実測
- [ ] AC3: staging / production それぞれで OIDC 経路が**独立に成立**する（trust policy が environment 単位で分離）
- [ ] AC4: 旧長命 Token が**失効済み**であることを Cloudflare Dashboard / API で確認
- [ ] AC5: 緊急 rollback 手順（長命 Token 一時再注入 24h）が runbook 化されている
- [ ] AC6: 短命 credential の scope が U-FIX-CF-ACCT-01 で確定した最小 **4 scope** に限定されている（`Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read`）
- [ ] AC7（DERIV 固有）: trust policy の subject claim が `repo:daishiman/UBM-Hyogo:ref:refs/heads/{dev,main}` および `environment:{staging,production}` で**最小化**されており、fork PR / `pull_request_target` から漏洩しない設計になっている
- [ ] AC8（DERIV 固有）: GitHub Actions OIDC subject ログと Cloudflare audit ログが**突合可能**な形で記録されている
- [ ] AC9（DERIV 固有）: staging で **7 日連続 green** の deploy 実績が evidence として保存される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #14 Cloudflare free-tier（intermediate IdP 経路の追加コスト・quota 影響を free-tier 内に収める）
- #5 admin / CI 境界（CI から production への副作用が短命 credential のみで成立し、長命 Token を経由しない）

## completion definition

全 phase 仕様書と `outputs/phase-*` 実体が揃い、(a) OIDC trust policy 設計、(b) workflow YAML 改修方針、(c) `scripts/cf.sh` の token 注入分岐方針、(d) staging-first の段階展開計画、(e) 緊急 rollback runbook、(f) 旧長命 Token 失効手順 が evidence path / approval gate（G1〜G4）と紐づいた状態で文書化されていること。実 workflow YAML 改修・実 deploy・commit・push・PR 作成は本仕様書作成タスクには含めず、後続のユーザー承認付き実行 phase で扱う。
