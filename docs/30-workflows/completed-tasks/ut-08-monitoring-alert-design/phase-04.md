# Phase 4: テスト計画・事前検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | モニタリング/アラート設計 (UT-08) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト計画・事前検証 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画書化) |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |

---

## 目的

UT-08 は **設計タスク（spec_created / non_visual）** であり、本タスク内で計装コードや外形監視設定を実施しない。
Phase 4 の責務は、Wave 2 実装タスクが Phase 5 の実装計画に従って計装・通知設定を行う際に
「監視設計が現実に機能するか」を検証可能な形で固定しておくことにある。
具体的には、以下の3層検証戦略をテスト計画として記述し、Wave 2 実装タスクへの引き渡しに必要な
事前確認チェックリストを整える。

1. **外部監視疎通検証**: UptimeRobot 等の外形監視がエンドポイントの HTTP 応答を検出できるか
2. **WAE 書き込み検証**: Workers Analytics Engine への計装イベントが書き込まれ、SQL API で読み出せるか
3. **通知到達検証**: Slack Incoming Webhook / メール経由でアラート通知が宛先に到達するか

本 Phase では実コードを書かないため、検証は **計画と擬似コマンドの形で固定** する。
実コマンド実行は Wave 2 実装タスク（UT-08 後段）の責務である。

---

## 実行タスク

- [ ] Phase 2 設計成果物（metric-catalog / alert-threshold-matrix / wae-instrumentation-plan / notification-design / external-monitor-evaluation）の確定済み版が存在することを確認する
- [ ] Phase 3 設計レビューが GO 判定であることを確認する
- [ ] 3層検証戦略（外部監視 / WAE / 通知）を `outputs/phase-04/test-plan.md` に記述する
- [ ] 検証コマンド suite（擬似コマンド・期待結果）を Test ID 単位で固定する
- [ ] 事前確認チェックリストを `outputs/phase-04/pre-verify-checklist.md` に作成する
- [ ] 上流タスク（05a-parallel-observability-and-cost-guardrails / UT-09 Sheets→D1 同期）の状態を確認項目に含める
- [ ] 無料枠残量・Secret 配置完了・WAE 有効化を事前確認に含める
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## テスト計画（test-plan.md の章立て案）

### 検証層 1: 外部監視疎通検証

| Test ID | 対象 | 検証内容 | 期待結果 |
| --- | --- | --- | --- |
| MON-EXT-01 | UptimeRobot HTTPS 監視 | 公開トップ URL（`https://<production-domain>/`）に対する5分間隔の HTTP HEAD/GET が 200 を返す | UptimeRobot ダッシュボードで `Up` 状態が継続表示される |
| MON-EXT-02 | UptimeRobot 障害検知 | 意図的に 5xx 応答するエンドポイントを設定 → 5〜10分以内に DOWN 検知 | 通知チャネルへ DOWN アラートが送信される |
| MON-EXT-03 | UptimeRobot 復旧検知 | DOWN 状態から正常応答へ復旧後の検知 | 同チャネルへ UP（復旧）通知が送信される |
| MON-EXT-04 | API ヘルスチェック | `https://<api-domain>/healthz`（仮）が 200 と JSON `{"ok":true}` を返す | 外形監視で 200 を観測し続ける |

### 検証層 2: WAE 書き込み検証

| Test ID | 対象 | 検証内容 | 期待結果 |
| --- | --- | --- | --- |
| MON-WAE-01 | バインディング解決 | `wrangler.toml` の `analytics_engine_datasets` バインディングが apps/api 側で `env.<BINDING>` として解決される | `wrangler dev --env staging` 起動時にバインディングエラーが出ない |
| MON-WAE-02 | 計装イベント書き込み | API リクエストごとに `writeDataPoint` が呼ばれる（計装ポイントは Phase 5 で確定） | Cloudflare GraphQL/SQL API で当該データセットに行が観測される |
| MON-WAE-03 | sampling 動作確認 | sampling 率（例: 10%）設定時に書き込み件数が期待割合に収束する | 1000 リクエスト中、約 100 行が WAE に到達する |
| MON-WAE-04 | エラーイベント分離 | エラー発生時のみ `error=1` フィールドを書き込み、エラーレートを SQL で集計可能 | `SELECT SUM(_sample_interval * blob1) FROM <dataset> WHERE blob2='error'` 等で集計値を取得できる |

