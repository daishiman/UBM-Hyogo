# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本タスクは `infra/cloudflare-alerts/` 配下の宣言ファイル群と `scripts/cf.sh alerts` サブコマンドの実コード追加、および drift 検知 CI workflow の新規作成を伴う。Dashboard 手動設定の置換は単なる手順差し替えではなく、Cloudflare API v4 を冪等に呼び出す apply / diff ロジックの実装を前提とするため、ドキュメント整備のみでは閉じない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (ut-17-followup-004) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |

## 目的

親 UT-17 が外部操作残（T9 / T10）として残置した「Cloudflare Dashboard からの Notification Policy 4カテゴリ / 5 policy＋webhook destination 1 件の手動設定」を、リポジトリ宣言 + `scripts/cf.sh alerts` サブコマンド + drift 検知 CI で構造的に再現性・監査性を確保する状態に置換する要件を確定する。
本 Phase では「Terraform 不採用」「API + cf.sh 拡張」「API Token scope 分離（apply / read）」「閾値の `quota-base.json` 経由計算」の 4 つの基本方針を不変条件として固定し、Phase 2 設計の手戻りを防ぐ。

## 真の論点

本タスクの本質的な論点は以下の 4 点である。

1. **採用方式の確定（Terraform vs API + cf.sh）**:
   Cloudflare Terraform Provider `cloudflare/cloudflare` v4 系は alerting 関連 resource のサポートが provider バージョンで揺れる（一部 alert_type が beta 扱い）。既存リポジトリには Terraform 採用箇所が無く、Terraform 採用は learning cost と state 管理運用を新規に持ち込むことになる。本タスクは LOW 優先度かつ 4 category / 5 policy + 1 webhook という小規模であるため、**Cloudflare API v4 + `scripts/cf.sh alerts` 拡張を初期方式として確定**し、Terraform 採用は他 IaC が Terraform 化される時点まで先送りする（YAGNI 原則）。JSON 宣言は Cloudflare API v4 と 1:1 構造を保ち、将来 HCL 化が必要になった時点で 1 回の migration script で対応可能な形にする。

2. **API Token scope 分離**:
   Notification Policy API は `Account.Notifications:Edit` scope を要求するが、既存 `CLOUDFLARE_API_TOKEN`（Workers / Pages / D1 / R2 deploy 用）には不足している可能性が高い。deploy token に scope を後から足すと、deploy 失敗時の切り分けが複雑化する。**apply 用 token と read 用 token を別 1Password Item で発行**し、CI（drift 検知）は read-only token のみを使う運用にする。これにより drift 検知 job が compromise しても apply 権限は流出しない。

3. **閾値表現の不統一への対応**:
   Cloudflare Dashboard 上では「無料枠の 80%」のような百分率表示でも、API 上では `conditions.threshold` が**絶対値**で要求される alert_type がある。無料枠の絶対値（例: Workers 100k req/day、D1 5M reads/day）は Cloudflare 側で改定される可能性があり、絶対値直書きでは追従できず alert が fire しない事態が発生する。**`infra/cloudflare-alerts/quota-base.json` に無料枠 base 値を中央集約**し、policy JSON 内では係数のみ表現する。apply 直前に base × 係数で絶対値に展開する。

4. **webhook destination と policy の順序依存**:
   Notification Policy は `mechanisms.webhooks[].id` で webhook destination を参照するが、webhook destination は account レベルの独立 resource として先に作成されている必要がある。policy JSON に webhook ID を直書きすると Account 再構築時に壊れる。**webhook destination の `name` を key として参照**し、apply 時に ID 解決する設計に統一する。ID 直書きの定義は lint で禁止する。

## 依存境界と責務

