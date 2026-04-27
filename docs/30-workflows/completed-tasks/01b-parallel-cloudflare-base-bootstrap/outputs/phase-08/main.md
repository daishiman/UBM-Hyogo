# Phase 8 成果物: 設定 DRY 化チェック結果レポート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 名称 | 設定 DRY 化 |
| 状態 | completed |
| 作成日 | 2026-04-23 |

## 1. 入力確認

Phase 5-7 成果物:
- `outputs/phase-05/cloudflare-bootstrap-runbook.md`: 設定値の source-of-truth
- `outputs/phase-06/main.md`: 異常系シナリオ（A4 branch drift が関連）
- `outputs/phase-07/main.md`: AC トレースマトリクス

## 2. DRY 化チェック結果

| チェック項目 | 確認方法 | 期待状態 | 判定 |
| --- | --- | --- | --- |
| Pages 名の一貫性 | `rg "ubm-hyogo-web" apps/web/wrangler.toml doc/` | 全て `ubm-hyogo-web` / `ubm-hyogo-web-staging` | OK（全 outputs で統一済み） |
| Workers 名の一貫性 | `rg "ubm-hyogo-api" apps/api/wrangler.toml doc/` | 全て `ubm-hyogo-api` / `ubm-hyogo-api-staging` | OK（全 outputs で統一済み） |
| D1 名の一貫性 | `rg "ubm-hyogo-db" apps/api/wrangler.toml doc/` | 全て `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging` | OK（全 outputs で統一済み） |
| branch 名の一貫性 | `rg "develop" .claude/.../deployment-cloudflare.md` | `develop` 表記ゼロ、`dev` のみ | NG → Phase 12 M-01 で対応予定 |
| artifacts.json の task_path | `cat doc/01b-.../artifacts.json` | `doc/01b-parallel-cloudflare-base-bootstrap` | OK |
| secret 変数名の一貫性 | `rg "CLOUDFLARE_API_TOKEN" doc/` | 全て同一の変数名 | OK |

## 3. 変更管理テーブル（Before / After）

| 対象 | Before | After | 理由 | 状態 |
| --- | --- | --- | --- | --- |
| deployment-cloudflare.md | `develop` ブランチ表記 | `dev` ブランチ表記 | branch-strategy.md と統一 | Phase 12 M-01 で対応 |
| artifacts.json task_path | `doc/01-infrastructure-setup/01b-...` | `doc/01b-parallel-cloudflare-base-bootstrap` | ディレクトリ移動を反映 | 修正済み |
| outputs 全ファイル | `develop` 混在 | `dev` に統一 | branch strategy 優先 | 修正済み（outputs は `dev` のみ） |
| runtime 記法 | OpenNext 一体 | Pages / Workers 分離 | architecture と整合 | 修正済み |
| data ownership | Sheets / D1 混線 | Sheets input / D1 canonical | source-of-truth 一意化 | 修正済み |

## 4. 共通化パターン確認

| パターン | 確認内容 | 状態 |
| --- | --- | --- |
| branch/env 表現 | 全 outputs で `dev`→staging、`main`→production | OK |
| outputs 配置ルール | `outputs/phase-XX/main.md` | OK（全 Phase で統一） |
| 4条件表記 | 「価値性 / 実現性 / 整合性 / 運用性」 | OK |
| secret 変数名 | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | OK |

## 5. 削除対象確認

| 項目 | 状態 |
| --- | --- |
| legacy assumption の持ち込み（`develop` ブランチ前提） | outputs からは削除済み。deployment-cloudflare.md は Phase 12 M-01 で対応 |
| scope 外サービスの先行導入（有料 Cloudflare サービスへの言及） | outputs に含まれていないことを確認済み |
| 実値前提の secret 記述（実際のトークン値のインライン記述） | 全 outputs でプレースホルダーのみ使用していることを確認済み |

## 6. 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 命名ドリフト解消により、onboarding コストを削減できる |
| 実現性 | PASS | DRY 化チェックが rg/grep 等の既存ツールで実行可能 |
| 整合性 | PASS | 全 outputs で命名・ブランチ・secret 表現が統一されている（deployment-cloudflare.md のみ Phase 12 待ち） |
| 運用性 | PASS | Before/After テーブルにより変更の追跡が可能 |

## 7. downstream handoff

Phase 9 では本 Phase の DRY 化チェック結果を品質保証の入力として使用する。
未解消ドリフト: `deployment-cloudflare.md` の `develop` 表記 → Phase 12 M-01 で対応予定。

## 完了条件チェック

- [x] DRY 化チェックリストの全項目が「OK / 修正済み / Phase 12 行き」になっている
- [x] 変更管理テーブル（Before/After）が記録されている
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