### 検証層 3: 通知到達検証

| Test ID | 対象 | 検証内容 | 期待結果 |
| --- | --- | --- | --- |
| MON-NTF-01 | Slack Webhook 疎通 | `curl -X POST -d '{"text":"test"}' "$MONITORING_SLACK_WEBHOOK_URL"` が 200 を返す | Slack 指定チャネルにテストメッセージが投稿される |
| MON-NTF-02 | UptimeRobot → Slack 連携 | UptimeRobot のアラートコンタクトに Slack Webhook を登録 → DOWN テスト | Slack に DOWN 通知が届く |
| MON-NTF-03 | メール通知 | UptimeRobot の通知先メールアドレスへ DOWN 通知が到達する | 受信ボックスに通知が届く（迷惑メール除外を含めて確認） |
| MON-NTF-04 | 通知抑止（重複防止） | 同一インシデントの連続通知が抑止されている | 5分間隔の中で重複通知が発生しない |

### 期待結果テーブル（サマリー）

| 検証層 | Test ID 数 | 成功基準 | 失敗時の差し戻し先 |
| --- | --- | --- | --- |
| 外部監視 | 4 | 全 Test ID で期待結果と一致 | Phase 2 `external-monitor-evaluation.md` |
| WAE 書き込み | 4 | 全 Test ID で期待結果と一致 | Phase 2 `wae-instrumentation-plan.md` |
| 通知到達 | 4 | 全 Test ID で期待結果と一致 | Phase 2 `notification-design.md` / `secret-additions.md` |

> **注記**: 上記テストの実行責務は Wave 2 実装タスクにある。本 Phase では Test ID の固定と擬似コマンドの記述まで行う。

---

## 事前確認チェックリスト（pre-verify-checklist.md）

