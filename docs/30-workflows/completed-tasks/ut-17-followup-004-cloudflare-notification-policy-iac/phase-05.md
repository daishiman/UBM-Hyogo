# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化と drift 検知 (UT-17-followup-004) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (テスト戦略) |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 4 の T1〜T10 のうち T3〜T9 は **JSON 宣言群 / shell + Node 補助スクリプト / GitHub Actions workflow を実コードとして実装する**。本 Phase はそのコード実装の着手前計画として、変更対象ファイル・subcommand シグネチャ・JSON schema・入出力副作用・実装順序を CONST_005 必須項目に沿って固定する。Issue #636 は CLOSED の Refs であり、本仕様の SSOT は本ドキュメント群とする。 |

---

## 目的

Phase 4 のサブタスク T1〜T10 を、Phase 06（テスト戦略）以降が即着手できる粒度まで具体化する。
本 Phase の出力は CONST_005（変更対象ファイル / subcommand シグネチャ / JSON schema / 入出力・副作用 / 依存ライブラリ / 実装順序）の
全項目を満たす `outputs/phase-05/implementation-plan.md` を中心に構成する。

CONST_007 先送り禁止: Cloudflare API token scope 不足、webhook destination 順序依存、閾値表現の不統一（百分率 vs 絶対値）、
CI 上での secret 取り回し、の 4 つの既知リスクは本 Phase 内で対策を確定する（章 5-8）。

---

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 役割 | 担当サブタスク |
| --- | --- | --- | --- |
| 新規 | `infra/cloudflare-alerts/README.md` | ディレクトリ運用手順・token scope 方針・apply/diff/list 早見表 | T1 |
| 新規 | `infra/cloudflare-alerts/quota-base.json` | Cloudflare 無料枠 base 値 SSOT（Workers/D1 read/D1 write/Pages/R2） | T2 |
| 新規 | `infra/cloudflare-alerts/policies/workers-requests.json` | Workers Requests > 80% policy 宣言 | T3 |
| 新規 | `infra/cloudflare-alerts/policies/d1-read-queries.json` | D1 Read Queries > 80% policy 宣言 | T3 |
| 新規 | `infra/cloudflare-alerts/policies/d1-write-queries.json` | D1 Write Queries > 80% policy 宣言 | T3 |
| 新規 | `infra/cloudflare-alerts/policies/pages-build.json` | Pages Build > 80% policy 宣言（Builds 派生は本タスクでは扱わない / 親 UT-17 既設定を踏襲） | T3 |
| 新規 | `infra/cloudflare-alerts/policies/r2-class-a.json` | R2 Class A Operations > 80% policy 宣言 | T3 |
| 新規 | `infra/cloudflare-alerts/webhooks/ut-17-alert-relay.json` | webhook destination 宣言（UT-17 relay URL 向け） | T3 |
| 編集 | `scripts/cf.sh` | `alerts` subcommand dispatcher 追加（apply / diff / list） | T4 / T5 / T6 |
| 新規 | `infra/cloudflare-alerts/lib/apply.sh` | apply 実装（POST/PUT 冪等）。`--dry-run` 対応 | T4 |
| 新規 | `infra/cloudflare-alerts/lib/diff.sh` | diff 実装（GET + normalize.mjs）。`--ci` 対応 | T5 |
| 新規 | `infra/cloudflare-alerts/lib/list.sh` | list 実装（read-only 列挙） | T6 |
| 新規 | `infra/cloudflare-alerts/lib/normalize.mjs` | policy / webhook destination JSON 正規化（key sort / null 除去 / ID→name 解決） | T5 |
| 新規 | `infra/cloudflare-alerts/lib/resolve-destination-id.mjs` | webhook destination name → ID 解決 pure 関数 | T7 |
| 編集 | `.env` | `op://` 参照 2 行追加（alerting edit token / read token） | T8 |
| 編集 | `.dev.vars.example` | `CLOUDFLARE_ALERTS_TOKEN_APPLY` / `CLOUDFLARE_ALERTS_TOKEN_READ` の op:// 参照を追記 | T8 |
| 新規 | `.github/workflows/cloudflare-alerts-drift.yml` | daily schedule + workflow_dispatch で `alerts diff --ci` 実行 | T9 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | health check 手順を `scripts/cf.sh alerts diff` 経路へ差し替え | T10 |

> 削除ファイルなし。`apps/web/` / `apps/api/` 配下は変更しない（本タスクは IaC + 運用層に閉じる）。

---

## 5-2. subcommand シグネチャ

### 5-2-1. `scripts/cf.sh alerts apply [--dry-run]`

