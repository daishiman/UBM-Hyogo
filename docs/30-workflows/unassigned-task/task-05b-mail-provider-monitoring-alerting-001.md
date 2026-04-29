# 05b follow-up: mail provider 監視 / alerting - タスク指示書

## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | task-05b-mail-provider-monitoring-alerting-001             |
| タスク名     | Magic Link mail provider 監視と alerting                   |
| 分類         | operations / observability                                 |
| 対象機能     | `apps/api` Magic Link mailer (Resend HTTP API)             |
| 優先度       | 中                                                         |
| 見積もり規模 | 中規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | 05b Phase 12 unassigned-task-detection (U-03)              |
| 発見日       | 2026-04-29                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05b では Magic Link 送信を Resend HTTP API 経由で実行し、送信失敗時には F-11 rollback で auth_token を削除した上で 502 `MAIL_FAILED` を返す実装を導入した（`apps/api/src/services/mail/magic-link-mailer.ts`）。
ただし、失敗時の運用検知は `console.warn` ログに依存しており、Cloudflare Workers のデフォルトログは Logpush sink が無い限り長期保持されない。

### 1.2 問題点・課題

- `MAIL_FAILED` の発生件数・失敗率・失敗理由分布を時系列で観測できない
- production で `MAIL_PROVIDER_KEY` が未設定 / rotate 漏れ / Resend 障害が起きてもログイン導線が静かに失敗し続ける
- bounce / complaint レートが計測されず、送信ドメイン reputation の低下を事前検知できない
- development/test の no-op success と production fail-closed が同じ log 種別に流れ、production 異常の検出 SN 比が低い

### 1.3 放置した場合の影響

- production ログイン障害が顧客通報まで気付けない（runbook 不在）
- Resend 側の rate limit / domain block 発生時に対応が遅延
- L-05B-003（外部依存先呼び出し Worker は monitoring と pair で wave 計画する教訓）が運用に反映されないまま、別 wave で同種の負債が再発

---

## 2. 何を達成するか（What）

### 2.1 目的

mail provider (Resend) の送信成功率・失敗理由分布・遅延・bounce/complaint レートを Cloudflare Workers Logs / Analytics Engine もしくは外部 dashboard で可視化し、しきい値超過時に運用者へ alert する常設の観測基盤を整える。

### 2.2 最終ゴール

- 502 `MAIL_FAILED` の件数・率が dashboard で時系列に確認できる
- 失敗理由（API key 不正 / rate limit / network / 5xx 等）が分類されて集計できる
- 連続失敗 N 件 または 失敗率 X% 超過で alert 通知が発火する
- runbook に provider key rotate / disabled 時の復旧手順が記述されている
- development/test の no-op 成功は production 集計に混入しない

### 2.3 スコープ

#### 含むもの

- `magic-link-mailer.ts` の structured log 出力フォーマット確定（JSON、PII redaction ルール込み）
- Cloudflare Workers Logs / Logpush / Analytics Engine いずれを採用するかの選定
- dashboard（Cloudflare Analytics or 外部 SaaS）構築
- alert ルール定義（しきい値・通知先・rate limit）
- runbook 整備（provider key rotate、Resend incident 時の手順）

#### 含まないもの

- Magic Link の認証フロー本体の改修
- mail provider の差し替え（Resend → 別サービス）
- bounce/complaint webhook を受けて auth_token を無効化する自動化（別タスク）
- payment 等、他の外部依存サービス監視（個別タスク）

### 2.4 成果物

- `apps/api/src/services/mail/magic-link-mailer.ts` の log 出力差分
- Logpush / Analytics Engine 設定ファイル（`apps/api/wrangler.toml` または別 manifest）
- dashboard 定義（コードまたはスクリーンショット）
- alert ルール定義
- `docs/30-workflows/05b-.../runbooks/mail-provider-incident.md`（新規）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 05b が main にマージ済みで `MAIL_FAILED` 経路が production で稼働している
- Cloudflare アカウントで Workers Logs / Logpush / Analytics Engine の利用可否が確認済み
- Resend dashboard 側の bounce/complaint メトリクスへのアクセス権が運用者にある

### 3.2 依存タスク

- 05b Phase 12 unassigned-task-detection U-03 の識別
- L-05B-003 の lessons-learned 参照
- F-11 rollback 実装（既に完了）

### 3.3 必要な知識

- Cloudflare Workers Logs / Logpush / Analytics Engine の datasource 設計
- Resend API のエラーレスポンス分類
- 構造化ログ（JSON）と PII redaction（送信先 email のハッシュ化等）
- alert 通知チャネル（Slack / Email / PagerDuty 等）の選定

### 3.4 推奨アプローチ

1. まず Phase 1 で structured log フォーマットを確定し、production の `magic-link-mailer.ts` を最小差分で更新
2. Logpush で R2 sink に流す経路と、Analytics Engine の dataset に書き込む経路の費用 / 運用コストを比較し、どちらか一方に統一
3. dashboard は最初は Cloudflare 内蔵で済ませ、要件が膨らんだ段階で外部 SaaS を検討
4. alert は false positive を恐れて緩めに開始し、運用しながら閾値を tighten する

