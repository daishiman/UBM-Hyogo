# Phase 10: 最終レビュー — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: Phase 1〜9 で設計された OIDC trust 経路 / `.github/workflows/deploy-*.yml` の YAML 差分 / `scripts/cf.sh` の token 注入経路改修 / runbook 追記は、すべて repo に commit され CI / Cloudflare 認証経路の挙動を変える実コード変更を伴う。docs-only ではなく実装仕様書として最終レビューを行う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 10 / 13 |
| upstream issue | #405 |
| mode | sequential（CI 認証経路の段階移行） |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜9 で設計した「GitHub Actions OIDC → intermediate IdP（AWS STS / 1Password Connect 等）→ 短命 Cloudflare API token (lifetime ≤ 1h)」経路と、最小 4 scope 継承（`Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read`）を維持した workflow YAML 差分・`scripts/cf.sh` 改修・rollback runbook について、設計→実装→テスト→DRY→QA→セキュリティの全観点で self-review し、Phase 11 実測 evidence 取得の可否と Phase 13 PR 作成可否を判定する。

## レビュー観点チェックリスト（最低 20 項目）

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| R01 | 長命 `secrets.CLOUDFLARE_API_TOKEN` が deploy workflow から完全消滅 | `git grep -n 'CLOUDFLARE_API_TOKEN' .github/workflows/` | 0 hit（参照は OIDC 経路の出力変数のみ） |
| R02 | OIDC `permissions: id-token: write` が deploy job のみに付与 | YAML 構造 grep / job ごとの permissions ブロック確認 | `web-cd.yml` / `backend-ci.yml` deploy job 以外で `id-token: write` 0 件 |
| R03 | `pull_request_target` 不採用 | `git grep -n 'pull_request_target' .github/workflows/` | 0 hit |
| R04 | fork PR からの OIDC 漏洩防止（trigger 制限） | trigger が `push` / `workflow_dispatch` / protected branch 限定 | 仕様一致 |
| R05 | intermediate IdP（一次候補 AWS STS）trust policy が repo / branch / environment 単位で絞り込み済 | `sub` claim の設計（`repo:daishiman/UBM-Hyogo:environment:production` 等）| audience / sub claim 設計表が phase-04 に存在 |
| R06 | 短命 token の lifetime ≤ 3600s | trust policy / token 発行 API のパラメータ確認 | `expires_on - created_on ≤ 3600` を契約として記述済 |
| R07 | 最小 4 scope 継承（U-FIX-CF-ACCT-01 から） | scope 設計表 | `Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read` の 4 件のみ |
| R08 | `scripts/cf.sh` が短命 token を環境変数として揮発的に受け取る | cf.sh diff レビュー | token 値はファイル / ログに残らない（`set +x` / `op run` 経由維持） |
| R09 | rollback 経路（長命 token 24h 一時再注入手順） | runbook（`specs/15-infrastructure-runbook.md`）の追記 | 手順 5 step 以上で記述・dry-run 検証済 |
| R10 | staging-first → production の段階移行が phase-05 に明記 | phase-05 ランブック | 「staging 7 日 green → production cutover → 24h 並行 → 長命 token 失効」順序 |
| R11 | 24h 並行運用 monitoring（旧 token `last_used_on` 観測） | phase-06 / phase-08 | Cloudflare audit log で `last_used_on` 更新がないことを確認する手順あり |
| R12 | 長命 token 失効手順（Dashboard / API） | runbook | `DELETE /accounts/:id/tokens/:id` 手順記載 |
| R13 | secret hygiene: log に token 値が残らない | redact パイプ設計 / Phase 9 grep | `Bearer\|token=\|cf_api_token=\|CF_API_TOKEN=` 0 hit を Phase 11 で grep 予定 |
| R14 | OWASP CICD top 10 の secret hygiene 観点（CICD-SEC-1 / CICD-SEC-7） | チェックリスト | 関連 4 項目以上に PASS 記録 |
| R15 | OIDC 信頼境界（CICD-SEC-3 / CICD-SEC-9） | trust policy + UT-GOV-002 整合 | sub / aud / iss claim いずれも限定済 |
| R16 | supply chain 観点（CICD-SEC-4） | action の SHA pin / `actions/configure-aws-credentials@<sha>` 等 | major tag 参照を排除し SHA pin 化 |
| R17 | aiworkflow-requirements 正本との整合 | `references/deployment-gha.md` / `deployment-secrets-management.md` | OIDC 経路追記が Phase 12 で同期される契約 |
| R18 | 既存 unassigned-task `UT-25-DERIV-04` / `UT-GOV-002` との設計重複なし | task md 突き合わせ | DERIV-04 (secret 配置 OIDC) / GOV-002 (OIDC 評価) と本タスク (deploy 認証経路) の責務分離が明文化 |
| R19 | 後続 DERIV-02 / DERIV-03 / DERIV-04 への引き渡し条件記述 | phase-12 unassigned-task-detection.md 草案 | 3 件すべて scope 境界記載 |
| R20 | solo-dev branch protection 不変条件遵守 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` |

## レビュー実施手順

### Step 1: self-review（1 周目）

1. Phase 1〜9 の各 main.md / 仕様書 phase-XX.md を順に読み返す
2. R01〜R20 を順に PASS / FAIL / N/A 判定し、根拠（ファイル名 + 行番号 + grep 結果）を記録
3. 設計→実装→テスト→DRY→QA→セキュリティの観点で漏れを探す

### Step 2: blocker 仕分け

| blocker 種別 | 分岐先（CONST_007: 先送り禁止） |
| --- | --- |
| trust policy / OIDC sub claim 設計の欠陥 | Phase 5（ランブック改修）に戻す |
| workflow YAML / cf.sh 実装上の bug 候補 | Phase 8（実装ドラフト見直し）に戻す |
| evidence 未取得（Phase 11 マター） | Phase 11 取得手順への TODO として記録 |
| 本タスク scope 外（DERIV-02/03/04 領域） | unassigned-task 起票 |

### Step 3: GO / NO-GO 判定

- hard 観点（R01〜R12, R14, R15, R20）すべて PASS → GO
- soft 観点（R13 / R16〜R19）の FAIL は理由記録で続行可
- 1 つでも hard FAIL → NO-GO（Step 2 で分岐先を確定し、本 Phase を再実施）

### Step 4: レビュー記録

`outputs/phase-10/main.md` に以下を保存:

- レビュー観点表（R01〜R20）の判定結果
- blocker 一覧（種別 / 分岐先 / 起票 unassigned-task のリンク）
- GO / NO-GO 判定と根拠
- Phase 11 実測 evidence 取得許可の有無

## 既存 unassigned-task との設計整合チェック

| 隣接 task | 重複懸念 | 本タスクの責務境界 |
| --- | --- | --- |
| UT-25-DERIV-04（cf-secrets-oidc-cd） | secret 配置 OIDC | 本タスクは deploy job の認証経路。secret 値配置経路は DERIV-04 が担う |
| UT-GOV-002-EVAL（OIDC + workflow_run） | OIDC 信頼境界の評価 | GOV-002 は監査側。本タスクは実装側で trust 設計を提供し評価 input を渡す |
| U-FIX-CF-ACCT-01-DERIV-02（scope split） | scope 設計の独立性 | 本タスクは最小 4 scope を継承。scope 分割は DERIV-02 |
| U-FIX-CF-ACCT-01-DERIV-03（rotation runbook） | rotation 概念 | OIDC 化後は trust policy 更新に概念移行 → DERIV-03 が新 runbook を策定 |
| U-FIX-CF-ACCT-01-DERIV-04（audit logs monitoring） | last_used_on 監視 | 本タスクは 24h cutover 中の一回観測。常時監視は DERIV-04 |

## OWASP CICD Top 10 観点（抜粋）

| ID | 名称 | 本タスクでの対応 |
| --- | --- | --- |
| CICD-SEC-1 | Insufficient Flow Control Mechanisms | environment + required reviewers / staging-first |
| CICD-SEC-3 | Dependency Chain Abuse | action SHA pin (R16) |
| CICD-SEC-4 | Poisoned Pipeline Execution | fork PR / `pull_request_target` 排除（R03 / R04） |
| CICD-SEC-6 | Insufficient Credential Hygiene | 短命 token / log redact / 長命 token 失効（R06 / R12 / R13） |
| CICD-SEC-7 | Insecure System Configuration | branch protection + solo-dev 不変条件（R20） |
| CICD-SEC-9 | Improper Artifact Integrity Validation | OIDC sub/aud claim 限定（R15） |

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 Phase 11 verified（最小 4 scope 確定）
- 横並走: UT-25-DERIV-04 / UT-GOV-002
- 下流: U-FIX-CF-ACCT-01-DERIV-02 / DERIV-03 / DERIV-04

## サブタスク管理

- [ ] R01〜R20 を順に判定
- [ ] blocker を Phase 5 / Phase 8 / Phase 11 / unassigned-task のいずれかに分岐
- [ ] GO / NO-GO 判定を確定
- [ ] `outputs/phase-10/main.md` を作成

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-11/evidence/qa-final-review.log`（R01〜R20 の grep 可能フラットテキスト）