```
用途: infra/cloudflare-alerts/ 配下の宣言を Cloudflare Account に冪等適用する。
入力:
  - infra/cloudflare-alerts/quota-base.json
  - infra/cloudflare-alerts/policies/*.json
  - infra/cloudflare-alerts/webhooks/*.json
  - env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ALERTS_TOKEN_APPLY（op:// 経由）
出力: stdout に適用 summary（policy 名 + action: created|updated|noop）
副作用: Cloudflare API への POST / PUT（webhook destination → policy の順）
オプション:
  --dry-run  API mutation を発火させず intended diff のみ出力（exit 0 固定）
exit code:
  0 正常終了（変更あり / なし両方）
  1 適用失敗（API 4xx / 5xx）
  2 設定 / token 不足（CONFIG エラー）
```

### 5-2-2. `scripts/cf.sh alerts diff [--ci]`

```
用途: Cloudflare 現状と repo 宣言を JSON 正規化して diff する。
入力: 同上 + env: CLOUDFLARE_ALERTS_TOKEN_READ（read-only）
出力: stdout に unified diff 形式（差分なしの場合は "no drift" のみ）
副作用: なし（GET のみ）
オプション:
  --ci  op run を skip し CLOUDFLARE_ALERTS_TOKEN_READ を環境変数から直読みする（CI 用）
exit code:
  0 drift なし
  1 drift あり（差分内容は stdout）
  2 API error / token 不足 / 解決失敗
```

### 5-2-3. `scripts/cf.sh alerts list`

```
用途: Cloudflare 上の現存 policy / webhook destination を read-only に列挙する。
入力: env: CLOUDFLARE_ALERTS_TOKEN_READ
出力: stdout に表形式（name / id / enabled / mechanisms 概要）
副作用: なし
exit code:
  0 正常
  2 token 不足 / API error
```

### 5-2-4. `infra/cloudflare-alerts/lib/resolve-destination-id.mjs`

```ts
/**
 * webhook destination の name → ID 解決。
 * - GET /accounts/:account_id/alerting/v3/destinations/webhooks 結果から name 一致を抽出
 * - 0 件 / 2 件以上の hit は throw（呼び出し側で exit 2）
 *
 * 入力: { name: string, token: string, accountId: string }
 * 出力: Promise<string>  // destination ID
 * 副作用: HTTPS GET 1 回
 */
export async function resolveDestinationId(args: {
  name: string;
  token: string;
  accountId: string;
}): Promise<string>;
```

### 5-2-5. `infra/cloudflare-alerts/lib/normalize.mjs`

```ts
/**
 * policy / webhook destination の正規化:
 *  - object key を昇順 sort
 *  - null / undefined / 空配列を除去
 *  - mechanisms.webhooks[].id を name に逆解決して比較対象から除外
 *  - server-managed フィールド（id, created, modified, account_id 等）を除去
 *
 * 入力: 任意 JSON
 * 出力: 正規化済み JSON 文字列（diff 安定化）
 * 副作用: なし（pure function）
 */
export function normalizeAlertResource(input: unknown, kind: 'policy' | 'webhook'): string;
```

---

## 5-3. JSON schema（宣言ファイル）

### 5-3-1. `quota-base.json`

```json
{
  "_meta": {
    "sources": [
      "https://developers.cloudflare.com/workers/platform/limits/",
      "https://developers.cloudflare.com/d1/platform/limits/",
      "https://developers.cloudflare.com/pages/platform/limits/",
      "https://developers.cloudflare.com/r2/pricing/"
    ],
    "reviewed_at": "2026-05-14"
  },
  "quotas": {
    "workers_requests":         { "base": 100000,   "unit": "req",   "period": "day" },
    "d1_rows_read":             { "base": 5000000,  "unit": "rows",  "period": "day" },
    "d1_rows_written":          { "base": 100000,   "unit": "rows",  "period": "day" },
    "pages_requests":           { "base": 500,      "unit": "builds","period": "month" },
    "r2_class_a_operations":   { "base": 1000000,  "unit": "ops",   "period": "month" }
  }
}
```

### 5-3-2. policy JSON（例: `policies/workers-requests.json`）

```json
{
  "name": "UBM-Hyogo / Workers Requests > 80%",
  "description": "Workers 無料枠 (100k req/day) の 80% 到達時に UT-17 relay へ通知",
  "enabled": true,
  "alert_type": "billing_usage_alert",
  "mechanisms": {
    "webhooks": [
      { "name": "ut-17-alert-relay" }
    ]
  },
  "filters": {
    "product": ["workers"],
    "metric_ref": "workers_requests"
  },
  "_threshold": {
    "ref": "workers_requests",
    "ratio": 0.8
  }
}
```

