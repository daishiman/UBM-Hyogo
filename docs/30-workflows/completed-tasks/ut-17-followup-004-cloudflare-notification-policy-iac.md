# Cloudflare Notification Policy IaC 化 - タスク指示書

## メタ情報

```yaml
issue_number: 636
```

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | ut-17-followup-004-cloudflare-notification-policy-iac                 |
| タスク名     | Cloudflare Notification Policy 4 種の IaC 化と drift 検知             |
| 分類         | 改善（運用 / インフラ）                                               |
| 対象機能     | Cloudflare Account Notification Policies（Workers / D1 read+write / Pages / R2） |
| 優先度       | 低                                                                    |
| 見積もり規模 | 中規模                                                                |
| ステータス   | promoted / consumed（current workflow: `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/`） |
| 発見元       | ut-17-cloudflare-analytics-alerts                                     |
| 発見日       | 2026-05-09                                                            |

---

## Promoted / Consumed Trace

- 2026-05-14: 本 unassigned task は `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/` へ昇格済み。
- 現状態: `implementation_complete / implementation / NON_VISUAL / runtime Cloudflare mutation pending_user_approval`。
- 実装済み: `infra/cloudflare-alerts/`, `scripts/cf.sh alerts`, `.github/workflows/cloudflare-alerts-drift.yml`, `pnpm test:alerts`。
- 未実行の user-gated operation: GitHub Secret 配置、Cloudflare `alerts apply --yes`、commit、push、PR。
- 本ファイルは履歴・発見元 trace として残す。再起票・二重実行はしない。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-17 (`docs/30-workflows/ut-17-cloudflare-analytics-alerts/`) では Cloudflare 無料枠到達検知のため、Account 単位の Notification Policy を 4 種類（Workers Requests、D1 Read Queries、D1 Write Queries、Pages Requests、R2 Class A/B Operations）作成する必要がある。implementation-guide Part 5 では T9 / T10 の手順として **Cloudflare Dashboard から手動で Policy を作成・閾値設定する**ことが残作業として記載されている。

### 1.2 問題点・課題

- Dashboard 手動設定は **誰が・いつ・どの閾値で設定したか** の監査ログが Cloudflare 側 audit log にしか残らず、リポジトリ側で diff が追えない。
- 第三者（あるいは将来の自分）が Dashboard で policy を変更・削除した場合に **drift を検知する手段が無い**。webhook destination が外された場合、UT-17 の relay endpoint まで通知が到達しない silent failure になる。
- 4 policy × 閾値 × webhook destination 紐付けという構成は再現性確保が必要だが、手順書だけでは reproducibility が保証できない。
- 無料枠の絶対値（例: Workers 100k req/day）は Cloudflare 側で改定されることがあり、閾値を絶対値で書く resource では追従ができていないと alert が fire しない。

### 1.3 放置した場合の影響

- UT-17 の monthly healthcheck runbook (`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`) で「Policy が 4 件存在し webhook が紐付いている」ことを目視確認するだけになり、構造的な保証ができない。
- Cloudflare Dashboard UI 改変・権限ローテーション・誤操作で policy が消失しても気付けず、無料枠超過が Slack 通知されないまま production 課金が始まる潜在リスクが残る。
- 将来 Account を分割・複製する際に手作業が再発する。

---

## 2. 何を達成するか（What）

### 2.1 目的

UT-17 で必要な Cloudflare Notification Policy 4 種をリポジトリ管理下に置き、`pnpm` / `scripts/cf.sh` 経由で再適用・drift 検知できる状態にする。

### 2.2 最終ゴール

- 4 policy（Workers / D1 read / D1 write / Pages / R2）の定義がリポジトリに JSON もしくは HCL として存在する。
- 適用スクリプト 1 本で Cloudflare Account に冪等適用できる。
- CI（または手動 `pnpm` script）で Cloudflare 上の現状と repo 上の定義を比較し、drift があれば fail する。
- webhook destination も同じ仕組みで宣言・参照する。

### 2.3 スコープ

#### 含むもの

