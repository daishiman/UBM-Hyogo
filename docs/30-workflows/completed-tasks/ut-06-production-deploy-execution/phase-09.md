# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 8 (設定 DRY 化・runbook 整備) |
| 次 Phase | 10 (最終レビュー（GO/NO-GO）) |
| 状態 | pending |

## 目的

本番デプロイ実行が Cloudflare 無料枠制約を超えないこと、wrangler.toml / runbook / コマンド出力に機密情報が混入しないこと、CLAUDE.md のシークレット管理方針（Cloudflare Secrets / GitHub Secrets / 1Password Environments）が遵守されていることを確認する。
implementation タスクとして本番不可逆操作を伴うため、secret leakage と無料枠超過の双方を Phase 10 GO/NO-GO 判定前にゼロ件にすることが目的。

## 実行タスク

- OpenNext Workers / API Workers / D1 / wrangler CLI の無料枠制約と本タスクの影響を確認する
- wrangler.toml / deploy-runbook.md / コマンド出力に機密情報（database_id 実値・OAuth Secret・Magic Link Secret 等）が混入していないか確認する
- secret hygiene ルール（CLAUDE.md / 04-serial）の遵守を確認する
- GitHub Secrets と Cloudflare Secrets の境界を確認する
- 設定ドキュメントの品質基準適合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-08.md | DRY 化方針・deploy-runbook |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-08/deploy-runbook.md | 統合稿 runbook |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-08/dry-config-policy.md | DRY 化方針 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | スコープ確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 無料枠制約・wrangler 設定方針 |
| 必須 | docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | Secrets / 環境変数の管理方針 |
| 参考 | CLAUDE.md | シークレット管理方針 |
| 参考 | docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証（OAuth / Magic Link）の Secret 構成 |

## 実行手順

### ステップ 1: 無料枠制約確認

- Cloudflare Pages（500 builds/month）の本タスク影響（初回 1 build + 必要時の再 deploy）を確認する
- Cloudflare Workers（100k req/day Free）の本タスク影響（smoke test の少数回呼び出し）を確認する
- Cloudflare D1（5GB storage / 5M reads day Free）の本タスク影響（マイグレーション適用 + 1 件 SELECT）を確認する
- wrangler CLI 利用は無料であることを確認する

### ステップ 2: Secret hygiene 確認

- wrangler.toml 内に database_id 実値が含まれていないか確認する（プレースホルダーまたは Cloudflare Dashboard 管理）
- Google OAuth Client ID / Secret が Cloudflare Secrets に配置されていることを確認する
- Magic Link 用の Secret が Cloudflare Secrets に配置されていることを確認する
- GitHub Secrets と Cloudflare Secrets の境界（CI/CD では GitHub、ランタイムでは Cloudflare）が遵守されているか確認する
- `.env` ファイルがコミットされていないか確認する
- CI ログ / wrangler 出力に Secret 値が leak していないか確認する

### ステップ 3: 設定安全性チェック

- wrangler.toml レビュー
- deploy-runbook.md レビュー
- Phase 5 で記録される deploy-execution-log.md のテンプレに Secret マスキングルールが含まれているか確認する

### ステップ 4: ドキュメント品質確認

- 各 Phase の成果物ドキュメントの参照リンク切れ確認
- AC matrix / coverage-report と runbook の整合確認
- Phase 10 の GO/NO-GO 判定に必要な情報が揃っているか確認

## 無料枠確認【必須】

