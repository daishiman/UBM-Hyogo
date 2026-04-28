# UT-06 Follow-up C: D1 database_id の wrangler.toml 直書き解消

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-C |
| タスク名 | D1 database_id の CI 注入式化 |
| 優先度 | LOW |
| 推奨Wave | Wave 2+ |
| 作成日 | 2026-04-27 |
| 種別 | refactor |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-C |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

`apps/api/wrangler.toml` の `d1_databases.database_id` を直書きから CI/CD 注入式（環境変数 + 生成スクリプト）に変更し、管理粒度と環境分離を改善する。

## スコープ

### 含む

- `database_id` を `${D1_DATABASE_ID_PROD}` / `${D1_DATABASE_ID_STAGING}` 等の env 経由に変更
- 注入用スクリプト（`scripts/cf.sh` または `scripts/render-wrangler.sh`）整備
- GitHub Actions / Cloudflare Secrets / 1Password で値を分離管理
- staging / production 双方で deploy 動作確認

### 含まない

- D1 database の作り直し
- 機密情報としての扱い変更（database_id は機密度低）
- マルチアカウント対応

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06-FU-B（env.production セクション整理） | 同 wrangler.toml を編集するため順序を意識 |
| 上流 | UT-04 / UT-27 GitHub Secrets 配置 | 注入経路の前提 |
| 関連 | scripts/cf.sh ラッパー（UT-06-FU-G） | wrangler 呼び出し統一の文脈 |

## 苦戦箇所・知見

**1. wrangler の env 補完仕様**
`wrangler` は TOML 内の `${VAR}` を直接展開しない。pre-process（envsubst や custom script）か、`wrangler` の `--var` / 別形式で渡す必要がある。実装方式を意思決定してから着手する。

**2. database_id は機密ではないが粒度向上目的**
本タスクは security ではなく管理粒度改善が動機。優先度 LOW のため、UT-06-FU-A/B 完了後に着手で十分。

**3. local dev と CI/CD で分岐させる際の落とし穴**
`wrangler dev` ローカル実行時は staging 値が使われるよう defaultが必要。env なしで起動できなくなると DX が悪化する。

## 受入条件

- [ ] `wrangler.toml` に database_id 直書きが残っていない
- [ ] CI/CD で `${D1_DATABASE_ID_PROD}` 等が正しく注入される
- [ ] staging / production 双方で `bash scripts/cf.sh deploy` が PASS
- [ ] local `wrangler dev` も適切な default で起動できる
- [ ] CLAUDE.md または README に注入方式が記載されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-C |
| 必須 | apps/api/wrangler.toml | 編集対象 |
| 参考 | scripts/cf.sh / scripts/with-env.sh | 既存ラッパー |
| 参考 | CLAUDE.md シークレット管理セクション | 値注入方針 |
