# UT-08: モニタリング/アラート設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-08 |
| タスク名 | モニタリング/アラート設計 |
| 優先度 | LOW |
| 推奨Wave | Wave 2以降 |
| 状態 | spec_created（設計完了、実装は UT-08-IMPL へ分離） |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | あり |
| 組み込み先 | docs/05a-parallel-observability-and-cost-guardrails |

## 目的

Cloudflare Analytics および外部監視ツールを組み合わせて、システムの可用性・無料枠消費・障害を継続的に観測し、問題を早期に検知してアラートを発報できる仕組みを設計する。05a-parallel-observability-and-cost-guardrails で定義した手動観測 / runbook を自動監視へ発展させることが主目的である。

> 2026-04-27 更新: 設計ワークフロー `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/` が Phase 1-12 まで `spec_created` として完了。WAE 計装コード・アラートワーカー・外部監視設定などの実装作業は `UT-08-IMPL-monitoring-alert-implementation.md` へ分離する。

## スコープ

### 含む
- Cloudflare Workers / Pages / D1 の主要メトリクス収集設計（エラーレート・レスポンスタイム・CPU使用量・無料枠消費率）
- アラート閾値の定義（WARNING / CRITICAL 二段階）
- 障害通知先の設計（メール or Slack Webhook）
- 外部監視ツール選定（UptimeRobot 等の無料プラン範囲）
- D1 クエリ失敗・Sheets 同期失敗の検知ルール
- アラート発報から対応完了までの runbook 更新（05a との差分）
- ダッシュボード設計（Cloudflare Analytics / 外部ツール）

### 含まない
- WAE 計装コード・アラートワーカー・Slack/Email 配信・UptimeRobot 設定の実装（→ UT-08-IMPL）
- 有料監視 SaaS の契約（無料枠内に限定）
- アプリケーション APM（コードレベルのトレーシング）
- 通知基盤（UT-07）のメトリクス監視
- セキュリティ監視・WAF 設定

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Wave 1 全タスク（01〜06タスク群） | 監視対象となるサービスが全てデプロイ済みであること |
| 上流 | docs/05a-parallel-observability-and-cost-guardrails | 手動観測・runbook の基盤設計を継承し、自動化を追加する |
| 上流 | UT-09（Sheets→D1 同期ジョブ実装） | 同期ジョブの失敗検知が主要監視対象の一つ |
| 下流 | UT-07（通知基盤設計と導入） | アラート通知チャネルとして通知基盤を活用できる（任意） |

## 苦戦箇所・知見

**05a との責務境界の曖昧さ**
05a-parallel-observability-and-cost-guardrails は「手動確認可能な観測点の優先」を方針としており、自動アラートは意図的にスコープ外にされている。UT-08 はその次のステップとして自動監視を追加するが、05a の成果物（observability-matrix.md・cost-guardrail-runbook.md）を上書きしないよう、差分として追記する方針を取る。設計時に 05a の担当者と境界を合意しておくこと。

**Cloudflare Analytics API の制約**
Cloudflare Analytics は Workers Analytics Engine（WAE）を使うことで構造化ログをクエリできるが、WAE への書き込みは Workers コードへの計装が必要。無料プランでの利用可否と保存期間（デフォルト 31 日）を事前に確認すること。

**外部監視ツールの HTTPS チェック頻度制限**
UptimeRobot 無料プランは監視間隔が 5 分。5 分以内に起きた瞬断は検知できない。SLA 要件と照合し、許容できるかを先に合意しておく。

**アラートノイズ問題**
閾値設定が緩すぎると誤報が頻発し、担当者が無視するようになる（アラート疲れ）。初期は WARNING のみ運用し、対応実績を見ながら CRITICAL の閾値を調整する iterative アプローチを採ること。

**D1 クエリメトリクスの取得**
D1 はネイティブにクエリ単位の実行時間を Workers ログに出力しない。`console.log` でタイミングを計装するか、D1 のダッシュボード（Cloudflare Dashboard）の集計値を定期チェックするかを選択する必要がある。

---

### Phase 12 完了時に追加された知見（2026-04-27）

