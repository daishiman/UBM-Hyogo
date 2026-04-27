# UT-08 Phase 2: 05a runbook 差分計画 (AC-6)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-6 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 対象 | `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/` 配下成果物 |
| 不変条件 | 05a 成果物を上書きしない（不変条件 1） |

05a の手動 runbook を上書きせず、UT-08 で追加される自動監視・自動アラートに関する追記計画として本ドキュメントを保持する。実際の追記は本ドキュメントが Phase 11/12 で 05a 担当と合意されたあと、Wave 2 実装フェーズの末尾で行うか、05a 側のドキュメント更新タスクで吸収する。

---

## 1. 上書き禁止項目（明文化）

以下の 05a 既存成果物の **既存内容は変更しない**。

- `outputs/phase-02/observability-matrix.md`（手動観測項目一覧）
- `outputs/phase-02/cost-guardrail-runbook.md`（無料枠手動チェック / ガードレール手順）
- 05a の手動チェック手順、月次運用フロー、責任分界の記載
- 05a 既存の参照リンク

UT-08 は **追記のみ** を行う差分計画として扱い、本書（runbook-diff-plan.md）に追記項目を集約する。

---

## 2. observability-matrix.md への追記計画

| 追記対象メトリクス（05a 既存項目） | UT-08 追記内容 |
| --- | --- |
| Workers エラーレート | 「自動監視あり: WAE `api.error` イベント、UT-08 [metric-catalog.md](./metric-catalog.md) 参照」 |
| Workers CPU 時間 | 「自動監視あり: Cloudflare Analytics、閾値 8ms WARNING / 9.5ms CRITICAL」 |
| Workers Subrequests | 「自動監視あり: 40 / req WARNING」 |
| D1 row reads / writes | 「自動監視あり: 70% WARNING / 90% CRITICAL、Dashboard ポーリング」 |
| 外形監視 | 「自動監視あり: UptimeRobot 5 min、UT-08 [external-monitor-evaluation.md](./external-monitor-evaluation.md) 参照」 |
| Cron 起動 | 「自動監視あり: WAE `cron.sync.start/end`、24h で 1 件失敗 → WARNING」 |

### 追記するセクションの形式（提案）

各メトリクス行末に以下のマーカを追加するか、observability-matrix.md の末尾に「UT-08 自動化対応表」を新設する（後者を推奨、既存 table に手を入れない）。

```markdown
## UT-08 自動化対応表（参照）

UT-08 で自動化に昇格したメトリクスは下表のとおり。詳細は
docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/metric-catalog.md
を参照。本表は本ドキュメントの既存内容を変更せず追記のみ。
```

---

## 3. cost-guardrail-runbook.md への追記計画

### 3.1 アラート受信時の一次対応手順（新セクション）

05a の手動チェック手順は維持しつつ、本セクションを末尾追記する。

```markdown
## UT-08 自動アラート受信時の一次対応（追記）

1. Slack `#alerts-prod` で WARNING / CRITICAL 通知を確認
2. 通知メッセージの「Service / Severity / Runbook URL」を控える
3. WARNING の場合:
   - 同種アラートの過去 24h 件数を Slack 検索
   - 既知パターンなら担当に共有のみ。新規パターンなら 4 へ
4. CRITICAL の場合:
   - 即時 apps/api / Pages の Cloudflare Dashboard を開き、メトリクス傾向を確認
   - 必要に応じ Wave 2 で定義された個別 runbook（D1 失敗 / Sheets 同期失敗等）を参照
5. 対応完了後、Slack スレッドに対応結果を残す（次月の閾値レビュー入力）
```

### 3.2 Secret ローテーション手順（新セクション）

```markdown
## UT-08 監視 Secret ローテーション（追記）

Slack Webhook URL が漏洩した場合の対応:
1. Slack 管理画面で該当 Webhook を Revoke
2. 新規 Webhook を発行
3. 1Password Environments で該当 Secret を更新
4. `wrangler secret put MONITORING_SLACK_WEBHOOK_URL_PROD --env production`
   `wrangler secret put MONITORING_SLACK_WEBHOOK_URL_STAGING --env staging`
5. テスト通知を発火し疎通確認
6. ローテーション履歴を 1Password の change log に残す
```

### 3.3 月次レビューのチェック項目追加

05a 月次手動チェックに以下を追加（既存項目は維持）。

- [ ] WARNING 通知件数 / 月（誤報率の集計）
- [ ] WAE data points 月次累計（無料枠超過予防）
- [ ] UptimeRobot monitor 数（無料枠 50 内に収まっているか）
- [ ] Slack Webhook 疎通テスト 1 回

---

## 4. 二重管理を避けるための運用ルール

| 項目 | 05a の責務 | UT-08 の責務 |
| --- | --- | --- |
| メトリクス定義 | 手動観測項目の正本 | 自動化に昇格したメトリクスの正本（metric-catalog.md） |
| 閾値定義 | （なし、手動判断） | 自動アラート閾値（alert-threshold-matrix.md） |
| 月次手動チェック | 既存通り維持 | UT-08 由来の月次チェック追加項目のみ |
| 自動アラート受信時手順 | （なし） | 一次対応手順（本ドキュメント §3.1） |
| Secret ローテーション | （なし） | 監視 Secret 用の手順（本ドキュメント §3.2） |

同じメトリクスが両方で別定義されないよう、UT-08 metric-catalog.md は 05a observability-matrix.md からの追加・上書きをしない構成とする（[metric-catalog.md §7](./metric-catalog.md) で対応関係を記述）。

---

## 5. 追記タイミング

| いつ | 何を | 誰が |
| --- | --- | --- |
| Phase 3 レビュー | 本書（runbook-diff-plan.md）の 05a 担当合意 | UT-08 担当 + 05a 担当 |
| Phase 12 | 05a index.md に「UT-08 で追記された差分計画あり」と注記 | UT-08 担当 |
| Wave 2 実装末尾 | 05a runbook 本体への追記 PR を別タスクで作成（または 05a 側で吸収） | Wave 2 実装担当 |

UT-08 本タスク内では `outputs/phase-02/runbook-diff-plan.md` に集約するのみ。05a の本体ファイルには触れない。

---

## 6. 衝突発生時の解消手順

万が一 05a 既存成果物と UT-08 の記述で意味の衝突が発覚した場合:

1. 即座に UT-08 側を修正する（05a を変更しない、不変条件 1）
2. 衝突箇所を本ドキュメント §1「上書き禁止項目」へ追加
3. Phase 3 レビューに差し戻し（NO-GO 判定）

---

## 7. 参照リンク

- 05a: `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md`
- 05a phase-02: `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md`
- UT-08 metric-catalog: [metric-catalog.md](./metric-catalog.md)
- UT-08 alert-threshold: [alert-threshold-matrix.md](./alert-threshold-matrix.md)
- UT-08 notification: [notification-design.md](./notification-design.md)
