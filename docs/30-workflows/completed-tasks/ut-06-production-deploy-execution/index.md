# ut-06-production-deploy-execution - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06 |
| タスク名 | 本番デプロイ実行 |
| ディレクトリ | docs/30-workflows/ut-06-production-deploy-execution |
| Wave | 1 |
| 実行種別 | 独立タスク（既存タスクへの組み込みなし） |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | docs-ready-execution-blocked |
| タスク種別 | implementation（本番環境への実デプロイを伴う） |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #8（CLOSED） |
| 元出典 | docs/30-workflows/completed-tasks/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md |

## 目的

Cloudflare Workers 上の Next.js 16 + `@opennextjs/cloudflare`（`apps/web`）/ API Workers（`apps/api`）/ D1 の本番環境への初回デプロイを実施し、smoke test で動作確認を行う。
`05b-parallel-smoke-readiness-and-handoff` で readiness checklist は整備されるが、本番への実デプロイ実行は独立タスクとして本タスクで実施する。

> **注意: GitHub Issue #8 は CLOSED 状態のままタスク仕様書を作成しています。**
> Issue は完了処理されているが、実装着手前の仕様書整備として本ディレクトリに 13 Phase 構成の正式な仕様書を整備します。
> 実行時は `05b-parallel-smoke-readiness-and-handoff` の handoff PASS 後に再オープン or 別 Issue で起票してください。

> **2026-04-27 Phase 12 再検証結果**
> Phase 1-12 の実行テンプレートは整備済みだが、本番デプロイ・D1 migration・Phase 11 smoke test は未実行。`apps/web` OpenNext Workers 形式整合、`apps/api` `/health/db` 実装、Phase 11 実スクリーンショット取得が完了するまで、UT-06 を本番完了扱いにしない。

## スコープ

### 含む

- Cloudflare Workers 上の Next.js 16 + `@opennextjs/cloudflare`（`apps/web`）本番デプロイ実行
- Cloudflare Workers（`apps/api`）の本番環境への初回デプロイ実行
- Cloudflare D1 本番データベースへのマイグレーション初回適用
- デプロイ後の smoke test（ページアクセス・API レスポンス・D1 バインディング疎通）
- 本番 URL の確認・記録
- デプロイ成功／失敗時の判定基準の事前確定とロールバック手順確認
- D1 本番バックアップ（`bash scripts/cf.sh d1 export`）の取得手順整備

### 含まない

- 本番データ（実ユーザーデータ）の投入
- Google Sheets から D1 への初回データ同期（→ UT-09）
- 継続的なモニタリング・アラート設定（→ UT-08）
- CI/CD パイプラインの構築（→ UT-05）
- カスタムドメインの完全設定（DNS 構成は別タスクで取り扱う場合は明示する）
- アプリケーション機能の実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation | ビルド可能な monorepo 環境が整備されていること |
| 上流 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract | 本番 D1 スキーマ（UT-04）が確定・適用準備済みであること |
| 上流 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | 本番 Secrets / 環境変数が Cloudflare に配置済みであること |
| 上流 | UT-04（D1 データスキーマ設計） | 本番 D1 にマイグレーションを適用するためにスキーマが確定していること |
| 上流 | UT-05（CI/CD パイプライン実装） | 推奨だが必須ではない。CI/CD 未完なら手動デプロイで初回実施 |
| 上流 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff | readiness checklist が PASS であること |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 本番 D1 が稼働していることが同期ジョブ実装・テストの前提 |
| 下流 | UT-08（モニタリング・アラート設計） | 本番環境が稼働してから監視設定を実装 |
| 下流 | 02-application-implementation 全体 | 本番環境が稼働していることが実装フェーズの前提 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Pages / Workers / D1 デプロイ手順・wrangler 操作 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 必須 | docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/index.md | readiness checklist・handoff 成果物 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md | D1 runbook（マイグレーション適用手順） |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | 本番 Secrets 配置確認 |
| 参考 | docs/00-getting-started-manual/specs/00-overview.md | システム全体像・本番環境の目標状態 |
| 参考 | docs/30-workflows/unassigned-task/UT-06-production-deploy-execution.md | UT-06 出典（unassigned 版） |
| 参考 | CLAUDE.md | ブランチ戦略・シークレット管理方針 |

## 受入条件 (AC)

