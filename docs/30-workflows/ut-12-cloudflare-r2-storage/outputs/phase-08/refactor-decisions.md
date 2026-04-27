# Phase 8 成果物: リファクタ決定事項 (refactor-decisions.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 8 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. リファクタ目的

`wrangler.toml` の `[env.production]` / `[env.staging]` セクションと CORS JSON について、staging / production 間の重複を整理し、共通値（binding name）と環境固有値（bucket_name / AllowedOrigins）を分離する。docs-only タスクのため実コードへの適用はせず、設計サンプル・テンプレートとして記録する。

## 2. 重複洗い出し

| 設定対象 | 重複している項目 | 環境固有 | DRY 化の余地 |
| --- | --- | --- | --- |
| wrangler.toml `[[r2_buckets]]` | `binding = "R2_BUCKET"` | `bucket_name` のみ | コメントで一元管理（TOML 仕様で完全 DRY 不可） |
| CORS JSON | `AllowedMethods` / `AllowedHeaders` / `ExposeHeaders` / `MaxAgeSeconds` | `AllowedOrigins` のみ | テンプレート化可能 |

## 3. リファクタ対象 / Before / After / 理由（[Feedback RT-03]）

| # | リファクタ対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| R-1 | binding 名 | 各環境セクションで個別記述（重複） | 全環境共通 `R2_BUCKET` をコメントで明示 + 環境別セクションに記述 | TOML 仕様上の制約で完全 DRY 不可。コメントで根拠を一箇所固定 |
| R-2 | CORS 共通項 | 環境別 JSON 内に Methods/Headers/Expose/MaxAge を都度記述 | 共通テンプレ化（AllowedOrigins のみ環境別） | 変更箇所最小化・誤設定予防 |
| R-3 | bucket_name 命名 | サンプル値混在懸念 | `ubm-hyogo-r2-{prod,staging}` で固定（01b 命名規約整合） | AC-1 充足、命名トポロジー一貫性 |
| R-4 | apps/web 非対象 | 設計内で言及のみ | wrangler.toml コメント + binding-name-registry.md で明記 | 不変条件 5 を文書側でも担保 |
| R-5 | AllowedOrigins プレースホルダ | 暫定 origin が混在しがち | `<env-specific-origin>` 統一プレースホルダ | UT-16 完了時の差し替え漏れ防止 |

## 4. DRY 化の境界（やらないこと）

- `binding = "R2_BUCKET"` を完全に 1 行化することは TOML 仕様上不可（環境別 `[[env.<env>.r2_buckets]]` テーブル配列のため）
- AllowedOrigins を共通テンプレに含めない（環境ごとに正しい origin を強制するため）
- 実コードへの適用は将来タスクに委譲（spec_created の境界）

## 5. 命名整合性確認（01b トポロジー）

| 項目 | 01b 規約 | 本タスクでの値 | 整合 |
| --- | --- | --- | --- |
| 環境サフィックス | `prod` / `staging` | `prod` / `staging` | OK |
| プレフィックス | `ubm-hyogo-` | `ubm-hyogo-r2-`（リソース種別 `r2` 中間挿入） | OK |
| binding 命名 | UPPER_SNAKE_CASE | `R2_BUCKET` | OK |
| Token 命名 | `ubm-hyogo-<resource>-token` | `ubm-hyogo-r2-token`（採用案D） | OK |
| GitHub Secrets | `CLOUDFLARE_<RESOURCE>_TOKEN` | `CLOUDFLARE_R2_TOKEN` | OK |

## 6. 反映先

| 反映先ファイル | 内容 |
| --- | --- |
| `outputs/phase-08/dry-applied-diff.md` | After 構造の詳細サンプル |
| `outputs/phase-12/implementation-guide.md` | Part 2 に DRY 化方針サマリ |
| `outputs/phase-05/r2-setup-runbook.md` | Phase 5 ステップ 2 で言及済 |

## 7. 機密情報チェック

- 実 origin / 実 Token / 実 Account ID は本書に直書きしていない
- プレースホルダ `<env-specific-origin>` 統一

## 8. AC との対応

- AC-1: 命名整合性確認で PASS
- AC-2: wrangler.toml DRY 化で PASS
- AC-5: CORS テンプレ化で PASS

## 9. 完了条件チェック

- [x] Before / After 比較が wrangler.toml / CORS JSON 双方で記録（dry-applied-diff.md と連動）
- [x] リファクタ対象 / Before / After / 理由のテーブル完成
- [x] 01b 命名トポロジーとの整合確認
- [x] apps/web 非対象が維持
- [x] 機密情報の直書きなし