- 4 policy（Workers Requests / D1 Read / D1 Write / Pages Requests / R2 Class A+B）の宣言定義
- webhook destination 1 件（UT-17 relay endpoint 向け）の宣言定義
- 適用スクリプト（API 方式 or Terraform 方式）
- drift 検知スクリプト（diff 出力 + exit code）
- 1Password の token rotate 手順ドキュメント（必要 scope に届かない場合）

#### 含まないもの

- UT-17 の relay endpoint 実装変更（既に実装済み）
- 新しい Cloudflare 無料枠 metric の追加検知
- 他 Account（個人別 Account 等）への展開

### 2.4 成果物

- `infra/cloudflare-alerts/policies/*.json` もしくは `infra/cloudflare-alerts/*.tf`
- `scripts/cf.sh` 拡張（`scripts/cf.sh alerts apply` / `scripts/cf.sh alerts diff` 等）
- CI workflow（任意・最小 1 job）
- 苦戦箇所を反映したオペレーションノート

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `scripts/cf.sh` 経由で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入する既存路線を維持する（`wrangler` / `terraform` を直接呼ばない）。
- `mise exec --` 経由で Node 24 / pnpm 10 を保証する。
- 既存リポジトリには Terraform 採用箇所が無い前提で、第一候補は **Cloudflare API v4 alerting/policies + scripts/cf.sh 拡張**。Terraform 採用は既存運用への学習コストを増やすため初期はスコープ外。

### 3.2 依存タスク

- 直接の依存なし。
- 依存先: UT-17 の T9 / T10（手動設定手順は IaC 完成後に廃止する）。
- 関連: monthly healthcheck runbook の手順差し替え。

### 3.3 必要な知識

- Cloudflare API v4 `accounts/:account_id/alerting/v3/policies` および `destinations/webhooks` のスキーマ。
- Notification Policy の `alert_type` ごとに「閾値の表現方法」が異なる事実（百分率 vs 絶対値 vs 既定 quota base）。
- `scripts/cf.sh` のラッパー設計（op run + esbuild 解決 + mise exec）。
- CI で secret を扱わずに read-only diff のみ実行する手段（dry-run / list API）。

### 3.4 推奨アプローチ

1. 初期実装は **API + scripts/cf.sh 拡張**。`infra/cloudflare-alerts/policies/*.json` に 1 policy = 1 ファイルで宣言する。
2. `scripts/cf.sh alerts apply` で `POST /alerting/v3/policies` を冪等適用（既存名なら `PATCH`、無ければ `POST`）。
3. `scripts/cf.sh alerts diff` で `GET` 結果と repo 定義を JSON 正規化して diff し、差分があれば non-zero exit。
4. 将来 Terraform 採用が必要になった時点で同 JSON から HCL を生成する流れにする。

---

## 4. 完了条件チェックリスト

### 機能要件

- [ ] 4 policy + webhook destination がリポジトリ宣言から再構築できる
- [ ] `scripts/cf.sh alerts apply` が冪等で、2 回連続実行で diff が出ない
- [ ] `scripts/cf.sh alerts diff` が drift 時に exit code 非 0 を返す
- [ ] UT-17 monthly healthcheck runbook が「Dashboard 目視」から「`scripts/cf.sh alerts diff`」に差し替わっている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] secret が repo / log に転記されていない（CLAUDE.md シークレット管理ルール準拠）

### ドキュメント要件

- [ ] `infra/cloudflare-alerts/README.md`（または同等）に運用手順がある
- [ ] UT-17 implementation-guide Part 5 から本タスク完了後の手順への参照リンクがある
- [ ] 1Password token rotate 手順が必要 scope を含めて記載されている

---

## 5. 参照資料

### 関連ドキュメント

- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md`（Part 5: 外部操作残）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`
- `scripts/cf.sh`
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」

### 関連 issue / task

- ut-17-cloudflare-analytics-alerts（親 workflow）
- 他 followup（ut-17-followup-001..003）と並列・独立

### 外部参照

