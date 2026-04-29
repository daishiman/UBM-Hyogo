# UT-25-DERIV-02: SA key 失効監視

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-25-DERIV-02 |
| タスク名 | SA key 失効監視（Sheets API 401/403 検出と alert 経路整備） |
| 優先度 | HIGH |
| 推奨Wave | Wave 3（UT-26 完了後） |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | なし（UT-08 監視設計とは独立。SA key 失効固有の検出・alert 経路を扱う） |
| 組み込み先 | - |
| 検出元 | UT-25 Phase 11 `outputs/phase-11/main.md` §保証できない範囲（2. SA key 失効監視） |

## 目的

UT-25 で配置した `GOOGLE_SERVICE_ACCOUNT_JSON` シークレットの裏側で動作している Google Service Account key が、Google 側で失効・無効化（鍵削除 / SA 無効化 / Sheets API 権限剥奪）された場合に、本番運用中の `apps/api` Workers が**沈黙故障する**ことを防ぐ。Sheets API の 401/403 応答を検出し、Cloudflare Workers logs / Sentry / 定期 health check を組み合わせた alert 経路を整備する。失効検出時の rollback 経路は UT-25 Phase 13 の `rollback-runbook.md` を逆参照する。

## スコープ

### 含む

- `apps/api/src/jobs/sheets-fetcher.ts`（および `sync-sheets-to-d1.ts`）に Sheets API 401/403 応答を構造化ログ（`console.error` + 一意の error code）として出力する経路の実装
- 401（認証失敗 = key 無効 / 期限切れ）と 403（認可失敗 = Sheets スコープ剥奪 / SA disabled）を区別した error code 付与（例: `SHEETS_AUTH_401_KEY_INVALID` / `SHEETS_AUTH_403_FORBIDDEN`）
- Cloudflare Workers logs を Sentry（または同等の外部 sink）へ転送する Tail Worker / Logpush 設定の構築
- Sentry 側の alert rule 設定（401/403 が直近 N 分で M 回以上発生で notify、N=10/M=3 を初期値）
- 定期 health check（Cron Trigger）で Sheets API に最小 read を発行し失効を能動検出する経路（頻度は 15 分間隔を初期値、運用調整可とする）
- false positive（network transient / Google 側 5xx / rate limit 429）と true positive（401/403）の切り分け仕様の文書化
- alert 受信時に rollback runbook（`docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`）への導線を案内する notification template

### 含まない

- SA key 定期ローテーション運用 SOP の策定（UT-25-DERIV-01 のスコープ）
- Cloudflare Secret 監査ログの整備（UT-25-DERIV-03 のスコープ）
- Cloudflare 全般の SLO / error budget 設計（UT-08 のスコープ）
- Sheets API quota / rate limit 監視（UT-26 以降の運用課題として deferred）
- 多数の他シークレット（OAuth, Resend 等）の失効監視（個別 issue として将来分離）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-25（Cloudflare Secrets 本番配置） | SA key が production に配置済みでないと監視対象が存在しない |
| 上流 | UT-26（Sheets API E2E 疎通確認） | 正常系の baseline が確立してないと alert の意味がない |
| 上流 | UT-08（監視・alert 設計） | Sentry / Workers logs の基盤 alert ポリシーを継承する |
| 上流 | UT-07（通知インフラ） | Sentry / Slack / メール等の notification チャネルが整備されている前提 |
| 下流 | UT-25-DERIV-01（SA key rotation SOP） | rotation 実施時に本監視が誤検知しないよう抑止仕様が必要 |
| 横 | UT-25 Phase 13 rollback-runbook | 失効検出 alert の対応手順として逆参照する |

## 着手タイミング

> **着手前提**: UT-25 Phase 13 完了（SA key が production に配置済み）かつ UT-26 完了（Sheets API 疎通テストが PASS している）こと。疎通の baseline がない状態で alert を組んでも true/false positive の切り分けができない。

| 条件 | 理由 |
| --- | --- |
| UT-25 Phase 13 完了 | 監視対象の SA key が production で実稼働している |
| UT-26 完了 | 正常系のレスポンスパターンが確認済みで 401/403 の異常判定が可能 |
| Sentry プロジェクト準備済み | Workers logs の転送先が存在する（UT-07 / UT-08 で整備） |
| Cron Trigger 利用可能 | health check の定期実行に Workers Cron Trigger（または GitHub Actions schedule）が利用できる |

## 苦戦箇所・知見

**1. 401 と 403 の意味の違いを alert 上で区別する**
401 は「認証情報そのものが無効」（SA key が削除された / 期限切れ / private_key 破損）。403 は「認証は通ったが認可されていない」（SA から Sheets スコープが剥奪された / 対象 Spreadsheet の共有設定変更で SA が外れた / SA が disabled）。両者は対応経路が異なる。401 は **新 key への rollback が必須**で `rollback-runbook.md` の §新 key（rotation）で復旧する場合 を実行する。403 は **Google Workspace 側の権限再付与**で復旧する可能性があり、key rotation は不要なことが多い。alert payload と error code を分けないと、運用者が誤って key rotation してしまい不要な secret 上書きを招く。