### カテゴリ 1: 上流タスクの状態確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 1-1 | 05a-parallel-observability-and-cost-guardrails が completed である | `cat docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md` | 状態が completed | [ ] |
| 1-2 | 05a の `observability-matrix.md` が存在する | `ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | ファイル存在 | [ ] |
| 1-3 | 05a の `cost-guardrail-runbook.md` が存在する | `ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` | ファイル存在 | [ ] |
| 1-4 | UT-09（Sheets→D1 同期ジョブ）の状態を確認する | `cat docs/30-workflows/unassigned-task/UT-09-*.md` または対応 30-workflows | 状態を記録（completed 不要だが Phase 5 計装対象として把握） | [ ] |
| 1-5 | Wave 1 主要タスク（01〜06）が staging 環境にデプロイ済みである | Cloudflare ダッシュボードで Workers / Pages の存在確認 | サービスが稼働している | [ ] |

### カテゴリ 2: Cloudflare 無料枠残量確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 2-1 | Workers Requests 残量 | Cloudflare Dashboard → Workers & Pages → Analytics | 月間 100,000 / 日に対する消費率 < 50% | [ ] |
| 2-2 | WAE データセット作成可能枠 | Cloudflare Dashboard → Analytics Engine | データセット作成上限内 | [ ] |
| 2-3 | D1 読み取り行数残量 | Cloudflare Dashboard → D1 → Metrics | 無料枠 5M rows/day に対する余裕がある | [ ] |
| 2-4 | UptimeRobot モニタ枠 | UptimeRobot ダッシュボード | 無料 50 モニタ枠の利用状況確認 | [ ] |

### カテゴリ 3: Secret 配置・1Password 状態確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 3-1 | 1Password Environments に `MONITORING_SLACK_WEBHOOK_URL`（または等価項目）の格納先が用意されている | 1Password Vault 確認 | 項目が存在する（値は Phase 5 で投入） | [ ] |
| 3-2 | `secret-additions.md`（Phase 2 成果物）に追加 Secret 一覧が網羅されている | `cat outputs/phase-02/secret-additions.md` | AC-11 の対象 Secret が記載されている | [ ] |
| 3-3 | Cloudflare Secrets 投入手順が `notification-design.md` に記載されている | `grep wrangler outputs/phase-02/notification-design.md` | `wrangler secret put` の手順が記載 | [ ] |
| 3-4 | UptimeRobot API トークンの保管場所が明確である | 1Password / `secret-additions.md` | 保管場所が一意に特定できる | [ ] |

### カテゴリ 4: 設計成果物の完備確認（Phase 2 / 3 引き継ぎ）

| # | 確認項目 | 確認方法 | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 4-1 | `outputs/phase-02/monitoring-design.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-2 | `outputs/phase-02/metric-catalog.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-3 | `outputs/phase-02/alert-threshold-matrix.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-4 | `outputs/phase-02/wae-instrumentation-plan.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-5 | `outputs/phase-02/notification-design.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-6 | `outputs/phase-02/external-monitor-evaluation.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-7 | `outputs/phase-02/runbook-diff-plan.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-8 | `outputs/phase-02/failure-detection-rules.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-9 | `outputs/phase-02/secret-additions.md` が存在する | `ls` | ファイル存在 | [ ] |
| 4-10 | `outputs/phase-03/design-review.md` の判定が GO である | `grep -i 'GO' outputs/phase-03/design-review.md` | GO 判定が明記されている | [ ] |

### カテゴリ 5: ローカル / mise 環境確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 5-1 | mise + Node 24 + pnpm 10 の動作 | `mise exec -- node --version && mise exec -- pnpm --version` | `v24.x.x` / `10.x.x` | [ ] |
| 5-2 | wrangler CLI が利用可能 | `mise exec -- pnpm wrangler --version` | バージョン番号が表示される | [ ] |
| 5-3 | Cloudflare ログイン状態 | `mise exec -- pnpm wrangler whoami` | アカウントが表示される | [ ] |

---

## 事前確認失敗時の対処

| 失敗ケース | 対処 |
| --- | --- |
| 05a が completed でない | 05a の完了を待つか、未完了スコープを Phase 5 計画に明記する |
| 無料枠消費率が高い | 05a の `cost-guardrail-runbook.md` に従って消費抑制策を先行する |
| Secret 格納先が未整備 | 1Password Environments に項目を作成し、`secret-additions.md` に追記する |
| Phase 2 成果物欠落 | Phase 2 へ差し戻し、欠落成果物を補完する |
| Phase 3 が NO-GO | Phase 4 に進まず、Phase 2/3 を再実施する |

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
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC 定義・Phase 一覧・不変条件 |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/artifacts.json | Phase 成果物定義 |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md | observability-matrix と継承元 |
| 必須 | docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md | UT-08 原典 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/ | WAE 公式 |
| 参考 | https://uptimerobot.com/api/ | UptimeRobot API |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-plan.md | 3層検証（外部監視 / WAE / 通知）の Test ID と期待結果 |
| ドキュメント | outputs/phase-04/pre-verify-checklist.md | 上流状態・無料枠・Secret・成果物完備の事前確認結果 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] `outputs/phase-04/test-plan.md` に MON-EXT-01〜04 / MON-WAE-01〜04 / MON-NTF-01〜04 の全 Test ID が定義されている
- [ ] 各 Test ID に「対象」「検証内容」「期待結果」が記載されている
- [ ] `outputs/phase-04/pre-verify-checklist.md` のカテゴリ 1〜5 が全て埋められている
- [ ] 上流タスク（05a / UT-09）の状態が記録されている
- [ ] 無料枠残量・Secret 配置状況・Phase 2/3 成果物の存在が確認されている
- [ ] 失敗項目がある場合、対処方針が明記され Phase 5 へ引き継ぐ事項として整理されている
- [ ] 計装コードを書いていないこと（不変条件 5 に準拠）が確認できる

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-04 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 5（実装計画書化）
- 引き継ぎ事項:
  - test-plan.md の Test ID は Wave 2 実装タスクが Phase 5 の実装計画に基づいて実行する
  - pre-verify-checklist.md の未充足項目があれば Phase 5 計画に「前提条件」として明記する
  - 上流タスク状態（05a / UT-09）の差分は Phase 5 計画と Phase 6 異常系に反映する
- ブロック条件: Phase 3 が NO-GO、または Phase 2 成果物に欠落がある場合は Phase 5 に進まない
