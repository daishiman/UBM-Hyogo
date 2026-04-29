# UT-25-DERIV-03: Cloudflare Secret 監査ログ運用

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DERIV-03 |
| タスク名 | Cloudflare Secret 監査ログ運用（put/delete 操作の系統的取得・保管） |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2（UT-25 完了後、運用安定化フェーズ） |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | なし（UT-25 のスコープは「配置の実走」、本タスクは「配置以後の監査線」） |
| 組み込み先 | - |
| 検出元 | UT-25 Phase 11 `outputs/phase-11/main.md` §保証できない範囲 |

## 目的

UT-25 によって `GOOGLE_SERVICE_ACCOUNT_JSON` を含む Cloudflare Workers Secret が staging / production に配置される運用が確立されたが、Phase 11 の smoke 実走時の証跡は **実走者が手動で書いた `manual-smoke-log.md`** に限られ、誰がいつ secret を put / delete したのかをシステマティックに観測する経路が欠けている。本タスクは Cloudflare Account 単位の Audit Logs API から secret 操作イベントを定期取得し、外部ストレージ（R2 もしくは外部 SIEM）に append-only で保管する運用を整備し、secret 値そのものを暴露せずに「誰が・いつ・どの環境の・どの secret 名に」操作したかを後追いできる状態にする。

## スコープ

### 含む

- Cloudflare Account 単位の Audit Logs API（`GET /accounts/{account_id}/audit_logs`）から `wrangler secret put` / `wrangler secret delete` 由来のイベントを抽出するクエリ条件の確定
- API 認証に使用する `CLOUDFLARE_API_TOKEN` のスコープ（`Account Audit Logs: Read`）の追加と 1Password / Cloudflare Secrets への反映
- 取得スクリプト（例: `scripts/cf-audit-fetch.sh`）の実装と `bash scripts/cf.sh` ラッパー経由での実行統一
- 取得結果（NDJSON）を Cloudflare R2 バケット（`ubm-hyogo-audit-logs`）に `secrets/YYYY/MM/DD.ndjson` 形式で append-only で書き出す経路の確立
- 「API token = 個人」対応表（`docs/40-operations/cf-api-token-owners.md` 想定）の作成と運用ルール明文化
- 取得頻度（cron / GitHub Actions schedule）の決定と、Cloudflare 側 audit log の retention（既定 18 か月）に対する補完保管期間の決定
- Phase 11 の `manual-smoke-log.md` と本 audit log の役割分担を `references/deployment-secrets-management.md` に追記

### 含まない

- Secret 値そのものの保管・復号（Cloudflare API 仕様上 audit log には value は含まれない）
- ランタイム上での secret 読み取り（`env.GOOGLE_SERVICE_ACCOUNT_JSON` 参照）に対するアクセスログ取得（Workers logs / Tail で別系統の課題）
- GitHub Actions 経由の自動 put（UT-25-DERIV-04 のスコープ）
- 外部 SIEM（Datadog / Splunk）連携の本実装。本タスクでは R2 への保管までを既定路線とし、SIEM 連携は将来の deferred とする

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-25（Cloudflare Secrets 本番配置） | secret put / delete のオペレーション様式が固まっていないと監査対象が曖昧になる |
| 上流 | UT-06（`scripts/cf.sh` ラッパー整備） | API 呼び出しを 1Password / mise 経由に統一する前提 |
| 並走 | UT-25-DERIV-02（SA key 失効監視） | 失効検知時の調査線として audit log を併用する |
| 下流 | （将来）SIEM 連携タスク | R2 保管が確立してから外部送出経路を増設する |

## 着手タイミング

> **着手前提**: UT-25 Phase 13 が完了し、`GOOGLE_SERVICE_ACCOUNT_JSON` の本番配置と rollback 経路が runbook 化されていること。R2 バケットが作成可能な Cloudflare プランであること。

| 条件 | 理由 |
| --- | --- |
| UT-25 Phase 13 完了 | 監査対象の secret 操作が定常運用に入っている |
| `CLOUDFLARE_API_TOKEN` に Audit Logs Read スコープを付与可能 | API から audit log を引ける必要がある |
| R2 バケット作成権限がある | append-only 保管先を確保する |

## 苦戦箇所・知見

**1. Cloudflare audit log は Account-level しか提供されない（namespace 化の制約）**

Cloudflare の Audit Logs は **Account 単位** で記録される。`wrangler secret put` イベントの actor は Cloudflare ダッシュボードユーザー（email）または **API token ID** として記録され、「どの Workers の」「どの環境の」 secret かは `resource` フィールドの script 名・metadata から推定する必要がある。ubm-hyogo の場合 `ubm-hyogo-api`（production）/ `ubm-hyogo-api-staging`（staging）の script 名が environment 区分の手がかりになる。env による namespace 分離は audit log 側では実現できないため、**抽出側でフィルタする**前提で設計する。

**2. secret 値そのものは log に出ない（put 操作の事実のみ）**

Audit log entry には secret name / 操作種別（put / delete）/ actor / timestamp は記録されるが、**secret 値（plaintext）は一切含まれない**。これは仕様であり、本タスクは「値の漏洩を再現する」ものではない。逆に「値が漏れたか」を audit log から判断することはできず、その観点は SA key 側（Google Cloud audit log = UT-25-DERIV-02 の領域）と組合せて評価する。

