# UT-06 Follow-up B: apps/api の `[env.production]` セクション明示化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-B |
| タスク名 | apps/api/wrangler.toml の env.production セクション一本化 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1〜2 |
| 作成日 | 2026-04-27 |
| 種別 | refactor |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-B |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

`apps/api/wrangler.toml` でトップレベル設定と `[env.production]` セクションに同じ値が重複しており、どちらが正本か不明確。`[env.production]` を正として一元化し、Phase 8 / Phase 12 docs との drift を解消する。

## スコープ

### 含む

- 同値の重複（`name`, `compatibility_date`, `vars`, `d1_databases` 等）を `[env.production]` に集約
- 環境別差分のみトップレベル / `[env.staging]` / `[env.production]` に分離
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` の挙動が現状と完全一致することを検証
- Phase 8 deploy-runbook と env-binding-matrix の更新

### 含まない

- apps/web 側の wrangler 整理（UT-06-FU-A）
- D1 binding 内容そのものの変更
- secrets の値変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06 本番デプロイ完了 or 並走 | 既存挙動との等価性検証が前提 |
| 関連 | UT-06-FU-D（vars DRY 化） | 同じ wrangler.toml を編集するため同時実施が望ましい |

## 苦戦箇所・知見

**1. `wrangler` の env マージ仕様の罠**
`[env.<env>]` セクションがあると、トップレベルの一部キーが継承されず、明示しないと欠落する（`vars` などは特に）。等価性を担保するには `wrangler deploy --env production --dry-run` で生成 manifest を before/after で diff する必要がある。

**2. drift 検出は Phase 12 で確認済み**
Phase 12 phase12-task-spec-compliance-check.md で wrangler.toml の旧記述 drift が検出された経緯があるため、再発防止として CI で `wrangler` 設定の lint / dry-run gate を入れることも検討する。

**3. staging との対称性**
staging 側に `[env.staging]` がない or トップレベル参照になっている場合、production だけ env セクション化すると非対称となる。両環境を同形式に揃える。

## 受入条件

- [ ] `[env.production]` セクションで全 production 設定が明示されている
- [ ] `wrangler deploy --env production --dry-run` の manifest が before/after で意味的に等価
- [ ] `[env.staging]` も同形式に揃えられている（または残す方針が docs に明記）
- [ ] env-binding-matrix.md / deploy-runbook.md が更新済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-B |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/env-binding-matrix.md | 現状の binding 表 |
| 必須 | apps/api/wrangler.toml | 編集対象 |
| 参考 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-08/deploy-runbook.md | runbook 更新 |