- AC-1: `apps/web` の OpenNext Workers 本番 URL がアクセス可能であり、`200 OK` を返す
- AC-2: Cloudflare Workers（`apps/api`）が本番環境にデプロイされ、`/health` エンドポイントが healthy を返す
- AC-3: D1 本番データベースへのマイグレーションが正常に適用され、`wrangler d1 migrations list --env production` に履歴が記録されている
- AC-4: Workers から D1 へのバインディングが本番環境で疎通している（API 経由で 1 件 SELECT が成功する）
- AC-5: デプロイ後の smoke test（Web 表示・API レスポンス・D1 疎通）が全件 PASS している
- AC-6: デプロイ実施記録（実施日時・実施者・wrangler バージョン・コミット SHA・結果）が `outputs/phase-05/deploy-execution-log.md` に文書化されている
- AC-7: D1 本番バックアップ（`bash scripts/cf.sh d1 export --env production`）が取得され、保管場所が記録されている
- AC-8: ロールバック手順（OpenNext Workers / API Workers / D1）が事前確認され、`outputs/phase-02/rollback-runbook.md` に記録されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01 |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | template-ready | outputs/phase-04 |
| 5 | 本番デプロイ実行 | phase-05.md | not-executed | outputs/phase-05 |
| 6 | 異常系・ロールバック検証 | phase-06.md | template-ready | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07 |
| 8 | 設定 DRY 化・runbook 整備 | phase-08.md | completed | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09 |
| 10 | 最終レビュー（GO/NO-GO） | phase-10.md | completed | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | not-executed | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | pending | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/deploy-design.md | OpenNext Workers / API Workers / D1 デプロイ手順設計 |
| ドキュメント | outputs/phase-02/rollback-runbook.md | ロールバック手順（OpenNext Workers / API Workers / D1） |
| ドキュメント | outputs/phase-02/env-binding-matrix.md | 環境別 wrangler バインディング差分 |
| ドキュメント | outputs/phase-04/verify-suite-result.md | 事前検証 verify suite の実行結果 |
| ドキュメント | outputs/phase-05/deploy-execution-log.md | デプロイ実施記録（日時・SHA・結果） |
| ドキュメント | outputs/phase-05/d1-backup-evidence.md | D1 export バックアップ証跡 |
| ドキュメント | outputs/phase-06/abnormal-case-matrix.md | 異常系・ロールバック検証結果 |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC 完了トレース |
| ドキュメント | outputs/phase-09/quality-report.md | 無料枠・secret hygiene 確認 |
| ドキュメント | outputs/phase-10/go-nogo.md | GO / NO-GO 判定 |
| ドキュメント | outputs/phase-11/smoke-test-result.md | 本番 smoke test 結果 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 更新サマリー |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | `apps/web` OpenNext 本番ホスティング / `apps/api` API 本番ホスティング | 無料枠（100k req/day） |
| Cloudflare D1 | 本番 DB（マイグレーション適用対象） | 無料枠（5GB storage） |
| wrangler CLI | デプロイ実行・D1 操作・バックアップ | 無料 |
| GitHub Actions | （UT-05 完了後）CI/CD 経由デプロイ | 無料枠（2000 分/月） |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1 〜 AC-8 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルール（spec-update-workflow.md）が破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見

**1. 初回デプロイと既存デプロイの挙動差異**
OpenNext Workers は初回デプロイ時に service name・route・カスタムドメイン設定が確定する。2回目以降と手順が異なるため、初回は `apps/web/wrangler.toml` の `name` / route / assets binding を事前確認する。

**2. D1 マイグレーションの本番適用リスク**
`bash scripts/cf.sh d1 migrations apply --env production` は本番 DB を直接変更するため不可逆になりうる。実行前に `bash scripts/cf.sh d1 export --env production` でバックアップ取得を必須手順とする。

**3. Workers の初回デプロイ後のバインディング確認**
`wrangler.toml` に定義したバインディングが本番で正しく解決されているかを Workers のログで確認する必要がある。特に `[[d1_databases]]` の `database_id` は dev / staging / production で異なる。

**4. Pages のビルドキャッシュとデプロイ順序**
`apps/web` のビルドアーティファクトが `apps/api` の型定義に依存している場合、api → web の順でビルドする必要がある。`@opennextjs/cloudflare` adapter の出力先（`.open-next/worker.js` / `.open-next/assets`）と `apps/web/wrangler.toml` を一致させる。

**5. 本番 URL の確定とドメイン設定**
Pages はデフォルトで `*.pages.dev` ドメインが割り当てられる。カスタムドメインを使う場合は DNS 伝播時間を考慮し、smoke test のタイミングを調整する。

**6. ロールバック手順の事前確認**
失敗時にすぐロールバックできるよう、`wrangler rollback`（Pages）や前バージョンへの `bash scripts/cf.sh deploy` 手順を Phase 4 で確認する。D1 はバックアップ SQL からの手動リストアになるため手順を runbook 化する。

**7. Wave 1 の最後に位置する**
本タスクは 02-serial / 03-serial / 04-serial / 05b-parallel が全て完了してから着手する。先行タスクの遅延をクリティカルパスとして監視する必要がある。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-infra.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/8 (CLOSED)
- unassigned 出典: ../../unassigned-task/UT-06-production-deploy-execution.md
