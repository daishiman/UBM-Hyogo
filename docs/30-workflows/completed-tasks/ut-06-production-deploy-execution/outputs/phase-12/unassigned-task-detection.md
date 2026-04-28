# Phase 12: 未割当タスク検出

本タスク (UT-06) を進める過程で発見された、本タスク範囲外の改修・追加作業候補。別タスクとして起票推奨。

## 1. 検出タスク一覧

### UNASSIGNED-A: apps/web の OpenNext Workers 形式整合

| 項目 | 内容 |
| --- | --- |
| 概要 | `apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` (Pages 形式) を OpenNext Workers (`.open-next/`) 形式へ移行 |
| 重要度 | HIGH |
| 根拠 | CLAUDE.md と正本仕様は「Cloudflare Workers + Next.js via `@opennextjs/cloudflare`」を定義。現状 wrangler.toml は Pages 形式で乖離しており、UT-06 AC-1 の本番実行前ブロッカー |
| 影響範囲 | apps/web のビルド・デプロイ全体 |
| 推奨タスクタイプ | implementation |
| 想定 AC | (1) `pnpm --filter @ubm-hyogo/web build:cloudflare` が `.open-next/` を生成 (2) `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` で Workers として配信 (3) smoke 全件 PASS (4) staging 検証完了 |

### UNASSIGNED-B: apps/api の `[env.production]` セクション明示化

| 項目 | 内容 |
| --- | --- |
| 概要 | apps/api/wrangler.toml のトップレベル設定と `[env.production]` セクションの重複を整理し、どちらを正とするか明確化 |
| 重要度 | MEDIUM |
| 根拠 | 本ワークツリーで `[env.production]` は追加済みだが、トップレベルにも同値が残り、Phase 8/12 docs の旧記述と drift している |
| 影響範囲 | apps/api のデプロイ設定 |
| 推奨タスクタイプ | refactor |
| 想定 AC | (1) `[env.production]` セクションで全 production 設定が明示される (2) `wrangler deploy --env production` の挙動が現状と完全一致 (3) staging 検証 |

### UNASSIGNED-C: D1 database_id の wrangler.toml 直書き解消

| 項目 | 内容 |
| --- | --- |
| 概要 | `database_id` を CI/CD 注入式 (環境変数 + 生成スクリプト) に変更 |
| 重要度 | LOW |
| 根拠 | 機密度は低いが管理粒度向上のため |
| 影響範囲 | apps/api のデプロイパイプライン |
| 推奨タスクタイプ | refactor |
| 想定 AC | (1) wrangler.toml に database_id 直書きなし (2) CI/CD で正しい値が注入される (3) staging / production 双方で動作 |

### UNASSIGNED-D: `[vars] SHEET_ID` / `FORM_ID` の DRY 化

| 項目 | 内容 |
| --- | --- |
| 概要 | apps/api/wrangler.toml で production と staging に同値定義されている `SHEET_ID` / `FORM_ID` を共通化 |
| 重要度 | LOW |
| 根拠 | 重複定義の保守コスト削減 |
| 影響範囲 | apps/api の設定管理 |
| 推奨タスクタイプ | refactor |
| 想定 AC | (1) 同値の `[vars]` がトップレベルに集約 (2) 環境別オーバーライドが必要な値のみ `[env.<env>.vars]` に残る |

### UNASSIGNED-E: D1 バックアップの長期保管・自動化

| 項目 | 内容 |
| --- | --- |
| 概要 | 本番 D1 バックアップを R2 / 1Password Environments / 外部ストレージに長期保管。CI/CD で日次自動取得 |
| 重要度 | MEDIUM |
| 根拠 | 本タスク Phase 5 では outputs/phase-05/ 配下を一次保管としたが、長期保管・冗長化が未確立 |
| 影響範囲 | バックアップ運用 |
| 推奨タスクタイプ | implementation |
| 想定タスク | UT-08 (継続モニタリング) または別 UT |

### UNASSIGNED-G: Cloudflare CLI ラッパー (`scripts/cf.sh`) の正式化

| 項目 | 内容 |
| --- | --- |
| 概要 | UT-06 実行中に wrangler 認証ブロッカー (esbuild バージョン不整合 + `.env` 経由のトークン注入経路未整備) を解消するため、`scripts/cf.sh` および CLAUDE.md の運用ルールを追加した。これらは UT-06 の AC スコープ外のため、別タスクとして正式化する |
| 重要度 | MEDIUM |
| 根拠 | (1) ローカル `.env` に実値を書かず 1Password 動的注入を強制する運用は AI 学習混入防止のためユーザー必須要件。(2) グローバル `esbuild` (`~/Library/pnpm/esbuild`) と wrangler 同梱 `esbuild` のバージョン不整合は環境依存だが再発が見込まれる。(3) これらの整備は UT-04 (CI/CD secrets) の派生または独立タスク扱いが適切 |
| 影響範囲 | `scripts/cf.sh` (新規) / `CLAUDE.md` (シークレット管理セクション追記) / Claude Code memory (`feedback_cloudflare_cli_wrapper.md`) |
| 推奨タスクタイプ | infrastructure / refactor |
| 想定 AC | (1) `scripts/cf.sh` が `op run --env-file=.env` + `ESBUILD_BINARY_PATH` + `mise exec` を一括ラップすること (2) `bash scripts/cf.sh whoami` / `d1 list` / `deploy` / `rollback` の代表ケースが PASS (3) CLAUDE.md に運用ルール (実値禁止 / 禁止事項) が記載されること (4) UT-04 既存資産との整合確認 |
| 提案タスク ID | UT-22 (仮) |
| 関連参照 | `scripts/cf.sh`, `CLAUDE.md` (シークレット管理セクション), `~/.claude/projects/.../memory/feedback_cloudflare_cli_wrapper.md` |