**3. 「誰が」= API token 単位での識別 → 個人対応表が別途必要**

Audit log の actor は人間ユーザーの場合 email、CI / wrangler 経由の場合 **API token の ID と name** で記録される。`bash scripts/cf.sh secret put` は 1Password から注入された `CLOUDFLARE_API_TOKEN` を使うため、log 上は「token name」までしか見えない。誰がその token を実行したかは別管理の対応表（例: `docs/40-operations/cf-api-token-owners.md` に token name / 用途 / 所有者 / 発行日 / ローテーション期限）で突き合わせる必要がある。token を個人共用しない（1人1トークン）運用ルールを併設しないと監査線が崩れる。

**4. log 保管期間と retention（Cloudflare 側の保管期間に依存）**

Cloudflare 側の audit log retention は既定 **18 か月**（プランにより変動）であり、それを超える期間の追跡には自前保管が必須。本タスクでは Cloudflare R2 に NDJSON で append-only 保管し、**最低 36 か月（3 年）**を目安に保持する。R2 の Object Lock（compliance mode）を有効化するかは別判断とし、最初は **書き込み権限を CI のみに絞る IAM 構成**で改ざん耐性を確保する。

**5. 取得頻度と重複排除**

Audit Logs API は時刻範囲フィルタ（`since` / `before`）を持つ。日次 cron で前日分を取得する場合、境界の重複・欠落を避けるため `id` をキーにした冪等な append（既存 NDJSON を読んで dedupe）を実装する。GitHub Actions の `schedule` で UTC 固定実行とし、JST 表示はビューワ側で行う。

**6. R2 への書き込み経路と secret 値の混入禁止**

R2 への put は Cloudflare API token（R2: Edit スコープ）を別途用意する。Audit log fetch 用 token と R2 書き込み用 token を **分離**し、同一 token に過剰スコープを集めない（UT-25 と同じ最小権限原則）。NDJSON へは Audit Logs API レスポンスをそのまま流し込み、加工で誤って `wrangler secret put` の stdin 値を参照する経路を作らない（そもそも fetch 側の API レスポンスに値は含まれないが、加工 pipeline に stdin を混ぜない設計を明示する）。

## 実行概要

1. Cloudflare ダッシュボードで Audit Logs Read スコープ付き API token を新規作成し、1Password に保管（既存の `CLOUDFLARE_API_TOKEN` とは分離）
2. R2 バケット `ubm-hyogo-audit-logs` を作成し、書き込み専用 token を分離発行
3. `scripts/cf-audit-fetch.sh`（仮称）を新設し、`bash scripts/cf.sh` 経由で `op run` 注入された token を使い `GET /accounts/{account_id}/audit_logs?since=...&before=...&action.type=secret_put|secret_delete` 相当のクエリを実行
4. 取得した NDJSON を `secrets/YYYY/MM/DD.ndjson` として R2 に append（`id` で dedupe）
5. `.github/workflows/cf-audit-fetch.yml` を新設し、daily schedule（UTC 03:00 等）で実行
6. `docs/40-operations/cf-api-token-owners.md` を新設し、token name と所有者の対応表を作成
7. `references/deployment-secrets-management.md` に「audit log 取得経路」セクションを追加し、Phase 11 の `manual-smoke-log.md` との役割分担（手動 = 実走者証跡 / audit log = システム証跡）を明文化
8. 初回取得後、`secret_put` / `secret_delete` イベントが想定どおり R2 に保管されていることを確認し、Phase 13 引き渡しの runbook に逆参照を追加

## 完了条件

- [ ] Audit Logs Read スコープ付き Cloudflare API token が 1Password に保管され、`.env` に `op://` 参照のみが記述されている
- [ ] `scripts/cf-audit-fetch.sh` が `bash scripts/cf.sh` ラッパー経由で動作し、Audit Logs API から secret 関連イベントを取得できる
- [ ] R2 バケット `ubm-hyogo-audit-logs` に `secrets/YYYY/MM/DD.ndjson` 形式で append-only 保管されている（最低 1 日分の実データで確認）
- [ ] GitHub Actions の daily schedule が安定稼働（連続 7 日成功）している
- [ ] `docs/40-operations/cf-api-token-owners.md` が作成され、現存する全 Cloudflare API token の name / 用途 / 所有者 / 発行日 が記録されている
- [ ] `references/deployment-secrets-management.md` に audit log 取得経路セクションが追加され、`manual-smoke-log.md` との役割分担が明文化されている
- [ ] secret 値（plaintext）が R2 / GitHub Actions ログ / コミット履歴のいずれにも転記されていないことを確認

## 参照資料

| 種別 | パス / URL | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 親タスク（secret 配置運用の正本） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/main.md | §保証できない範囲（本タスクの検出元） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/manual-smoke-log.md | 手動 smoke ログの現状フォーマット |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針の正本（本タスクで追記） |
| 参考 | https://developers.cloudflare.com/api/operations/audit-logs-list-user-audit-logs | Cloudflare Audit Logs API リファレンス |
| 参考 | https://developers.cloudflare.com/fundamentals/account/account-security/review-audit-logs/ | Audit log の概念・retention |
| 参考 | https://developers.cloudflare.com/r2/ | R2 保管先の仕様 |
| 関連 | docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md | SA key 失効監視（並走タスク） |
