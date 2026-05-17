# ALERT_DEDUP_KV namespace の usage / latency dashboard 監視整備 - タスク指示書

## メタ情報

```yaml
issue_number: 702
```

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring                        |
| タスク名     | ALERT_DEDUP_KV namespace の usage / latency dashboard 監視整備                       |
| 分類         | 改善（運用観測）                                                                    |
| 対象機能     | Cloudflare KV namespace `ALERT_DEDUP_KV`（`apps/api` `/internal/alert-relay` 経由） |
| 優先度       | 低                                                                                  |
| 見積もり規模 | 小規模                                                                              |
| ステータス   | unassigned                                                                          |
| 発見元       | ut-17-followup-002-alert-relay-dedup-kv-persistence / UT-17-FU-005 structured log schema |
| 発見日       | 2026-05-14                                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-17 follow-up 002 で `apps/api/src/routes/internal/alert-relay.ts` の dedup を in-memory `Map` から Cloudflare KV namespace `ALERT_DEDUP_KV` へ移行した。これにより isolate 跨ぎでも dedup window 内の重複アラートを抑止できるようになった一方、KV namespace 自体の **usage（read/write/storage）と latency** を Cloudflare Dashboard で継続監視する設定は未整備のままである。

KV は Workers の binding として呼ばれるが、独立した dashboard 画面を持たず、観測は Workers Analytics 側に集約される。アラート転送量が想定外に増えた場合、KV write が free tier / 課金単価境界を越えても気付けない構造になっている。

### 1.2 問題点・課題

- `ALERT_DEDUP_KV` の write/min・read/min・storage bytes・error rate が dashboard で恒常監視されていない。
- UT-17-FU-005 で追加された `event=alert_relay_kv_op_failed` の `op=get|put` 件数が dashboard / aggregation 対象に含まれていない。
- 上限 / 課金境界（KV write daily quota など）を越えても、運用側が事後的にしか気付けない。
- KV latency が悪化した場合、alert-relay 全体の応答が劣化するが、原因が KV か Slack 側か切り分ける指標が無い。
- UT-17 で構築済みの Slack アラートチャネルへ KV 観測アラートを乗せる動線が存在しない。

### 1.3 放置した場合の影響

- KV write quota 超過で dedup `put` が失敗し、Slack へ重複通知が再発するが、`alert_relay_kv_op_failed` を集計しないと原因特定に時間がかかる。
- KV latency 悪化が alert-relay の p95 を引き上げても、observability が無いため SLO 議論ができない。
- follow-up 002 で導入した KV 永続化の効果検証（dedup hit rate / write 頻度）が runbook 月次レビューで定量化できない。

---

## 2. 何を達成するか（What）

### 2.1 目的

`ALERT_DEDUP_KV` namespace の usage / latency / error rate と、UT-17-FU-005 の `alert_relay_kv_op_failed` structured log event を Cloudflare Dashboard / Workers Logs / 後段 aggregation で恒常監視し、閾値超過時に UT-17 既存の Slack アラートチャネルへ通知が届く状態を作る。

### 2.2 最終ゴール

- `ALERT_DEDUP_KV` の writes/min・reads/min・error rate・storage bytes が Cloudflare Dashboard で確認できる。
- `alert_relay_kv_op_failed` を `op=get` / `op=put` 別に日次・時間帯別で集計できる。
- Cloudflare Notification policy が KV 関連メトリクスに対して 1 件以上設定され、既存 cf-webhook 経由で `apps/api` `/internal/alert-relay` を通って Slack に届く。
- 月次 runbook（`ut-17-alert-relay-monthly-healthcheck.md`）に KV usage / latency の確認手順が追加される。

### 2.3 スコープ

#### 含むもの

