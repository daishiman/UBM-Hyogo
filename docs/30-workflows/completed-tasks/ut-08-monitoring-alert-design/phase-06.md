# Phase 6: 異常系検証計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | モニタリング/アラート設計 (UT-08) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証計画 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画書化) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |

---

## 目的

監視・アラート基盤そのものが「壊れた」ときに検出・回復できる手順を整備する。
すなわち、**監視を監視する** 観点で異常系シナリオを洗い出し、各シナリオの
検出方法・期待結果・回復手順を `failure-case-matrix.md` にまとめる。

UT-08 は設計タスクのため、実コードによる障害再現は行わず、Wave 2 実装タスクが
本マトリクスを入力として実機検証を行えるよう、検証手順を擬似コマンドで固定する。

主要な異常カテゴリ:

1. WAE 書き込み失敗（バインディング欠落・dataset 不在・rate limit）
2. 通知配送失敗（Slack Webhook 失効・メール bounce）
3. 外部監視ダウン（UptimeRobot サービス障害）
4. 閾値誤検知（誤報・過検知・未検知）
5. Secret 欠落・期限切れ
6. 上流タスク障害（UT-09 同期失敗の検知欠落）

---

## 実行タスク

- [ ] Phase 5 計装ポイント・通知設計と Phase 4 Test ID を入力に異常系シナリオを洗い出す
- [ ] 各シナリオを FC-ID（Failure Case ID）として固定し、`outputs/phase-06/failure-case-matrix.md` に記録する
- [ ] 各 FC に「原因」「症状」「検出方法」「期待検出結果」「回復手順」を明記する
- [ ] 自動回復可否と手動対処難易度を分類する
- [ ] サマリーマトリクスで FC を一覧する
- [ ] Phase 5 implementation-plan.md の DoD と整合させる

---

## 6-1. 異常系シナリオ詳細

### FC-01: WAE バインディング欠落

| 項目 | 内容 |
| --- | --- |
| 原因 | `wrangler.toml` の `analytics_engine_datasets` 未追加または binding 名のタイポ |
| 発生環境 | local / staging / production |
| 症状 | `env.WAE_DATASET` が `undefined` で `writeDataPoint` 呼び出し時に TypeError |
| 検出方法 | Workers のエラーログ（Cloudflare Logs Push or `wrangler tail`）で TypeError を観測 |
| 期待検出結果 | デプロイ直後の smoke チェックでエラーが顕在化する |
| 回復手順 | `apps/api/wrangler.toml` を修正し、再デプロイ。Phase 5 の wrangler.toml 差分計画に従う |
| 自動回復 | 不可 |
| 手動対処難易度 | 低 |

### FC-02: WAE データセット存在せず / 書き込み拒否

| 項目 | 内容 |
| --- | --- |
| 原因 | dataset 名のタイポ、または無料枠超過による rate limit |
| 発生環境 | staging / production |
| 症状 | `writeDataPoint` 自体は失敗を投げないが、SQL/GraphQL でデータセットが空 |
| 検出方法 | 定期的な集計クエリ（Phase 5 の MON-WAE-04 期待結果）で行が増えていない |
| 期待検出結果 | 1 時間以上行追加がない場合、二次アラート（運用担当への通知）を発火 |
| 回復手順 | データセット名を確認し wrangler.toml を修正、または rate limit 解除を待つ |
| 自動回復 | 一時的（rate limit）であれば自動回復、設定不正は不可 |
| 手動対処難易度 | 中 |

### FC-03: Slack Webhook URL 失効

| 項目 | 内容 |
| --- | --- |
| 原因 | Slack 側で Incoming Webhook が無効化された / ワークスペースから App 削除 |
| 発生環境 | staging / production |
| 症状 | UptimeRobot から Slack への配送が 4xx/5xx を返す |
| 検出方法 | UptimeRobot の Alert log に配送失敗が記録される / Slack に通知が届かない |
| 期待検出結果 | UptimeRobot ダッシュボードに alert delivery failure が表示 |
| 回復手順 | Slack で Webhook を再発行 → 1Password に新値を保管 → UptimeRobot のコンタクトを更新 |
| 自動回復 | 不可 |
| 手動対処難易度 | 中 |

### FC-04: メール通知 bounce / 迷惑メール振り分け

| 項目 | 内容 |
| --- | --- |
| 原因 | 受信側のメールスプール障害、SPF/DKIM 不整合、迷惑メール扱い |
| 発生環境 | staging / production |
| 症状 | UptimeRobot は配送成功と認識するが、受信ボックスに通知なし |
| 検出方法 | Slack 通知と相互チェック（Slack 着信時はメール着信を確認） |
| 期待検出結果 | 月次で「メール到達確認」テストを runbook に組み込み確認 |
| 回復手順 | 迷惑メールフォルダから救出、ホワイトリスト設定、恒久対策として配信先メールを変更 |
| 自動回復 | 不可 |
| 手動対処難易度 | 低 |

