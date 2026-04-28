# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-27 |
| 前 Phase | 6 (異常系・ロールバック検証) |
| 次 Phase | 8 (設定 DRY 化・runbook 整備) |
| 状態 | pending |

## 目的

AC-1〜AC-8 の全受入条件に対して検証項目が完全にトレースされ、Phase 1〜6 で生成された成果物が証跡として機能していることを確認する。
本番デプロイを伴う implementation タスクとして、smoke test / 依存タスク連携 / dependency edge の網羅性を確認し、抜け漏れがある場合は対応 Phase に差し戻す判断を行う。

## 実行タスク

- AC matrix を作成し AC-1〜AC-8 を全トレースする
- 各 AC に対応する検証 Phase・検証コマンド／手順・期待結果・証跡パス・状態を明確化する
- 依存タスク（02-serial / 03-serial / 04-serial / 05b-parallel / UT-04 / UT-05 / UT-09 / UT-08）との dependency edge coverage を確認する
- smoke test カバレッジ（Pages 表示 / API /health / D1 SELECT / バインディング解決 / 認証エンドポイント疎通）を確認する
- 抜け漏れ検出時の差し戻し先 Phase を明示する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | AC-1〜AC-8 の正本 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-01.md | AC・スコープ・既存資産インベントリ |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-02.md | デプロイ設計・smoke test 設計・env-binding-matrix |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-03.md | 設計レビュー結果・GO/NO-GO 判定 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-04.md | 事前検証 verify suite 結果 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-05.md | デプロイ実施記録 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-06.md | 異常系・ロールバック検証結果 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler コマンド仕様 |
| 必須 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md | readiness checklist の AC との整合 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: AC matrix の作成

- index.md の AC-1〜AC-8 を再読する
- 各 AC に対応する検証 Phase・検証コマンド／手順・期待結果・証跡パスを列挙する
- Phase 1〜6 の成果物を実機ファイルで確認し、各 AC の証跡が存在するか確認する

### ステップ 2: dependency edge coverage の確認

- 02-serial / 03-serial / 04-serial / 05b-parallel が本タスク開始前に PASS しているかを Phase 1 の既存資産インベントリと突き合わせる
- UT-04（D1 スキーマ）/ UT-05（CI/CD）が本 Phase の検証対象に紐づいているかを確認する
- UT-09 / UT-08 が本タスクの下流 handoff として整理されているかを確認する

### ステップ 3: smoke test カバレッジの確認

- AC-1 (Pages 200) / AC-2 (/health) / AC-4 (D1 SELECT) / AC-5 (smoke 全件 PASS) のカバレッジを確認する
- バインディング解決（D1 / KV / R2 / Vars / Secrets）が Workers ログまたは API 経由で確認されているかを確認する
- 認証エンドポイント（Auth.js / Magic Link）の疎通確認は MVP スコープに応じて任意項目として扱う

### ステップ 4: 抜け漏れの差し戻し判断

- 証跡が欠落している AC を特定し、差し戻し先 Phase（Phase 2 設計 / Phase 4 事前検証 / Phase 5 実行 / Phase 6 異常系）を明示する
- coverage-report.md に差し戻しリストを記録する

## AC matrix（AC-1〜AC-8 全トレース）【必須】

