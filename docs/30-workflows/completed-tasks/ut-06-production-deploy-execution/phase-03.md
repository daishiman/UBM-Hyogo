# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | pending |

## 目的

Phase 2 で確定した「OpenNext Workers / API Workers / D1 デプロイ手順設計・ロールバック runbook・env-binding-matrix・Mermaid 図」の妥当性をレビューし、4 条件評価と AC カバレッジ確認に基づき GO / NO-GO / 条件付き GO 判定を行う。
本番不可逆操作（D1 マイグレーション適用）を伴うタスクのため、設計の抜け漏れを Phase 4 以降に持ち越さないことが目的。

## 実行タスク

- Phase 2 の deploy-design.md / rollback-runbook.md / env-binding-matrix.md をレビューする
- OpenNext Workers / API Workers / D1 各デプロイ手順の妥当性を確認する
- ロールバック手順の実行可能性（コマンド存在・権限・所要時間）を確認する
- smoke test 設計が AC-1 / AC-2 / AC-4 / AC-5 を完全カバーしているか確認する
- 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を確定する
- レビュー判定（GO / NO-GO / 条件付き GO）を行い、Phase 4 への引き継ぎ事項を整理する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-02.md | レビュー対象の設計 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-01.md | AC・スコープ・4 条件評価 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | AC の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler コマンド仕様の確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 参考 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md | readiness checklist の AC との整合 |

## 実行手順

### ステップ 1: 設計の妥当性確認

- Phase 2 の OpenNext Workers デプロイ手順が初回 project create 要否を判定するロジックを含むか確認する
- Workers デプロイ手順が `[env.production]` セクション・binding 設定を網羅しているか確認する
- D1 マイグレーション適用手順が「バックアップ取得 → 適用 → 履歴確認 → テーブル存在確認」の順序になっているか確認する
- env-binding-matrix が local / staging / production の D1 / KV / R2 / Vars / Secrets / project_name / service name 全てを記載しているか確認する

### ステップ 2: ロールバック手順のレビュー

- OpenNext Workers / API Workers / D1 各系統のロールバックコマンドが実在し、wrangler@3.x で動作する想定か確認する
- ロールバック発動条件・判断者・所要時間目安が runbook に明記されているか確認する
- 初回デプロイ時の Workers ロールバック不可（前 version 不在）に対する代替手順が記載されているか確認する
- D1 リストア時の整合性（Workers が新スキーマ前提の状態でリストアした場合の挙動）が考慮されているか確認する

### ステップ 3: smoke test の AC カバレッジ確認

- AC-1 (Pages 200 OK) / AC-2 (/health healthy) / AC-4 (D1 SELECT) / AC-5 (smoke 全件 PASS) が smoke test 設計に対応しているか確認する
- AC-3 (migrations list) / AC-6 (deploy-execution-log.md) / AC-7 (D1 export 保管) / AC-8 (rollback runbook) が Phase 5 / Phase 2 で記録されることが明示されているか確認する

### ステップ 4: 4 条件評価と判定

- 価値性 / 実現性 / 整合性 / 運用性を Phase 2 設計に対して再評価する
- 各観点で PASS / MINOR / MAJOR を判定する
- MAJOR が 1 件でもあれば Phase 2 に差し戻す
- MINOR は Phase 4 開始前に解消する
- 全観点が PASS であれば GO 判定で Phase 4 へ進む

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | MAJOR 判定時に差し戻す |
| Phase 4 | GO / 条件付き GO 判定後に verify suite の設計に進む |
| Phase 5 | レビュー結果を本番デプロイ実行の根拠とする |
| Phase 6 | rollback-runbook.md レビュー結果を異常系検証の根拠とする |
| Phase 7 | AC カバレッジ確認結果を AC matrix の入力とする |

## 多角的チェック観点（AIが判断）

- 価値性: 設計が「本番 go-live」というクリティカルパス解放価値を確実に実現するか
- 実現性: wrangler@3.x で全コマンドが実行可能であり、Cloudflare 無料枠超過リスクが評価されているか
- 整合性: env-binding-matrix と wrangler.toml の構造が一致し、本番 binding が staging / local と完全に分離されているか
- 運用性: ロールバック手順が「失敗発生時に 5 分以内に判断・実行可能」であり、バックアップ取得が必須前置きとして組み込まれているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | OpenNext Workers デプロイ手順レビュー | 3 | pending | AC-1 との整合確認 |
| 2 | Workers デプロイ手順レビュー | 3 | pending | AC-2 との整合確認 |
| 3 | D1 マイグレーション手順レビュー | 3 | pending | AC-3 / AC-7 との整合確認 |
| 4 | ロールバック手順レビュー | 3 | pending | AC-8 との整合確認 |
| 5 | smoke test 設計レビュー | 3 | pending | AC-1 / AC-2 / AC-4 / AC-5 カバレッジ |
| 6 | env-binding-matrix レビュー | 3 | pending | local / staging / production 全件 |
| 7 | 4 条件評価 | 3 | pending | 価値性 / 実現性 / 整合性 / 運用性 |
| 8 | GO / NO-GO 判定 | 3 | pending | 判定結果を記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー結果（観点別判定・代替案・GO/NO-GO 判定） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 全レビュー観点で判定（PASS / MINOR / MAJOR）が完了している
- 4 条件評価が全て確定している
- GO / NO-GO / 条件付き GO の最終判定が記録されている
- MAJOR がない（または Phase 2 差し戻しが完了している）
- Phase 4 への進行可否が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- MAJOR 判定の場合は Phase 2 差し戻し記録がある
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: 設計レビュー結果・GO/NO-GO 判定・採用設計・条件付き GO の場合の対応事項を Phase 4 に渡す
- ブロック条件: NO-GO 判定が残っている場合は次 Phase に進まない

