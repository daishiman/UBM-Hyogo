# Phase 6 成果物: 異常系マトリクス (failure-case-matrix.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-08 モニタリング/アラート設計 |
| Phase | 6 / 13（異常系検証計画） |
| 作成日 | 2026-04-27 |
| 状態 | completed |
| 種別 | 設計タスク（non_visual） — 実機障害再現は Wave 2 実装タスクが担当 |

---

## 1. 観点

監視・アラート基盤そのものが「壊れた」ときに検出・回復できる手順を整備する。
本マトリクスは「**監視を監視する**」観点で異常系シナリオを洗い出し、
各シナリオの検出方法・期待結果・回復手順を Wave 2 実装タスクへの実機検証入力として固定する。

異常カテゴリ（10 ケース）:
1. WAE 書き込み失敗（バインディング欠落・dataset 不在・rate limit）
2. 通知配送失敗（Slack Webhook 失効・メール bounce）
3. 外部監視ダウン（UptimeRobot / Cronitor サービス障害）
4. 閾値誤検知（誤報・過検知・未検知）
5. Secret 欠落・期限切れ
6. 上流タスク障害（UT-09 同期失敗の検知欠落）
7. 無料枠枯渇による計装停止
8. 05a 成果物との重複・上書きリスク
9. Secret 漏洩
10. 誤報多発（アラート疲れ）

---

## 2. 異常系シナリオ詳細（FC-01〜FC-12）

### FC-01: WAE バインディング欠落

| 項目 | 内容 |
| --- | --- |
| 原因 | `wrangler.toml` の `analytics_engine_datasets` 未追加または binding 名タイポ |
| 発生環境 | local / staging / production |
| 症状 | `env.WAE_DATASET` が `undefined` で `writeDataPoint` 呼出時に TypeError |
| 検出方法 | `wrangler tail` / Workers Logs Push の TypeError 観測 / smoke (MON-WAE-01) |
| 期待検出結果 | デプロイ直後の smoke で顕在化 |
| 回復手順 | wrangler.toml 修正 → 再デプロイ |
| 自動回復 | 不可 |
| 手動対処難易度 | 低 |
| 関連 AC | AC-5 |

### FC-02: WAE データセット不在 / 書込拒否

| 項目 | 内容 |
| --- | --- |
| 原因 | dataset 名タイポ、または無料枠超過による rate limit |
| 発生環境 | staging / production |
| 症状 | writeDataPoint は throw しないが SQL/GraphQL でデータセット空 |
| 検出方法 | 定期集計（MON-WAE-04）で 1h 以上行追加なし |
| 期待検出結果 | 行追加停止検知の二次アラート（運用通知） |
| 回復手順 | dataset 名修正、rate limit は時間経過で復帰 |
| 自動回復 | 一時的（rate limit）は可、設定不正は不可 |
| 手動対処難易度 | 中 |
| 関連 AC | AC-5 / AC-7 |

### FC-03: Slack Webhook URL 失効

| 項目 | 内容 |
| --- | --- |
| 原因 | Slack 側で Incoming Webhook が無効化 / App 削除 / トークン rotate |
| 発生環境 | staging / production |
| 症状 | UptimeRobot から Slack 配送が 4xx/5xx |
| 検出方法 | UptimeRobot Alert log の delivery failure / Slack 不着 |
| 期待検出結果 | UptimeRobot ダッシュボードに alert delivery failure |
| 回復手順 | Slack で Webhook 再発行 → 1Password 更新 → `wrangler secret put` 再投入 → UptimeRobot コンタクト更新 |
| 自動回復 | 不可 |
| 手動対処難易度 | 中 |
| 関連 AC | AC-3 / AC-11 |

### FC-04: メール通知 bounce / 迷惑メール振り分け

| 項目 | 内容 |
| --- | --- |
| 原因 | 受信側スプール障害、SPF/DKIM 不整合、迷惑メール扱い |
| 発生環境 | staging / production |
| 症状 | UptimeRobot は配送成功と認識、受信ボックスに不着 |
| 検出方法 | Slack 通知と相互チェック（Slack 着信時にメール着信確認） |
| 期待検出結果 | 月次到達確認 runbook（FC-11 と連動） |
| 回復手順 | 迷惑メール救出 / ホワイトリスト / 配信先メール変更 |
| 自動回復 | 不可 |
| 手動対処難易度 | 低 |
| 関連 AC | AC-3 |

### FC-05: 外部監視（UptimeRobot / Cronitor）サービス自体のダウン

| 項目 | 内容 |
| --- | --- |
| 原因 | UptimeRobot / Cronitor 側の障害、アカウント停止 |
| 発生環境 | 全環境共通 |
| 症状 | 監視結果更新停止、アラート発火欠落（盲点） |
| 検出方法 | 各サービス Status Page RSS 購読、二次的な手動 smoke（週次） |
| 期待検出結果 | Status feed の障害告知を別チャネルで把握 |
| 回復手順 | 復旧待ち。長期化時は Better Uptime / Hyperping 無料枠に切替 |
| 自動回復 | 一時障害は自動 |
| 手動対処難易度 | 中（代替切替時） |
| 関連 AC | AC-4 |

