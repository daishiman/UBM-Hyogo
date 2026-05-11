# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は Phase 2 で確定した Slack 日本語化リレー Worker のコード設計（cf-webhook-auth 検証・エラーハンドリング・配置先）を含む 4 ドキュメントを多角的にレビューし、Phase 4 以降の実装フェーズへ引き渡す前に欠陥を検出する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 (UT-17) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト計画・事前検証) |
| 状態 | spec_created |

## 目的

Phase 2 で作成した 4 ドキュメント（alert-policy-matrix / relay-worker-design / slack-message-format / secret-management）と本 Phase 内に記述したテスト通知手順 / Webhook 失敗フォールバック / runbook 追記方針を多角的にレビューし、Phase 4 以降の実装フェーズへ引き渡す前に以下のリスクを検出・解消する:

- 無料枠超過リスク
- UT-08 既存設計との重複・命名衝突
- Secret 漏洩リスク
- アラート疲れリスク
- メッセージ可読性の不足
- フォールバック耐障害性の不足
- リレー Worker 配置先決定の妥当性

レビュー結果は GO / NO-GO 判定として `outputs/phase-03/design-review.md` に記録する。

## 真の論点（Phase 1〜2 から継承）

1. UT-08 既存通知設計と Secret 名・チャンネル・運用責務が衝突していないか
2. Cloudflare plan gate Notifications で全アラート対象メトリクスが本当に設定可能か
3. リレー Worker 配置先（`apps/api` 内 internal route vs 新規 `apps/alert-relay`）の決定根拠が妥当か
4. cf-webhook-auth 認証が Cloudflare Notifications Webhook の実仕様で実装可能か（cf-webhook-auth ヘッダ仕様）

## 依存境界

| 種別 | 対象 | 本 Phase での扱い |
| --- | --- | --- |
| 上流 | Phase 2 の 4 ドキュメント | 全てレビュー対象 |
| 上流 | UT-08 notification-design.md / secret-additions.md | 整合性レビューの照合先 |
| 上流 | Cloudflare 公式仕様 | 実現性レビューの照合先 |
| 下流 | Phase 4 (テスト計画) | レビュー結果に基づく事前検証項目を引き継ぐ |
| 下流 | Phase 4 以降 実装フェーズ | GO 判定後に着手 |

## 価値とコスト

- **価値**: 実装着手前に設計欠陥を検出することで実装手戻りコストを最小化する。特に「cf-webhook-auth が Cloudflare 仕様で成立しない」という発見は実装着手後では大きな手戻りとなるため、本 Phase で必ず検出する。
- **コスト**: 4 ドキュメント × 7 観点のクロスレビュー。重大度区分でフィルタし、CRITICAL/MAJOR を優先処理する。

## 4 条件評価

| 条件 | 問い | 判定基準 |
| --- | --- | --- |
| 価値性 | レビューが実装手戻りを実質的に減らすか | CRITICAL/MAJOR が 0 になり MINOR は許容範囲で記録される |
| 実現性 | 各観点の判定が現行成果物と公式仕様のみで完結するか | Cloudflare / Slack 公式仕様の追加調査結果を本 Phase 内に記録できる |
| 整合性 | UT-08 既存設計との衝突がないか | secret-management.md の衝突確認表が漏れなく整理されている |
| 運用性 | 配置先・閾値・フォールバックが運用継続可能な形になっているか | リレー Worker 配置先決定が運用簡素化と独立性のバランスを取っている |

## レビュー観点と重大度区分

### 重大度区分

| 区分 | 意味 | 対応 |
| --- | --- | --- |
| CRITICAL | 設計の根本欠陥・Secret 漏洩リスク・無料枠超過確実・実装不可能 | Phase 2 へ差し戻し、修正後再レビュー必須 |
| MAJOR | 重大な不整合・AC 未充足・UT-08 と命名衝突 | Phase 2 で修正、再レビュー後 GO |
| MINOR | 軽微な改善点 | Phase 4 着手と並行して修正可、ブロックしない |
| PASS | 問題なし | 次 Phase に進む |

### 観点 1: AC 充足レビュー

