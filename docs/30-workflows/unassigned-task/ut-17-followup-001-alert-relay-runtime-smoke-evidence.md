# UT-17 alert-relay runtime smoke evidence 取得 - タスク指示書

## メタ情報

```yaml
issue_number: 633
```

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | ut-17-followup-001-alert-relay-runtime-smoke-evidence                         |
| タスク名     | `POST /internal/alert-relay` の staging / production runtime smoke evidence 取得 |
| 分類         | 検証（Runtime Evidence）                                                      |
| 対象機能     | `apps/api` Cloudflare Workers / `POST /internal/alert-relay` + Slack 連携    |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | ut-17-cloudflare-analytics-alerts                                             |
| 発見日       | 2026-05-09                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-17（Cloudflare Analytics アラート集約 / Slack 中継）にて、`apps/api` 側に `POST /internal/alert-relay` endpoint を実装し、`cf-webhook-auth` ヘッダによる固定 secret 認証 / Cloudflare Notification webhook payload の Block Kit 整形 / Slack `chat.postMessage` 送出 / in-memory dedup（5 分窓）までを完了させた。ただし Cloudflare staging / production への deploy 後に `curl` で実 endpoint を叩いて 200 応答 + Slack チャンネル側の実着信を確認する runtime smoke は未実施である。

加えて Phase-11 は `NON_VISUAL` skip 判定で抜けており、relay の本物動作 evidence（HTTP 応答ログ・Slack 受信スクリーンショット相当）が `outputs/phase-11/` 配下に残っていない。

### 1.2 問題点・課題

- Cloudflare Workers ランタイムでの `cf-webhook-auth` 検証が production secret で実通すか、ローカルテストでは保証できない。
- Slack Block Kit の severity ヘッダ色付け（`attachments[].color`）が実 Slack workspace のレンダリングで意図通りに見えるか、unit test では検証不能。
- in-memory dedup が Worker isolate 跨ぎで効かない既知制約があり、本番トラフィック相当の連投で重複通知量を実測しないと運用判断ができない。
- 同種パターンの先行例（`completed-tasks/task-09a-A-exec-staging-smoke-001.md` / `task-09b-a-runtime-provider-smoke-execution-001.md`）に倣い、staging / production 双方で smoke evidence を MD 化する運用が UT-17 でも必要。

### 1.3 放置した場合の影響

- Cloudflare Notification の実 webhook が初めて飛んだ瞬間に 401 / 500 が出ても、relay 側の不具合か CF 側 payload 仕様変更かの切り分けができない。
- Slack 通知の severity 色分けが崩れていても気付かず、運用ランブック（`runbooks/ut-17-cloudflare-usage-alert-response.md`）の severity 判定が機能不全のまま運用に入るリスク。
- UT-17 の Phase-13 PR / close-out で「runtime evidence 不足」が後追い指摘され、再 deploy 待ちで close が遅延する。

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare staging / production にデプロイ済みの `POST /internal/alert-relay` に対し、実 webhook payload を `curl` で投入して 200 応答と Slack 着信を実機で確認し、その evidence を MD として残す。

### 2.2 最終ゴール

- staging 環境向け smoke evidence MD: `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-11/evidence/staging-smoke.md`
- production 環境向け smoke evidence MD: `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-11/evidence/production-smoke.md`
- 両 MD に `curl` request / response（200 / 401 / 409 dedup）と Slack 着信確認の記録を含める。

### 2.3 スコープ

#### 含むもの

- Cloudflare staging / production にデプロイ済みの `apps/api` Worker への `curl` 実行
- 正常系 / 認証失敗系（401）/ dedup 系（409 or 200 skip）の 3 ケース確認
- Slack 受信側で severity（critical / warning / info）の色分け表示確認
- runbook（`runbooks/ut-17-cloudflare-usage-alert-response.md`）の手順整合性確認

#### 含まないもの

- relay 実装の機能追加・bug fix（別 followup として切り出す）
- Cloudflare Notification 側の webhook 設定作業（T8 完了前提）
- Durable Objects / KV を使った dedup 永続化（既知制約として切り分け済み）

### 2.4 成果物

