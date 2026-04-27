# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare R2 ストレージ設定 (UT-12) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-27 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |
| タスク種別 | spec_created（docs-only / 実装は別タスク） |

## 目的

Phase 2 の wrangler.toml diff・CORS ポリシー JSON・命名規則を対象に、staging / production 環境間の重複を Before / After で整理し、共通値（binding name / 命名 prefix）と環境固有値（bucket_name / AllowedOrigins）を分離する。設定変更の修正コスト削減と、ドリフト発生時の影響範囲最小化を狙う docs-only リファクタリングとする。

## 参照資料（前提成果物）

- Phase 2: `outputs/phase-02/wrangler-toml-diff.md` / `cors-policy-design.md` / `r2-architecture-design.md` / `token-scope-decision.md`
- Phase 5: `outputs/phase-05/r2-setup-runbook.md` / `binding-name-registry.md`
- Phase 7: `outputs/phase-07/ac-matrix.md`（DRY 観点で再確認すべき AC の特定）
- 01b: `outputs/phase-05/cloudflare-bootstrap-runbook.md`（命名トポロジーの正本）

## 成果物（出力一覧）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/refactor-decisions.md | リファクタ対象 / Before / After / 理由のテーブル |
| ドキュメント | outputs/phase-08/dry-applied-diff.md | 適用後 wrangler.toml / CORS JSON の参照可能差分 |
| メタ | artifacts.json | Phase 状態の更新 |

> 上記成果物の実体ファイルは Phase 8 実行時に作成する。本 phase 仕様書では作成しない。

## 実行タスク（チェックボックス）

- [ ] wrangler.toml の `[env.production]` / `[env.staging]` セクションで重複している項目を抽出する
- [ ] CORS JSON の AllowedOrigins / AllowedMethods / AllowedHeaders で環境共通項目を切り出す
- [ ] バインディング名（例: `R2_BUCKET`）が全環境で一致しているか整合確認する
- [ ] バケット命名 prefix（`ubm-hyogo-r2-` + 環境サフィックス）の一貫性を 01b トポロジーと突合する
- [ ] Before / After 比較を Markdown コードブロックで記録する
- [ ] リファクタ対象 / Before / After / 理由のテーブル形式記録（[Feedback RT-03] 準拠）を作成する
- [ ] DRY 化適用後の wrangler.toml / CORS JSON 参照位置を documentation-changelog の前段として整理する

## 実行手順

### ステップ 1: 現状の重複洗い出し

- Phase 2 の wrangler-toml-diff.md を再読する
- `[env.production]` と `[env.staging]` で `binding` / `bucket_name` 以外に重複している項目を列挙する
- CORS JSON の環境別定義から共通箇所（AllowedMethods / AllowedHeaders / MaxAgeSeconds 等）を抽出する

### ステップ 2: DRY 化方針の確定

- 共通値: バインディング名 `R2_BUCKET` を全環境で固定（`apps/api` 限定 / 不変条件 5 維持）
- 環境固有値: `bucket_name`（`ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`）と CORS の AllowedOrigins
- CORS JSON: `AllowedOrigins` のみ環境別、それ以外は共通テンプレ化する方針を文書化
- DRY 化の境界: docs-only タスクのため実コード適用はせず、設計サンプルとして記録

### ステップ 3: Before / After 比較と理由の記録

- Before（DRY 化前 / Phase 2 の素のサンプル）と After（DRY 化後の推奨構造）を併記する
- 各変更項目について「リファクタ対象 / Before / After / 理由」を 1 行ずつテーブル化する [Feedback RT-03]
- 命名整合（01b トポロジー）との突合結果を記録する

## Before / After（設定変更前後の比較）【必須】

### Before（DRY 化前・サンプル）

```toml
# apps/api/wrangler.toml（Phase 2 設計時点）
[env.staging]
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[env.production]
[[env.production.r2_buckets]]
binding = "R2_BUCKET"  # 各環境で重複定義
bucket_name = "ubm-hyogo-r2-prod"
```

```json
// CORS JSON（Phase 2 設計時点 / 各環境で全項目を都度定義）
[
  {
    "AllowedOrigins": ["https://staging.example.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "MaxAgeSeconds": 3600
  }
]
```

### After（DRY 化後・推奨構造）

