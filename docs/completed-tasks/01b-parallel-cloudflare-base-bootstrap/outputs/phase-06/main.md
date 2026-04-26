# Phase 6 成果物: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 名称 | 異常系検証 |
| 状態 | completed |
| 作成日 | 2026-04-23 |

## 1. 入力確認

Phase 5 成果物:
- `outputs/phase-05/cloudflare-bootstrap-runbook.md`: Dashboard/CLI 手順完全版
- `outputs/phase-05/token-scope-matrix.md`: API Token スコープ定義表

## 2. 異常系シナリオ表（8件）

| ID | 異常シナリオ | 発生条件 | 検出方法 | 対処 |
| --- | --- | --- | --- | --- |
| A1 | Pages ビルド失敗 | `pnpm --filter @repo/web build` がエラー | GitHub Actions の build step 失敗 | ビルドエラーを修正。旧デプロイは Cloudflare Pages が自動維持（ゼロダウンタイム） |
| A2 | Workers デプロイ権限不足 | API Token に Workers:Edit スコープなし | `wrangler deploy` で 403 エラー | Token を再作成し Pages:Edit + Workers:Edit + D1:Edit の3スコープを付与 |
| A3 | D1 database_id 未設定 | wrangler.toml の database_id がプレースホルダーのまま | `wrangler d1 execute` で "D1 database not found" エラー | `wrangler d1 create ubm-hyogo-db-prod` 後に出力 database_id を記録 |
| A4 | branch drift（dev/develop 混在） | deployment-cloudflare.md に `develop` 表記が残存 | `rg "develop" .claude/skills/aiworkflow-requirements/references/` でヒット | Phase 12 で `dev` に統一し、staging の Git Integration 設定も `dev` に修正 |
| A5 | secret placement ミス（runtime/deploy 混在） | CLOUDFLARE_API_TOKEN を Cloudflare Secrets に誤配置 | deployment-secrets-management.md の判断フロー（CI/CD からのみ使う値は GitHub Secrets）で検出 | GitHub Secrets に移動し、Cloudflare Secrets からは削除 |
| A6 | D1 source-of-truth 競合（Sheets と D1 の責務重複） | Sheets のデータを D1 に直接書き込む設計が混入 | architecture-overview-core.md の責務分離（Sheets は入力、D1 は正本 DB）と照合して検出 | Sheets は入力のみ、D1 は正本 DB として責務を再定義し contract を更新 |
| A7 | 無料枠逸脱リスク | Workers 100k req/day を超える負荷設計が混入 | Cloudflare Dashboard Analytics で req/day を監視し、有料機能依存を deployment-cloudflare.md と照合 | 初期スコープで有料機能を使わないよう設計を見直し、scope 外へ戻す |
| A8 | wrangler.toml の環境名不一致 | `[env.staging]` の name が `ubm-hyogo-api-staging` と異なる値になっている | `wrangler deploy --env staging --dry-run` でデプロイ先 Worker 名の不一致を検出 | wrangler.toml の `[env.staging]` セクションの `name` を `ubm-hyogo-api-staging` に修正 |

## 3. 再現手順（シナリオ別）

### A1: Pages ビルド失敗の再現

1. `apps/web/app/page.tsx` に意図的に型エラーを混入する（例: `const x: number = "string"` を追記）
2. `pnpm --filter @repo/web build` を実行する
3. GitHub Actions の build step が失敗することを確認する
4. 旧デプロイが Cloudflare Pages で引き続き配信されていることを Dashboard で確認する
5. 型エラーを修正して再度ビルドを試みる

### A2: Workers デプロイ権限不足の再現

1. Cloudflare Dashboard で Workers:Edit スコープを持たない API Token を新規作成する
2. 環境変数 `CLOUDFLARE_API_TOKEN` に上記 Token を設定する
3. `wrangler deploy --config apps/api/wrangler.toml` を実行する
4. 「You do not have permission to access this resource」エラーが返ることを確認する
5. Token を削除し、3スコープで再作成する

### A3: D1 database_id 未設定の再現

1. `apps/api/wrangler.toml` の `database_id` の値を空文字（`""`）に変更する
2. `wrangler d1 execute ubm-hyogo-db-prod --command "SELECT 1"` を実行する
3. 「D1 database not found」エラーが返ることを確認する
4. `wrangler d1 create ubm-hyogo-db-prod` を実行し、database_id を wrangler.toml に記録する

### A4: branch drift の再現と検出

1. `rg "develop" doc/` を実行し、`develop` 表記が残存しているファイルを確認する
2. `rg "dev" .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` を実行し、正本仕様の表記と比較する
3. 差分があれば Phase 12 M-01 として記録し `dev` に統一する

## 4. 期待エラーと対処（詳細）

| ID | 期待エラーメッセージ | 対処手順 |
| --- | --- | --- |
| A1 | `Type 'string' is not assignable to type 'number'` 等の TypeScript エラー | ビルドエラーを修正。Pages は旧デプロイを自動維持するためダウンタイムなし |
| A2 | `You do not have permission to access this resource` | Token を削除し、3スコープ（Pages:Edit + Workers:Edit + D1:Edit）で再作成 |
| A3 | `D1 database not found` または `Cannot find database with name` | `wrangler d1 create` 後に ID を wrangler.toml の `database_id` フィールドに記録 |
| A4 | `rg` で `develop` がヒット | 該当箇所を `dev` に修正し、Cloudflare Pages の Git Integration も確認 |
| A5 | Cloudflare Workers のシークレット参照でデプロイが通るが CI が意図しない Token を参照 | GitHub Secrets に `CLOUDFLARE_API_TOKEN` を移動し、Cloudflare Secrets から削除 |
| A6 | D1 にデータが二重登録される、または Sheets と D1 の値が乖離する | architecture-overview-core.md に従い責務を再定義：Sheets = 入力のみ、D1 = 正本 DB |
| A7 | Cloudflare Analytics で Workers req/day が 100k に近づく | 設計を見直し、初期スコープ（無料枠内）に収まるよう機能を絞り込む |
| A8 | `wrangler deploy --dry-run` で想定外の Worker 名が表示される | wrangler.toml の `[env.staging]` の `name` を `ubm-hyogo-api-staging` に修正 |

## 5. 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 8件の異常系シナリオにより Phase 7 の網羅性検証の基盤が整った |
| 実現性 | PASS | 全シナリオが無料枠・既存ツールで検出・対処可能 |
| 整合性 | PASS | シナリオが Phase 1-5 の設計と一致している |
| 運用性 | PASS | 各シナリオに対処手順が明記されており運用者が対応できる |

## 6. downstream handoff

Phase 7 では A1〜A8 を AC トレースマトリクスおよび網羅性チェックリストの入力として使用する。

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
- [x] 異常系シナリオが8件以上記載されている
- [x] 各シナリオに再現手順・期待エラー・対処が記述されている
