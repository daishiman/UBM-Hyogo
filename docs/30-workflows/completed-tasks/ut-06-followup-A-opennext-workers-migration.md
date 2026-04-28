# UT-06 Follow-up A: apps/web の OpenNext Workers 形式整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-A |
| タスク名 | apps/web wrangler.toml の OpenNext Workers 形式移行 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1（UT-06 本番デプロイ前ブロッカー） |
| 作成日 | 2026-04-27 |
| 種別 | implementation |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 unassigned-task-detection.md UNASSIGNED-A / 実行前ブロッカー B-1 |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

`apps/web/wrangler.toml` が現状 Pages 形式（`pages_build_output_dir = ".next"`）であり、CLAUDE.md と正本仕様（`Cloudflare Workers + Next.js via @opennextjs/cloudflare`）と乖離している。これを OpenNext Workers 形式（`.open-next/` 出力 + `main` + `compatibility_flags`）に整合させ、UT-06 AC-1 の本番実行ブロッカーを解消する。

## スコープ

### 含む

- `apps/web/wrangler.toml` を OpenNext Workers 形式へ移行
- `pages_build_output_dir` を撤去し、`main = ".open-next/worker.js"` 等の Workers 用 entry 指定へ変更
- `compatibility_date` / `compatibility_flags` を `nodejs_compat` 等を含めて再点検
- `pnpm --filter @ubm-hyogo/web build:cloudflare` で `.open-next/` が生成されること
- staging 検証および smoke test の通し

### 含まない

- apps/api 側の wrangler 設定変更（UT-06-FU-B 参照）
- 本番ドメイン切替・DNS 変更
- Next.js のアプリ実装変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `@opennextjs/cloudflare` 採用済の build pipeline | 形式移行の前提 |
| 下流 | UT-06 本番デプロイ Phase 5 / Phase 11 smoke | Pages 形式のままでは AC-1 通過不能 |
| 関連 | UT-28（Cloudflare Pages projects 作成）の取扱い再評価 | Pages リソースを廃止/別用途化するか判定 |

## 苦戦箇所・知見

**1. Pages 形式と OpenNext Workers 形式の判別が静的ファイル単独では困難**
`pages_build_output_dir` キーの有無で判定できるが、レガシー設定が残っていると build 時に Pages として解釈されるリスクがある。Phase 12 skill-feedback F-3 で `deployment-cloudflare.md` に判定フロー追記済みのため、本タスクでも判定基準を仕様書冒頭に明記すること。

**2. `wrangler deploy` が `.open-next/` 生成物を見つけられないケース**
`build:cloudflare` の実行漏れ・`.gitignore` 設定不備で生成物がない状態で deploy するとエラー。本タスクでは pre-deploy step に build を必ず含めるよう Phase 8 deploy-runbook も更新する。

**3. compatibility_flags の `nodejs_compat` 漏れ**
OpenNext Workers は Node 互換が必須。Pages 設定ではデフォルト挙動だったが、Workers 形式では明示が必要。漏れると runtime で `Buffer is not defined` 等が発生する。

**4. 既存 Pages プロジェクト（UT-28 で作成予定）との並走方針**
Pages リソースを残すか・廃止するか・staging 専用にするかを意思決定する必要がある。漏れると料金・運用面で意図せぬ重複コストが発生する。

## 受入条件

- [ ] `apps/web/wrangler.toml` から `pages_build_output_dir` が撤去されている
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が成功し `.open-next/` を生成
- [ ] `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` が PASS
- [ ] staging 環境で UT-06 Phase 11 smoke S-01〜S-10 が PASS
- [ ] `compatibility_flags` に `nodejs_compat` 等の必要 flag が明示されている
- [ ] Phase 12 skill `deployment-cloudflare.md` 判定フローに準拠したドキュメント更新

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | 検出記録 UNASSIGNED-A |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/implementation-guide.md | 実行前ブロッカー B-1 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Pages vs OpenNext 判定フロー |
| 参考 | apps/web/wrangler.toml | 現行設定 |
| 参考 | CLAUDE.md | スタック定義（Workers + Next.js via @opennextjs/cloudflare） |
