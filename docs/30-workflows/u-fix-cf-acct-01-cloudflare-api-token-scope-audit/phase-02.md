# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 2 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. wrangler-action / D1 migration / Pages deploy の各経路で必要な Cloudflare 権限を Resource × Permission で表化する。
2. staging → production の適用順序、旧 Token 保持期間、失効タイミングを設計する。
3. rollback 経路と検証戦略（grep / cf.sh / dry-run）を確定する。
4. ADR 化方針を U-FIX-CF-ACCT-02 と整合させる。

## 目的

Phase 1 で確定した要件に基づき、Token 権限マトリクス・適用順序・rollback・検証戦略を設計し、Phase 5 ランブックへ橋渡しする。

## 参照資料

- Phase 1 成果物
- `index.md`
- Cloudflare API Token Permissions Reference
- `cloudflare/wrangler-action@v3` README
- `scripts/cf.sh`

## 入力

- Phase 1 で列挙した「必要最小権限の初期見積もり」
- 並列タスク U-FIX-CF-ACCT-02 の token 分離 ADR 草案（共有予定）

## 既存コンポーネント再利用判定

| 観点 | 判定 |
| --- | --- |
| GitHub Environment Secret 構造 | 採用（staging / production の二分割を維持） |
| `scripts/cf.sh` 経由実行 | 採用（直 wrangler 禁止ルールに従う） |
| 既存 Variable（Account ID / Pages Project） | 採用（変更なし） |
| 新規 Secret / Variable 導入 | なし |

## 権限マトリクス（必要最小集合）

CI/CD で wrangler-action / D1 migration / Pages deploy を実行するために Token に付与すべき権限と、その必要根拠を以下に示す。「不要権限」は AC-1 の対象として最小化する。

| Resource | Permission | Scope | 必要根拠 | 出処 |
| --- | --- | --- | --- | --- |
| Account / Workers Scripts | Edit | Account | `apps/api` の Workers deploy（`wrangler deploy`） | wrangler-action README |
| Account / D1 | Edit | Account | `wrangler d1 migrations apply` の DDL 実行 | scripts/cf.sh d1 系 |
| Account / Cloudflare Pages | Edit | Account | `apps/web` の Pages deploy | wrangler-action README |
| Account / Account Settings | Read | Account | `wrangler whoami` 等の account 列挙 | wrangler 認証チェック |

追加候補（実測で必要と判明した場合のみ付与）:

| Resource | Permission | Scope | 追加条件 |
| --- | --- | --- | --- |
| Account / Workers KV Storage | Edit | Account | `wrangler deploy --env staging --dry-run` が KV binding メタ更新権限不足で失敗した場合 |
| User / User Details | Read | User | `wrangler whoami` / token verify が Account Settings:Read だけでは失敗した場合 |

不要候補（**付与しない**）:

- `Zone / *` 系（DNS / SSL / Cache）— 本プロジェクトは Cloudflare DNS を直接編集しない
- `Account / Workers R2 Storage` — R2 未使用
- `Account / Workers Queues` — Queues 未使用
- `Account / Stream` / `Account / Images` — 未使用
- `Memberships`（広いテンプレート由来）— Account Settings:Read で代替可

## staging → production 適用順序

```
[T0]  Cloudflare Dashboard で「production-new」Token を最小権限で発行
       │
       ▼
[T1]  staging Environment Secret を「staging-new」Token に更新
       │  ※ staging-new は同一権限で別 Token 値
       ▼
[T2]  staging で smoke 実行（次節「検証戦略」参照）
       │   PASS の場合のみ T3 へ
       ▼
[T3]  production Environment Secret を「production-new」に更新
       │  旧 production Token は Dashboard で残置（失効しない）
       ▼
[T4]  main へマージし backend-ci / web-cd の deploy-production を観測
       │   green 確認
       ▼
[T5]  +24h 観測後に「production-old」Token を Dashboard で失効
       │   staging-old も同タイミングで失効
       ▼
完了
```