- Cloudflare Dashboard 上の KV namespace 計測項目特定（Workers Analytics の KV operation メトリクス）
- Cloudflare Notification policy 追加（writes/min・error rate 等の閾値超過、user-gated Dashboard 操作）
- Workers Logs / Logpush / Analytics Engine のいずれかで `alert_relay_kv_op_failed` event を集計する方法の選定と runbook 化
- `apps/api` 側で新 policy の webhook payload が既存 `/internal/alert-relay` ルートを通過することの確認（コード変更不要前提）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への KV 監視項目追記

#### 含まないもの

- `alert-relay.ts` / dedup ロジックのコード変更（follow-up 002 / 005 のスコープ）
- route-level structured log producer の追加（UT-17-FU-005 で完了済み）
- 新 KV namespace の追加（`ALERT_DEDUP_KV` の運用観測に閉じる）
- Notification policy の API 化 / IaC 化（Cloudflare 側で API 未公開のため）

### 2.4 成果物

- Cloudflare Dashboard で `ALERT_DEDUP_KV` 関連メトリクスと `alert_relay_kv_op_failed` 件数を確認するための手順 note（runbook 内）
- 新規 Notification policy 1 件以上（Cloudflare 側に作成。本リポジトリには id / 名称のみを runbook に記載）
- 更新版 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- ベースライン取得ログ（staging で 1 週間の writes/min・error rate）の記録メモ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Node 24.15.0 / pnpm 10.33.2
- Cloudflare CLI 操作はすべて `bash scripts/cf.sh` 経由（`wrangler` 直接実行禁止）
- Notification policy 作成は Dashboard UI 操作のため **user-gated**（Claude Code は手順提示のみ、実操作はユーザー承認後）
- UT-17 follow-up 002 が merge 済みで `ALERT_DEDUP_KV` が staging / production 両 env に存在すること

### 3.2 依存タスク

- ut-17-followup-002-alert-relay-dedup-kv-persistence（親 / KV namespace 導入）
- ut-17-cloudflare-analytics-alerts（祖父 / Slack 通知チャネル + cf-webhook 経路）

### 3.3 必要な知識

- Cloudflare KV namespace は独立 dashboard を持たず、Workers Analytics の `Workers > KV` 配下にメトリクスが出る
- Cloudflare Notification policy は Account-scoped で、`wrangler` / public API では作成不可（Dashboard UI 必須）
- UT-17 で構築済みの cf-webhook → `/internal/alert-relay` → Slack 経路は payload 構造に依存せず汎用転送する
- 閾値は staging で 1 週間のベースラインを取ってから設定する（過剰アラート防止）

### 3.4 推奨アプローチ

1. まず staging 環境で 1 週間分の `ALERT_DEDUP_KV` writes/min・reads/min・error rate・storage bytes を観測し、p95 / max を記録する。
2. その値を基に、`max × 3` 程度を初期閾値とする（保守的）。production 適用時は staging 値の差分を考慮して上振れ係数を再評価する。
3. Notification policy は Dashboard で「Workers KV」関連の available product から選び、対象 namespace を `ALERT_DEDUP_KV` に絞る。webhook 通知先は UT-17 既設の cf-webhook を再利用する。
4. 既存 `/internal/alert-relay` は generic payload を Slack へ整形転送する設計なので、コード変更なしで新 policy も通過するはず。staging で擬似発火させて Slack 着信を確認する。
5. runbook に「月次で writes / error rate / storage trend を Workers Analytics で確認」「閾値見直しは四半期ごと」項目を追記する。

---

## 4. 実行手順

### Phase 構成

1. ベースライン取得対象メトリクスの選定
2. Cloudflare Notification policy 作成（user-gated）
3. 既存 alert-relay 経路を通過することの実機確認
4. runbook 反映

### Phase 1: ベースライン取得対象メトリクスの選定

#### 目的

監視対象メトリクスと初期閾値の根拠を確定する。

#### 手順

