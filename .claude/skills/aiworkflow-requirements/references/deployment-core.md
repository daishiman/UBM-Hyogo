# デプロイメント (Deployment) / core specification

> 親仕様書: [deployment.md](deployment.md)
> 役割: core specification

## デプロイメント戦略概要

### UT-06 本番不可逆操作ゲート（2026-04-27）

本番 D1 migration、Workers deploy、rollback rehearsal は不可逆またはユーザー影響を伴う。UT-06 では次の条件を満たすまで、本番デプロイ完了扱いにしない。

| 条件 | 必須確認 |
| --- | --- |
| 承認 | `outputs/phase-04/production-approval.md` に承認者・日時・対象 commit を記録 |
| CLI | `wrangler` 直実行ではなく `bash scripts/cf.sh ...` を使う |
| Backup | D1 migration 前に `bash scripts/cf.sh d1 export ... --env production` を実行し、空 export の場合も理由を記録 |
| Web deploy 形式 | OpenNext Workers 形式と Pages 形式を混同しない。`pages_build_output_dir` が残る場合は実行前ブロッカー |
| API smoke | `/health` と D1 疎通 endpoint の期待 JSON が実装と一致 |
| Rollback | API Workers、Web Workers、D1 restore の戻し方を Phase 6 に記録 |
| Evidence | Phase 5 の実行ログ、Phase 11 の API response、実スクリーンショットを保存 |
| Next.js 16 / Turbopack monorepo root 誤検出 | `apps/web/next.config.ts` で `outputFileTracingRoot` と `turbopack.root` を worktree path に明示する。明示がない場合、Turbopack が monorepo の親方向を root と誤検出してビルドが不安定化する。これは UT-06 の deploy gate ブロッカー扱い |

`apps/web/next.config.ts` で `typescript.ignoreBuildErrors = true` を使う場合、本番 deploy gate では別途 `pnpm --filter @ubm-hyogo/web exec tsc --noEmit` を必須にする。`ignoreBuildErrors` 単独で deploy gate を通すことは禁止し、CI / 手動実行の双方で別 tsc gate と pair で運用する。

### デプロイ対象

| 対象 | プラットフォーム | 更新頻度 | 優先度 |
| ---- | ---------------- | -------- | ------ |
| Web フロントエンド | Cloudflare Workers + `@opennextjs/cloudflare`（ADR-0001 採択。現行 CD は Pages deploy 残） | 機能追加・修正のたび | 高 |
| API バックエンド | Cloudflare Workers | 機能追加・修正のたび | 高 |
| データベース | Cloudflare D1 | スキーマ変更時 | 高 |

### デプロイフロー

1. 開発者がコードをプッシュ
2. GitHub Actions で CI（型チェック・Lint・テスト・ビルド）を実行
3. CI が成功したらまず dev ブランチにマージし、dev の検証が通過したら main ブランチへ昇格する
4. ブランチに応じて Cloudflare Workers へ自動デプロイする。2026-05-01 時点では `.github/workflows/web-cd.yml` の Web CD が Pages deploy のまま残っており、`task-impl-opennext-workers-migration-001` で置換する
5. デプロイ完了後、ヘルスチェックで正常性を確認
6. 問題があれば Cloudflare ダッシュボードから即座にロールバック

### 品質ゲート

| チェック項目 | 基準 | 必須 |
| ------------ | ---- | ---- |
| TypeScript 型チェック | エラーゼロ | Yes |
| ESLint | エラーゼロ | Yes |
| ビルド | 成功 | Yes |
| ユニットテスト | カバレッジ 60% 以上 | Yes |
| E2E テスト | クリティカルパス通過 | No |

---

## Cloudflare デプロイ戦略

### プラットフォーム構成

| サービス | 用途 | 無料枠 |
| -------- | ---- | ------ |
| Cloudflare Workers + OpenNext | フロントエンド（Next.js） | Workers 無料枠に準拠 |
| Cloudflare Workers | API バックエンド | 100,000 リクエスト/日 |
| Cloudflare D1 | SQLite データベース | 5GB・500万読み取り/日 |
| Cloudflare R2 | オブジェクトストレージ | 10GB・エグレス無料 |
| Cloudflare KV | セッション・キャッシュ | 100,000 読み/日 |

### カスタムドメイン設定

#### 設定手順

1. Cloudflare ダッシュボード → Pages → プロジェクト → Custom Domains
2. ドメインを追加（例: `ubm-hyogo.yourdomain.com`）
3. DNS は Cloudflare 管理の場合は自動設定
4. SSL 証明書は自動発行（Cloudflare Universal SSL）
5. DNS プロパゲーションは即時（Cloudflare 管理ドメインの場合）

### 環境分離

#### 環境構成

| 環境 | 用途 | ブランチ | デプロイトリガー |
| ---- | ---- | -------- | ---------------- |
| 開発 | ローカル開発 | - | 手動（wrangler dev） |
| ステージング | 本番前検証 | `dev` | プッシュ時自動 |
| 本番 | ユーザー提供 | `main` | プッシュ時自動 |