| 制約項目 | 無料枠上限 | 本タスクの影響 | 判定 |
| --- | --- | --- | --- |
| Cloudflare Pages builds | 500 builds / month | 初回デプロイ 1 build + 必要時の再デプロイ（数回想定） | PASS |
| Cloudflare Pages リクエスト | 無制限（Free） | smoke test 数回・本番アクセス少数 | PASS |
| Cloudflare Workers リクエスト | 100k req / day（Free） | smoke test の `/health` / `/health/db` 数回呼び出し | PASS |
| Cloudflare Workers CPU 時間 | 10ms CPU / req（Free） | `/health` 系の軽量レスポンス想定 | PASS |
| Cloudflare D1 ストレージ | 5 GB / DB | 初期スキーマのみ・データ未投入 | PASS |
| Cloudflare D1 reads | 5M rows reads / day（Free） | マイグレーション適用 + 1 件 SELECT | PASS |
| Cloudflare D1 writes | 100k rows writes / day（Free） | マイグレーション DDL のみ | PASS |
| wrangler CLI | 無料 | 全コマンド無料 | PASS |
| GitHub Actions（UT-05 完了後）| 2000 分 / 月（Free） | 本タスク手動実行時は未使用 | PASS |

## Secret hygiene 確認【必須】

| 確認項目 | 方針 | 状態 |
| --- | --- | --- |
| database_id 実値の管理 | wrangler.toml にはプレースホルダーのみ。実値は Cloudflare Dashboard で管理し、参照は 1Password Environments に保存 | pending |
| Google OAuth Client ID | Cloudflare Secrets（`wrangler secret put GOOGLE_CLIENT_ID --env production`）に配置 | pending |
| Google OAuth Client Secret | Cloudflare Secrets（`wrangler secret put GOOGLE_CLIENT_SECRET --env production`）に配置・コミット禁止 | pending |
| Magic Link 用 Secret（メール送信 API キー / 署名鍵 等） | Cloudflare Secrets（`wrangler secret put` で配置）・実値は 1Password で正本管理 | pending |
| Auth.js 暗号化鍵（`AUTH_SECRET`） | Cloudflare Secrets に配置・実値はコミット禁止 | pending |
| GitHub Secrets と Cloudflare Secrets の境界 | CI/CD（GitHub Actions）用は GitHub Secrets、Workers ランタイム用は Cloudflare Secrets。重複は最小化し、両方必要な場合は同期手順を 04-serial で管理 | pending |
| `.env` のリポジトリコミット禁止 | `.gitignore` で `.env` / `.dev.vars` を除外。正本は 1Password Environments | pending |
| CI ログへの Secret leak 防止 | GitHub Actions の `secrets` 経由参照のみ・`echo $SECRET` 禁止・wrangler 出力のマスキング確認 | pending |
| wrangler 出力での leak 防止 | `wrangler secret list` は名前のみ表示で値は出ないことを確認 / `wrangler tail` で leak が起きないログ設計 | pending |
| deploy-execution-log.md のマスキング | コマンド出力をログ化する際、Secret 値を含む可能性のある行はマスキングして記録 | pending |

## 設定安全性チェック【必須】

| チェック対象 | チェック項目 | 期待値 | 確認方法 |
| --- | --- | --- | --- |
| `apps/api/wrangler.toml` | database_id にプレースホルダーまたは Cloudflare Dashboard 管理値が記載 | 実値の直書きなし | wrangler.toml レビュー |
| `apps/api/wrangler.toml` | OAuth / Magic Link Secret が Vars / `[env.*.vars]` に直書きされていない | 直書きなし（Secrets で管理） | wrangler.toml レビュー |
| `apps/web` Pages 設定 | API キー等の機密情報が build env に直書きされていない | 直書きなし | Pages 設定レビュー |
| `outputs/phase-08/deploy-runbook.md` | コマンド例で実値ではなくプレースホルダーを使用 | `<DB_NAME>` / `<DATABASE_ID>` 等 | runbook レビュー |
| `outputs/phase-05/deploy-execution-log.md`（テンプレ） | Secret 値を含む出力のマスキング指針が記載 | マスキングルール記載 | テンプレ レビュー |
| Pull Request 差分 | `.env` / `*.secret` / OAuth credential 等が含まれない | 含まれない | gh pr diff 確認 |
| GitHub Actions ログ（UT-05 完了後） | Secret 値が plain text で出力されない | マスク済み | Actions ログ確認 |
| `wrangler tail --env production` 出力 | Secret 値がログに出ない | 出ない | tail 出力レビュー |

