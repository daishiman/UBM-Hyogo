# UT-06 Follow-up G: Cloudflare CLI ラッパー (`scripts/cf.sh`) の正式化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-G |
| タスク名 | scripts/cf.sh および CLAUDE.md 運用ルールの正式タスク化 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1〜2 |
| 作成日 | 2026-04-27 |
| 種別 | infrastructure / refactor |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-G（提案 ID: UT-22 仮） |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

UT-06 実行中に発生した wrangler 認証ブロッカー（esbuild バージョン不整合 + `.env` 経由トークン注入経路未整備）を解消するため、`scripts/cf.sh` および CLAUDE.md 運用ルールが追加された。これらは UT-06 の AC スコープ外のため、独立タスクとして正式化し、UT-04（CI/CD secrets）の派生として位置付ける。

## スコープ

### 含む

- `scripts/cf.sh` の正式化（テスト・lint・README 整備）
- CLAUDE.md「シークレット管理」セクションの運用ルール（実値禁止 / 禁止事項）の確定
- Claude Code memory の `feedback_cloudflare_cli_wrapper.md` との整合
- 代表ケース（`whoami` / `d1 list` / `deploy` / `rollback`）の smoke
- UT-04 既存資産との整合確認

### 含まない

- wrangler 自体の version up
- 1Password Environments の構造変更（UT-23 別タスク）
- mise の version 変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-04 CI/CD secrets and environment sync | 注入経路の正本 |
| 上流 | UT-23 1Password Environments + mise README | 1Password 参照の前提 |
| 関連 | scripts/with-env.sh | op 経由ラッパーの土台 |

## 苦戦箇所・知見

**1. グローバル `esbuild` と wrangler 同梱 `esbuild` のバージョン不整合**
`~/Library/pnpm/esbuild` が新しすぎる場合、wrangler 同梱 esbuild と衝突して deploy が失敗する。`ESBUILD_BINARY_PATH` で wrangler 同梱版を強制指定するラップが必要。環境依存だが再発見込み。

**2. ローカル `.env` への実値書き込み禁止**
AI 学習混入防止のためユーザー必須要件。`op://` 参照のみを書き、実行時に `op run --env-file=.env` で動的注入する。`scripts/cf.sh` がこの構造を強制する責務を持つ。

**3. `wrangler login` で生成される OAuth トークンの罠**
`~/Library/Preferences/.wrangler/config/default.toml` にローカル OAuth トークンが残ると、API Token 注入経路と二重化し挙動が不安定になる。`.env` の op 参照に一本化する運用が必要。

**4. mise exec での Node 24 / pnpm 10 保証**
ラッパーが `mise exec --` で Node を強制しないと、ホスト Node が古い場合に wrangler が動かない。Phase 12 で実装済みだが正式化時に regression test が必要。

**5. AI エージェント禁止事項の明文化**
`.env` の `cat` / `Read`、API Token 値のドキュメント転記等を Claude Code 含む全 AI エージェント向けに CLAUDE.md で明示。memory にも同等の feedback を保存済み。

## 受入条件

- [ ] `scripts/cf.sh` が `op run --env-file=.env` + `ESBUILD_BINARY_PATH` + `mise exec` を一括ラップ
- [ ] `bash scripts/cf.sh whoami` / `d1 list` / `deploy` / `rollback` の代表ケースが PASS
- [ ] CLAUDE.md にシークレット管理運用ルール（実値禁止 / 禁止事項）が記載
- [ ] UT-04 既存資産（GitHub / Cloudflare Secrets 配置）と整合
- [ ] memory `feedback_cloudflare_cli_wrapper.md` と CLAUDE.md の内容が一致
- [ ] regression test または smoke 手順が docs に記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-G |
| 必須 | scripts/cf.sh | 対象スクリプト |
| 必須 | CLAUDE.md シークレット管理セクション | 運用ルール正本 |
| 必須 | ~/.claude/projects/.../memory/feedback_cloudflare_cli_wrapper.md | AI エージェント用 feedback |
| 参考 | scripts/with-env.sh | op ラッパー |
