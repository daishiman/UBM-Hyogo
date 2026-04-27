# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | モニタリング/アラート設計 (UT-08) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト計画・事前検証) |
| 状態 | completed |

## 目的

Phase 2 で作成した 9 ドキュメント（メトリクスカタログ・閾値マトリクス・通知設計・外部監視評価・WAE 計装計画・runbook 差分計画・失敗検知ルール・Secret 一覧・総合まとめ）を多角的な観点でレビューし、Wave 2 実装タスクへ引き渡す前に設計上の欠陥・無料枠超過リスク・05a 責務境界の不整合・アラート疲れリスク・Secret 漏洩リスクを検出し解消する。
レビュー結果は GO / NO-GO 判定として `outputs/phase-03/design-review.md` に記録する。

## 真の論点（Phase 1〜2 から継承）

1. 05a との責務境界が runbook-diff-plan.md で明確化されているか
2. WAE / Cloudflare Analytics / UptimeRobot 無料プラン制約を遵守しているか
3. 初期 WARNING 中心 / CRITICAL 段階導入のアラート疲れ抑止策が閾値マトリクスに反映されているか

## 依存境界

| 種別 | 対象 | 本 Phase での扱い |
| --- | --- | --- |
| 上流 | Phase 2 の 9 ドキュメント | 全てレビュー対象 |
| 上流 | 05a observability-matrix.md / cost-guardrail-runbook.md | 整合性レビューの照合先 |
| 下流 | Phase 4 (テスト計画) | レビュー結果に基づく事前検証項目を引き継ぐ |
| 下流 | Wave 2 実装タスク | GO 判定後に着手 |

## 価値とコスト

- **価値**: Wave 2 着手前に設計欠陥を検出することで実装手戻りコストを最小化する。
- **コスト**: 9 ドキュメント × 6 観点のクロスレビューが必要。重大度区分でフィルタし、CRITICAL/MAJOR を優先処理する。

## 4 条件評価

| 条件 | 問い | 判定基準 |
| --- | --- | --- |
| 価値性 | レビューが実装手戻りを実質的に減らすか | CRITICAL/MAJOR が 0 になり MINOR は許容範囲で記録される |
| 実現性 | 各観点の判定が現行成果物のみで完結するか | 外部仕様の追加調査なしに判定可能 |
| 整合性 | 05a 成果物との衝突がないか | runbook-diff-plan.md のリンク先が全て解決する |
| 運用性 | アラート閾値が運用継続可能な形になっているか | 初期 WARNING 中心の運用方針が一貫して適用されている |

## レビュー観点と重大度区分

### 重大度区分

| 区分 | 意味 | 対応 |
| --- | --- | --- |
| CRITICAL | 設計の根本欠陥・Secret 漏洩リスク・無料枠超過確実 | Phase 2 へ差し戻し、修正後再レビュー必須 |
| MAJOR | 重大な不整合・AC 未充足 | Phase 2 で修正、再レビュー後 GO |
| MINOR | 軽微な改善点 | Phase 4 着手と並行して修正可、ブロックしない |
| PASS | 問題なし | 次 Phase に進む |

### 観点 1: AC 充足レビュー

| AC | レビュー対象 | 確認内容 | 期待判定 |
| --- | --- | --- | --- |
| AC-1 | metric-catalog.md | Workers / Pages / D1 / Cron が網羅されているか | PASS |
| AC-2 | alert-threshold-matrix.md | WARNING / CRITICAL 双方が定義され根拠付きか | PASS |
| AC-3 | notification-design.md | メール / Slack 双方の比較と Secret 取り扱いが明示されているか | PASS |
| AC-4 | external-monitor-evaluation.md | 複数候補の比較表が存在するか | PASS |
| AC-5 | wae-instrumentation-plan.md | イベント名 / フィールド / sampling が確定しているか | PASS |
| AC-6 | runbook-diff-plan.md | 05a 上書き禁止が明記されているか | PASS |
| AC-7 | failure-detection-rules.md | D1 クエリ失敗・同期失敗の双方が定義されているか | PASS |
| AC-8 | monitoring-design.md | 上記 7 つを束ねるリンクが全て存在するか | PASS |
| AC-11 | secret-additions.md | 1Password Environments 管理の Secret 一覧があるか | PASS |