## Rollback 設計

| 失敗ポイント | rollback 手順 |
| --- | --- |
| T2 staging smoke 失敗 | `gh secret set CLOUDFLARE_API_TOKEN --env staging` で旧 Token 値を再投入。新 Token は失効してよい |
| T4 production deploy 失敗 | `gh secret set CLOUDFLARE_API_TOKEN --env production` で旧 Token 値を即時再投入。`bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID>` で deploy も巻き戻す |
| 権限追加忘れによる Authentication error | Cloudflare Dashboard の Token 編集で必要権限を追記。値再発行は不要（編集だけで反映される） |
| 旧 Token 値を失念した | Cloudflare Dashboard で新規 Token を再発行し、staging/prod 双方を順序通りに切替直す（T0 から再開） |

旧 Token は **最大 24h** 保持する。それ以上の保持は監査リスクを増やすため、Phase 11 で失効ログを残す。

## 検証戦略（Phase 4 へ引き継ぎ）

### Static 検証（Token 切替前）

| 種別 | コマンド | 期待結果 |
| --- | --- | --- |
| Secret 存在 | `gh secret list --env staging` / `gh secret list --env production` | `CLOUDFLARE_API_TOKEN` が両 env に存在、値は出力されない |
| 参照 | `rg -n "CLOUDFLARE_API_TOKEN" .github/workflows` | backend-ci.yml / web-cd.yml で `secrets.CLOUDFLARE_API_TOKEN` のみ参照 |
| Variable 化されていない | `gh api repos/daishiman/UBM-Hyogo/actions/variables` | 出力に `CLOUDFLARE_API_TOKEN` が含まれない |

### Runtime 検証（staging Token 切替後）

| 種別 | コマンド | 期待結果 |
| --- | --- | --- |
| 認証 | `bash scripts/cf.sh whoami` | exit=0、Account 情報が返る |
| D1 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | exit=0、`Authentication error` が出ない |
| API deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | exit=0 |
| Web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit=0 |

### Production 検証（T4 後）

`gh run list --branch main --workflow=backend-ci --limit 1` / `--workflow=web-cd --limit 1` の `conclusion: success` を確認。失敗時は Rollback 設計の T4 行に従う。

## 因果ループ確認

- **強化ループ**: 権限最小化 → 漏洩時影響縮小 → 監査コスト低減 → ローテーション頻度を健全化できる
- **バランスループ**: 権限を削りすぎ → deploy 失敗 → staging 検証で吸収 → 必要権限を追記 → 安定状態に収束

## 状態所有権

| 状態 | 所有者 |
| --- | --- |
| Cloudflare Token の権限定義 | 本タスク（Cloudflare Dashboard が正本） |
| GitHub Environment Secret の値 | 本タスク（Phase 5 で更新） |
| Token 値そのものの記録 | **誰も保持しない**（運用ルール） |
| ADR（staging/prod token 分離） | 本タスク + U-FIX-CF-ACCT-02 共有 |

## ADR 化方針

| 項目 | 方針 |
| --- | --- |
| 場所 | `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/outputs/phase-12/adr-cloudflare-token-scope.md` |
| 対象 | Token の最小権限集合・staging/prod 値分離方針・OIDC 移行を将来課題化する判断 |
| U-FIX-CF-ACCT-02 との整合 | 並列タスクの ADR と相互参照、重複しないよう責務を分離（02 は wrangler.toml warning 側） |

## 完了条件

- [ ] 正本 4 種の必要権限がマトリクス化され、KV / User Details は追加候補として分離されている
- [ ] 適用順序 T0〜T5 が図解されている
- [ ] rollback 経路が失敗ポイント別に記載されている
- [ ] static / runtime / production の三段検証が定義されている
- [ ] ADR 化方針が U-FIX-CF-ACCT-02 と整合している

## 成果物

- `outputs/phase-02/main.md`
