# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | モニタリング/アラート設計 (UT-08) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

UT-08 モニタリング/アラート設計タスクの必要性・スコープ・受入条件を確定し、下流 Phase の手戻りを防ぐ。
特に「05a-parallel-observability-and-cost-guardrails が定義した手動観測 / runbook を、どこまで自動アラートへ昇格させるか」という責務境界の論点を早期に特定し、Phase 2 設計に適切なインプットを渡す。
本タスクは設計成果物のみを出力し、実装は Wave 2 以降の実装タスクへ委譲する点を明示する。

## 真の論点

UT-08 の本質的な問題は以下の 3 点である。

1. **05a との責務境界の未確定箇所**:
   05a-parallel-observability-and-cost-guardrails は意図的に「手動確認可能な観測点の優先」を方針とし、自動アラートをスコープ外にしている。UT-08 はその次のステップとして自動監視を追加するが、05a 既存成果物（`observability-matrix.md` / `cost-guardrail-runbook.md`）を上書きしないこと、どの観測点を「自動化に昇格」「手動のまま据え置き」するかの線引きを Phase 2 設計の前に確定する必要がある。境界を未確定のまま進めると、05a の手動 runbook と UT-08 の自動 runbook が二重管理になり、運用コストが増える。

2. **Cloudflare Analytics / Workers Analytics Engine の無料プラン制約**:
   Cloudflare Workers Analytics Engine（以下 WAE）は構造化イベントを集計クエリ可能だが、無料プランでは保存期間が公式確認値、書き込み回数・データポイント上限・SQL クエリ回数に制約がある。WAE への計装は Workers コードへの埋め込みが必要なため、計装ポイントを設計時点で確定し、無料枠を超過しないサンプリング戦略を定義しないと運用フェーズで突然停止するリスクがある。さらに、D1 はクエリ単位の実行時間を Workers ログに自動出力しないため、`console.log` 計装か Dashboard 集計値の定期チェックかを選択する必要がある。

3. **アラートノイズと閾値設計のトレードオフ**:
   閾値が緩いと誤報が頻発し（アラート疲れ）、担当者がアラートを無視するようになる。逆に厳しすぎると本当の障害を見逃す。本タスクは少人数運用を前提とするため、初期は WARNING のみ運用し、対応実績を見ながら CRITICAL の閾値を段階的に導入する iterative なアプローチを採る。Phase 1 で「初期 WARNING 中心 / CRITICAL は実績ベース段階導入」という運用方針を不変条件として確定し、Phase 2 の閾値マトリクスに反映する。

## 依存境界と責務

| 種別 | 対象 | 本タスクとの境界 |
| --- | --- | --- |
| 上流 | 05a-parallel-observability-and-cost-guardrails | 手動観測 / runbook の基盤設計（observability-matrix.md / cost-guardrail-runbook.md）が存在する前提。本タスクは差分追記方針として記録し、上書きしない |
| 上流 | Wave 1 全タスク（01〜06タスク群） | Cloudflare Workers / Pages / D1 / Cron の監視対象サービスがデプロイ済みである前提 |
| 上流 | UT-09 (Sheets→D1 同期ジョブ実装) | 同期失敗検知ルールの主要対象。同期ジョブの失敗 signal（exit code / log pattern）が定義済みである前提 |
| 上流 | UT-01 (Sheets→D1 同期方式定義) | 同期成功/失敗の判定基準が確定している前提 |
| 下流 | UT-07 (通知基盤設計と導入) | 本タスクで設計した通知チャネル（メール / Slack Webhook）の連携先。任意連携 |
| 下流 | Wave 2 実装タスク（監視計装コード追加） | 本設計書を入力として WAE 計装・外形監視設定・通知設定を実装する |
| 対象外 | 有料監視 SaaS の契約 | 無料プラン範囲に限定（Datadog / NewRelic / Sentry 有料プラン等は対象外） |
| 対象外 | アプリケーション APM | コードレベルのトレーシング（OpenTelemetry SDK 等の組み込み）は対象外 |
| 対象外 | セキュリティ監視・WAF 設定 | UT-15 系の責務 |
| 対象外 | 計装コードの実装そのもの | 本 Phase は設計成果物のみ。実装は Wave 2 タスクへ委譲 |

## 価値とコスト評価

- **初回提供価値**: 05a の手動観測 runbook を自動監視へ発展させ、無料枠超過 / 障害 / 同期失敗を 5 分〜数十分以内に自動検知できる仕組みの設計図を確立する。これにより少人数運用でも見逃し率を下げられる。
- **初回に払わないコスト**: 計装コード本体（Wave 2 実装タスクへ委譲）、有料 SaaS 契約、APM、セキュリティ監視、UT-07 通知基盤の実装そのもの。
- **設計コスト**: 9 種類の Phase 2 成果物（メトリクスカタログ / 閾値マトリクス / 通知設計 / 外部監視評価 / WAE 計装計画 / runbook 差分計画 / 失敗検知ルール / Secret 一覧 / 総合まとめ）を作成する分量が大きい。
- **運用コスト**: アラート Secret（Slack Webhook URL 等）の 1Password Environments での管理、WAE 無料枠の月次確認、05a runbook との二重管理を避けるための定期的な突合せ。

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 自動監視/アラート設計が Wave 2 実装タスクと運用フェーズの障害検知速度向上に直結するか | CONDITIONAL |
| 実現性 | Cloudflare 無料プラン（Workers Analytics + WAE）と外部無料監視ツール（UptimeRobot 等）の組合せで AC-1〜AC-11 を満たせるか | CONDITIONAL |
| 整合性 | 05a 既存成果物（observability-matrix.md / cost-guardrail-runbook.md）と差分追記方針で衝突なく共存できるか | CONDITIONAL |
| 運用性 | 初期 WARNING のみ運用 + CRITICAL 段階導入というアラート疲れ抑止策が、少人数運用の現実に耐えるか | CONDITIONAL |