## 完了条件

- [ ] レビュー観点 R01〜R20 すべてに PASS / FAIL / N/A の判定が付いている
- [ ] すべての FAIL に分岐先（Phase 5 / Phase 8 / Phase 11 TODO / unassigned-task）が割当済
- [ ] GO / NO-GO 判定が記録されている
- [ ] Phase 11 実測 evidence 取得許可の有無が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] CONST_007 違反（「Phase XX で対応」型の先送り）が無い
- [ ] solo-dev branch protection 不変条件（R20）を侵していない

## 次 Phase への引き渡し

Phase 11 へ:
- GO 判定された設計一式と R 観点 hash 記録
- NO-GO の場合の分岐指示（戻し先 Phase / 起票する unassigned-task）
- Phase 11 で取得すべき evidence の優先順位

## 実行タスク

- [ ] phase-10 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 参照資料

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `docs/30-workflows/unassigned-task/UT-25-DERIV-04-cf-secrets-oidc-cd.md`
- `docs/30-workflows/unassigned-task/UT-GOV-002-EVAL-oidc-and-workflow-run.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `CLAUDE.md`（branch protection / Cloudflare CLI / secret hygiene）
- OWASP CICD Top 10 (https://owasp.org/www-project-top-10-ci-cd-security-risks/)