**`spec_created` close-out の Step 1-A〜1-C を N/A 扱いにしない**
非ビジュアル / 設計タスクであっても、Phase 12 の Step 1-A（完了タスク記録 4 ファイル更新）/ Step 1-B（実装状況テーブル）/ Step 1-C（関連タスクテーブル）を **N/A 扱いにせず実施**する。`spec_created` は「実装は別 UT に委譲」の意味であり、設計レベルでの周辺ドキュメント同期は必要。本タスクでは UT-09 / UT-07 / 05a / UT-13 の 4 関連タスクへ「UT-08 設計ハンドオフ」セクションを追記した。

**phase-12.md の 300 行上限と Phase 12 標準構成の競合（MINOR-01）**
task-specification-creator の Phase 12 標準構成（Task 1-6 + Step 1-A〜1-C + Step 2 + 同期ルール + 完了条件 + 中学生レベル概念説明）を全部入れると 380 行となり 300 行上限を 80 行超過する。**意味的分割不可**（Step 1-A〜1-C と Task 1-6 の対応が崩れるため）として条件付き許容で進めた。skill-feedback-report.md にテンプレート改善提案として記録。

**NON_VISUAL タスクの Phase 11 必須 outputs**
Phase 11 視覚テンプレ（`manual-test-checklist.md` / `screenshot-plan.json` / `screenshots/`）と非視覚テンプレ（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）の使い分けは SKILL.md UBM-002 / UBM-003 を読まないと判断しにくい。本タスクは設計成果物のみで UI 変更が一切ないため NON_VISUAL 判定で `screenshots/` ディレクトリも `.gitkeep` も作成しない方式を採用。

**05a outputs 個別ファイル未生成（M-01 / PASS_WITH_OPEN_DEPENDENCY）**
05a 自身のワークフローで生成されるべき `outputs/phase-02/observability-matrix.md` / `outputs/phase-05/cost-guardrail-runbook.md` が未生成のため、UT-08 設計成果物からの参照リンクが OPEN になった。Phase 11 で AC-10 を **PASS_WITH_OPEN_DEPENDENCY** として判定し、Phase 12 で **UT-30** として正式化（実装着手前ゲート）。

**MINOR-02 / MINOR-03 を運用 UT として独立化（UT-31）**
アラート閾値の月次レビューと Email 月次到達確認は、実装タスク（UT-08-IMPL）に統合せず、運用継続タスク（UT-31）として独立起票した。実装スコープと運用スコープを混ぜると Wave 2 完了後の責務オーナーが曖昧になるため。

**自動チェックスクリプト `validate-phase-output.js` の引数仕様**
`--workflow` / `--phase` フラグを期待した実行が「ディレクトリが存在しません: --workflow」エラーで停止。実際は positional argument（ディレクトリパス直渡し）が正解。skill-feedback-report.md に `--help` 追加 or `--workflow` フラグ実装を提案。

**identifier drift 防止（メトリクス名 / イベント名）**
`api.request` / `api.error` / `cron.sync.start` / `cron.sync.end` / `d1.query.fail` / `auth.fail` の 6 イベント名はコード・閾値マトリクス・通知設計・runbook の 4 箇所で参照される。**識別子の SSOT は `wae-instrumentation-plan.md`** であり、コード変更時は先に SSOT を更新してからコードに反映する（逆順禁止）。

## 実行概要

- 05a の成果物（observability-matrix.md）を参照し、自動化対象メトリクスを選定して監視設計書（`monitoring-design.md`）を作成する
- Cloudflare Workers Analytics Engine への計装コード追加、UptimeRobot 設定、Slack/Email 配信、Secret 投入は UT-08-IMPL で実施する
- 05a の runbook は本タスクでは差分計画のみ作成し、実ファイル追記は Wave 2 実装末尾の別PRまたは 05a 側で吸収する

## 完了条件

- [x] 監視設計書（monitoring-design.md）が作成されており、メトリクス・閾値・通知先が定義されている
- [x] WAE 計装ポイント、イベント名、データセット名、Secret 名、通知方式が設計成果物に定義されている
- [x] 外形監視ツール評価と UptimeRobot 無料プラン採用方針が記録されている
- [x] 05a の runbook との差分・継承関係が設計書に明記されている
- [x] 実装未着手項目が UT-08-IMPL として分離されている
- [ ] Cloudflare Workers 計装・外形監視・アラート通知・Secret 実配置は UT-08-IMPL で完了させる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/index.md | 手動観測・runbook の基盤設計を継承するための起点 |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/phase-02.md | observability-matrix の詳細確認 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-08 の原典記録 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/ | Workers Analytics Engine 公式ドキュメント |