---

## 4. 実行手順

### Phase 構成

1. structured log フォーマットの確定
2. ログ収集経路の選定と接続
3. dashboard 構築
4. alert ルール定義と通知接続
5. runbook 整備と訓練

### Phase 1: structured log フォーマットの確定

#### 目的

`magic-link-mailer.ts` が出力するログの JSON schema と redaction ルールを決める。

#### 手順

1. 現状の `console.warn` 出力箇所を棚卸しする
2. 必須フィールドを定義（`event`, `outcome`, `provider`, `errorCategory`, `httpStatus`, `latencyMs`, `tokenIdHash`, `recipientHash`, `env`）
3. PII（生 email、token 平文）を出力しないことを redaction ルールとして明文化
4. development/test では `env=dev` を付与し、production 集計から除外可能にする

#### 成果物

log schema 仕様メモと `magic-link-mailer.ts` の差分案

#### 完了条件

production / dev の log が同 schema で出力され、PII が含まれない

### Phase 2: ログ収集経路の選定と接続

#### 目的

長期保持と検索可能な経路を 1 つに決めて接続する。

#### 手順

1. Cloudflare Workers Logs / Logpush (R2) / Analytics Engine の比較表を作成
2. コスト・retention・検索性で 1 つを選定
3. `wrangler.toml` または Cloudflare dashboard で設定（実値は 1Password / Cloudflare Secrets で管理、`scripts/cf.sh` 経由）
4. production で 1 件以上のサンプルレコードが収集されることを確認

#### 成果物

採用経路の設定ファイル / 設定スクリーンショットと収集サンプル

#### 完了条件

production の `MAIL_FAILED` ログが選定 sink に到達している

### Phase 3: dashboard 構築

#### 目的

成功率・失敗理由分布・遅延・bounce/complaint を可視化する。

#### 手順

1. 成功 / 失敗カウント時系列グラフ
2. `errorCategory` 別の積み上げグラフ
3. p50 / p95 latency
4. Resend dashboard の bounce/complaint レートをリンク or 取り込み
5. development/test の `env=dev` を除外するフィルタを既定にする

#### 成果物

dashboard URL と panel 定義

#### 完了条件

運用者が 1 画面で mail provider の健全性を判断できる

### Phase 4: alert ルール定義と通知接続

#### 目的

しきい値超過を能動的に通知する。

#### 手順

1. alert 条件を定義（例: 5 分間で `MAIL_FAILED` が連続 5 件、または 15 分間の失敗率が 20% 超）
2. 通知先（Slack channel 等）と rate limit を設定
3. test alert を 1 回発火し受信を確認
4. false positive 観察期間を設けて閾値を tighten

#### 成果物

alert ルール設定と test 発火ログ

#### 完了条件

しきい値超過時に通知が届くことが実証されている

### Phase 5: runbook 整備と訓練

#### 目的

alert 受信時の対応手順を文書化する。

#### 手順

1. `MAIL_PROVIDER_KEY` rotate 手順を `scripts/cf.sh` 経由で記述
2. Resend 側 incident 時の暫定対応（送信停止 / fallback）
3. F-11 rollback の挙動と auth_token 無効化の確認手順
4. 月 1 回の dry-run スケジュール

#### 成果物

`runbooks/mail-provider-incident.md`

#### 完了条件

runbook を読んだ別オペレーターが手順だけで復旧操作を実施できる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] structured log が JSON schema 通りに production で出力されている
- [ ] 選定した sink に長期保持されている
- [ ] dashboard で成功率 / 失敗理由 / 遅延 / bounce が可視化されている
- [ ] alert がしきい値超過時に発火する
- [ ] runbook が整備されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `apps/api` テスト緑
- [ ] PII が log に含まれないことを review で確認

### ドキュメント要件

- [ ] runbook を `docs/30-workflows/05b-.../runbooks/` に追加
- [ ] L-05B-003 と本タスクの対応関係を lessons-learned に追記
- [ ] dashboard URL / alert channel を運用ドキュメントに記録（実値ではなく参照のみ）

---

## 6. 検証方法

### テストケース

- production で意図的に `MAIL_PROVIDER_KEY` を不正値にして alert 発火を観測（staging での実演）
- Resend が 5xx を返す mock で `errorCategory` が正しく分類される
- 通常成功時に `outcome=success` のレコードが sink に到達する
- development 環境の no-op success が `env=dev` でフィルタ除外される

### 検証手順