| AC | レビュー対象 | 確認内容 | 期待判定 |
| --- | --- | --- | --- |
| AC-1 | alert-policy-matrix.md | Workers / D1 read+write / Pages / R2 各メトリクスが網羅され WARNING (80%) / CRITICAL (95%) が定義されているか | PASS |
| AC-2 | relay-worker-design.md | リレー Worker 入出力契約・配置先・認証方式が決定されているか | PASS |
| AC-3 | slack-message-format.md | 日本語フォーマットにメトリクス名・現在値・閾値・残量・確認手順リンクが含まれているか | PASS |
| AC-4 | secret-management.md | Slack Webhook URL の 1Password パスと wrangler 登録手順があるか | PASS |
| AC-5 | relay-worker-design.md | cf-webhook-auth 固定シークレット認証が設計されているか | PASS |
| AC-6 | phase-02.md（テスト通知手順） | 手動トリガー手順と動作確認手順が記述されているか | PASS |
| AC-7 | phase-01.md / alert-policy-matrix.md | 本番稼働後 1〜2 週間ベースライン後の再調整方針があるか | PASS |
| AC-8 | phase-02.md（フォールバック） | Webhook 失敗時のメール併用と月次ヘルスチェックがあるか | PASS |
| AC-9 | phase-02.md（runbook 追記） | runbook 追記方針が存在するか | PASS |

### 観点 2: UT-08 整合性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| Secret 名衝突 | UT-08 の `MONITORING_SLACK_WEBHOOK_URL` と UT-17 の `SLACK_WEBHOOK_URL` が同一名前空間で衝突しないか | REVIEW_REQUIRED |
| Slack チャンネル設計 | UT-08 アプリ層通知と UT-17 プラットフォーム層通知のチャンネル分離方針が明確か | REVIEW_REQUIRED |
| 責務重複 | 同じイベントが UT-08 と UT-17 の双方で通知される設計になっていないか | REVIEW_REQUIRED |
| runbook 二重管理 | UT-08 が予約した runbook 差分計画と UT-17 の追記計画が衝突しないか | REVIEW_REQUIRED |
| 1Password Vault 構造 | UT-08 と UT-17 で同じ Vault 内のアイテム命名が体系化されているか | REVIEW_REQUIRED |

### 観点 3: 無料枠遵守レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| Cloudflare Notifications 無料枠 | 設定するアラート数がplan gate上限内に収まるか | REVIEW_REQUIRED |
| R2 Class A アラート可否 | plan gateで R2 Class A operations のアラートが設定可能か（不可なら設計から除外） | REVIEW_REQUIRED |
| D1 Read アラート可否 | plan gateで D1 Read row 数のアラートが設定可能か | REVIEW_REQUIRED |
| リレー Worker のリクエスト消費 | リレー Worker 自身が Workers Daily Requests を消費する量が誤検知を起こさないか（自己参照ループ防止） | REVIEW_REQUIRED |
| 有料 SaaS 不採用 | 設計内に有料 SaaS への暗黙的依存がないか | REVIEW_REQUIRED |

### 観点 4: Secret 管理レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 1Password Environments 正本 | 全 Secret が `op://` 参照で正本管理されているか | REVIEW_REQUIRED |
| ハードコード禁止 | 設計内に Webhook URL / cf-webhook-auth 値の実値が含まれていないか | REVIEW_REQUIRED |
| `scripts/cf.sh` 経由登録 | wrangler 直接呼び出しが含まれていないか | REVIEW_REQUIRED |
| `.env` コミット防止 | `.dev.vars.example` に `op://` 参照のみ記述されているか | REVIEW_REQUIRED |
| Secret ローテーション | Webhook URL / cf-webhook-auth 失効時の差し替え手順が runbook 追記方針に含まれるか | REVIEW_REQUIRED |
| ログ出力禁止 | エラーログ・通常ログに Secret 値が出ない実装方針が明示されているか | REVIEW_REQUIRED |

### 観点 5: アラート疲れ抑止レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 二段階閾値 | WARNING (80%) / CRITICAL (95%) が全メトリクスで設定されているか | REVIEW_REQUIRED |
| ベースライン後再調整 | 本番稼働後 1〜2 週間後の閾値再調整方針が明示されているか | REVIEW_REQUIRED |
| メッセージ集約性 | 同種アラートが短時間に多発しても運用者が一覧で把握できるフォーマットか | REVIEW_REQUIRED |
| 連続条件 | CRITICAL を即時発報せず、可能なら連続条件を Cloudflare 側で設定する選択肢を検討したか | REVIEW_REQUIRED |
| 通知抑制方針 | リレー Worker が短時間に同一メトリクスのアラートを束ねる将来拡張余地があるか | REVIEW_REQUIRED |