| 種別 | 対象 | 本タスクとの境界 |
| --- | --- | --- |
| 上流 | 親 UT-17 (`docs/30-workflows/ut-17-cloudflare-analytics-alerts/`) | 4 category / 5 policy の閾値・webhook destination URL（relay endpoint）・Notification Type が確定済 |
| 上流 | `scripts/cf.sh` | `op run` + `mise exec` + `ESBUILD_BINARY_PATH` 解決基盤を再利用。同ファイル内に `alerts` サブコマンドを追加 |
| 上流 | 1Password Environments | 新規 alert 用 token 2 種（apply / read）の正本配置 |
| 上流 | CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」 | `wrangler` 直接呼び禁止、`bash scripts/cf.sh` 経由のみという不変条件 |
| 連携 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「Dashboard 目視」手順を「`pnpm cf:alerts:diff`」へ差し替え方針 |
| 下流 | 親 UT-17 implementation-guide Part 5（T9 / T10） | 「Dashboard 手動設定」記述を `bash scripts/cf.sh alerts apply` へ更新（Phase 12 同期で実施） |
| 対象外 | UT-17 relay endpoint 実装 | 既に実装済。本タスクでは触らない |
| 対象外 | 新規メトリクスの追加 | 既存 4カテゴリ / 5 policy＋R2 の宣言化のみ |
| 対象外 | 他 Account への展開 | 単一 Account 前提 |
| 対象外 | UT-17 / UT-08 が予約済の Slack Webhook / `CF_WEBHOOK_AUTH_SECRET` | 命名・配置はそのまま流用、本タスクでは扱わない |

## 価値とコスト評価

- **初回提供価値**:
  - Cloudflare Notification Policy 4カテゴリ / 5 policy＋webhook destination 1 件が git 履歴付きで追跡可能になる
  - Dashboard 誤操作・権限ローテ・第三者変更による silent failure（webhook 紐付け切れ）を `alerts diff` で構造的に検知できる
  - Account 再構築・複製時に `alerts apply` 一発で再構成できる（手順書の reproducibility 担保）
  - 無料枠 base 値が `quota-base.json` に集約され、Cloudflare 側の無料枠改定に対する追従コストが最小化される

- **初回に払わないコスト**:
  - Terraform state 管理 / provider バージョン追従コスト（YAGNI で棄却）
  - Cloudflare 公式 SaaS 監査機能 / 有料 Health Checks（plan gate 外）
  - WAE 計装による独自 metric 追加（UT-08 責務、本タスクでは扱わない）

- **設計コスト**:
  - Phase 2 で 5 ドキュメント作成（architecture / directory-layout / cf-sh-alerts-spec / api-mapping / token-scope-design）
  - alert_type 4カテゴリ / 5 policyの正式名称と閾値表現の Cloudflare 公式仕様確認

- **実装コスト**（Phase 4 以降想定）:
  - `infra/cloudflare-alerts/` 配下 JSON 約 6〜8 ファイル
  - `scripts/cf.sh` 拡張（`alerts` case 分岐追加、約 100〜200 行 bash + tsx スクリプト）
  - drift 検知 CI workflow 1 件
  - `infra/cloudflare-alerts/README.md` 約 100 行

- **運用コスト**:
  - 月次 drift 確認（`pnpm cf:alerts:diff` を runbook 経由）
  - Cloudflare 無料枠改定時の `quota-base.json` 更新
  - alert 用 token rotate（年次想定）

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | Dashboard 手動設定の IaC 化が UT-17 silent failure 防止と Account 再構築の reproducibility に直結するか | PASS |
| 実現性 | Cloudflare API v4 alerting/v3 endpoints + `scripts/cf.sh` 拡張で AC-1〜AC-12 を満たせるか | CONDITIONAL |
| 整合性 | 既存 `CLOUDFLARE_API_TOKEN`（deploy 用）と新規 alert 用 token が責務分離されているか、CLAUDE.md `scripts/cf.sh` 不変条件と矛盾しないか | PASS |
| 運用性 | 月次 drift 確認 + token rotate + `quota-base.json` 更新の運用が継続可能か | PASS |

CONDITIONAL の解消条件:

- Cloudflare API v4 `/accounts/:account_id/alerting/v3/policies` および `/destinations/webhooks` が現行 API で利用可能であることを Phase 2 設計前に公式仕様で再確認する
- alert_type 4カテゴリ / 5 policy（Workers Daily Requests / D1 Read Rows / D1 Write Rows / Pages Build / R2 Class A operations）の正式 API 名称を Phase 2 で確定する（未確認 gate のメトリクスは Phase 2 で代替方針を併記）
- `Account.Notifications:Edit` および `Account.Notifications:Read` の Token Permission が Cloudflare ダッシュボード上で実際に発行可能であることを Phase 2 で確認する（未提供の場合は最小上位 scope へフォールバック）