1. Cloudflare Dashboard → Workers & Pages → KV → `ALERT_DEDUP_KV` を開き、利用可能なメトリクス（writes/min, reads/min, deletes/min, error rate, storage bytes）を列挙
2. staging 環境で 1 週間（最低 5 営業日）分のメトリクスを観測し、p50 / p95 / max を記録
3. 初期閾値案を `max × 3`（writes/min, reads/min）、`error rate > 1%`、`storage > 想定上限 80%` で起票

#### 完了条件

監視対象 4 項目（writes/min, reads/min, error rate, storage bytes）と初期閾値が文書化される

### Phase 2: Cloudflare Notification policy 作成（user-gated）

#### 目的

閾値超過時に既存 Slack チャネルへ通知が届く Notification policy を Account に登録する。

#### 手順

1. **ユーザー承認後**、Cloudflare Dashboard → Notifications → Create に進む
2. Product は Workers / KV 関連カテゴリから選び、対象 namespace を `ALERT_DEDUP_KV` に絞る
3. Webhook destination として UT-17 で登録済みの cf-webhook を選択
4. Phase 1 で決めた閾値を入力し、policy を作成
5. policy 名 / id を runbook に記録（実値はリポジトリにコミットしない）

#### 完了条件

`ALERT_DEDUP_KV` に紐づく Notification policy が 1 件以上 active になる

### Phase 3: 既存 alert-relay 経路を通過することの実機確認

#### 目的

新 policy が発火した際、コード変更なしで Slack へ届くことを保証する。

#### 手順

1. staging で擬似的に閾値超過を起こす（負荷スクリプトで KV write を一時的に多発させる、または policy の閾値を一時的に低くしてテストする）
2. cf-webhook → `/internal/alert-relay` → Slack の経路で 1 件着信することを確認
3. dedup window 内で重複通知が出ないことを確認（follow-up 002 の retention を流用）
4. テスト終了後、policy 閾値を本番想定値に戻す

#### 完了条件

staging で Slack 着信ログが取得され、`/internal/alert-relay` ログに該当 request が記録される

### Phase 4: runbook 反映

#### 目的

月次 / 四半期の運用フローに KV 監視を組み込む。

#### 手順

1. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に以下を追記
   - 月次: Workers Analytics で `ALERT_DEDUP_KV` の writes/min・error rate・storage トレンドを確認
   - 四半期: Phase 1 のベースラインを再計測し、閾値を見直す
   - 通知が誤発火した場合のエスカレーション手順（policy 一時無効化 → 閾値再評価）
2. follow-up 002 仕様書の「7. 参照情報」に本タスクへの相互リンクを追記（任意）

#### 完了条件

runbook に KV 監視セクションが追記され、月次レビュー手順として組み込まれる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `ALERT_DEDUP_KV` の writes/min・reads/min・error rate・storage bytes を Workers Analytics で確認できる
- [ ] Cloudflare Notification policy が 1 件以上 active で、対象 namespace が `ALERT_DEDUP_KV` に絞られている
- [ ] 既存 `/internal/alert-relay` 経路を通過し Slack に届くことが staging で実証される
- [ ] dedup window 内で重複通知が抑止される（follow-up 002 の挙動を維持）

### 品質要件

- [ ] コード変更を伴わないことを `git diff` で確認（本タスクは観測整備のみ）
- [ ] staging で 1 週間のベースライン取得ログがメモとして残る
- [ ] 初期閾値の根拠が runbook から辿れる

### ドキュメント要件

