# Phase 2: 設計 — 権限マトリクス・適用順序・rollback

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 2（設計） |
| 状態 | spec_created → planned |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流 | Phase 1 成果物 |

## 1. 目的

Phase 1 で確定した要件に基づき、Cloudflare API Token の **必要最小権限マトリクス**、
**staging → production 適用順序**、**rollback 経路**、**検証戦略** を設計し、
Phase 4 テスト戦略 / Phase 5 実装ランブックへ橋渡しする。

## 2. 既存コンポーネント再利用判定

| 観点 | 判定 | 備考 |
| --- | --- | --- |
| GitHub Environment Secret 構造（staging / production の二分割） | 採用 | UT-27 で配備済み構造を維持 |
| `scripts/cf.sh` 経由実行（直 wrangler 禁止） | 採用 | 1Password CLI + esbuild 解決 + mise の三役 |
| 既存 Variable（`CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_PAGES_PROJECT`） | 採用 | 値・参照経路ともに変更なし |
| 新規 Secret / Variable 導入 | なし | 既存 Secret の値再発行のみ |
| `cloudflare/wrangler-action@v3` | 採用 | `apiToken` / `accountId` の input 構造を維持 |

## 3. 権限マトリクス（必要最小集合）

CI/CD の `cloudflare/wrangler-action@v3` 経由で実行される 3 経路に対し、
Token に付与すべき権限と必要根拠を Resource × Permission で表化する。

### 3.1 正本マトリクス（必須付与）

| # | Resource | Permission | Scope | 必要根拠（呼び出し API / 観測経路） | 出処 |
| --- | --- | --- | --- | --- | --- |
| P1 | Account / Workers Scripts | Edit | Account（指定 Account ID 限定） | `apps/api` の `wrangler deploy --env {staging|production}`（backend-ci.yml: `command: deploy --env staging` / `command: deploy --env production`） | wrangler-action README / Cloudflare Permissions Reference |
| P2 | Account / D1 | Edit | Account（指定 Account ID 限定） | `wrangler d1 migrations apply ubm-hyogo-db-{staging|prod} --env … --remote`（backend-ci.yml: D1 マイグレーション step）。DDL 実行に Edit 必須 | scripts/cf.sh d1 系（`d1 migrations list/apply/export`） |
| P3 | Account / Cloudflare Pages | Edit | Account（指定 Account ID 限定） | `apps/web` の `wrangler pages deploy .next --project-name=…`（web-cd.yml: staging / production 両 job） | wrangler-action README |
| P4 | Account / Account Settings | Read | Account（指定 Account ID 限定） | `wrangler whoami` 等 Account 列挙、wrangler 認証チェック。Token 検証に必要 | wrangler 認証フロー |

#### 各権限の根拠根拠（CI step との対応）

- **P1 (Workers Scripts:Edit)**: `.github/workflows/backend-ci.yml` の "Deploy Workers app" step（`command: deploy --env staging` / `--env production`）。Workers script のアップロード・bindings 更新を行うため Edit 必須。
- **P2 (D1:Edit)**: `.github/workflows/backend-ci.yml` の "Apply D1 migrations" step。`migrations apply` は DDL（CREATE TABLE / ALTER TABLE 等）を実行するため Read だけでは不足。
- **P3 (Pages:Edit)**: `.github/workflows/web-cd.yml` の "Deploy web app to Cloudflare Pages" step（`pages deploy .next --project-name=…`）。Pages deployment 作成・差し替えに Edit 必須。
- **P4 (Account Settings:Read)**: `bash scripts/cf.sh whoami`、wrangler-action 起動時の token verify、Account ID 突合。

### 3.2 追加候補（実測で必要と判明した場合のみ昇格）

