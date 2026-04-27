# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

「`dev` ブランチを Cloudflare staging へ deploy し、Forms 同期と Playwright を staging 上で green にする」という単一責務を、production 切り出し（09c）と監視/runbook 整備（09b）から確実に分離した上で、scope と AC を固定する。

## 実行タスク

1. 上流タスク（08a contract test、08b Playwright、04 CI/CD secrets）の AC 達成状況を点検する
2. staging deploy で必要な D1 migration / secrets / wrangler.toml の前提を列挙する
3. staging 上で Forms 同期を回す手順（手動 POST + sync_jobs 確認）を要件として固定する
4. staging URL に対する Playwright 実行プロファイルと screenshot 保存先を確定する
5. `_design/phase-2-design.md` の Wave 9a と本 index.md の AC 整合性を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 9a scope / AC |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | staging deploy / D1 / secrets / cron |
| 必須 | doc/00-getting-started-manual/specs/14-implementation-roadmap.md | Phase 7 受け入れ条件 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠と staging Worker / D1 構成 |
| 必須 | doc/02-application-implementation/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/index.md | Playwright artifact の引き渡し元 |
| 参考 | docs/05b-parallel-smoke-readiness-and-handoff/phase-01.md | smoke readiness の要件記述例 |

## 実行手順

### ステップ 1: 上流 AC の引き継ぎ確認
- 08a の `outputs/phase-09/main.md` に CI green の証跡があるか確認する
- 08b の `outputs/phase-11/playwright/` に desktop / mobile screenshot 一式があるか確認する
- 04 の `outputs/phase-12/secret-inventory.md` に staging secret 7 種が登録済みか確認する

### ステップ 2: 真の論点と依存境界の整理
- 真の論点を `outputs/phase-01/main.md` に記述する（後述 "真の論点" セクション参照）
- 依存境界を「09a が触れる範囲（staging のみ）」と「09b/09c が触れる範囲（cron/runbook/production）」で分離する

### ステップ 3: 4 条件の判定と次 Phase 引き継ぎ
- 価値性 / 実現性 / 整合性 / 運用性を仮判定する（最終判定は Phase 10）
- blocker（例: staging secrets 未登録）と open question を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の scope / AC を mermaid と env table に展開 |
| Phase 4 | AC を verify suite（unit / contract / E2E / authorization）にマッピング |
| Phase 7 | AC matrix の base としてここで列挙した受入条件を使う |
| Phase 10 | GO/NO-GO の根拠として 4 条件判定を再利用 |
| 並列 09b | 本タスクが要求する staging URL を 09b の release runbook 内で参照させる |
| 下流 09c | 本タスクの staging green 結果を production deploy の前提にする |

## 多角的チェック観点（不変条件）

- 不変条件 #5（apps/web → D1 直接禁止）: staging build artifact で `D1Database` import が apps/web 配下に出現しないか lint で再確認することを Phase 4 で test 化
- 不変条件 #10（無料枠）: staging deploy 後 24h で Workers リクエスト数が 30k req / D1 reads 50k 以下に収まる見積もりを Phase 9 で検証
- 不変条件 #2（consent キー）: staging Playwright で `publicConsent` / `rulesConsent` の AuthGateState 出し分けを検証
- 不変条件 #11（admin は本人本文を直接編集できない）: staging admin UI に編集 form がないことを Phase 11 で目視

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 引き継ぎ確認 | 1 | pending | 08a/08b/04 の outputs を点検 |
| 2 | scope と依存境界の確定 | 1 | pending | 09b/09c との境界を明示 |
| 3 | AC リストアップ | 1 | pending | index.md の AC-1〜AC-9 と整合 |
| 4 | 4 条件 仮判定 | 1 | pending | Phase 10 で最終判定 |
| 5 | open question 列挙 | 1 | pending | Phase 3 へ持ち越す |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope / 真の論点 / 4 条件仮判定 / open question |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] `outputs/phase-01/main.md` が 9 個の AC を含めて書かれている
- [ ] 上流 3 タスク（08a / 08b / 04）の AC 引き継ぎ状況が「達成済み / 部分 / 未達」のいずれかでマーク済み
- [ ] 4 条件が「PASS / TBD」のいずれかで仮判定済み
- [ ] 開いている question が 3 件未満（多い場合は Phase 3 で alternative 検討）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-01/main.md` が指定パスに配置済み
- 完了条件 4 件すべてにチェック
- 上流 AC 不足が検出された場合 Phase 10 で NO-GO 候補としてマーク
- artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: scope / AC / 上流 AC 引き継ぎ状況 / 4 条件仮判定 / open question
- ブロック条件: 本 Phase の主成果物が未作成、または上流 AC 未達数が 5 件以上の場合は次 Phase に進まず Phase 10 で NO-GO 候補とする

## 真の論点

- staging deploy を「08 までの artifact をそのまま流すだけ」で済ませて良いか、それとも 09a 専用の事前検証を挟むか
- Forms 同期の staging 検証を「手動 POST のみ」で済ませるか、cron でも回すか（cron は 09b に分離すべきか）
- staging Playwright を `STAGING` プロファイルで再実行するか、08b と同じ fixture を使い回すか
- staging で AC を満たさなかった場合、09c へのブロックではなく該当 8 系 task への差し戻しとするか

## 依存境界

- 09a が触る: D1 staging への migration apply、staging secrets 確認、staging deploy、staging Forms 同期、staging Playwright、staging smoke runbook
- 09a が触らない: production 環境一切、cron triggers 設定（09b）、release runbook 本体（09b）、production smoke（09c）

## 価値とコスト

- 初回価値: production deploy 前に staging で Forms 同期 + 認可境界 + UI を一貫検証することで、production 障害の確率を下げる
- 初回で払わないコスト: production への deploy（09c）、cron triggers の本番設定（09b）、Sentry / Logpush 本番接続（09b）

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | staging green が本当に production の前提として機能するか | PASS（production deploy で唯一の事前検証経路） |
| 実現性 | 上流 08a/08b と 04 secrets が揃えば 1 営業日で完了するか | TBD（上流 AC 引き継ぎで判定） |
| 整合性 | 09b（cron / runbook）と 09c（production）の境界が重複していないか | PASS（scope 定義で重複なし） |
| 運用性 | 失敗時に 09c をブロックし、08 系へ差し戻す経路が明確か | PASS（Phase 10 で NO-GO 判定） |