## レビュー観点表

| 観点 | レビュー対象 | チェックポイント | 判定 |
| --- | --- | --- | --- |
| OpenNext Workers デプロイ手順の妥当性 | deploy-design.md | 初回 project create 判定・ビルド出力先・wrangler deploy --config apps/web/wrangler.toml --env production コマンド | TBD |
| Workers デプロイ手順の妥当性 | deploy-design.md | `[env.production]` 構造・binding 完全性・wrangler deploy コマンド | TBD |
| D1 マイグレーション手順の妥当性 | deploy-design.md | バックアップ前置き・migrations apply・migrations list・テーブル存在確認 | TBD |
| ロールバック手順の実行可能性 | rollback-runbook.md | コマンド実在・権限・初回不可ケースの代替・所要時間 | TBD |
| smoke test の AC カバレッジ | deploy-design.md | AC-1 / AC-2 / AC-4 / AC-5 全カバー | TBD |
| env-binding-matrix の網羅性 | env-binding-matrix.md | local / staging / production × D1/KV/R2/Vars/Secrets | TBD |
| Mermaid 設計図の整合性 | deploy-design.md | フロー全体（バックアップ→適用→デプロイ→smoke→記録／失敗ロールバック） | TBD |
| AC との整合（AC-1 〜 AC-8） | 全成果物 | 各 AC が Phase 2 設計のどこで実現されるか | TBD |
| 4 条件評価（価値性） | Phase 2 全体 | go-live 価値の実現性 | TBD |
| 4 条件評価（実現性） | Phase 2 全体 | wrangler@3.x で全コマンド動作・無料枠内 | TBD |
| 4 条件評価（整合性） | Phase 2 全体 | local / staging / production 完全分離 | TBD |
| 4 条件評価（運用性） | Phase 2 全体 | ロールバック 5 分以内・バックアップ必須 | TBD |

**判定凡例:**
- PASS: そのまま次 Phase に進める
- MINOR: 軽微な修正が必要だが Phase 4 開始前に解消可能
- MAJOR: 設計の根本的な見直しが必要（Phase 2 に差し戻し）

## レビュー判定（GO / NO-GO / 条件付き GO）

| 判定 | 条件 | Phase 4 進行可否 |
| --- | --- | --- |
| GO | 全観点 PASS かつ 4 条件全て PASS | 進行可 |
| 条件付き GO | MINOR が 1 件以上、MAJOR ゼロ | MINOR 解消後に進行可 |
| NO-GO | MAJOR が 1 件以上、または 4 条件のいずれかが NO-GO | Phase 2 差し戻し |

**最終判定:** TBD（Phase 2 成果物確認後に記入）

## 代替案検討

| 案 | 内容 | メリット | デメリット | 採否 |
| --- | --- | --- | --- | --- |
| A: 手動 wrangler コマンドで初回デプロイ（採用案） | Phase 2 設計の通り wrangler CLI で OpenNext Workers / API Workers / D1 を順次デプロイ | 学習コスト低・初回 go-live に適切・rollback 手順を runbook 化しやすい | 自動化されないため再現性は GitHub Actions 化（UT-05）で別途確保 | 採用 |
| B: GitHub Actions（UT-05）完了を待ってから本番デプロイ | CI/CD で完全自動化 | 再現性・トレース性が高い | UT-05 完了待ちでクリティカルパスが伸びる | 不採用（並行進行で UT-05 完了後に CI/CD へ移行） |
| C: Cloudflare ダッシュボード手動デプロイ | UI 操作で完結 | wrangler 不要 | コマンド履歴が残らず再現不可・runbook 化困難 | 不採用 |
| D: D1 を Drizzle migrate などサードパーティで適用 | アプリ側マイグレーションツール利用 | アプリ層とスキーマ管理を統合 | 本タスクのスコープ外（UT-04 で別途検討） | 不採用 |

## Phase 4 への引き継ぎ事項

- GO / 条件付き GO 判定の最終結果と、条件付き GO の場合の MINOR 解消タスク一覧
- レビューで確認した「未確認項目」（例: Cloudflare アカウント権限の実機確認・wrangler バージョン確認）を Phase 4 verify suite の対象として引き継ぐ
- Phase 2 で設計した smoke test 手順を Phase 4 で dry run 用に再利用する旨
- ロールバック手順の dry run（実行はしないがコマンド構文の検証）を Phase 4 のスコープに含める
- 本番不可逆操作前のバックアップ取得手順（AC-7）が Phase 5 実行直前の必須前置きであることを再確認