| # | Resource | Permission | Scope | 追加条件 |
| --- | --- | --- | --- | --- |
| O1 | Account / Workers KV Storage | Edit | Account | `wrangler deploy --env staging --dry-run` が KV binding メタ更新権限不足で失敗した場合のみ追加。現在の `apps/api/wrangler.toml` は KV binding を保持するため要実測 |
| O2 | User / User Details | Read | User | `wrangler whoami` / token verify が Account Settings:Read だけでは失敗した場合のみ追加 |

> Phase 11 smoke 実行で AC-3〜5 が通れば O1 / O2 は **不要のまま** 確定。失敗時のみ Phase 6 異常系で昇格判定する。

### 3.3 不要候補（付与しない・除外根拠）

| Resource | Permission | 除外根拠 |
| --- | --- | --- |
| Zone / DNS | Edit | 本プロジェクトは Cloudflare DNS を直接編集しない。デプロイ経路に Zone 操作なし |
| Zone / SSL and Certificates | Edit | 同上、SSL 操作なし |
| Zone / Cache Purge | Purge | キャッシュパージは行わない |
| Account / Workers R2 Storage | Edit | R2 未使用 |
| Account / Workers Queues | Edit | Queues 未使用 |
| Account / Stream | Edit | 動画ストリーム未使用 |
| Account / Images | Edit | Images 未使用 |
| Account / Email Routing | Edit | Email Routing 未使用 |
| Memberships | Read | Account Settings:Read で代替可能 |
| Account / Logs | Read | デプロイに不要、Dashboard で参照 |

## 4. staging → production 適用順序

```
[T0]  Cloudflare Dashboard で 2 本の新 Token を最小権限（P1〜P4）で発行
       ├─ "ubm-staging-YYYYMMDD"（staging 用）
       └─ "ubm-production-YYYYMMDD"（production 用）
       ※ どちらも Account scope を本プロジェクトの Account ID 1 件に限定
       │
       ▼
[T1]  GitHub staging Environment Secret を新 staging Token に更新
       └─ gh secret set CLOUDFLARE_API_TOKEN --env staging
       │
       ▼
[T2]  staging 三段検証（§6 検証戦略）
       ├─ Static  : gh secret list / gh api variables 突合
       ├─ Runtime : cf.sh whoami / d1 migrations list / api+web dry-run
       └─ Pipeline: dev ブランチへ no-op commit を push し
                   backend-ci / web-cd の deploy-staging が green
       │   PASS の場合のみ T3 へ、FAIL なら Rollback §5 R1
       ▼
[T3]  GitHub production Environment Secret を新 production Token に更新
       └─ gh secret set CLOUDFLARE_API_TOKEN --env production
       │   旧 production Token は Cloudflare Dashboard に残置（失効しない）
       ▼
[T4]  main へマージし、backend-ci / web-cd の deploy-production を観測
       └─ gh run list --branch main --workflow=backend-ci --limit 1
           gh run list --branch main --workflow=web-cd --limit 1
           conclusion: success を確認
       │   FAIL なら Rollback §5 R2
       ▼
[T5]  +24h 観測後に旧 staging / 旧 production Token を Dashboard で失効
       └─ Phase 11 evidence に失効日時のみ記録（Token 値・ID 末尾は残さない）
       ▼
完了（artifacts.json: workflow_state = verified）
```

### 適用順序の設計判断

- **staging を先に新 Token 化** する: production 影響を staging が先に吸収するため。
- **旧 Token を失効しない期間を T2〜T5 で 24h 以上確保**: 切替失敗時に `gh secret set` で旧値に即時戻せる。
- **production Token 切替（T3）と main マージ（T4）は同 PR で行わない**: Secret 更新は Dashboard 側 / CI の責務、main マージは git 側の責務として分離。
- **T5 の失効は手動操作**: 自動失効スクリプトを置かない（Token 値が必要になり監査リスクが増える）。

## 5. Rollback 設計

