# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |

## 目的

wrangler.toml における D1 バインディングと WAL mode 設定の重複を排除し、staging / production 間で環境別設定が一意かつ DRY に管理されていることを確認する。docs-only タスクとして設定方針を文書化する。

## 実行タスク

- wrangler.toml の D1 バインディング設定を Before / After 形式で比較する
- staging / production 環境間の設定重複を洗い出す
- WAL mode 設定の DRY 化方針を文書化する
- 環境固有値と共通値の分離方針を明確化する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 バインディング設定方法・wrangler.toml 構造 |
| 必須 | docs/ut-02-d1-wal-mode/outputs/phase-02/wal-mode-design.md | WAL mode 設計（存在する場合） |
| 必須 | docs/ut-02-d1-wal-mode/outputs/phase-07/ac-matrix.md | AC トレース（前 Phase 成果物） |
| 参考 | docs/completed-tasks/02-serial-monorepo-runtime-foundation/index.md | 組み込み先の設定構造 |

## 実行手順

### ステップ 1: 現状の設定構造の把握

- wrangler.toml の D1 バインディング定義を確認する
- staging / production 環境間で重複している設定項目を特定する
- WAL mode 設定が `[env.staging]` / `[env.production]` に分散しているか確認する

### ステップ 2: DRY 化方針の設計

- 共通値（binding name、database_name）をトップレベルに配置する方針を文書化する
- 環境固有値（database_id）のみ `[env.*]` セクションに記載する方針を確認する
- WAL mode 設定コメントの配置場所を決定する

### ステップ 3: Before / After 比較ドキュメントの作成

- Before（DRY 化前の想定構造）を記録する
- After（DRY 化後の推奨構造）を記録する
- 変更理由と根拠を明記する

## Before / After（設定変更前後の比較）【必須】

### Before（DRY 化前・重複あり）

```toml
# 各環境に同一の binding 定義が重複する例（推奨しない）
[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-staging"
database_id = "xxxxxxxx-staging"

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-production"
database_id = "xxxxxxxx-production"
# WAL mode のコメントが各環境に分散
```

### After（DRY 化後・推奨構造）

```toml
# トップレベル: ローカル開発用デフォルト（binding name は全環境共通）
[[d1_databases]]
binding = "DB"
# D1 write/read contention policy:
# Do not assume persistent PRAGMA journal_mode=WAL unless Cloudflare D1
# documents support for it. Runtime mitigation is handled in UT-09.
# ローカル: wrangler dev --local の SQLite エミュレーションは remote D1 と差異あり（phase-04 参照）
database_name = "ubm-hyogo-local"
database_id = "local-dummy-id"

[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-staging"
database_id = "xxxxxxxx-staging"  # staging D1 database_id

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-production"
database_id = "xxxxxxxx-production"  # production D1 database_id
```

### 差分サマリー

| 項目 | Before | After | 理由 |
| --- | --- | --- | --- |
| WAL mode コメント | 各環境に分散 / 未記載 | トップレベルに集約 | 設定根拠を一箇所で管理 |
| binding name | 各環境で重複定義の可能性 | 全環境で `DB` に統一 | 不変条件として明示 |
| database_id | 環境固有値として分離済み | 変更なし | 適切な分離 |
| WAL PRAGMA 実行 | 未定義 | wrangler d1 execute で適用（runbook に記録） | wrangler.toml では PRAGMA 直接指定不可 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | DRY 化方針を設計ドキュメントに反映 |
| Phase 5 | DRY 化後の wrangler.toml 構造に基づいてセットアップを実行 |
| Phase 9 | DRY 化後の設定が品質基準を満たすか確認 |

## 多角的チェック観点（AIが判断）

- 価値性: DRY 化によって設定変更時の修正箇所が減るか。
- 実現性: wrangler.toml の制約内で DRY 化が実現可能か（PRAGMA は toml 外で管理）。
- 整合性: staging / production の database_id が環境固有値として正しく分離されているか。
- 運用性: 新環境追加時に最小限の変更で済む構造になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before 構造の記録 | 8 | spec_created | 重複パターンの文書化 |
| 2 | After 構造の設計 | 8 | spec_created | 推奨 wrangler.toml 構造 |
| 3 | DRY 化方針ドキュメント作成 | 8 | spec_created | outputs/phase-08/dry-config-policy.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/dry-config-policy.md | DRY 化方針と Before/After 比較 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- [ ] Before / After の wrangler.toml 構造が文書化されている
- WAL mode コメントの配置方針が確定している
- 環境固有値（database_id）と共通値（binding name）の分離方針が明確化されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: DRY 化後の wrangler.toml 推奨構造と設定方針を Phase 9 に引き継ぐ。
- ブロック条件: Before / After 比較が未作成なら次 Phase に進まない。