### 観点 2: 05a 整合性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 上書き禁止遵守 | runbook-diff-plan.md が 05a 既存成果物を上書きせず差分追記方針として記述されているか | REVIEW_REQUIRED |
| 責務境界の明確化 | 自動化に昇格した観測点 / 手動据え置き観測点が明示されているか | REVIEW_REQUIRED |
| リンク整合性 | 05a 成果物への相対リンクが全て解決するか | REVIEW_REQUIRED |
| 二重管理の回避 | 同じメトリクスが 05a と UT-08 で別定義になっていないか | REVIEW_REQUIRED |

### 観点 3: 無料枠遵守レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| WAE 書込上限 | sampling 計画が WAE 無料枠（25 億 data points/月相当）を超過しないか | REVIEW_REQUIRED |
| WAE 保存期間 | 公式確認値保存を前提とした設計になっているか | REVIEW_REQUIRED |
| Cloudflare Analytics クエリ回数 | 無料枠の SQL クエリ上限を考慮しているか | REVIEW_REQUIRED |
| UptimeRobot monitor 数 | 50 monitors 無料上限内に収まる設計か | REVIEW_REQUIRED |
| D1 クエリ無料枠 | 監視自体が D1 row reads を不必要に消費しないか | REVIEW_REQUIRED |
| 有料 SaaS 不採用 | 設計内に有料 SaaS への暗黙的依存が無いか | REVIEW_REQUIRED |

### 観点 4: 責務境界レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| UT-07 連携の任意性 | 通知基盤 (UT-07) 未完成でも UT-08 が成立する設計か | REVIEW_REQUIRED |
| UT-09 連携 | Sheets→D1 同期失敗の検知ルールが UT-09 仕様と矛盾しないか | REVIEW_REQUIRED |
| Wave 2 実装委譲 | 設計成果物のみを出力し、計装コードを含んでいないか | REVIEW_REQUIRED |
| apps/api / apps/web の境界 | 計装ポイントが apps/api に閉じ apps/web から D1 直アクセスを誘発しないか | REVIEW_REQUIRED |

### 観点 5: アラート疲れ抑止レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 初期 WARNING 中心 | alert-threshold-matrix.md が初期は WARNING のみを推奨しているか | REVIEW_REQUIRED |
| CRITICAL 段階導入 | CRITICAL 閾値が「実績ベースで導入」と運用方針に明示されているか | REVIEW_REQUIRED |
| 閾値の根拠 | 各閾値に「無料枠 / SLA / アラート疲れ抑止」のどの根拠かが付記されているか | REVIEW_REQUIRED |
| 通知集約 | 同種アラートの抑制（rate limiting）戦略が記述されているか | REVIEW_REQUIRED |
| 失敗検知の連続条件 | 単発エラーで CRITICAL を発報しない設計か（連続 2 回等） | REVIEW_REQUIRED |

### 観点 6: Secret 管理レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 1Password Environments 管理 | 全アラート用 Secret が 1Password Environments を起点にしているか | REVIEW_REQUIRED |
| ハードコード禁止 | 設計内に Webhook URL / API key の実値が含まれていないか | REVIEW_REQUIRED |
| Cloudflare Secrets 配置手順 | `wrangler secret put` の手順が記述されているか | REVIEW_REQUIRED |
| .env コミット防止 | `.dev.vars` 等の `.gitignore` 記載が前提化されているか | REVIEW_REQUIRED |
| Secret ローテーション | Webhook 失効時の差し替え手順が runbook 差分計画に含まれるか | REVIEW_REQUIRED |

## 代替案棄却の確認