## ドキュメント品質確認

| 確認項目 | 期待値 | 状態 |
| --- | --- | --- |
| 参照リンク切れ | 全ドキュメントでリンク切れゼロ | pending |
| AC matrix（Phase 7）と runbook（Phase 8）の整合 | AC-1〜AC-8 が runbook 各章にマッピングされている | pending |
| dependency edge coverage の最新性 | 02/03/04-serial / 05b-parallel / UT-04 / UT-05 / UT-09 / UT-08 全件記載 | pending |
| Phase 10 入力資料の完備 | quality-report / ac-matrix / deploy-runbook が揃っている | pending |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の secret hygiene 遵守確認（実行時のマスキング適用） |
| Phase 8 | DRY 化方針が secret hygiene と整合しているか再確認 |
| Phase 10 | 品質保証の結果を GO/NO-GO 判定に反映 |
| Phase 11 | smoke test 実行時の Secret leak 防止ガイドを引き継ぐ |
| Phase 12 | ドキュメント品質確認結果を close-out / spec 更新に記録 |

## 多角的チェック観点（AIが判断）

- 価値性: 品質保証により本番 secret leak / 無料枠超過の事故リスクがゼロに近づくか
- 実現性: 本タスクが Cloudflare 無料枠内で完結し、追加コストが発生しないか
- 整合性: secret hygiene ルールが CLAUDE.md / 04-serial / 13-mvp-auth.md と一致しているか
- 運用性: 本番運用で secret leakage が起きない構造（Secrets / 1Password / GitHub Secrets の境界）になっているか・チェックリストで再現的に検証可能か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠制約確認 | 9 | pending | OpenNext Workers / API Workers / D1 / wrangler CLI |
| 2 | secret hygiene 確認 | 9 | pending | database_id / OAuth / Magic Link / .env / CI ログ |
| 3 | 設定安全性チェック | 9 | pending | wrangler.toml / runbook / コマンド出力 |
| 4 | GitHub Secrets / Cloudflare Secrets 境界確認 | 9 | pending | CI/CD と Workers ランタイムの分離 |
| 5 | ドキュメント品質確認 | 9 | pending | 参照リンク・AC 整合 |
| 6 | 品質保証レポート作成 | 9 | pending | outputs/phase-09/quality-report.md |
| 7 | secret hygiene チェックリスト作成 | 9 | pending | outputs/phase-09/secret-hygiene-checklist.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-report.md | 無料枠確認結果 / 設定安全性チェック / ドキュメント品質確認 |
| ドキュメント | outputs/phase-09/secret-hygiene-checklist.md | secret hygiene 確認テーブルの詳細チェックリスト（database_id / OAuth / Magic Link / GH-CF Secrets 境界 / .env / CI ログ） |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 無料枠確認の全項目が PASS である
- secret hygiene 確認テーブルの全項目が完了し、未解決の leak リスクがゼロである
- 設定安全性チェックの全項目で機密混入なしが確認されている
- GitHub Secrets と Cloudflare Secrets の境界が明文化されている
- ドキュメント品質確認が完了し、Phase 10 GO/NO-GO 判定に必要な情報が揃っている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（無料枠超過リスク・secret leak リスク・参照リンク切れ）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 10 (最終レビュー（GO/NO-GO）)
- 引き継ぎ事項: 無料枠 PASS / secret hygiene チェックリスト / 設定安全性チェック結果を Phase 10 に引き継ぎ、最終 GO/NO-GO 判定の根拠とする
- ブロック条件: 無料枠確認・secret hygiene 確認・設定安全性チェックのいずれかに未解決の問題がある場合は Phase 10 に進まない