| AC | 内容 | 検証 Phase | 検証コマンド／手順 | 期待結果 | 証跡パス | 状態 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | Web 本番 URL が `200 OK` を返す | Phase 5 / Phase 11 | `curl -sI <web-url>` | HTTP/2 200（または HTTP/1.1 200 OK） | outputs/phase-05/deploy-execution-log.md / outputs/phase-11/smoke-test-result.md | pending |
| AC-2 | Workers `/health` が healthy を返す | Phase 5 / Phase 11 | `curl -s <workers-url>/health` | `{"status":"healthy"}` 等 healthy レスポンス | outputs/phase-05/deploy-execution-log.md / outputs/phase-11/smoke-test-result.md | pending |
| AC-3 | D1 マイグレーション履歴が記録されている | Phase 5 | `wrangler d1 migrations list <DB> --env production` | applied 履歴に全マイグレーションが記載 | outputs/phase-05/deploy-execution-log.md | pending |
| AC-4 | Workers→D1 バインディング疎通（API 経由 1 件 SELECT） | Phase 5 / Phase 11 | API `/health/db` 等で SELECT 実行 | 1 件以上のレスポンス成功 | outputs/phase-05/deploy-execution-log.md / outputs/phase-11/smoke-test-result.md | pending |
| AC-5 | smoke test 全件 PASS | Phase 5 / Phase 11 | AC-1 / AC-2 / AC-4 を一括実行 | 全件 PASS | outputs/phase-11/smoke-test-result.md | pending |
| AC-6 | デプロイ実施記録（日時・実施者・wrangler ver・SHA・結果）の文書化 | Phase 5 | `git rev-parse HEAD` / `wrangler --version` 取得 | deploy-execution-log.md に全項目記載 | outputs/phase-05/deploy-execution-log.md | pending |
| AC-7 | D1 本番バックアップ取得・保管場所記録 | Phase 5 | `wrangler d1 export <DB> --env production --output backup-{ts}.sql` | backup ファイル取得・保管場所文書化 | outputs/phase-05/d1-backup-evidence.md | pending |
| AC-8 | ロールバック手順（OpenNext Workers / API Workers / D1）の事前確認・runbook 化 | Phase 2 / Phase 6 | rollback-runbook.md レビュー・Phase 6 dry run | 3 系統の手順が runbook に記載・dry run PASS | outputs/phase-02/rollback-runbook.md / outputs/phase-06/abnormal-case-matrix.md | pending |

## dependency edge coverage【必須】

| 依存タスク | 種別 | 連携内容 | 検証方法 | 状態 |
| --- | --- | --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | 上流 | ビルド可能な monorepo（pnpm workspace / Node 24 / @opennextjs/cloudflare） | Phase 1 既存資産インベントリ確認 / `mise exec -- pnpm build` 成功 | pending |
| 03-serial-data-source-and-storage-contract | 上流 | D1 runbook・スキーマ確定 | Phase 4 verify suite で migrations dry run | pending |
| 04-serial-cicd-secrets-and-environment-sync | 上流 | 本番 Secrets 配置 | `wrangler secret list --env production` で件数確認 | pending |
| 05b-parallel-smoke-readiness-and-handoff | 上流 | readiness checklist PASS | handoff 成果物 PASS 確認 | pending |
| UT-04 (D1 データスキーマ設計) | 上流 | マイグレーション SQL | Phase 4 verify suite で `wrangler d1 migrations list --env production` dry run | pending |
| UT-05 (CI/CD パイプライン) | 上流（推奨） | 推奨だが必須ではない | 未完なら手動デプロイで代替（Phase 5 で明示） | pending |
| UT-09 (Sheets→D1 同期) | 下流 | 本タスク完了が前提 | handoff として下流 Issue 起票・spec 更新 | pending |
| UT-08 (モニタリング・アラート) | 下流 | 本タスク完了が前提 | handoff として下流 Issue 起票・spec 更新 | pending |

## smoke test カバレッジ【必須】

| 項目 | 検証 Phase | 検証手順 | AC 対応 | 状態 |
| --- | --- | --- | --- | --- |
| Pages 表示（200 OK） | Phase 5 / Phase 11 | `curl -sI <web-url>` | AC-1 / AC-5 | pending |
| API `/health` 疎通 | Phase 5 / Phase 11 | `curl -s <workers-url>/health` | AC-2 / AC-5 | pending |
| D1 SELECT（API 経由） | Phase 5 / Phase 11 | `/health/db` 等エンドポイント実行 | AC-4 / AC-5 | pending |
| Workers→D1 バインディング解決 | Phase 5 | `wrangler tail --env production` でログ確認 | AC-4 | pending |
| Workers→KV バインディング解決 | Phase 5 | API 経由 KV read（該当エンドポイントがあれば） | AC-5（拡張） | pending（任意） |
| Workers→R2 バインディング解決 | Phase 5 | API 経由 R2 head（該当エンドポイントがあれば） | AC-5（拡張） | pending（任意） |
| 認証エンドポイント疎通（Auth.js / Magic Link） | Phase 11 | `curl` でログイン開始エンドポイント疎通 | AC-5（MVP スコープ依存） | pending（任意） |
| migrations list 履歴確認 | Phase 5 | `wrangler d1 migrations list --env production` | AC-3 | pending |