判定が CONDITIONAL である主要条件:

- WAE 無料枠の保存期間は公式値を確認 / 書込み上限 / クエリ回数上限を Phase 2 設計前に再確認すること
- UptimeRobot 5 分間隔監視の SLA 許容性を Phase 2 評価で合意すること
- 05a 担当者と「自動化に昇格する観測点 / 据え置く観測点」の境界を Phase 3 レビュー前に合意すること

## 既存資産インベントリ

| 資産 | 確認対象 | 確認方法 |
| --- | --- | --- |
| 05a observability-matrix.md | 自動化候補メトリクスの一次ソース | `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md` および outputs を参照 |
| 05a cost-guardrail-runbook.md | 無料枠ガードレールの手動 runbook | 05a outputs を参照、本タスクは差分追記方針で扱う |
| `apps/api` 計装コード | WAE / console.log 計装の既存有無 | repository を grep し、既存計装が無い場合は Wave 2 実装タスクで新規追加する前提とする |
| `apps/web` 計装コード | Pages / Workers 側の計装有無 | 同上 |
| 通知基盤 (UT-07) | Slack Webhook / メール送信機構の有無 | UT-07 spec を確認、未実装の場合は本タスクで Webhook URL を Secret として直接保持する設計を採る |
| 1Password Environments | Secret 配置先 | `CLAUDE.md` のシークレット管理セクションで方針が定義済み |
| Cloudflare Dashboard | Analytics / D1 集計値の手動参照可否 | Wave 1 完了済みの場合は閲覧可能な前提 |
| 外部監視ツール契約 | UptimeRobot 等の既存契約有無 | 既存契約が無いことを前提に、Phase 2 で評価し新規導入を検討 |

## スコープ確定

### 含む

- メトリクス収集設計（Workers / Pages / D1 / Cron）
- WARNING / CRITICAL 二段階アラート閾値の定義
- 通知設計（メール / Slack Webhook）と Secret 取り扱い方針
- 外部監視ツール選定評価（UptimeRobot 等の無料プラン比較）
- WAE 計装計画（イベント名 / フィールド / sampling）
- 05a runbook との差分追記計画
- D1 クエリ失敗・Sheets→D1 同期失敗の検知ルール
- 1Password Environments で管理する追加 Secret 一覧

### 含まない

- 計装コードの実装（Wave 2 実装タスクへ委譲）
- 有料監視 SaaS 契約
- APM・トレーシング
- UT-07 通知基盤の実装本体
- セキュリティ監視・WAF 設定（UT-15 系）

## 受入条件 (AC) 確認

index.md で定義された AC-1〜AC-11 を Phase 1 で正式に承認する。Phase 2 の各成果物が AC-1〜AC-8・AC-11 に、Phase 3 が AC-9 に、Phase 11 が AC-10 にそれぞれ対応する。

## 実行タスク

- [ ] index.md / artifacts.json / 原典 `docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md` を読み、前提条件を確認する
- [ ] 上流 05a 成果物（observability-matrix.md / cost-guardrail-runbook.md）の現状を確認する
- [ ] 真の論点（05a 責務境界 / 無料プラン制約 / アラートノイズ）を特定し文書化する
- [ ] スコープ（含む/含まない）を確定する
- [ ] 受入条件 AC-1〜AC-11 を Phase 1 で正式承認する
- [ ] 4 条件評価を行い、実施可否と CONDITIONAL の解消条件を記録する
- [ ] 既存資産インベントリ（05a 成果物・apps/api 計装の有無・通知基盤の有無・Secret 管理基盤）を洗い出す
- [ ] WAE 無料枠（保存期間・書込上限・クエリ回数）の最新仕様を再確認する
- [ ] UptimeRobot 等の無料プラン候補を一次リストアップする
- [ ] `outputs/phase-01/requirements.md` を作成する

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
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | タスク概要・AC・不変条件 |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json | Phase ごとの artifacts 定義 |
| 必須 | docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md | UT-08 原典タスク仕様（苦戦箇所・知見） |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md | 上流の手動観測・runbook 基盤 |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md | observability-matrix の詳細 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/ | WAE 公式仕様（無料枠・保存期間） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare バインディング・Secrets 取り扱い |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物（論点・スコープ・AC・4条件評価・既存資産インベントリ） |
| メタ | artifacts.json | phase-01 を completed に更新 |

## 完了条件

- [ ] 真の論点 3 点（05a 責務境界 / 無料プラン制約 / アラートノイズ）が文書化されている
- [ ] 4 条件評価が PASS / FAIL / CONDITIONAL のいずれかで記録され、CONDITIONAL の解消条件が明示されている
- [ ] AC-1〜AC-11 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリ（05a 成果物・計装の有無・通知基盤の有無）が記録されている
- [ ] WAE 無料枠と UptimeRobot 無料プランの仕様が再確認されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（05a 成果物未参照 / WAE 仕様変更 / 通知基盤未整備）を確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の phase-01 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 真の論点・AC・スコープ・4 条件評価の CONDITIONAL 解消条件・既存資産インベントリを Phase 2 設計の入力として渡す
- ブロック条件: 本 Phase の `outputs/phase-01/requirements.md` が未作成、または CONDITIONAL の解消条件が記録されていない場合は Phase 2 に進まない