### FC-06: 閾値誤検知（誤報・過検知）/ アラート疲れ

| 項目 | 内容 |
| --- | --- |
| 原因 | WARNING 閾値が厳しすぎ、健全状態でも頻繁に発火 |
| 発生環境 | 全環境 |
| 症状 | Slack に同種アラートが短時間に多数、担当が無視 |
| 検出方法 | 週次でアラート件数集計、誤報率（fired / acknowledged-as-real）算出 |
| 期待検出結果 | 誤報率 > 30% で閾値見直しトリガ |
| 回復手順 | alert-threshold-matrix.md を実績ベースで改訂。CRITICAL は段階導入（不変条件 3） |
| 自動回復 | 不可 |
| 手動対処難易度 | 中 |
| 関連 AC | AC-2 |

### FC-07: 閾値未検知（漏れ・過小検知）

| 項目 | 内容 |
| --- | --- |
| 原因 | 閾値が緩すぎ、明らかな障害でも発火しない |
| 発生環境 | 全環境 |
| 症状 | ユーザー報告で初めて障害を知る |
| 検出方法 | インシデント postmortem で「アラートが鳴らなかったか」を必ず確認 |
| 期待検出結果 | 鳴らなかった場合は閾値引締め、本マトリクスに learnings 追記 |
| 回復手順 | 閾値再設計 → alert-threshold-matrix.md 改訂版 |
| 自動回復 | 不可 |
| 手動対処難易度 | 高（再設計） |
| 関連 AC | AC-2 |

### FC-08: Secret 欠落（Cloudflare Secrets 未投入）/ 期限切れ

| 項目 | 内容 |
| --- | --- |
| 原因 | `wrangler secret put` 未実行、命名タイポ、トークン rotate 反映漏れ |
| 発生環境 | staging / production |
| 症状 | 通知ハンドラ参照時 `undefined`、Workers ログにエラー |
| 検出方法 | `wrangler secret list --env <env>` で項目欠落、Workers エラーログ |
| 期待検出結果 | デプロイ直後 smoke で顕在化（MON-NTF-01 PASS 必須） |
| 回復手順 | 1Password から取得し `wrangler secret put` 再投入 |
| 自動回復 | 不可 |
| 手動対処難易度 | 低 |
| 関連 AC | AC-3 / AC-11 |

### FC-09: UT-09（Sheets→D1 同期）失敗の検知欠落

| 項目 | 内容 |
| --- | --- |
| 原因 | INST-API-05 未実装 / UT-09 計装漏れ / Cronitor heartbeat 未送信 |
| 発生環境 | staging / production |
| 症状 | 同期失敗が発生してもアラート発火せず、データ鮮度低下 |
| 検出方法 | failure-detection-rules.md の SQL 集計、Cronitor heartbeat 不在検知 |
| 期待検出結果 | 同期失敗 1 件で WARNING、連続 3 回で CRITICAL |
| 回復手順 | INST-API-05 実装、Cronitor 設定 → 検知ルール再配備 |
| 自動回復 | 不可 |
| 手動対処難易度 | 中 |
| 関連 AC | AC-7 |

### FC-10: 無料枠枯渇による計装停止

| 項目 | 内容 |
| --- | --- |
| 原因 | Workers Requests / WAE writes / D1 reads が無料枠超過、計装停止 |
| 発生環境 | production |
| 症状 | WAE 書き込みが silently 失敗、Workers が 5xx |
| 検出方法 | 05a `cost-guardrail-runbook.md` 日次チェック、Cloudflare Dashboard 警告（70% / 90%） |
| 期待検出結果 | 消費率 70% で WARNING、90% で CRITICAL（不変条件 2 / 無料プラン範囲） |
| 回復手順 | 05a runbook 順守、sampling 率を上げ（例 100% → 10%） WAE 書込量抑制 |
| 自動回復 | 月次リセット |
| 手動対処難易度 | 中 |
| 関連 AC | AC-2（不変条件 2） |

### FC-11: 05a 成果物との重複・上書き（不変条件 1 違反）

| 項目 | 内容 |
| --- | --- |
| 原因 | runbook-diff-plan.md の差分追記が誤って 05a の既存節を上書き |
| 発生環境 | docs（リポジトリ） |
| 症状 | 05a 既存記述が消失、参照リンク崩れ |
| 検出方法 | PR diff レビュー（W2-T10）、Phase 11 link-checklist.md |
| 期待検出結果 | PR レビューで上書きを差し戻し |
| 回復手順 | git revert / 該当節を再追加 |
| 自動回復 | 不可（ヒューマンレビュー必須） |
| 手動対処難易度 | 低 |
| 関連 AC | AC-6 |

### FC-12: Secret 漏洩（リポジトリ / ログ経由）

