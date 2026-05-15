# Phase 1: 要件定義・スコープ確定

## 目的

Issue #662 が CLOSED であるにもかかわらず未作成のまま残っている `staging` / `production` Environment 用 Cloudflare deploy secret provisioning runbook 2 本を、canonical 化された運用文書として整備する。本 Phase ではタスクの主体・目的・成功条件・スコープ境界を確定する。

## なぜ必要か（中学生向け Why）

GitHub Actions が Cloudflare へデプロイするとき、`secrets.CLOUDFLARE_API_TOKEN` という「合鍵」を使う。合鍵は `staging`（試運転）と `production`（本番）の 2 種類あり、それぞれ違う部屋（Environment）の金庫に入っている。今、その金庫に「どの合鍵を、誰が、どう入れるか」を書いた説明書（runbook）が片方しか無い状態。説明書が無いと、合鍵が無くなったときや交換したいときに右往左往してデプロイが止まる。本タスクは残り 2 部屋分の説明書を書く。

## スコープ

### 含む
- `runbooks/staging-secret-provisioning.md` の新規作成
- `runbooks/production-secret-provisioning.md` の新規作成
- 既存 `runbooks/secret-provisioning.md` と章立てを揃える
- 親 `index.md` の In-scope 充足確認

### 含まない
- 実 secret 値の記述・rotation 実施
- `.github/workflows/*.yml` の修正（task-01 で完了済）
- `CLOUDFLARE_ACCOUNT_ID` の管理（GitHub Variables 側）
- helper script (`scripts/smoke/provision-*-secrets.sh` 等) の新規追加
- `staging-runtime-smoke` 用既存 runbook の再編集

## 成功条件

1. `staging-secret-provisioning.md` / `production-secret-provisioning.md` が存在する
2. 既存 `secret-provisioning.md` と同じ 7 章立てで揃っている
3. 実 secret 様文字列（hex 32+ / `eyJ` JWT prefix）が grep で 0 件である
4. 親 `index.md` から 3 つの runbook が参照可能である
5. `apps/` / `packages/` / `.github/workflows/` の差分が 0 である（script helper の stale CLI contract correction のみ許容）

## ユーザーシナリオ

| 役割 | シナリオ |
|------|---------|
| 新規参画開発者 | `staging` Environment に Cloudflare token を入れたい → `staging-secret-provisioning.md` を読み、`gh secret set` 経路で投入できる |
| oncall | `web-cd / deploy-staging` 失敗時に「どの secret が登録されているべきか」を `gh api` で確認する正規手順を即時参照できる |
| 運用担当 | Cloudflare token を rotation する際、1Password 更新 → `gh secret set` 上書きの正規順序を runbook で確認できる |

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 1 |
| 状態 | completed |

## 実行タスク

- 要件・スコープ・成功条件を確定する。

## 参照資料

- `index.md`
- `.github/workflows/web-cd.yml`

## 成果物/実行手順

- 本 Phase 文書。

## 統合テスト連携

- docs-only / NON_VISUAL のため実行テストは Phase 11 grep gate で代替する。

- 本 Phase ファイルが scope / 成功条件 / 含む含まない を確定して記述している
- Phase 2 以降が本 Phase の境界に従って設計される