```bash
# log schema レビュー
rg -n "console\\.(warn|error|log)" apps/api/src/services/mail/

# ビルド・型・lint
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
mise exec -- pnpm --filter @repo/api test

# Cloudflare 設定（実値はラッパー経由）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

---

## 7. リスクと対策

| リスク                                                       | 影響度 | 発生確率 | 対策                                                                     |
| ------------------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------ |
| log に PII（email 平文・token）が混入                        | 高     | 中       | redaction ルールを Phase 1 で確定し、review で機械的にチェック           |
| Logpush / Analytics Engine のコストが想定より高騰            | 中     | 中       | Phase 2 で比較表を作成し、retention を最小に設定。月次でコスト確認        |
| alert false positive 多発で運用者が無視するようになる        | 高     | 中       | Phase 4 で観察期間を設け、閾値を段階的に tighten                         |
| Resend 側 schema 変更で `errorCategory` 分類が劣化           | 中     | 低       | unknown カテゴリを `errorCategory=other` に集約し、急増時に再分類       |
| monitoring 構築中に auth core の検証時間を圧迫              | 中     | 中       | 本タスクは 05b 本体と別 wave に切り出し、05b 取り込み後に着手する        |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`（L-05B-003）
- `apps/api/src/services/mail/magic-link-mailer.ts`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`

### 参考資料

- Cloudflare Workers Logs / Logpush / Analytics Engine 公式ドキュメント
- Resend API エラーレスポンス仕様
- L-05B-003: 外部依存先呼び出し Worker は monitoring task と pair で wave 計画する

---

## 9. 実装課題と解決策（lessons-learned 対応）

> 本セクションは `lessons-learned-05b-magic-link-auth-gate-2026-04.md` L-05B-003 を中心に、
> dev no-op success と production fail-closed の区別化原則を運用基盤へ展開する観点を整理する。

### 9.1 対応する lesson

| Lesson ID  | 教訓要旨                                                                                                                                          | 本タスクへの影響                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| L-05B-003  | mail provider 失敗時は token rollback で fail-closed を担保する。development/test の no-op success と production の fail-closed を **区別して記録** する | 本タスクは観測基盤側でこの区別をそのまま実装する。structured log の `env` フィールドを必須化し、dashboard / alert は production のみに既定フィルタを適用 |

### 9.2 再発する可能性

- 外部依存先（mail / payment 等）を呼び出す Worker の monitoring を後回しにすると、production 障害が顧客通報まで気付けない盲点が再生する。L-05B-003 の Follow-up Boundaries に従い、**外部依存呼び出し Worker は monitoring task と pair で wave 計画する** 運用ルールを次回 wave で必ず適用する
- dev/test の no-op success が production 集計に混入すると、failure rate が見かけ上 0 になり alert が発火しない。Phase 1 の log schema で `env` を **必須フィールド** にし、dashboard 既定フィルタで dev を除外する
- redaction ルールが緩いと token 平文 / 生 email が log sink に流入し、回収不能の漏洩事故になる。Phase 1 で redaction を確定し、review で機械的にチェックする

### 9.3 事前に確認すべき設計判断

- 採用する sink（Workers Logs / Logpush + R2 / Analytics Engine）の比較表と費用上限を Phase 2 で運用者と合意。後から sink 切替するとログ schema 互換性の問題が発生する
- alert の初期しきい値は false positive を恐れて緩めに開始し、運用観察期間（最低 2 週間）を経て tighten する Phase 4 の運用順序を Phase 0 で合意
- runbook の dry-run スケジュール（月 1 回）を Phase 5 完了条件に組み込み、実運用での復旧訓練を強制化する
- F-11 rollback の挙動（送信失敗 → token 削除 → 502）が monitoring 化後も破壊されていないことを Phase 1 着手前に再確認する

---

## 10. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 05b 実装中、Resend HTTP API 失敗時の F-11 rollback は実装したが、失敗が連続発生した場合に運用者へ通知する仕組みが無く、Cloudflare Worker の `console.warn` ログは Logpush なしで保持されないため長期トレンドが取れない状態だった |
| 原因     | 05b スコープに monitoring を含めると Logpush 設定 / R2 sink / dashboard 構築まで連鎖し、auth core の検証時間を圧迫するため、Logpush 設定や Workers Analytics Engine の datasource 化を 05b 本体スコープから外した         |
| 対応     | 05b では structured log の最低限の出力箇所のみ確保し、monitoring / alerting は本タスクとして別 wave に切り出した。送信失敗 sample log の JSON 構造と redaction ルールは本タスク Phase 1 で確定する          |
| 再発防止 | 「外部依存先（mail / payment 等）を呼び出す Worker は、必ず monitoring task と pair で wave 計画する」運用ルールを `lessons-learned` hub（L-05B-003）に追加検討。次回以降は wave 計画段階で monitoring 受け皿タスクを同時起票する |

### レビュー指摘の原文（該当する場合）

```
05b Phase 12 unassigned-task-detection.md (U-03) にて、Magic Link mail provider の監視 / alerting を別 wave 切り出しタスクとして識別。
F-11 rollback により fail-closed は確保されているが、失敗連続検知の能動通知が無いため運用上の盲点となる。
```

### 補足事項

本タスクは 05b 取り込み後の早い時期に着手するのが望ましい。Logpush / Analytics Engine いずれを採用するかでコスト構造が大きく変わるため、Phase 2 の比較段階で運用者と費用上限を合意する必要がある。Resend 側の bounce/complaint webhook 連動による auth_token 自動無効化は本タスクのスコープ外とし、別タスクで扱う。