## 抜け漏れ検出時の差し戻し先 Phase

| 抜け漏れの種類 | 差し戻し先 Phase | 対応内容 |
| --- | --- | --- |
| AC matrix で証跡パスが空 | Phase 5（実行） / Phase 11（手動 smoke） | 該当証跡を生成して再記録 |
| 設計の不備（手順抜け / コマンド誤り） | Phase 2（設計） | 設計を改訂し Phase 3 で再レビュー |
| 事前検証の dry run 漏れ | Phase 4（事前検証） | verify suite を再実行 |
| ロールバック dry run 不足 | Phase 6（異常系） | 抜けケースを追加検証 |
| dependency edge の未連携 | Phase 1（要件定義） | 依存関係を再整理し既存資産インベントリを更新 |
| smoke test カバレッジ不足 | Phase 2（設計） / Phase 11（実行） | smoke test 設計を拡張 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1〜6 | 各 Phase の成果物が AC の証跡として機能しているか確認 |
| Phase 8 | env-binding-matrix の DRY 化方針整備に AC matrix を引き継ぐ |
| Phase 9 | secret hygiene / 無料枠確認に AC matrix を入力 |
| Phase 10 | AC matrix を GO/NO-GO 判定の根拠として使用 |
| Phase 11 | smoke test カバレッジを手動 smoke test 実行の根拠とする |
| Phase 12 | close-out 時の spec sync において AC 完了状態を参照 |

## 多角的チェック観点（AIが判断）

- 価値性: 全 AC に検証項目・証跡が割り当てられ、本番 go-live の確認が完結するか
- 実現性: implementation タスクとして証跡が実機ログ／コマンド出力／ドキュメントで揃うか
- 整合性: 上流（02/03/04-serial / 05b-parallel / UT-04 / UT-05）・下流（UT-09 / UT-08）との dependency edge が網羅されているか
- 運用性: Phase 10 の GO/NO-GO 判定が AC matrix と coverage-report のみで判断できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 作成（AC-1〜AC-8） | 7 | pending | outputs/phase-07/ac-matrix.md |
| 2 | dependency edge coverage 確認 | 7 | pending | 8 タスクとの連携確認 |
| 3 | smoke test カバレッジ確認 | 7 | pending | Pages / API / D1 / バインディング / 認証 |
| 4 | 抜け漏れ検出と差し戻し判断 | 7 | pending | coverage-report.md に記録 |
| 5 | 05b-parallel handoff PASS 整合確認 | 7 | pending | readiness checklist との突き合わせ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜AC-8 の全トレース表（検証 Phase / コマンド / 期待結果 / 証跡 / 状態） |
| ドキュメント | outputs/phase-07/coverage-report.md | dependency edge coverage / smoke test カバレッジ / 抜け漏れと差し戻しリスト |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- AC-1〜AC-8 の全行に検証 Phase・検証コマンド／手順・期待結果・証跡パス・状態が記載されている
- dependency edge coverage が 8 タスク全件について確認されている
- smoke test カバレッジで Pages / API / D1 / バインディング解決の必須項目が PASS 見込みである
- 抜け漏れが検出された場合の差し戻し先 Phase が明示されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（証跡欠落・dependency edge 未連携・smoke test 不足）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (設定 DRY 化・runbook 整備)
- 引き継ぎ事項: AC matrix / coverage-report / 抜け漏れ差し戻しリストを Phase 8 に引き継ぐ
- ブロック条件: AC matrix が未完成、または MAJOR な抜け漏れ（AC 未トレース）が残っている場合は次 Phase に進まない