### UNASSIGNED-F: smoke test スクリプト化

| 項目 | 内容 |
| --- | --- |
| 概要 | Phase 11 smoke (S-01〜S-10) を CLI スクリプト化し、CI/CD またはオンデマンドで一括実行 |
| 重要度 | LOW |
| 根拠 | 本タスクでは手動実行を前提にテンプレ化したが、自動化で再現性向上 |
| 影響範囲 | scripts/ |
| 推奨タスクタイプ | implementation |

### UNASSIGNED-H: apps/api `/health/db` D1 疎通 endpoint 実装

| 項目 | 内容 |
| --- | --- |
| 概要 | UT-06 AC-4 の API 経由 D1 SELECT smoke のため、`GET /health/db` を実装する |
| 重要度 | HIGH |
| 根拠 | Phase 11 は `/health/db` を smoke 対象にしているが、現行 `apps/api/src/index.ts` には endpoint と `DB` binding 型がない |
| 影響範囲 | `apps/api/src/index.ts`, API contract docs, smoke test |
| 推奨タスクタイプ | implementation |
| 想定 AC | (1) `Env.DB: D1Database` を型定義 (2) `GET /health/db` が `SELECT 1` を実行 (3) 成功時 200、失敗時 503 (4) Phase 11 S-03/S-07 が PASS |

### UNASSIGNED-I: API `/health` 期待レスポンス同期

| 項目 | 内容 |
| --- | --- |
| 概要 | docs の `{"status":"healthy"}` 期待と、実装の `{ ok: true, foundation, integrationRuntimeTarget }` を同期する |
| 重要度 | MEDIUM |
| 根拠 | UT-06 smoke docs は healthy status を期待するが、現行 API は `ok: true` を返す |
| 影響範囲 | `apps/api/src/index.ts`, Phase 11 smoke docs, API contract |
| 推奨タスクタイプ | refactor / docs |
| 想定 AC | (1) docs または実装のどちらかに統一 (2) smoke-test-result.md の期待値が実装と一致 (3) API contract test を追加 |

### UNASSIGNED-J: API CORS preflight policy 実装・仕様化

| 項目 | 内容 |
| --- | --- |
| 概要 | Web-to-API smoke で OPTIONS preflight を確認できるよう、CORS policy を実装・仕様化する |
| 重要度 | MEDIUM |
| 根拠 | Phase 11 は CORS preflight を検証対象にしているが、Hono 側に CORS middleware / OPTIONS handler が見当たらない |
| 影響範囲 | `apps/api`, security specs, smoke test |
| 推奨タスクタイプ | implementation |
| 想定 AC | (1) 許可 origin を環境別に定義 (2) OPTIONS が適切な CORS header を返す (3) 不許可 origin を拒否 (4) Phase 11 S-06 が PASS |

### UNASSIGNED-K: `@ubm-hyogo/*` package scope 正本同期

| 項目 | 内容 |
| --- | --- |
| 概要 | 一部正本仕様に残る `@repo/shared` などの旧 package scope を現行 `@ubm-hyogo/*` へ同期する |
| 重要度 | LOW |
| 根拠 | UT-06 build / smoke docs は `@ubm-hyogo/api`, `@ubm-hyogo/web`, `@ubm-hyogo/shared` を前提に修正済み |
| 影響範囲 | architecture-monorepo などの正本仕様 |
| 推奨タスクタイプ | docs |

## 2. 起票推奨先

- 本書の各 UNASSIGNED-X を `docs/30-workflows/` 配下の新規タスクディレクトリ (例: `ut-XX-opennext-migration/`) として、後続 Wave で起票
- UT-06 完了後の Wave 1 残タスク or Wave 2 タスクのいずれかへ振り分け

## 3. 本タスク完了後の即時アクション

- 本書を運用責任者・レビュアーに共有
- 重要度 HIGH (UNASSIGNED-A / H) は UT-06 実デプロイ前に解消または AC 再定義が必要
- 重要度 MEDIUM (UNASSIGNED-B / E / G / I / J) は次回 sprint plan に組み込み検討