| ID | 失敗ポイント | rollback 手順 | 備考 |
| --- | --- | --- | --- |
| R1 | T2 staging smoke 失敗 | `gh secret set CLOUDFLARE_API_TOKEN --env staging` で旧 staging Token 値を再投入。新 staging Token は Cloudflare Dashboard で失効してよい | 旧 Token 値が手元にない場合は Cloudflare Dashboard で旧 Token を再発行（権限は旧仕様）→ Secret 更新 |
| R2 | T4 production deploy 失敗（Authentication error / 権限不足） | `gh secret set CLOUDFLARE_API_TOKEN --env production` で旧 production Token 値を即時再投入。`bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env production` で deploy も巻き戻す。Pages 側は Cloudflare Dashboard で前回 deployment を "Rollback" |
| R3 | 権限追加忘れによる Authentication error（特定 API のみ失敗） | Cloudflare Dashboard の Token 編集で必要権限を追記（例: §3.2 O1 / O2 を昇格）。**値再発行は不要**。CI を re-run | 編集だけで反映される（数分以内） |
| R4 | 旧 Token 値を失念（人為） | Cloudflare Dashboard で旧仕様の Token を新規発行 → staging を先に切戻し → 順序通り T0 から再開 | 旧 Token 値の記録は禁止のため、Dashboard 側の発行操作で代替する |
| R5 | T5 で旧 Token を残し続けた（監査リスク） | 速やかに失効、Phase 11 evidence に遅延理由を記録 | 24h を超えた場合は Phase 12 ドキュメントに「逸脱ログ」として残す |

旧 Token は **最大 24h** 保持する。それ以上の保持は監査リスクを増やすため、Phase 11 で失効ログを残す。

## 6. 検証戦略（Phase 4 へ引き継ぎ）

### 6.1 Static 検証（Token 切替前 / 切替後共通）

| 種別 | コマンド | 期待結果 | AC |
| --- | --- | --- | --- |
| Secret 存在確認 | `gh secret list --env staging` / `gh secret list --env production` | `CLOUDFLARE_API_TOKEN` が両 env に存在、値・暗号化済み hash は出力されない | AC-12 |
| workflow 参照 | `rg -n "CLOUDFLARE_API_TOKEN" .github/workflows` | backend-ci.yml / web-cd.yml で `secrets.CLOUDFLARE_API_TOKEN` のみ参照 | AC-1 補強 |
| Variable 化されていない | `gh api repos/daishiman/UBM-Hyogo/actions/variables` | 出力に `CLOUDFLARE_API_TOKEN` が含まれない（Token は Secret 専用） | AC-12 |
| Cloudflare 側権限突合 | Cloudflare Dashboard の Token 詳細ページを目視 | 付与権限が §3.1 P1〜P4 と一致、§3.3 が 0 件 | AC-1 / AC-2 |

### 6.2 Runtime 検証（staging Token 切替後・T2 で実施）

| 種別 | コマンド | 期待結果 | AC |
| --- | --- | --- | --- |
| 認証 | `bash scripts/cf.sh whoami` | exit=0、Account 情報が返る | P4 根拠 |
| D1 list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | exit=0、`Authentication error` が出ない | AC-3 |
| API deploy dry-run | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | exit=0 | AC-4 |
| Web deploy dry-run | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit=0 | AC-5 |

> ローカルから `scripts/cf.sh` で staging Token を扱う場合は 1Password 経由（`.env` の `op://` 参照）に限定する。ローカル環境で Token 値を平文 export しない。

### 6.3 Production 検証（T4 後）

| 種別 | コマンド | 期待結果 |
| --- | --- | --- |
| backend-ci の最新 run | `gh run list --branch main --workflow=backend-ci --limit 1` | `conclusion: success` |
| web-cd の最新 run | `gh run list --branch main --workflow=web-cd --limit 1` | `conclusion: success` |
| Workers 公開確認 | `curl -sI https://<api-prod>` | HTTP 2xx |
| Pages 公開確認 | `curl -sI https://<web-prod>` | HTTP 2xx |