```toml
# apps/api/wrangler.toml（DRY 化後 / バインディング名を共通項として明示）
# binding name: 全環境で R2_BUCKET 固定（apps/api からのみアクセス / 不変条件 5）
# bucket_name: 環境別に分離（01b 命名トポロジーに整合）

[env.staging]
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[env.production]
[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

```json
// CORS JSON テンプレ（共通部 + AllowedOrigins のみ環境差し替え）
// Apply 手順: wrangler r2 bucket cors put <bucket> --rules <env-rules.json>
[
  {
    "AllowedOrigins": ["<env-specific-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 差分サマリー（リファクタ対象 / Before / After / 理由）

| リファクタ対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| binding 名 | 各環境セクションで個別定義 | 全環境共通 `R2_BUCKET` を不変条件としてコメント化 | 設定根拠を一箇所で管理（[Feedback RT-03]） |
| CORS 共通項 | 環境別 JSON 内に重複記述 | テンプレ化し AllowedOrigins のみ環境置換 | 変更箇所を最小化し誤設定を予防 |
| bucket_name 命名 | サンプル値混在の懸念 | `ubm-hyogo-r2-{prod,staging}` で固定 | 01b トポロジー整合（AC-1） |
| apps/web への影響 | 言及のみ | 「apps/web には R2 バインディングを追加しない」と明記 | 不変条件 5 を DRY 化文書側でも担保 |

## 命名規則整合確認（01b トポロジー）

| 項目 | 01b トポロジー定義 | 本タスクでの値 | 整合 |
| --- | --- | --- | --- |
| 環境サフィックス | `prod` / `staging` | `prod` / `staging` | OK |
| プレフィックス | `ubm-hyogo-` | `ubm-hyogo-r2-` | OK（リソース種別 `r2` を中間挿入） |
| binding 命名 | UPPER_SNAKE_CASE | `R2_BUCKET` | OK |
| Token 命名 | `ubm-hyogo-<resource>-token` | `ubm-hyogo-r2-token`（Phase 2 採用案 D） | OK |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | DRY 化方針を設計レビューに反映（差し戻し時の修正範囲を最小化） |
| Phase 5 | DRY 化後の wrangler.toml / CORS JSON 構造で runbook を整備 |
| Phase 9 | DRY 化後の設定が品質基準（線数・リンク・mirror parity）を満たすか確認 |
| Phase 12 | implementation-guide Part 2 に DRY 化サンプルを反映 |

## 多角的チェック観点

- 価値性: DRY 化で AllowedOrigins 変更時の修正箇所が 1 環境分に閉じるか
- 実現性: wrangler.toml の TOML 仕様で `[[env.*.r2_buckets]]` の重複が技術的に避けられない部分を正しく許容しているか
- 整合性: 01b 命名トポロジー / 不変条件 5（apps/api 限定）と矛盾しないか
- 運用性: UT-16 完了時に AllowedOrigins のみ差し替えで CORS 再設定が完結するか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | wrangler.toml 重複抽出 | 8 | pending |
| 2 | CORS JSON 共通項の切り出し | 8 | pending |
| 3 | Before / After 構造の作成 | 8 | pending |
| 4 | refactor-decisions.md 作成 | 8 | pending |
| 5 | dry-applied-diff.md 作成 | 8 | pending |
| 6 | 01b 命名トポロジー突合 | 8 | pending |

## 完了条件（受入条件 + AC 紐付け）

- [ ] Before / After 比較が wrangler.toml / CORS JSON の双方で記録されている（AC-2 / AC-5）
- [ ] リファクタ対象 / Before / After / 理由のテーブルが完成している（[Feedback RT-03]）
- [ ] 01b 命名トポロジーとの整合確認が記録されている（AC-1）
- [ ] DRY 化方針が apps/web 非対象（不変条件 5）を維持していることを明記
- [ ] 機密情報（Account ID / Token 値 / 実 origin）が成果物に直書きされていない

## レビューポイント / リスク / 落とし穴

- TOML 仕様上 `[[env.*.r2_buckets]]` の `binding` 行は完全には DRY にできない（言語制約）。コメントで補完する方針を明記
- AllowedOrigins を共通テンプレに含めない（環境ごとに正しい origin を強制するため）
- DRY 化の過剰適用で Phase 5 runbook の手順が読みづらくなるリスク → サンプル原型は両方残す
- 機密情報の直書き禁止は Phase 9 の secret hygiene チェックでも再確認

## 次フェーズへの引き渡し

- 次: 9 (品質保証)
- 引き継ぎ事項: refactor-decisions.md / dry-applied-diff.md / 命名整合表 / 不変条件 5 維持の根拠
- ブロック条件: Before / After 比較が未作成 / 命名整合に矛盾が残っている場合は次 Phase に進まない