- [ ] `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に KV 監視セクションが追加される
- [ ] Notification policy 名 / id が runbook に記録される（実値の秘匿が不要な範囲で）
- [ ] 四半期見直し手順が明文化される

---

## 6. 苦戦箇所メモ（再発防止）

> このセクションは Cloudflare KV / Notifications の運用観測で踏みやすい地雷を、後続作業者の事前知識として明文化する。

### 6.1 KV namespace には独立 dashboard が無い

- Cloudflare KV のメトリクスは「KV namespace 専用 dashboard」ではなく **Workers Analytics に集約**されている。Dashboard 内の動線も浅い階層には無く、Workers & Pages → KV → 当該 namespace → Metrics タブ、という辿り方になる。
- 「KV dashboard を開けばいい」という先入観で動くと探し回るので、最初に Workers Analytics 配下であることを認識する。
- レポート期間も Workers Analytics と同じ制約（過去 30 日 / 集計粒度の上限）に従う。長期トレンドが必要なら GraphQL Analytics API へ移行する必要があるが、本タスクのスコープ外。

### 6.2 Notification policy は API 作成不可（Dashboard UI 必須）

- Cloudflare Notifications は Account-scoped リソースで、現状 public API / `wrangler` から作成できない。**Dashboard UI 操作が必須**。
- そのため Claude Code から自動化できず、**user-gated 手順**として明示する必要がある。Phase 2 を `wrangler` で実行しようとして失敗する事故を防ぐため、手順書側で UI 操作であることを強調する。
- IaC 化したい欲求は出るが、現時点では公式 Terraform provider でも一部しか対応していない。将来 API が拡張されたら別タスクで IaC 化を検討する。

### 6.3 閾値はベースライン取得前に固定しない

- KV write/read の発生量はアラート転送量と直結し、UT-17 alert volume の季節変動を直接受ける。**閾値を勘で設定すると過剰通知（アラート疲労）か沈黙（取りこぼし）のどちらかに必ず転ぶ**。
- Phase 1 のベースライン 1 週間は省略禁止。最低でも 5 営業日分、できれば月またぎを含む 2 週間が望ましい。
- `max × 3` は保守的な初期値で、最初の月次レビューで p95 ベースに切り替えるなどの調整余地を残す。閾値を runbook で明示し、誰が見ても根拠を辿れる状態にする。

### 6.4 dedup 自体の挙動と監視通知の重複を混同しない

- follow-up 002 の dedup は **alert-relay → Slack** の重複抑止であり、Notification policy 側（Cloudflare → cf-webhook）の重複は別レイヤ。
- 新 policy が高頻度発火した場合、cf-webhook までは複数回届く可能性があり、その後の `/internal/alert-relay` の KV dedup で抑止される構造になる。設計レビュー時に「2 段階の重複抑止経路」を混同して「片方しか効いていない」と誤認しないよう注意。
- staging で実機確認する際、dedup window 内で意図的に複数発火を試して挙動を観察すると、両レイヤの責務分離が体感できる。

### 6.5 KV operation latency と alert-relay p95 の責務分離

- KV `get` / `put` の latency は eventual consistency 構造上、リージョン跨ぎでばらつく。alert-relay p95 が悪化した時、原因が KV か Slack API か切り分ける指標を最初から runbook に組み込む。
- 具体的には Workers Analytics の KV operation duration を観測項目に含め、Slack API 側の latency（既存ログから取得）と並べて月次でレビューする。
- 切り分け指標がないと「alert-relay が遅い」という抽象的な incident が立った時、KV を疑うかどうかの判断に毎回時間を取られる。

---

## 7. 参照情報

### 関連実装

- `apps/api/src/routes/internal/alert-relay.ts`（KV 経由 dedup の現状実装）
- `apps/api/src/env.ts`（`ALERT_DEDUP_KV` binding 型）
- `apps/api/wrangler.toml`（KV namespace 定義）

### 関連ドキュメント

- `docs/30-workflows/unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md`（親タスク仕様）
- `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/`（親 workflow 一式）
- `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/outputs/phase-12/unassigned-task-detection.md`（本タスクの発見元）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（runbook 反映先）
- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`
- `docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md`（祖父タスク）

### 関連 issue / task

- ut-17-followup-002-alert-relay-dedup-kv-persistence（親 / KV 永続化）
- ut-17-cloudflare-analytics-alerts（祖父 / Slack 通知チャネル整備）
