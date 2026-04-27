# ut-08-monitoring-alert-design - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-08 |
| タスク名 | モニタリング/アラート設計 |
| ディレクトリ | docs/30-workflows/ut-08-monitoring-alert-design |
| Wave | 2以降 |
| 実行種別 | 設計タスク（後段で実装に発展） |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | spec_created |
| タスク種別 | design / non_visual |
| 優先度 | LOW |
| GitHub Issue | #10（CLOSED） |

## 目的

Cloudflare Analytics（Workers Analytics Engine 含む）と外部監視ツール（UptimeRobot 等の無料プラン）を組み合わせ、UBM 兵庫支部会システムの可用性・無料枠消費・障害を継続的に観測し、問題を早期に検知してアラートを発報できる仕組みを設計する。
`docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails` で定義された手動観測 / runbook を自動監視へ発展させ、本タスクの成果物（監視設計書・閾値定義・通知設定・runbook 差分）を Wave 2 以降の実装入力とする。

## スコープ

### 含む

- Cloudflare Workers / Pages / D1 の主要メトリクス収集設計
  - エラーレート・レスポンスタイム・CPU 使用量・無料枠消費率
- WARNING / CRITICAL の二段階アラート閾値の定義
- 障害通知先設計（メール or Slack Incoming Webhook）
- 外部監視ツールの選定評価（UptimeRobot 等の無料プラン範囲）
- D1 クエリ失敗・Sheets→D1 同期失敗（UT-09 連携）の検知ルール
- 05a の runbook（cost-guardrail-runbook.md / observability-matrix.md）との差分追記方針
- ダッシュボード設計（Cloudflare Analytics / 外部ツール）
- Workers Analytics Engine への計装ポイント定義（コードは Wave 2 以降の実装タスクで行う）
- 1Password Environments 経由のアラート用 Secret 配置手順

### 含まない

- 有料監視 SaaS 契約（無料枠内に限定）
- アプリケーション APM（コードレベルのトレーシング）
- 通知基盤（UT-07）の実装そのもの（連携先としての参照のみ）
- セキュリティ監視・WAF 設定（UT-15 系）
- 本タスク内での実装コード作成（設計成果物のみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails | 手動観測・runbook の基盤設計を継承し、自動監視を追加する |
| 上流 | Wave 1 全タスク（01〜06タスク群） | 監視対象となるサービスがデプロイ済みであること |
| 上流 | UT-09 (Sheets→D1 同期ジョブ実装) | 同期失敗検知ルールの主要対象 |
| 下流 | UT-07 (通知基盤設計と導入) | アラート通知チャネルとしての利用（任意） |
| 下流 | Wave 2 実装タスク（監視計装コード追加） | 本設計書を入力として WAE 計装・外形監視設定を実施 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md | 手動観測・runbook の基盤設計（継承元） |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md | observability-matrix の詳細 |
| 必須 | docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md | UT-08 の原典タスク仕様 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-08 検出記録 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/ | Workers Analytics Engine 公式 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare バインディング・Secrets 取り扱い |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 受入条件 (AC)

- AC-1: 自動化対象メトリクス一覧（Workers / Pages / D1 / Cron）が `outputs/phase-02/metric-catalog.md` に存在する
- AC-2: WARNING / CRITICAL の閾値が `outputs/phase-02/alert-threshold-matrix.md` に定義され、根拠（無料枠 / SLA / アラート疲れ抑止）が明記されている
- AC-3: 通知チャネル設計（メール or Slack Webhook）と Secret 取り扱い方針が `outputs/phase-02/notification-design.md` に存在する
- AC-4: 外部監視ツール選定評価（UptimeRobot 等）が `outputs/phase-02/external-monitor-evaluation.md` に記載されている
- AC-5: WAE 計装ポイント（イベント名 / フィールド / sampling）が `outputs/phase-02/wae-instrumentation-plan.md` に定義されている
- AC-6: 05a の runbook との差分（observability-matrix.md・cost-guardrail-runbook.md の追記計画）が `outputs/phase-02/runbook-diff-plan.md` に整理されている
- AC-7: D1 クエリ失敗・Sheets→D1 同期失敗の検知ルールが `outputs/phase-02/failure-detection-rules.md` に定義されている
- AC-8: 監視設計の総合まとめ `outputs/phase-02/monitoring-design.md` が存在し、AC-1〜AC-7 をリンクで束ねている
- AC-9: 設計レビュー結果（GO / NO-GO 判定）が `outputs/phase-03/design-review.md` に記録されている
- AC-10: Phase 11 で 05a 実成果物との整合性 smoke チェック（リンク・参照）が PASS している
- AC-11: 1Password Environments で管理する Secret 一覧（追加分）が `outputs/phase-02/secret-additions.md` に明記されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/ |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | テスト計画・事前検証 | phase-04.md | completed | outputs/phase-04/test-plan.md |
| 5 | 実装計画書化 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 異常系検証計画 | phase-06.md | completed | outputs/phase-06/failure-case-matrix.md |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07/ac-traceability-matrix.md |
| 8 | 設定 DRY 化 | phase-08.md | completed | outputs/phase-08/refactoring-log.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/quality-checklist.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/go-nogo-decision.md |
| 11 | 手動 smoke テスト | phase-11.md | completed | outputs/phase-11/manual-smoke-log.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/ |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/pr-checklist.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/monitoring-design.md | 監視設計書（総合まとめ） |
| ドキュメント | outputs/phase-02/metric-catalog.md | 計測対象メトリクスカタログ |
| ドキュメント | outputs/phase-02/alert-threshold-matrix.md | アラート閾値マトリクス |
| ドキュメント | outputs/phase-02/notification-design.md | 通知設計（メール / Slack Webhook） |
| ドキュメント | outputs/phase-02/external-monitor-evaluation.md | 外部監視ツール評価 |
| ドキュメント | outputs/phase-02/wae-instrumentation-plan.md | WAE 計装計画 |
| ドキュメント | outputs/phase-02/runbook-diff-plan.md | 05a runbook 差分計画 |
| ドキュメント | outputs/phase-02/failure-detection-rules.md | 失敗検知ルール |
| ドキュメント | outputs/phase-02/secret-additions.md | 追加 Secret 一覧 |

## 不変条件

1. 05a の成果物（observability-matrix.md / cost-guardrail-runbook.md）を上書きせず、差分追記方針として記録する
2. 監視ツールは無料プラン範囲に限定する（有料 SaaS は本タスクのスコープ外）
3. アラート閾値は WARNING 中心で初期運用し、CRITICAL は実績ベースで段階導入する（アラート疲れ抑止）
4. アラート用 Secret は 1Password Environments で管理し、コードへハードコードしない
5. 本タスクは設計成果物のみを出力し、計装コードの実装は Wave 2 実装タスクへ委譲する

## 注意点

- Issue #10 は CLOSED だが、unassigned-task として継続管理されている
- 05a の担当と責務境界（手動 vs 自動）を Phase 3 レビュー前に合意すること
- UptimeRobot 無料プランは 5 分監視間隔のため、SLA 要件と照合してから採用判断する
- Cloudflare 無料プランの WAE 保存期間（公式確認値）は Phase 1 で再確認する