### 観点 6: メッセージ可読性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 日本語化網羅 | メトリクス名日本語訳マスタが対象メトリクス全件をカバーしているか | REVIEW_REQUIRED |
| 必須情報 | メトリクス名・現在値・閾値・残量・発火時刻・重大度・リンクが全て含まれているか | REVIEW_REQUIRED |
| モバイル可読性 | Slack モバイルプッシュ通知で要約が読めるか（`text` フィールド併記） | REVIEW_REQUIRED |
| アクションボタン | Cloudflare Dashboard / runbook へのリンクが有効か | REVIEW_REQUIRED |
| 未知メトリクスのフォールスルー | マスタ未登録メトリクスでも英語名でフォールスルーする設計か | REVIEW_REQUIRED |

### 観点 7: フォールバック耐障害性レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| メール併用 | 全 Notification Policy にメール通知が併設されているか | REVIEW_REQUIRED |
| リレー Worker 障害時の挙動 | リレー Worker ダウン時にメールでフォールバックされるか | REVIEW_REQUIRED |
| Slack Webhook 失効検知 | 月次ヘルスチェック手順が runbook に組み込まれているか | REVIEW_REQUIRED |
| cf-webhook-auth 失効時の検知 | リレー Worker が 401 を返し続けた場合の検知経路が明示されているか | REVIEW_REQUIRED |
| リトライ仕様 | 5xx / network 失敗時のリトライ回数とバックオフが妥当か | REVIEW_REQUIRED |

### 観点 8: 配置先決定レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| トレードオフ整理 | (a) `apps/api` 内 internal route と (b) 新規 `apps/alert-relay` のメリット・デメリットが整理されているか | REVIEW_REQUIRED |
| 推奨案の妥当性 | 推奨案 (a) が運用簡素化と独立性のバランスを取っているか | REVIEW_REQUIRED |
| internal route 隔離 | 採用案 (a) の場合、認可境界（cf-webhook-auth + internal path）が外部公開ルートから論理分離されているか | REVIEW_REQUIRED |
| D1 アクセス境界遵守 | リレー Worker が D1 に直接アクセスしない設計か（CLAUDE.md 不変条件 5） | REVIEW_REQUIRED |
| 将来の (b) 移行容易性 | 将来独立 Worker へ切り出す場合の移行コストが過大でないか | REVIEW_REQUIRED |

## 代替案棄却の確認

| 代替案 | 棄却理由 | 確認済み |
| --- | --- | --- |
| Cloudflare Notifications を使わず外部監視のみで代替 | 内部メトリクス（D1 row reads 等）は外部監視で取得不可 | [ ] |
| Cloudflare → Slack 直接連携（リレー Worker なし） | 英語ペイロードのまま受信で運用者の判断負荷が高い | [ ] |
| 有料 Health Checks で監視 | plan gate外。本タスク不変条件と矛盾 | [ ] |
| リレー Worker を独立サービス（GAS / Lambda 等）で構築 | リポジトリ管理外となり運用一元性が損なわれる | [ ] |
| cf-webhook-auth 認証を省略し IP allowlist で代替 | Cloudflare 送信元 IP は変動するため不適 | [ ] |
| WAE 計装で UT-17 メトリクスを再観測 | UT-08 と責務重複し二重管理になる | [ ] |

## GO / NO-GO 判定基準

| 判定 | 条件 |
| --- | --- |
| GO | CRITICAL = 0 かつ MAJOR = 0、全 AC 観点が PASS、UT-08 整合性 PASS、Webhook plan gate / `cf-webhook-auth` / 対象メトリクス公式名が確定 |
| 条件付き GO | MAJOR = 0、MINOR ≤ 3 で Phase 4 と並行修正可能 |
| NO-GO | CRITICAL ≥ 1 または MAJOR ≥ 1 が解消されていない、または Webhook plan gate / `cf-webhook-auth` / 対象メトリクス公式名のいずれかが未確定の場合 |

NO-GO 時は Phase 2 へ差し戻し、該当成果物を修正のうえ再レビュー。Webhook 利用不可の場合は relay Worker を optional に落とし、メール通知 baseline + runbook evidence へ切り替える。

## 実行タスク