失敗時は §5 Rollback R2 に従う。

## 7. 因果ループ確認

- **強化ループ（goal-reinforcing）**: 権限最小化 → 漏洩時影響縮小 → 監査コスト低減 → ローテーション頻度を健全化できる → 権限最小化を継続できる
- **バランスループ（goal-balancing）**: 権限を削りすぎ → deploy 失敗 → staging 検証で吸収 → 必要権限を §3.2 から昇格 → 安定状態に収束

## 8. 状態所有権

| 状態 | 所有者 | 正本 |
| --- | --- | --- |
| Cloudflare Token の権限定義 | 本タスク | Cloudflare Dashboard（Token 詳細ページ） |
| GitHub Environment Secret の値 | 本タスク（Phase 5 で更新） | GitHub Environment Secret（暗号化保管） |
| Token 値そのものの記録 | **誰も保持しない** | 運用ルール（CLAUDE.md「平文 .env 禁止」を継承） |
| ADR（staging/prod token 分離 / OIDC 将来課題化） | 本タスク + U-FIX-CF-ACCT-02 共有 | `outputs/phase-12/adr-cloudflare-token-scope.md` |

## 9. ADR 化方針

| 項目 | 方針 |
| --- | --- |
| 配置 | `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/adr-cloudflare-token-scope.md` |
| 対象 | (a) Token 必要最小権限集合（§3.1）、(b) staging / production の値分離方針、(c) scope 別 Token（Option C）と OIDC（Option D）を将来課題化する判断 |
| U-FIX-CF-ACCT-02 との整合 | 並列タスクの ADR と相互参照。02 は wrangler.toml の runtime warning 側、本 ADR は Token 権限側として責務を分離 |
| 命名規約 | Token 名は `ubm-{staging|production}-YYYYMMDD` で統一（Phase 5 で明文化） |

## 10. 不変条件 #5 への影響

§Phase 1 §10 を継承。本 Phase で導入する `D1:Edit` 権限は **CI 上の `apps/api` ディレクトリ起点のマイグレーションのみが利用** する設計であり、`apps/web` から D1 を直接呼ぶ経路を新設しない。よって不変条件 #5 は侵害しない。

## 11. AC マッピング（Phase 2 内 完結分）

| AC | Phase 2 内の根拠 |
| --- | --- |
| AC-1 | §3.1 / §3.3 で必要・不要を完全列挙、検証は §6.1 Cloudflare 側突合 |
| AC-2 | §3.1（正本 4 種、根拠付き）/ §3.2（追加候補の昇格条件） |
| AC-3〜AC-5 | §6.2 で 3 コマンドの期待結果を定義（実測は Phase 11） |
| AC-6 | §4 の T0〜T5 図解 |
| AC-7 | §5 Rollback R1〜R5 |
| AC-9 | §10 不変条件 #5 影響なし宣言 |
| AC-10 | §9 ADR 化方針で U-FIX-CF-ACCT-02 と相互参照 |
| AC-12 | §6.1 Static 検証 |

AC-8 / AC-11 は Phase 11 / Phase 1 §12 で確認済み。

## 12. 完了条件

- [x] 正本 4 種の必要権限がマトリクス化され、KV / User Details は追加候補として分離されている（§3.1 / §3.2）
- [x] 適用順序 T0〜T5 が図解されている（§4）
- [x] rollback 経路が失敗ポイント別に記載されている（§5 R1〜R5）
- [x] static / runtime / production の三段検証が定義されている（§6）
- [x] ADR 化方針が U-FIX-CF-ACCT-02 と整合している（§9）

## 13. 成果物

- 本ファイル: `outputs/phase-02/main.md`
- 引き継ぎ先: Phase 3（設計レビュー）/ Phase 4（テスト戦略）/ Phase 5（実装ランブック）/ Phase 12（ADR 配置）