- staging smoke evidence MD（curl ログ + Slack 着信メモ）
- production smoke evidence MD（同上）
- `outputs/phase-11/` の `NON_VISUAL` skip ステータス更新（runtime evidence 取得済みへ）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-17 implementation-guide の T2（relay endpoint）/ T8（Cloudflare Notification webhook 設定）/ T10（Slack Bot token / channel id 投入）が完了済み
- Cloudflare staging / production の `apps/api` Worker に最新版がデプロイ済み
- `bash scripts/cf.sh` 経由で `CF_WEBHOOK_AUTH_SECRET` / `SLACK_BOT_TOKEN` / `SLACK_CHANNEL_ID` が両環境の Secrets に投入済み
- Slack 側で受信チャンネル（severity 別 or 統合）が用意済み

### 3.2 依存タスク

- 親: ut-17-cloudflare-analytics-alerts T2 / T8 / T10
- 影響先: UT-17 Phase-13 close-out、`runbooks/ut-17-alert-relay-monthly-healthcheck.md` の月次運用

### 3.3 必要な知識

- Cloudflare Notification webhook payload の構造（`apps/api/src/types/cloudflare-notification.ts` 参照）
- `cf-webhook-auth` ヘッダによる固定 secret 認証ロジック（`apps/api/src/lib/cf-webhook-auth.ts`）
- Slack Block Kit + `attachments[].color` の severity 色分け
- in-memory dedup（`apps/api/src/routes/internal/alert-relay.ts` の Map ベース 5 分窓）

### 3.4 推奨アプローチ

1. fixture payload（critical / warning / info の 3 severity）を `outputs/phase-11/evidence/fixtures/` に固定して再現性を確保。
2. staging に対し正常系 → 401 → 重複（dedup）の順に curl を投げ、HTTP status と Slack 着信を 1 セットで記録。
3. production も同手順を反復（ただし fixture の `alert_id` を staging と分離）。
4. Slack 側 screenshot は workspace 都合で取得が難しい場合、テキストでチャンネル名 / 投稿時刻 / 表示色を記録すれば可。

---

## 4. 実行手順

### Phase 構成

1. fixture 整備
2. staging smoke 実行 + evidence 記録
3. production smoke 実行 + evidence 記録
4. Phase-11 ステータス更新

### Phase 1: fixture 整備

#### 目的

CF Notification 公式サンプルが少ないため、再利用可能な webhook payload fixture を MD と JSON で残す。

#### 手順

1. `apps/api/src/types/cloudflare-notification.ts` を正本に critical / warning / info の 3 fixture を作成
2. `outputs/phase-11/evidence/fixtures/critical.json` 等として保存

#### 完了条件

3 severity すべての fixture が手元にある。

### Phase 2: staging smoke 実行 + evidence 記録

#### 目的

staging で実 endpoint を叩き、200 / 401 / dedup を確認する。

#### 手順

1. `bash scripts/cf.sh` 経由で staging URL を確認
2. 正常系 curl: `curl -i -X POST -H "cf-webhook-auth: $SECRET" -H "content-type: application/json" --data @critical.json <staging-url>/internal/alert-relay`
3. 認証失敗系 curl: 同 payload を `cf-webhook-auth` 無しで投げて 401 確認
4. dedup 系 curl: 同 `alert_id` の payload を 2 回連投し、2 回目で Slack に通知が出ないことを確認
5. Slack 受信を severity 別に確認（チャンネル名 / 時刻 / 色）

#### 完了条件

`outputs/phase-11/evidence/staging-smoke.md` に 3 ケース分の curl ログと Slack 着信記録が揃っている。

### Phase 3: production smoke 実行 + evidence 記録

#### 目的

production でも同等の動作を確認する。

#### 手順

Phase 2 と同手順を production URL / production secret で反復。fixture の `alert_id` は staging と衝突しないよう接頭辞を変える。

#### 完了条件

`outputs/phase-11/evidence/production-smoke.md` が完成。

### Phase 4: Phase-11 ステータス更新

#### 目的

`NON_VISUAL` skip だった Phase-11 を runtime evidence 取得済みに更新。

#### 手順

1. `outputs/phase-11/phase-11.md` のステータスを更新
2. UT-17 implementation-guide の Phase-11 セクションに smoke evidence への相互リンクを追加

#### 完了条件

UT-17 Phase-13 close-out で runtime evidence 欠落の指摘が出ない状態になる。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] staging で正常系 curl が 200 応答 + Slack 着信
- [ ] staging で 401 ケースが想定通り
- [ ] staging で dedup ケースが想定通り
- [ ] production で同 3 ケースが想定通り
- [ ] severity 別の Slack 表示色が runbook 記述と一致

### ドキュメント要件