| 項目 | 内容 |
| --- | --- |
| 原因 | `.env` 誤コミット、ログ出力で Webhook URL を文字列ダンプ、wrangler tail 出力共有時の誤公開 |
| 発生環境 | 全環境（特に local 開発） |
| 症状 | Slack Webhook URL / API Key が外部に流出、迷惑投稿・不正 API 呼出 |
| 検出方法 | git history scan（gitleaks 等）、Slack 通知の異常パターン、UptimeRobot 課金異常 |
| 期待検出結果 | 漏洩判明時に即時 rotate |
| 回復手順 | (1) Slack Webhook 失効 → 再発行（FC-03 と同手順） / (2) UptimeRobot API key rotate / (3) Cloudflare Token rotate / (4) git history rewrite or BFG / (5) 1Password 更新 |
| 自動回復 | 不可 |
| 手動対処難易度 | 高 |
| 関連 AC | AC-3 / AC-11（不変条件 4） |

---

## 3. サマリーマトリクス

| FC | カテゴリ | 発生環境 | 自動回復 | 手動対処難易度 | 関連 AC | 関連 Test ID |
| --- | --- | --- | --- | --- | --- | --- |
| FC-01 | WAE バインディング欠落 | local / staging / prod | 不可 | 低 | AC-5 | MON-WAE-01 |
| FC-02 | WAE 書込拒否 | staging / prod | 一部可 | 中 | AC-5 / AC-7 | MON-WAE-02 / 04 |
| FC-03 | Slack Webhook 失効 | staging / prod | 不可 | 中 | AC-3 / AC-11 | MON-NTF-01 / 02 |
| FC-04 | メール bounce | staging / prod | 不可 | 低 | AC-3 | MON-NTF-03 |
| FC-05 | 外部監視サービスダウン | 全環境 | 一時的 | 中 | AC-4 | MON-EXT-01〜04 |
| FC-06 | 閾値誤検知（誤報多発） | 全環境 | 不可 | 中 | AC-2 | MON-NTF-04 |
| FC-07 | 閾値未検知 | 全環境 | 不可 | 高 | AC-2 | （postmortem 起動） |
| FC-08 | Secret 欠落 | staging / prod | 不可 | 低 | AC-3 / AC-11 | MON-NTF-01 |
| FC-09 | UT-09 検知欠落 | staging / prod | 不可 | 中 | AC-7 | MON-WAE-04 |
| FC-10 | 無料枠枯渇 | prod | 月次 | 中 | AC-2（不変条件 2） | （閾値 70/90% 監視） |
| FC-11 | 05a 上書き（不変条件 1 違反） | docs | 不可 | 低 | AC-6 | （PR レビュー / link-checklist） |
| FC-12 | Secret 漏洩（不変条件 4 違反） | 全環境 | 不可 | 高 | AC-3 / AC-11 | （gitleaks / postmortem） |

---

## 4. 監視を監視するメタ観点

| メタ項目 | 内容 | 反映先 |
| --- | --- | --- |
| 月次到達確認 | Slack / メール双方への手動テスト送信を月次 runbook に組込（FC-04 緩和） | cost-guardrail-runbook.md 追記 |
| アラート静音検知（watchdog） | 24 時間以上 1 件もアラート発火しない場合「監視機能停止」を疑う watchdog ルール | phase-02/monitoring-design.md / failure-detection-rules.md フィードバック |
| 二次経路 | UptimeRobot ダウン時の代替（Better Uptime 等）を予備記載 | external-monitor-evaluation.md フィードバック |
| 誤報率モニタ | FC-06 の誤報率 > 30% を継続監視 | 月次運用レポート |
| Secret rotate 周期 | Slack Webhook / Cloudflare Token / UptimeRobot API Key の rotate 周期を運用 SOP に記載 | secret-additions.md フィードバック |

---

## 5. Phase 5 implementation-plan.md / Phase 4 test-plan.md との整合確認

| 整合観点 | 確認結果 |
| --- | --- |
| FC が Phase 5 計装ポイント INST-API-01〜07 / INST-WEB-01〜02 を網羅 | OK（FC-01/02 が WAE 系、FC-09 が INST-API-05、FC-08 が Secret 系） |
| FC が Phase 4 Test ID と双方向に紐づく | OK（§3 サマリー表の「関連 Test ID」列） |
| FC が Phase 5 DoD 項目と整合 | OK（DoD 各項目に対応する失敗ケースを定義） |
| 不変条件 1（05a 上書き禁止）が FC-11 に明記 | OK |
| 不変条件 2（無料プラン範囲）が FC-10 に明記 | OK |
| 不変条件 3（CRITICAL 段階導入）が FC-06 / FC-07 緩和策に反映 | OK |
| 不変条件 4（Secret は 1Password）が FC-03 / FC-08 / FC-12 に反映 | OK |
| 不変条件 5（実装コード非実施）を本 Phase 内で順守 | OK（擬似コマンドのみ） |

---

## 6. 参照

- outputs/phase-02/alert-threshold-matrix.md
- outputs/phase-02/failure-detection-rules.md
- outputs/phase-02/notification-design.md
- outputs/phase-02/secret-additions.md
- outputs/phase-04/test-plan.md
- outputs/phase-04/pre-verify-checklist.md
- outputs/phase-05/implementation-plan.md
- docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md
- https://developers.cloudflare.com/workers/observability/errors/