#### 各環境で分離すべき項目

- データベースインスタンス（別々の D1 データベース）
- 環境変数・シークレット（wrangler pages secret）
- ログレベル（開発: debug、本番: warn）
- 機能フラグ（KV で管理）

#### Cloudflare Pages プレビュー

- PR ごとに自動でプレビュー環境を作成
- URL 形式: `<hash>.ubm-hyogo-web.pages.dev`
- GitHub PR にデプロイ URL が自動コメント

---

## GitHub Actions CI/CD パイプライン

### ワークフロー構成

| ファイル | 用途 |
| -------- | ---- |
| `ci.yml` | PR 時の CI（型チェック・lint・coverage hard gate） |
| `validate-build.yml` | PR / push 時の build 検証 |
| `verify-indexes.yml` | aiworkflow-requirements indexes drift 検出 |
| `web-cd.yml` | Web アプリ CD（dev: staging / main: production 自動デプロイ。Discord 通知は未実装） |
| `backend-ci.yml` | API CD（D1 migrations apply → Workers deploy。migration 成功後に deploy が失敗した場合は GitHub Actions summary に post-migration deploy failure を記録。Discord 通知は未実装） |

> **current facts (UT-CICD-DRIFT / 2026-04-29)**: `.github/workflows/` の現行実体は上記 5 件。Node.js は `24`、pnpm は `10.33.2` / `pnpm/action-setup@v4` が基準。Discord 通知は正本要件として残るが、現行 workflow には未実装であり UT-08-IMPL（観測性実装）へ委譲する。

### CI ワークフロー要件（PR 時）

#### トリガー条件

- PR が dev または main ブランチに対して作成されたとき
- PR に新しいコミットがプッシュされたとき

#### 実行ステップ

1. リポジトリコードの取得
2. pnpm のセットアップ（バージョン: 10.33.2）
3. Node.js のセットアップ（バージョン: 24）
4. pnpm キャッシュの有効化
5. 依存関係のインストール（frozen-lockfile モード）
6. TypeScript 型チェックの実行
7. ESLint によるコード品質チェック
8. Next.js ビルドの確認
9. Vitest によるユニットテストの実行
10. カバレッジチェック（現行 `coverage-gate` は hard gate。`continue-on-error` 再混入は `scripts/coverage-guard.test.ts` で静的検出）

### CD ワークフロー要件（dev / main マージ時）

#### トリガー条件

- dev ブランチへのプッシュ（PR マージ時）
- main ブランチへのプッシュ（PR マージ時）

#### 実行内容

1. ブランチに応じて Cloudflare Workers へ自動デプロイ（`wrangler deploy --env <env>`）。2026-05-01 時点の `web-cd.yml` は Pages deploy 残で、ADR-0001 の後続 migration task で置換する
2. デプロイ完了後の Discord Webhook 通知は未実装。UT-08-IMPL（観測性実装）で導入する。

---

## ロールバック戦略

### Cloudflare Pages でのロールバック

#### ロールバック手順

**ダッシュボードから**

1. Cloudflare ダッシュボード → Pages → Deployments
2. 前のデプロイメントを選択
3. 「Rollback to this deployment」をクリック

**CLI から**

```bash
wrangler pages deployment rollback <deployment-id> --project-name ubm-hyogo-web
```

#### ロールバック判断基準

| 状況 | 対応 | 理由 |
| ---- | ---- | ---- |
| ビルド失敗 | 自動的に旧バージョン維持 | Cloudflare Pages の自動保護 |
| エラー率 > 5% | ロールバック検討 | 品質低下 |
| パフォーマンス劣化 > 30% | ロールバック検討 | ユーザー体験悪化 |
| マイナー不具合 | 次回修正で対応 | 影響範囲が限定的 |

### データベースマイグレーションのロールバック

#### 破壊的変更の回避原則

- カラム削除は即座に実行しない（非推奨マーク → 数リリース後に削除）
- テーブル削除は複数ステップで段階的に実施
- インデックス追加は本番適用前に影響をテスト

#### ロールバック戦略

| 変更種別 | 推奨アプローチ |
| -------- | -------------- |
| カラム追加 | NULL 許容またはデフォルト値を設定 |
| カラム名変更 | 新カラム追加 → データ移行 → 旧カラム削除 |
| 型変更 | 新カラム作成 → 段階的移行 |
| テーブル削除 | リネーム → 一定期間保持 → 完全削除 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-04-09 | 2.0.0 | 旧デプロイ基盤・Electron 削除、Cloudflare（Pages/Workers/D1/R2/KV）へ移行 |
| 2026-04-27 | 2.1.0 | UT-06 派生: 本番不可逆操作ゲートに「Next.js 16 / Turbopack monorepo root 誤検出ゲート」を追加（`outputFileTracingRoot` / `turbopack.root` 明示が deploy gate ブロッカー）、`ignoreBuildErrors=true` 使用時の別 tsc gate 必須を補強 |