- [ ] `outputs/phase-11/evidence/staging-smoke.md` 作成
- [ ] `outputs/phase-11/evidence/production-smoke.md` 作成
- [ ] `outputs/phase-11/phase-11.md` の skip ステータス更新
- [ ] runbook（`runbooks/ut-17-cloudflare-usage-alert-response.md`）の手順と evidence の整合確認

### 品質要件

- [ ] 実 secret 値はログ / MD に転記しない（CLAUDE.md シークレット管理ルール準拠）
- [ ] curl ログは Authorization / cf-webhook-auth ヘッダ値を redact 済み

---

## 6. 苦戦箇所・知見（再発防止）

UT-17 本体実装で実際に詰まった / 後段タスクで詰まり得るポイントを、将来の同種タスク（Cloudflare webhook 中継系）で活かせる粒度で記録する。

### 6.1 Cloudflare Notification の actual webhook payload 仕様が薄い

- Cloudflare 公式ドキュメントには Notification webhook の payload サンプルが断片的にしか載っておらず、severity / alert_type / metadata の field 名揺れが Console UI と実 webhook で異なるケースがあった。
- 対策: `apps/api/src/types/cloudflare-notification.ts` で zod schema として正本化し、`apps/api/src/lib/__tests__/` 内に最小 fixture を 3 severity 分置いた。runtime smoke でもこの fixture を流用する。
- 教訓: 「公式サンプル不足 + zod 正本化」のパターンは CF 側の他 webhook（Audit Log / Workers Trace 等）でも再利用可能。

### 6.2 webhook 認証の方式選定（HMAC 不採用 → 固定 secret ヘッダに着地）

- 当初は `X-CF-Alert-Signature` 相当の HMAC 検証を期待したが、Cloudflare Notification webhook には公式に署名契約が公開されていない（2026-05 時点）。
- 対策: `cf-webhook-auth` という独自固定 secret ヘッダで `crypto.timingSafeEqual` 相当の比較に着地（`apps/api/src/lib/cf-webhook-auth.ts`）。secret は Cloudflare Secrets で env 別に分離。
- 教訓: 公式 HMAC 契約が無い webhook 受信では「固定 secret ヘッダ + IP 制限（Cloudflare WAF rule）+ 短期 rotation」の三段構えが現実解。HMAC を無理に組まず、契約が公開された時点で乗り換えられるよう endpoint を抽象化しておく。

### 6.3 in-memory dedup の Worker isolate 跨ぎ重複

- `Map` ベースの 5 分窓 dedup を `alert-relay.ts` 内に置いたが、Cloudflare Workers は isolate を多重に立ち上げるため、isolate 跨ぎの同 `alert_id` 重複は防げない。
- 対策（短期）: 同 isolate 内の連投にだけ効く前提で運用し、月次 healthcheck（`runbooks/ut-17-alert-relay-monthly-healthcheck.md`）で重複量を観測。
- 対策（中期）: KV または Durable Objects に dedup を移す案を別 followup として切り出し可能（本 followup の対象外）。
- 教訓: Workers の stateful 処理は最初から KV / DO 前提で設計するのが安全。in-memory は smoke 用 / コスト最小実装と割り切る。

### 6.4 Slack Block Kit の severity 色付けレンダリング差

- severity ヘッダの色分けは `blocks` 単独では実現できず、`attachments[].color`（hex）併用が必要。ただし `attachments` は Slack 側で legacy 扱いとなっており、デスクトップ / モバイル / Slack Connect 経由でレンダリングが微妙に変わる。
- 対策: `apps/api/src/lib/cloudflare-alert-formatter.ts` で `blocks` を本体、`attachments[].color` を色のためだけに使用するハイブリッド構造に固定。
- 教訓: Slack の severity 視覚化は「`blocks` 本体 + `attachments` 色 hint」が現実的な落とし所。runtime smoke では必ず複数クライアント（少なくとも desktop + mobile 1 種）で着信表示を目視確認する。

---

## 7. 参照情報

### 関連ドキュメント

- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/lib/cf-webhook-auth.ts`
- `apps/api/src/lib/cloudflare-alert-formatter.ts`
- `apps/api/src/lib/slack-sender.ts`
- `apps/api/src/types/cloudflare-notification.ts`

### 関連 issue / task

- 親: ut-17-cloudflare-analytics-alerts
- 同種先行例: `docs/30-workflows/completed-tasks/task-09a-A-exec-staging-smoke-001.md`
- 同種先行例: `docs/30-workflows/completed-tasks/task-09b-a-runtime-provider-smoke-execution-001.md`