## 既存資産インベントリ

| 資産 | 確認対象 | 確認方法 |
| --- | --- | --- |
| 親 UT-17 phase-02 alert-policy-matrix.md | 4 category / 5 policy の閾値・Notification Type | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-02/alert-policy-matrix.md` |
| 親 UT-17 phase-02 secret-management.md | UT-17 既存 Secret 命名 / `CF_WEBHOOK_AUTH_SECRET` | 同上 outputs/phase-02/secret-management.md |
| 親 UT-17 phase-12 implementation-guide.md Part 5 | T9 / T10 外部操作残記述 | 同上 outputs/phase-12/implementation-guide.md |
| `scripts/cf.sh` | `api-get` / `api-post` / `audit-log` / `r2` のサブコマンド拡張パターン | リポジトリルート `scripts/cf.sh`（既存 228 行） |
| `scripts/with-env.sh` | `op run --env-file=.env` ラッパー | `scripts/with-env.sh` |
| 1Password Environments | 新規 alert token 2 種の配置先 Vault | CLAUDE.md「シークレット管理」 |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 差し替え対象 runbook | 該当ファイル |
| `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md` | アラート一次対応 runbook | 該当ファイル |
| `.github/workflows/` 配下 | drift 検知 CI 追加先 | 既存 workflow との命名規約 |
| Cloudflare API v4 alerting endpoint | endpoint 提供状況 | Phase 2 で公式ドキュメント再確認 |

## スコープ確定

### 含む

- `infra/cloudflare-alerts/` ディレクトリ新規作成
  - `policies/*.json` × 4〜5 件（Workers / D1 read / D1 write / Pages / R2）
  - `webhooks/*.json` × 1 件（UT-17 relay endpoint）
  - `quota-base.json`（無料枠 base 値）
  - `README.md`（運用手順）
- `scripts/cf.sh` への `alerts` サブコマンド追加
  - `alerts apply` / `alerts diff` / `alerts list`
  - `--ci` フラグで `op run` スキップ経路
- API Token scope 分離設計
  - `CLOUDFLARE_ALERTS_TOKEN_APPLY`（`Account.Notifications:Edit`）
  - `CLOUDFLARE_ALERTS_TOKEN_READ`（`Account.Notifications:Read`）
  - 1Password 正本パス追加、`.env`（op:// 参照のみ）追加
- `.github/workflows/cloudflare-alerts-drift.yml` 新規作成
- 親 UT-17 implementation-guide Part 5（T9 / T10）参照リンク追記方針
- monthly healthcheck runbook 差し替え方針
- 1Password token rotate 手順ドキュメント

### 含まない

- 親 UT-17 relay endpoint コードの変更
- Cloudflare Terraform Provider 採用（YAGNI で棄却）
- 新規メトリクスの追加検知
- 他 Account 展開
- `apps/web` / `apps/api` への影響
- D1 schema 変更
- UT-08 / UT-17 既存 Secret 命名の変更

## 受入条件 (AC) 確認

index.md で定義された AC-1〜AC-12 を Phase 1 で正式承認する。
Phase 2 が AC-1〜AC-8 / AC-11 の設計仕様、Phase 3 が AC-12（GO/NO-GO）、Phase 4〜10 が AC-1〜AC-8 / AC-11 の実装、Phase 12 が AC-9 / AC-10 の正本同期にそれぞれ対応する。

## 用語集

| 用語 | 意味 |
| --- | --- |
| Notification Policy | Cloudflare の通知設定単位。発火条件（alert_type / conditions）と送信先（mechanisms）のセット |
| Webhook Destination | Cloudflare Notifications がイベントを HTTP POST する宛先 resource。Account レベルで独立して存在 |
| alert_type | Notification Policy の発火条件種別を表す Cloudflare API v4 上の識別子（例: `billing_usage_alert`） |
| quota-base | 無料枠の絶対値（Workers 100k req/day 等）の中央集約定義。`quota-base.json` に格納 |
| drift | リポジトリ宣言と Cloudflare 上の実状態の差分 |
| apply | 宣言を Cloudflare 上に冪等適用する操作。既存名なら PUT、無ければ POST |
| diff | Cloudflare 上の現状と repo 宣言の差分を表示し drift 検知する操作 |
| `CLOUDFLARE_ALERTS_TOKEN_APPLY` | apply 専用 API Token（`Account.Notifications:Edit` scope） |
| `CLOUDFLARE_ALERTS_TOKEN_READ` | read 専用 API Token（`Account.Notifications:Read` scope）。CI で使用 |

## 実行タスク

- [ ] 元タスク指示書 `docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md` を読み、前提条件を確認する
- [ ] 親 UT-17 phase-02 alert-policy-matrix.md / secret-management.md / phase-12 implementation-guide.md を確認し、閾値・Notification Type・既存 Secret 命名を入力として固定する
- [ ] 真の論点 4 点（採用方式 / Token scope 分離 / 閾値表現 / 順序依存）を文書化する
- [ ] スコープ（含む/含まない）を確定する
- [ ] 受入条件 AC-1〜AC-12 を Phase 1 で正式承認する
- [ ] 4 条件評価を行い、CONDITIONAL の解消条件を記録する
- [ ] 既存資産インベントリ（`scripts/cf.sh` 拡張パターン / 1Password Vault / runbook 構造）を洗い出す
- [ ] Cloudflare API v4 alerting endpoint と `Account.Notifications:Edit/Read` Token Permission の利用可否を Phase 2 設計前に公式仕様で再確認する旨を記録
- [ ] `outputs/phase-01/requirements.md` を作成する

## 統合テスト連携

本 Phase は要件定義のみで、実コード・Cloudflare API 呼び出し・Secret 投入を実行しない。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 2 設計 | 採用方式確定 / Token scope 設計 / JSON schema 設計 | 論点と CONDITIONAL 解消条件を入力として渡す |
| Phase 7 実装 | `scripts/cf.sh alerts` 拡張 / JSON 宣言作成 / CI workflow 追加 | 要件のみ確定。実装は Phase 7 |
| 親 UT-17 implementation-guide | T9 / T10 記述更新 | Phase 12 同期で実施 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md | 元タスク指示書 |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/index.md | 本仕様書 index |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-02/alert-policy-matrix.md | 親 UT-17 閾値マトリクス |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md | 親 UT-17 T9 / T10 外部操作残 |
| 必須 | scripts/cf.sh | 拡張対象ラッパー |
| 必須 | CLAUDE.md | シークレット管理 / Cloudflare CLI 実行ルール |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | Cloudflare API v4 alerting/v3/policies |
| 参考 | https://developers.cloudflare.com/api/operations/notification-webhooks-create-webhook | alerting/v3/destinations/webhooks |
| 参考 | https://developers.cloudflare.com/fundamentals/api/reference/permissions/ | Account-scoped Token Permission 一覧 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（論点・スコープ・AC・4条件評価・既存資産インベントリ・用語集） |

## 完了条件

- [ ] 真の論点 4 点（採用方式 / Token scope 分離 / 閾値表現 / 順序依存）が文書化されている
- [ ] 4 条件評価が各条件について PASS / CONDITIONAL で記録され、CONDITIONAL の解消条件が明示されている
- [ ] AC-1〜AC-12 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリ（`scripts/cf.sh` / 1Password / runbook / Cloudflare API endpoint）が記録されている
- [ ] Cloudflare API v4 alerting endpoint と Token Permission の事前確認方針が記載されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（Cloudflare API alerting endpoint 廃止 / Token Permission 名変更 / 親 UT-17 仕様変更）を確認済み
- 次 Phase への引き継ぎ事項を記述

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 真の論点 4 点 / AC-1〜AC-12 / スコープ / 4 条件評価 CONDITIONAL 解消条件 / 既存資産インベントリ / Cloudflare API v4 alerting endpoint 確認方針 を Phase 2 設計の入力として渡す
- ブロック条件: `outputs/phase-01/requirements.md` が未作成、または CONDITIONAL 解消条件が未記録の場合は Phase 2 に進まない