- Cloudflare API v4 `Alerting - Policies` (`/accounts/:account_id/alerting/v3/policies`)
- Cloudflare API v4 `Notification Destinations - Webhooks` (`/accounts/:account_id/alerting/v3/destinations/webhooks`)
- Cloudflare Terraform Provider `cloudflare_notification_policy` / `cloudflare_notification_policy_webhooks`

---

## 6. 苦戦箇所・知見（再発防止）

### 6.1 API Token scope 不足

Cloudflare Notification Policy API は **Account-scoped** で、`Account.Notifications:Edit` 権限が必要。既存の `CLOUDFLARE_API_TOKEN`（Workers / Pages / D1 / R2 deploy 用）は scope が不足している可能性が高い。

- 対応: 1Password の `CLOUDFLARE_API_TOKEN` Item を rotate するのではなく、**専用 Token を別 Item で発行**する方針を優先する（deploy 用 token と alert 管理用 token の責務分離）。
- `.env` には `op://Vault/CloudflareAlertingToken/credential` のような追加参照を足し、`scripts/cf.sh alerts` サブコマンドだけがその参照を解決する形にする。
- 既存 deploy token に scope を後から足すと、deploy 失敗時の切り分けが難しくなるため避ける。

### 6.2 webhook destination と policy の順序依存

Notification Policy は `mechanisms.webhooks[].id` で webhook destination を参照するが、webhook destination 自体が **account レベルの独立 resource** として先に作成されている必要がある。

- apply スクリプトは「webhook destination 作成 → ID を取得 → policy 適用」の順序を必ず守る。
- repo 上の policy 定義に webhook destination を ID で書くと環境再構築時に壊れる。**webhook destination の `name` を key にして apply 時に ID 解決**する設計にする。
- diff 時も destination 名→ID 解決を経由する。ID 直書きの定義は禁止する lint を入れる。

### 6.3 閾値表現の不統一（百分率 vs 絶対値）

Cloudflare Dashboard 上では「無料枠の 80%」のような百分率表示でも、API 上では `conditions.threshold` が **絶対値**（例: Workers Requests なら `80000`）で要求される resource がある。

- 4 policy のうち、どの alert_type が「無料枠基準の自動計算」で、どれが「絶対値指定」かを実装初期に必ず一覧化する。
- 絶対値指定の policy では **無料枠の base 値**（Workers 100k/day、D1 5M reads/day 等）が Cloudflare 側で改定されると追従が要る。
- 対応: `infra/cloudflare-alerts/quota-base.json` に無料枠 base を切り出し、policy JSON は `threshold = quotaBase * 0.8` のような computed 値で生成する build step を入れる。
- monthly healthcheck runbook に「Cloudflare 公式 free tier 値の差分確認」を 1 行追加する。

### 6.4 Terraform Cloudflare Provider の resource サポート差

Terraform Cloudflare Provider は alerting 関連 resource のサポートが provider バージョンに強く依存する。

- `cloudflare/cloudflare` provider v4 系では `cloudflare_notification_policy` の一部 alert_type が beta 扱いで、schema が minor バージョンで変わる事例がある。
- 初期は API + scripts/cf.sh 方式で開始し、Terraform 採用は「他 IaC を Terraform で書く必要が出た時点」で判断する（YAGNI）。
- 将来移行時には現行 JSON 定義から HCL を変換する 1 回限りの migration script で対応する想定。
- それまでは Terraform 由来の learning cost を運用に乗せない。

### 6.5 CI 上での drift 検知の secret 取り回し

CI で `scripts/cf.sh alerts diff` を回すには Cloudflare API Token が必要だが、`op run` は CI 上で動かない。

- 対応案: GitHub Actions 上では 1Password CLI ではなく **GitHub Secrets に専用 alert 管理 token を別途登録**し、CI 専用の thin wrapper（`scripts/cf.sh alerts diff --ci`）が `op run` を skip して直接 `CLOUDFLARE_ALERTS_TOKEN` を読む経路を持つ。
- secret は read-only な `Account.Notifications:Read` のみの token を別発行し、apply 用 token と分離する。
- これにより drift 検知 job が compromise しても apply 権限は流出しない。