> `_threshold` は本リポジトリ独自フィールド。`apply` 時に `quota-base.json.quotas[ref].base * ratio` を計算し、
> Cloudflare API が要求する絶対値 / 百分率に変換して送出する（章 5-8 リスク C 対応）。
> Cloudflare API には `_threshold` を送らない（`normalize.mjs` で除去）。

### 5-3-3. webhook destination JSON（`webhooks/ut-17-alert-relay.json`）

```json
{
  "name": "ut-17-alert-relay",
  "url": "https://api.<production-domain>/internal/alert-relay",
  "secret": null
}
```

> `secret` フィールド（cf-webhook-auth 共有 secret）は Cloudflare 側に保持される値であり、
> repo 上では `null` プレースホルダ。実値は `bash scripts/cf.sh alerts apply` 実行時に
> 環境変数 `CF_WEBHOOK_AUTH_SECRET`（op:// 経由）から注入し、PUT 時にも上書きしない（既存値を尊重）。

---

## 5-4. 入出力・副作用・エラーハンドリング

| 関数 / コマンド | 入力 | 出力 | 副作用 | エラー時の挙動 |
| --- | --- | --- | --- | --- |
| `cf.sh alerts apply` | JSON 群 + token | stdout summary | POST/PUT（destination → policy 順） | 4xx/5xx で exit 1 / token 不足 exit 2 |
| `cf.sh alerts apply --dry-run` | 同上 | stdout 計画 diff | なし | API mutation を発火させない |
| `cf.sh alerts diff` | JSON 群 + read token | stdout diff | GET のみ | drift あり exit 1 / API error exit 2 |
| `cf.sh alerts diff --ci` | 同上（op skip） | 同上 | GET のみ | secret を log に出さない（mask）。GitHub Actions step summary に diff 抜粋を出力 |
| `cf.sh alerts list` | read token | stdout 表 | GET のみ | token 不足 exit 2 |
| `resolveDestinationId` | name, token | ID | GET 1 回 | 0/2 件 hit は throw |
| `normalizeAlertResource` | JSON | 正規化文字列 | なし | 未知 kind は throw |

---

## 5-5. 依存ライブラリ方針

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| HTTP クライアント | Node 標準 `fetch`（Node 24） | 追加依存ゼロ。`infra/cloudflare-alerts/lib/*.mjs` から直接利用 |
| JSON 正規化 / diff 表示 | Node 標準 `JSON.stringify` + 自前 sort | snapshot 安定性のため自前 normalize |
| diff 描画 | shell `diff -u` パイプ | 追加 npm 依存を持たない |
| 引数 parsing | shell の case 分岐 + Node `process.argv` | 追加依存ゼロ |
| 1Password 注入 | 既存 `op run --env-file=.env`（`scripts/cf.sh` 既存ラッパー） | 既存方針踏襲 |

> **追加 npm 依存ゼロ**を原則とする。`pnpm-lock.yaml` の差分は発生しない想定。

---

## 5-6. 実装順序（T1〜T10 詳細）

| 順 | サブタスク | 着手前条件 | 完了判定 |
| --- | --- | --- | --- |
| 1 | T1 | Phase 03 GO | README に運用手順 + token scope 方針が記載 |
| 2 | T2 | T1 完了 | `quota-base.json` が 5 metric × `{base, unit, period}` + `_meta.sources` を持つ |
| 3 | T3 | T2 完了 | 5 policy JSON + 1 webhook destination JSON が ID 直書きなしで配置 |
| 4 | T7 | T3 完了 | `resolveDestinationId` の単体実行で正例 / 0 件 / 多件の 3 ケース挙動を確認 |
| 5 | T8 | T1 完了 | 1Password に 2 token Item が登録され `.dev.vars.example` に op:// 参照が反映 |
| 6 | T4 | T3 + T7 + T8 完了 | `apply --dry-run` が 5 policy + 1 webhook の intended diff を出力。実 apply 2 回連続で 2 回目 no drift |
| 7 | T5 | T3 + T7 + T8 完了 | `diff` が drift なしで exit 0 / 注入した drift で exit 1 / token 抜きで exit 2 |
| 8 | T6 | T5 完了 | `list` が policy 5 件 + webhook 1 件を name + ID で列挙 |
| 9 | T9 | T5 + T8 完了 | `.github/workflows/cloudflare-alerts-drift.yml` が daily schedule + manual dispatch で `alerts diff --ci` を実行し drift で fail |
| 10 | T10 | T5 完了 | runbook の health check 手順が `bash scripts/cf.sh alerts diff` 経路へ差し替わる |