- [ ] Phase 2 成果物 4 件を全て読み、AC との対応を確認する
- [ ] 観点 1〜8 の各レビュー項目を判定する
- [ ] Cloudflare Notifications plan gate仕様（特に R2 / D1 Read アラート可否）を公式仕様で再確認し記録する
- [ ] Cloudflare Notifications Webhook のcf-webhook-auth ヘッダ仕様を再確認し、cf-webhook-auth 設計の実現可否を確定する
- [ ] UT-08 既存 Secret / チャンネルとの衝突確認結果を記録する
- [ ] 代替案棄却の確認チェックを完了させる
- [ ] CRITICAL / MAJOR / MINOR の件数を集計する
- [ ] リレー Worker 配置先 (a)/(b) の最終決定を承認する
- [ ] GO / NO-GO 判定を下し、根拠を `outputs/phase-03/design-review.md` に記録する
- [ ] NO-GO 時は Phase 2 への差し戻し事項を明記する
- [ ] Phase 4 への引き継ぎ事項（MINOR 修正残・追加検証項目）を記録する

## 統合テスト連携

本 Phase はレビューのみで実コード・Cloudflare ダッシュボード設定・Secret 投入を行わない。統合テスト連携は Phase 4 以降の実装フェーズで実施する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 4〜実装フェーズ | リレー Worker 実装、Notifications 設定、cf-webhook-auth 認証、Slack 疎通テスト | レビュー結果と未決事項を引き継ぐ |
| UT-07 | 通知基盤との接続 | Slack Webhook URL 提供元として参照 |
| UT-08 | 命名・チャンネル衝突の最終確認 | secret-management.md 衝突表をレビュー |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-02.md | Phase 2 設計仕様 |
| 必須 | outputs/phase-02/alert-policy-matrix.md | レビュー対象（AC-1, AC-7） |
| 必須 | outputs/phase-02/relay-worker-design.md | レビュー対象（AC-2, AC-5） |
| 必須 | outputs/phase-02/slack-message-format.md | レビュー対象（AC-3） |
| 必須 | outputs/phase-02/secret-management.md | レビュー対象（AC-4） |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md | UT-08 整合性照合先 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/secret-additions.md | UT-08 Secret 衝突確認 |
| 必須 | CLAUDE.md | Secret / `scripts/cf.sh` / D1 アクセス境界 |
| 参考 | https://developers.cloudflare.com/notifications/ | plan gate仕様再確認 |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | Webhook カスタムヘッダ仕様 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | レビュー結果（観点 1〜8 判定・重大度集計・GO/NO-GO 判定・根拠・代替案棄却確認・配置先最終決定） |

## 完了条件

- [ ] 全レビュー項目（観点 1〜8）が PASS / MINOR / MAJOR / CRITICAL のいずれかで判定されている
- [ ] CRITICAL = 0 かつ MAJOR = 0 が達成されている（または差し戻し記録）
- [ ] cf-webhook-auth 認証が Cloudflare 実仕様で実現可能であることが確認されている（不可なら cf-webhook-auth fixed secret フォールバック決定）
- [ ] UT-08 既存設計との Secret 名・チャンネル衝突がないことが確認されている
- [ ] Cloudflare plan gateで全アラート対象メトリクスが設定可能であることが確認されている（不可なメトリクスは設計から除外し記録）
- [ ] リレー Worker 配置先 (a)/(b) の最終決定が承認されている
- [ ] 代替案棄却の確認が全てチェック済み
- [ ] GO / NO-GO 判定が根拠付きで記録されている
- [ ] MINOR 残がある場合は Phase 4 への引き継ぎ事項に明記されている
- [ ] `outputs/phase-03/design-review.md` が作成されている

## タスク 100% 実行確認【必須】

- 全レビュー項目が判定済み
- 全成果物が指定パスに配置済み
- CRITICAL / MAJOR が残存する場合は Phase 2 へ差し戻し記録
- cf-webhook-auth 不可ケースのフォールバック判断結果を記録

## 次 Phase

- 次: 4 (テスト計画・事前検証)
- 引き継ぎ事項: GO 判定根拠、リレー Worker 配置先最終決定、cf-webhook-auth 認証実現可否、MINOR 修正残、追加検証項目（無料枠確認・Secret 配置検証・Slack 疎通テスト計画）を Phase 4 入力として渡す
- ブロック条件: GO 判定が下りていない（CRITICAL/MAJOR 残）場合、または cf-webhook-auth 認証の実現可否が未確定の場合は Phase 4 に進まない