| 代替案 | 棄却理由 | 確認済み |
| --- | --- | --- |
| 有料 APM (Datadog / NewRelic) | 無料枠スコープ外、UT-08 不変条件 2 と矛盾 | [ ] |
| Sentry 有料プラン | 無料枠スコープ外 | [ ] |
| 自前監視サーバー構築 | 運用コスト過大、Wave 2 実装範囲外 | [ ] |
| Cloudflare Health Checks (Pro 以上) | 無料プラン外 | [ ] |
| Workers Analytics をスキップし外部監視のみ | 内部失敗（D1 クエリ失敗等）の検知不可 | [ ] |

## GO / NO-GO 判定基準

| 判定 | 条件 |
| --- | --- |
| GO | CRITICAL = 0 かつ MAJOR = 0、全 AC 観点が PASS、05a 整合性 PASS |
| 条件付き GO | MAJOR = 0、MINOR ≤ 3 で Phase 4 と並行修正可能 |
| NO-GO | CRITICAL ≥ 1 または MAJOR ≥ 1 が解消されていない |

NO-GO 時は Phase 2 へ差し戻し、該当成果物を修正のうえ再レビュー。

## 実行タスク

- [ ] Phase 2 成果物 9 件を全て読み、AC との対応を確認する
- [ ] 観点 1〜6 の各レビュー項目を判定する
- [ ] 代替案棄却の確認チェックを完了させる
- [ ] CRITICAL / MAJOR / MINOR の件数を集計する
- [ ] GO / NO-GO 判定を下し、根拠を `outputs/phase-03/design-review.md` に記録する
- [ ] NO-GO 時は Phase 2 への差し戻し事項を明記する
- [ ] Phase 4 への引き継ぎ事項（MINOR 修正残・追加検証項目）を記録する

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
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/phase-02.md | Phase 2 設計仕様 |
| 必須 | outputs/phase-02/monitoring-design.md | レビュー対象（総合まとめ） |
| 必須 | outputs/phase-02/metric-catalog.md | レビュー対象（AC-1） |
| 必須 | outputs/phase-02/alert-threshold-matrix.md | レビュー対象（AC-2） |
| 必須 | outputs/phase-02/notification-design.md | レビュー対象（AC-3） |
| 必須 | outputs/phase-02/external-monitor-evaluation.md | レビュー対象（AC-4） |
| 必須 | outputs/phase-02/wae-instrumentation-plan.md | レビュー対象（AC-5） |
| 必須 | outputs/phase-02/runbook-diff-plan.md | レビュー対象（AC-6） |
| 必須 | outputs/phase-02/failure-detection-rules.md | レビュー対象（AC-7） |
| 必須 | outputs/phase-02/secret-additions.md | レビュー対象（AC-11） |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md | 整合性照合先 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/ | 無料枠仕様再確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | レビュー結果（全観点判定・重大度集計・GO/NO-GO 判定・根拠） |
| メタ | artifacts.json | phase-03 を completed に更新 |

## 完了条件

- [ ] 全レビュー項目（観点 1〜6）が PASS / MINOR / MAJOR / CRITICAL のいずれかで判定されている
- [ ] CRITICAL = 0 かつ MAJOR = 0 が達成されている（または差し戻し記録）
- [ ] 代替案棄却の確認が全てチェック済み
- [ ] GO / NO-GO 判定が根拠付きで記録されている
- [ ] MINOR 残がある場合は Phase 4 への引き継ぎ事項に明記されている
- [ ] `outputs/phase-03/design-review.md` が作成されている

## タスク 100% 実行確認【必須】

- 全レビュー項目が判定済み
- 全成果物が指定パスに配置済み
- CRITICAL / MAJOR が残存する場合は Phase 2 へ差し戻し記録
- artifacts.json の phase-03 を completed に更新

## 次 Phase

- 次: 4 (テスト計画・事前検証)
- 引き継ぎ事項: GO 判定根拠、MINOR 修正残、追加検証項目（無料枠超過確認・Secret 配置検証 等）を Phase 4 入力として渡す
- ブロック条件: GO 判定が下りていない（CRITICAL/MAJOR 残）場合は Phase 4 に進まない
