# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-23 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | pending |

## 目的

Cloudflare 基盤ブートストラップ における Phase 6 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。
具体的には、Cloudflare 固有の異常系シナリオを列挙し、再現手順・期待エラー・対処を明確にすることで、Phase 7 以降の網羅性検証の基盤を作る。

## 実行タスク

- input / output を確定する
- Cloudflare 固有の異常系シナリオを 8 件以上洗い出す
- 各シナリオの再現手順・期待エラー・対処を具体化する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略 |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase（Phase 5）と index.md を読む。
- Phase 1〜3 の確定済み設計（Pages/Workers/D1 名称、ブランチ戦略、APIトークンスコープ）を参照する。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-06/main.md に作成・更新する。
- 異常系シナリオ表（8件以上）を中心に記述する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 6 | pending | Phase 5 成果物と確定済み設計を読む |
| 2 | 成果物更新 | 6 | pending | outputs/phase-06/main.md（異常系シナリオ表 8件以上） |
| 3 | 4条件確認 | 6 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | Phase 6 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている
- 異常系シナリオが 8 件以上記載されている
- 各シナリオに再現手順・期待エラー・対処が具体的に記述されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項: 異常系シナリオ表（A1〜A8）を Phase 7 の AC トレースマトリクスおよび網羅性チェックリストの入力として使用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 異常系シナリオ表（Cloudflare 固有・8件）

| ID | 異常シナリオ | 発生条件 | 検出方法 | 対処 |
| --- | --- | --- | --- | --- |
| A1 | Pages ビルド失敗 | `pnpm --filter @repo/web build` がエラー | GitHub Actions の build step 失敗 | ビルドエラーを修正。旧デプロイは Cloudflare Pages が自動維持（ゼロダウンタイム） |
| A2 | Workers デプロイ権限不足 | API Token に Workers:Edit スコープなし | `wrangler deploy` で 403 エラー | Token を再作成し Pages:Edit + Workers:Edit + D1:Edit の 3 スコープを付与 |
| A3 | D1 database_id 未設定 | wrangler.toml の database_id がプレースホルダーのまま | `wrangler d1 execute` で "D1 database not found" エラー | `wrangler d1 create ubm-hyogo-db-prod` 実行後に出力された database_id を wrangler.toml に記録 |
| A4 | branch drift（dev/develop 混在） | deployment-cloudflare.md に `develop` 表記が残存 | `rg "develop" .claude/skills/aiworkflow-requirements/references/` でヒット | Phase 12 で `dev` に統一し、staging 環境の Git Integration 設定も `dev` ブランチに修正 |
| A5 | secret placement ミス（runtime/deploy 混在） | CLOUDFLARE_API_TOKEN を Cloudflare Secrets に誤配置 | deployment-secrets-management.md の判断フロー（「CI/CD からのみ使う値は GitHub Secrets」）で検出 | GitHub Secrets に移動し、Cloudflare Secrets からは削除 |
| A6 | D1 source-of-truth 競合（Sheets と D1 の責務重複） | Sheets のデータを D1 に直接書き込む設計が混入 | architecture-overview-core.md の責務分離（「Sheets は入力、D1 は正本 DB」）と照合して検出 | Sheets は入力のみ、D1 は正本 DB として責務を再定義し contract を更新 |
| A7 | 無料枠逸脱リスク | Workers 100k req/day を超える負荷設計が混入 | Cloudflare Dashboard Analytics で req/day を監視し、有料機能依存を deployment-cloudflare.md と照合 | 初期スコープで有料機能を使わないよう設計を見直し、scope 外へ戻す |
| A8 | wrangler.toml の環境名不一致 | `[env.staging]` の name が `ubm-hyogo-api-staging` と異なる値になっている | `wrangler deploy --env staging --dry-run` でデプロイ先 Worker 名の不一致を検出 | wrangler.toml の `[env.staging]` セクションの `name` を `ubm-hyogo-api-staging` に修正 |

## 再現手順（シナリオ別）

### A1: Pages ビルド失敗の再現
1. `apps/web/app/page.tsx` に意図的に型エラーを混入する（例: `const x: number = "string"` を追記）。
2. `pnpm --filter @repo/web build` を実行する。
3. GitHub Actions の build step が失敗することを確認する。
4. 旧デプロイが Cloudflare Pages で引き続き配信されていることを Dashboard で確認する。
5. 型エラーを修正して再度ビルドを試みる。

### A2: Workers デプロイ権限不足の再現
1. Cloudflare Dashboard で Workers:Edit スコープを持たない API Token を新規作成する。
2. 環境変数 `CLOUDFLARE_API_TOKEN` に上記 Token を設定する。
3. `wrangler deploy --config apps/api/wrangler.toml` を実行する。
4. 「You do not have permission to access this resource」というエラーが返ることを確認する。
5. Token を削除し、Pages:Edit + Workers:Edit + D1:Edit の 3 スコープで再作成する。

### A3: D1 database_id 未設定の再現
1. `apps/api/wrangler.toml` の `database_id` の値を空文字（`""`）に変更する。
2. `wrangler d1 execute ubm-hyogo-db-prod --command "SELECT 1"` を実行する。
3. 「D1 database not found」エラーが返ることを確認する。
4. `wrangler d1 create ubm-hyogo-db-prod` を実行し、出力された database_id を wrangler.toml に記録する。

### A4: branch drift の再現と検出
1. `rg "develop" doc/` を実行し、`develop` 表記が残存しているファイルを確認する。
2. `rg "dev" .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` を実行し、正本仕様の表記と比較する。
3. 差分があれば `dev` に統一する。

## 期待エラーと対処（詳細）

| ID | 期待エラーメッセージ | 対処手順 |
| --- | --- | --- |
| A1 | `Type 'string' is not assignable to type 'number'` などの TypeScript エラー | ビルドエラーを修正。Pages は旧デプロイを自動維持するためダウンタイムなし |
| A2 | `You do not have permission to access this resource` | Token を削除し、3 スコープ（Pages:Edit + Workers:Edit + D1:Edit）で再作成 |
| A3 | `D1 database not found` または `Cannot find database with name` | `wrangler d1 create` 後に ID を wrangler.toml の `database_id` フィールドに記録 |
| A4 | `rg` で `develop` がヒット | 該当箇所を `dev` に修正し、Cloudflare Pages の Git Integration の Production/Preview ブランチ設定も確認 |
| A5 | Cloudflare Workers のシークレット参照でデプロイが通るが CI が意図しない Token を参照 | GitHub Secrets に `CLOUDFLARE_API_TOKEN` を移動し、Cloudflare Secrets から削除 |
| A6 | D1 にデータが二重登録される、または Sheets と D1 の値が乖離する | architecture-overview-core.md に従い責務を再定義：Sheets = 入力のみ、D1 = 正本 DB |
| A7 | Cloudflare Analytics で Workers req/day が 100k に近づく | 設計を見直し、初期スコープ（無料枠内）に収まるよう機能を絞り込む |
| A8 | `wrangler deploy --dry-run` で想定外の Worker 名が表示される | wrangler.toml の `[env.staging]` の `name` を `ubm-hyogo-api-staging` に修正 |
