# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cloudflare-base-bootstrap |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-23 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

Phase 5 セットアップで作成した設定値（サービス名・DB名・ブランチ名）がドキュメント・wrangler.toml・artifacts.json で一貫しているかを確認し、重複・命名ドリフトを修正する。

> **注意**: docs_only: true のタスクであるため、wrangler.toml への実値記入は Phase 5 で行う。Phase 8 はドキュメントの DRY 化が主眼であり、コードの実装は行わない。

## 確定済み設計（Phase 1-3 の成果）

| リソース | production | staging |
| --- | --- | --- |
| Pages | `ubm-hyogo-web` | `ubm-hyogo-web-staging` |
| Workers | `ubm-hyogo-api` | `ubm-hyogo-api-staging` |
| D1 | `ubm-hyogo-db-prod` | `ubm-hyogo-db-staging` |
| ブランチ | `main` | `dev` |

## 実行タスク

- Phase 5-7 の成果物（runbook、AC トレース）を読んで重複箇所を洗い出す
- DRY 化チェックリストに基づき命名ドリフトを確認・修正する
- 変更管理テーブル（Before/After）を outputs/phase-08/main.md に記録する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セットアップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | Pages / Workers / D1 役割 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | token placement |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api split |
| 参考 | Cloudflare Dashboard / Wrangler CLI | 初回セットアップ |

## DRY 化チェックリスト

| チェック項目 | 確認コマンド / 方法 | 期待状態 |
| --- | --- | --- |
| Pages 名の一貫性 | `rg "ubm-hyogo-web" apps/web/wrangler.toml doc/` | 全て `ubm-hyogo-web` / `ubm-hyogo-web-staging` |
| Workers 名の一貫性 | `rg "ubm-hyogo-api" apps/api/wrangler.toml doc/` | 全て `ubm-hyogo-api` / `ubm-hyogo-api-staging` |
| D1 名の一貫性 | `rg "ubm-hyogo-db" apps/api/wrangler.toml doc/` | 全て `ubm-hyogo-db-prod` / `ubm-hyogo-db-staging` |
| branch 名の一貫性 | `rg "develop\|dev\|main" .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | `develop` 表記ゼロ、`dev` のみ |
| artifacts.json の task_path | `cat doc/01b-parallel-cloudflare-base-bootstrap/artifacts.json` | `doc/01b-parallel-cloudflare-base-bootstrap` |
| secret 変数名の一貫性 | `rg "CLOUDFLARE_API_TOKEN\|CLOUDFLARE_ACCOUNT_ID" doc/ .github/` | 全て同一の変数名 |

## 変更管理テーブル（Before / After）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| deployment-cloudflare.md | `develop` ブランチ表記 | `dev` ブランチ表記 | branch-strategy.md と統一 |
| artifacts.json task_path | `doc/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap` | `doc/01b-parallel-cloudflare-base-bootstrap` | ディレクトリ移動を反映 |
| index.md ディレクトリ参照 | `doc/01-infrastructure-setup/...` | `doc/01b-parallel-cloudflare-base-bootstrap` | 同上 |
| branch 記法 | `develop` 混在 | `dev` へ統一 | branch strategy 優先 |
| runtime 記法 | OpenNext 一体 | Pages / Workers 分離 | architecture と整合 |
| data ownership | Sheets / D1 混線 | Sheets input / D1 canonical | source-of-truth 一意化 |

## 実行手順

### ステップ 1: input と前提の確認

- Phase 5-7 の成果物（outputs/phase-05/main.md〜outputs/phase-07/main.md）を読む
- index.md と artifacts.json を読んで命名ドリフトの候補を洗い出す
- 正本仕様（deployment-cloudflare.md）との差分を先に整理する

### ステップ 2: DRY 化チェックの実行

- 上記 DRY 化チェックリストを上から順に実行する
- 各チェック項目の結果を「OK / NG / 修正済み」で記録する
- NG 項目は変更管理テーブルに Before/After を追記して修正する

### ステップ 3: Phase 成果物の作成

- 本 Phase の主成果物を outputs/phase-08/main.md に作成・更新する
- DRY 化チェック結果レポートを含める
- downstream task から参照される path を具体化する

### ステップ 4: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する
- 次 Phase に渡す blocker と open question を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 本 Phase の DRY 化チェック結果を品質保証の入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 命名ドリフト解消により、どのチームメンバーのオンボーディングコストを下げるか明確か。
- 実現性: 初回無料運用スコープ（Pages / Workers / D1 無料枠）で成立するか。
- 整合性: branch / env / runtime / data / secret の表現が全ドキュメントで一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## 共通化パターン

- branch / env / secret placement の表現を全ドキュメントで統一する
- outputs 配置ルールを Phase 12 まで同一化する（outputs/phase-XX/main.md）
- 4条件を「価値性 / 実現性 / 整合性 / 運用性」へ統一する

## 削除対象一覧

- legacy assumption の持ち込み（例: `develop` ブランチ前提の記述）
- scope 外サービスの先行導入（例: 有料 Cloudflare サービスへの言及）
- 実値前提の secret 記述（例: 実際のトークン値のインライン記述）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 8 | pending | Phase 5-7 の成果物と artifacts.json を読む |
| 2 | DRY 化チェック実行 | 8 | pending | チェックリスト全項目を確認・記録 |
| 3 | 成果物更新 | 8 | pending | outputs/phase-08/main.md にチェック結果レポートを作成 |
| 4 | 4条件確認 | 8 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化チェック結果レポート |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- DRY 化チェックリストの全項目が「OK / 修正済み」になっている
- 変更管理テーブル（Before/After）が outputs/phase-08/main.md に記録されている
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: DRY 化チェック結果レポート（outputs/phase-08/main.md）を Phase 9 の品質チェックの入力として使用する。未解消ドリフトがある場合は Phase 9 でブロック扱いとする。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。