### FC-05: 外部監視（UptimeRobot）サービス自体のダウン

| 項目 | 内容 |
| --- | --- |
| 原因 | UptimeRobot 側の障害 / アカウント停止 |
| 発生環境 | 全環境共通 |
| 症状 | 監視結果が更新されない、アラートが発火しない（監視の盲点） |
| 検出方法 | UptimeRobot ステータスページの監視 / 二次的な手動 smoke（週次） |
| 期待検出結果 | UptimeRobot status feed RSS を別チャネルで購読し、サービス障害を把握 |
| 回復手順 | サービス復旧を待つ。長期化時は代替（Better Uptime / Hyperping 無料枠）への切替を検討 |
| 自動回復 | 一時障害は自動 |
| 手動対処難易度 | 中（代替切替時） |

### FC-06: 閾値誤検知（誤報・過検知）

| 項目 | 内容 |
| --- | --- |
| 原因 | WARNING 閾値が厳しすぎて健全状態でも頻繁に発火（アラート疲れ） |
| 発生環境 | 全環境 |
| 症状 | Slack に同種アラートが短時間に多数届き、担当者が無視するようになる |
| 検出方法 | 週次でアラート件数を集計し、誤報率（fired / acknowledged-as-real）を算出 |
| 期待検出結果 | 誤報率 > 30% で閾値見直しトリガ |
| 回復手順 | `alert-threshold-matrix.md` の値を Wave 2 実装後実績に基づき調整。CRITICAL は段階導入（不変条件 3） |
| 自動回復 | 不可（人的判断要） |
| 手動対処難易度 | 中 |

### FC-07: 閾値未検知（漏れ・過小検知）

| 項目 | 内容 |
| --- | --- |
| 原因 | 閾値が緩すぎて、明らかな障害でもアラートが発火しない |
| 発生環境 | 全環境 |
| 症状 | ユーザー報告で初めて障害を知る |
| 検出方法 | インシデント postmortem 時に「アラートが鳴らなかったか」を必ず確認 |
| 期待検出結果 | 鳴らなかった場合は閾値を引き締め、本マトリクスに learnings を追記 |
| 回復手順 | 閾値再設計 → Phase 2 `alert-threshold-matrix.md` の改訂版を作成 |
| 自動回復 | 不可 |
| 手動対処難易度 | 高（再設計） |

### FC-08: Secret 欠落（Cloudflare Secrets 未投入）

| 項目 | 内容 |
| --- | --- |
| 原因 | `wrangler secret put MONITORING_SLACK_WEBHOOK_URL` が未実行、または環境変数名のタイポ |
| 発生環境 | staging / production |
| 症状 | 通知ハンドラが Secret を参照した際に `undefined` でエラー |
| 検出方法 | `wrangler secret list --env <env>` で項目欠落確認、Workers ログにエラー出力 |
| 期待検出結果 | デプロイ直後の smoke チェックで顕在化 |
| 回復手順 | 1Password から値を取得し `wrangler secret put` で再投入 |
| 自動回復 | 不可 |
| 手動対処難易度 | 低 |

### FC-09: UT-09（Sheets→D1 同期）失敗の検知欠落

| 項目 | 内容 |
| --- | --- |
| 原因 | UT-09 の同期失敗イベントが WAE に書き込まれない（INST-API-05 未実装） |
| 発生環境 | staging / production |
| 症状 | 同期失敗が発生してもアラートが発火せず、データ鮮度が低下 |
| 検出方法 | 失敗検出ルール（`failure-detection-rules.md`）に従う SQL クエリで該当行を集計 |
| 期待検出結果 | 同期失敗 1 件で WARNING、連続 3 回で CRITICAL（Phase 2 で確定）|
| 回復手順 | 計装漏れを INST-API-05 として Wave 2 実装で補完。検出ルールを Phase 2 に追記 |
| 自動回復 | 不可 |
| 手動対処難易度 | 中 |

### FC-10: 無料枠枯渇による監視機能停止

| 項目 | 内容 |
| --- | --- |
| 原因 | Workers Requests / WAE writes / D1 reads が無料枠を超え、計装そのものが停止 |
| 発生環境 | production |
| 症状 | WAE への書き込みが silently 失敗、Workers が 5xx を返す |
| 検出方法 | 05a `cost-guardrail-runbook.md` の日次チェック / Cloudflare Dashboard 警告 |
| 期待検出結果 | 消費率 > 80% で WARNING（不変条件 2 / 無料プラン範囲）|
| 回復手順 | 05a の runbook に従う。sampling 率を上げて WAE 書き込み量を抑制 |
| 自動回復 | 月次でリセット |
| 手動対処難易度 | 中 |