---

## 5-7. 不変条件チェック

- [ ] `apps/web` / `apps/api` には変更を加えない（IaC + 運用層のみ）
- [ ] D1 直接アクセスを追加しない
- [ ] Secret は 1Password → 環境変数経由のみ。`.env` 実値書き込み禁止
- [ ] `wrangler` / `terraform` / 生 `curl` を直接実行しない。すべて `bash scripts/cf.sh alerts ...` 経由
- [ ] webhook destination は ID 直書き禁止、name → ID 解決を経由する
- [ ] policy JSON に server-managed フィールド（id / created / modified / account_id）を含めない
- [ ] apply 用 token と diff 用 token を分離（apply: `Account.Notifications:Edit` / diff: `Account.Notifications:Read`）
- [ ] CI workflow の log に token / secret 実値が出ない

---

## 5-8. 既知リスクと対策（CONST_007 先送り禁止）

| ID | リスク（元タスク指示書 §6） | 本 Phase での確定対策 |
| --- | --- | --- |
| A | API Token scope 不足（deploy 用 token は Notifications scope を持たない） | T8 で **専用 token を別 Item 発行**（apply 用 Edit / diff 用 Read の 2 種）。`.env` に op:// 参照 2 行追加。既存 deploy token への scope 追加は禁止 |
| B | webhook destination と policy の順序依存（policy が destination ID 参照） | T7 で `resolveDestinationId` を共通化。apply 順序は **webhook destination → policy** 固定。repo 上は name で参照し ID 直書き禁止 |
| C | 閾値表現の不統一（百分率 vs 絶対値） | policy JSON に独自 `_threshold = {ref, ratio}` を導入。`quota-base.json` の base × ratio を `apply` 時に Cloudflare API が要求する形式へ変換して送出。base 値改定時は monthly healthcheck で確認 |
| D | CI 上での secret 取り回し（`op run` が CI で動かない） | T9 で `--ci` flag を導入。`op run` を skip し GitHub Secrets `CLOUDFLARE_ALERTS_TOKEN_READ`（read-only）を直読みする経路を分離。CI token は apply 不可（Read scope のみ） |

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 親（relay Worker） | webhook destination URL の参照先 | URL のみ参照。Worker 実装は変更しない |
| UT-17 monthly healthcheck runbook | health check 手順の主経路 | T10 で `alerts diff` 経路へ差し替え |
| UT-08-IMPL | 別経路・別 channel | 共有なし |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/phase-04.md | T1〜T10 の入力 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md | 元タスク指示書（§6 苦戦箇所が本 phase 5-8 の出典） |
| 必須 | scripts/cf.sh | subcommand 追加対象 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | wrapper 経由原則 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-policies-create-notification-policy | Cloudflare API v4 |
| 参考 | https://developers.cloudflare.com/api/operations/notification-webhooks-create-a-webhook | webhook destination API |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | quota-base 出典 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | CONST_005 必須項目を満たす実装計画書 |
| ドキュメント | outputs/phase-05/file-change-list.md | 変更対象ファイル一覧（Phase 13 PR 本文の元データ） |
| ドキュメント | outputs/phase-05/json-schemas.md | quota-base / policy / webhook destination の JSON schema 抜粋 |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 完了条件

- [ ] CONST_005 の必須項目（変更対象ファイル / subcommand シグネチャ / JSON schema / 入出力・副作用 / 依存 / 実装順序）が全て埋まっている
- [ ] 追加 npm 依存ゼロが確認されている
- [ ] subcommand は `bash scripts/cf.sh alerts ...` 経由で記述されている（`wrangler` 直接実行なし）
- [ ] 5-1 ファイル一覧と 5-6 実装順序が T1〜T10 と整合している
- [ ] 5-8 既知リスク A〜D に対する確定対策が記載されている（先送りなし）
- [ ] outputs/phase-05 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-05 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 6（テスト戦略）
- 引き継ぎ事項:
  - 5-2 の subcommand シグネチャと exit code 表は Phase 6 の単体・統合テストケース設計の基礎となる
  - 5-4 の入出力・エラーハンドリングは異常系テスト観点に展開される
  - 5-8 のリスク D（CI secret 取り回し）は Phase 6 で `--ci` flag の dry-run / live のローカル検証手順に展開される
- ブロック条件: CONST_005 必須項目に欠落 / 既知リスク A〜D いずれかが「Phase 6 で確定」と先送りされている場合は Phase 4 へ差し戻す