**2. Cloudflare Workers logs は短期保管なので外部 sink への転送が必須**
Cloudflare Workers の `wrangler tail` / Workers logs は短期間（標準では数時間〜数日のオーダー）しか保持されず、過去の 401/403 を遡って分析できない。Logpush（有償プラン）または Tail Worker（無償でも一部利用可）で Sentry / 外部ログ基盤に転送する経路を構築する。MVP では Tail Worker → Sentry transport で運用可能か検証する。

**3. health check の頻度設計（毎分 overspend / 毎時 detection 遅延）**
- 毎分（1440 回/日）: Cloudflare Workers free tier の 100,000 req/day 枠の数 % を消費するうえ、Sheets API の quota も無駄に消費する。
- 毎時: 失効から最大 60 分間、本番運用が沈黙故障する。
- **初期値は 15 分**（96 回/日）とし、UT-26 の疎通テスト確立後に運用実績を見て調整する。Cron Trigger で実装し、health check 自体の log と通常運用 log は tag で分離する。

**4. false positive（network transient）と true positive の区別**
Sheets API は 5xx（Google 側障害）/ 429（rate limit）/ network timeout が発生し得る。これらは SA key 失効ではないため alert を上げると noise になる。
- 401/403 のみを alert 対象とする（5xx/429/timeout は別 metric）。
- 401/403 が **連続 M 回**（初期値 3 回 / 10 分窓）で発火する threshold を設定し、単発の transient を抑止する。
- Cron health check はリトライ 1 回まで許容（同一実行内で 2 回連続 401/403 で確定）する。

**5. rotation 中の誤検知抑止**
UT-25-DERIV-01（rotation SOP）実施中、旧 key を Google 側で無効化した直後に Cloudflare Secret 上書きが間に合わないと一時的に 401 が発生する。rotation 作業時は alert を**手動で抑止する手順**（Sentry の mute / silencer）を runbook に明記しておかないと、rotation のたびに pager が鳴る。

**6. Workers binding 経由のシークレット参照と health check の分離**
health check 実装は `apps/api` 本体のジョブと同じ binding（`GOOGLE_SERVICE_ACCOUNT_JSON`）を参照するため、staging で先に検証してから production に投入する。誤って health check 自体が secret 名 typo で 401 を出すケースを Phase で吸収する。

## 実行概要

1. `apps/api/src/jobs/sheets-fetcher.ts` で Sheets API 呼び出し時の HTTP status を分類し、401/403 を構造化ログ（error code 付き）で `console.error` 出力する
2. Cloudflare Workers の Tail Worker（または Logpush）を設定し、`SHEETS_AUTH_4*` を含むログを Sentry へ転送する
3. Sentry 側に alert rule を作成（直近 10 分で `SHEETS_AUTH_401_*` または `SHEETS_AUTH_403_*` が 3 回以上 → Slack / メール notify）
4. `apps/api` に Cron Trigger（15 分間隔）で動作する health check job を追加し、Sheets API の最小 read（対象 Spreadsheet のメタ取得）を発行
5. health check job 内で 401/403 を検出したら同じ error code 経路でログ出力する（一般運用ジョブと同一の alert pipeline に乗る）
6. Sentry alert の notification template に rollback runbook へのリンク（`docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`）を埋め込む
7. staging で意図的に key を無効化して alert が発火することを確認（dry run）
8. production に投入し、Cron health check の正常動作を 24 時間観測する
9. UT-25 Phase 13 `rollback-runbook.md` の冒頭に「失効検出時はまず本監視 alert 内のリンクを参照」と逆参照を追記する
10. UT-25-DERIV-01（rotation SOP）作成者に対し、rotation 時の alert mute 手順を必須セクションとして申し送る

## 完了条件

- [ ] `apps/api/src/jobs/sheets-fetcher.ts`（または等価モジュール）で Sheets API 401/403 が `SHEETS_AUTH_401_KEY_INVALID` / `SHEETS_AUTH_403_FORBIDDEN` の error code 付きで構造化ログ出力されている
- [ ] Cloudflare Workers logs が Sentry（または同等 sink）に転送されている
- [ ] Sentry alert rule が「直近 10 分で 401/403 が 3 回以上」で発火するよう設定されている
- [ ] `apps/api` の Cron Trigger（15 分間隔）health check job が staging / production の両方で稼働している
- [ ] staging で意図的失効させ alert が発火 + rollback runbook リンクが notification 内に表示されることを確認した
- [ ] 5xx / 429 / network timeout は alert 対象から除外されていることを test ケースで確認した
- [ ] UT-25 Phase 13 `rollback-runbook.md` に本監視からの逆参照が追記されている
- [ ] UT-25-DERIV-01 作成者向けに rotation 時の alert mute 手順が申し送られている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-11/main.md | §保証できない範囲（本タスクの検出元） |
| 必須 | docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md | 失効検出時の対応経路（逆参照先） |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | SA key 配置の前提タスク |
| 必須 | docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md | 疎通 baseline 確立の前提タスク |
| 参考 | docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md | 監視 / alert 設計の上位方針 |
| 参考 | docs/30-workflows/unassigned-task/UT-07-notification-infrastructure.md | 通知チャネル整備 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置・運用方針 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers / Cron Trigger / Logpush 構成 |
| 参考 | https://developers.google.com/sheets/api/reference/rest | Sheets API レスポンスコード仕様 |
| 参考 | https://developers.cloudflare.com/workers/observability/logging/tail-workers/ | Tail Worker による外部 sink 転送 |