---

## 6-2. 異常系サマリーマトリクス

| FC | カテゴリ | 発生環境 | 自動回復 | 手動対処難易度 | 関連 AC |
| --- | --- | --- | --- | --- | --- |
| FC-01 | WAE バインディング欠落 | local / staging / prod | 不可 | 低 | AC-5 |
| FC-02 | WAE 書き込み拒否 | staging / prod | 一部可 | 中 | AC-5 / AC-7 |
| FC-03 | Slack Webhook 失効 | staging / prod | 不可 | 中 | AC-3 |
| FC-04 | メール bounce | staging / prod | 不可 | 低 | AC-3 |
| FC-05 | UptimeRobot ダウン | 全環境 | 一時的 | 中 | AC-4 |
| FC-06 | 閾値誤検知 | 全環境 | 不可 | 中 | AC-2 |
| FC-07 | 閾値未検知 | 全環境 | 不可 | 高 | AC-2 |
| FC-08 | Secret 欠落 | staging / prod | 不可 | 低 | AC-3 / AC-11 |
| FC-09 | UT-09 検知欠落 | staging / prod | 不可 | 中 | AC-7 |
| FC-10 | 無料枠枯渇 | prod | 月次 | 中 | AC-2（不変条件 2） |

---

## 6-3. 監視を監視するメタ観点

| メタ項目 | 内容 |
| --- | --- |
| 月次到達確認 | Slack / メール双方への手動テスト送信を月次 runbook に組み込む |
| アラート静音検知 | 24 時間以上 1 件もアラートが発火しない場合「監視機能停止」を疑う watchdog ルールを Phase 2 へフィードバック検討 |
| 二次経路 | UptimeRobot ダウン時の代替（Better Uptime 等）を `external-monitor-evaluation.md` に予備として記載する |

---

## 統合テスト連携

本タスクは spec_created / non_visual の設計タスクであり、この Phase では実装コード・外部監視設定・Secret 投入を実行しない。統合テスト連携は、後段 Wave 2 実装タスクが本 Phase の成果物を入力として実行する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| 後段 Wave 2 実装タスク | WAE 計装、外形監視設定、通知疎通、D1 / Sheets 失敗検知テスト | 設計・検証観点を定義し、実行は委譲 |
| UT-09 | Sheets→D1 同期失敗検知ルール | UT-09 完了後に閾値とイベント名を再確認 |
| UT-07 | 通知基盤との接続 | 通知チャネル候補として参照し、実装は UT-07 / 後段タスクで確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC 定義・不変条件 |
| 必須 | outputs/phase-02/alert-threshold-matrix.md | 閾値の根拠 |
| 必須 | outputs/phase-02/failure-detection-rules.md | 検知ルール |
| 必須 | outputs/phase-02/notification-design.md | 通知経路 |
| 必須 | outputs/phase-04/test-plan.md | Test ID と本マトリクスの対応 |
| 必須 | outputs/phase-05/implementation-plan.md | 計装ポイントと回復手順の整合 |
| 参考 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md | 無料枠運用 |
| 参考 | https://developers.cloudflare.com/workers/observability/errors/ | Workers エラー観測 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-case-matrix.md | FC-01〜FC-10 の異常系マトリクス |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 完了条件

- [ ] FC-01〜FC-10 の全ケースが `outputs/phase-06/failure-case-matrix.md` に記録されている
- [ ] 各ケースに「原因」「発生環境」「症状」「検出方法」「期待検出結果」「回復手順」が記載されている
- [ ] 自動回復可否・手動対処難易度が分類されている
- [ ] サマリーマトリクスで一覧化されている
- [ ] FC が Phase 4 Test ID および Phase 5 計装ポイントと整合している
- [ ] FC-09（UT-09 連携）が含まれており、上流タスク状態と整合している
- [ ] FC-10（無料枠枯渇）が含まれ、不変条件 2（無料プラン範囲）に整合している

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-06 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（検証項目網羅性）
- 引き継ぎ事項:
  - failure-case-matrix.md の各 FC は AC トレーサビリティマトリクスで AC-1〜AC-11 と対応付ける
  - FC-06 / FC-07（閾値誤検知 / 未検知）は Phase 2 `alert-threshold-matrix.md` の改訂サイクルへフィードバックする
  - 監視を監視するメタ観点（6-3）は Phase 2 `monitoring-design.md` の総合まとめへ追記候補
- ブロック条件: Phase 5 implementation-plan.md の DoD に整合しない FC があれば、Phase 5 に差し戻す
