# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-27 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

wrangler.toml における KV namespace バインディング設定（production / staging）の重複を排除し、バインディング名・TTL 値・運用ポリシーが DRY に管理されていることを確認する。docs-only タスクとして設定方針を Before / After で文書化する。

## 実行タスク

- wrangler.toml の KV namespace バインディング設定を Before / After 形式で比較する
- production / staging 環境間の設定重複を洗い出す
- バインディング名（`SESSION_KV` 等）の共通定数化方針を文書化する
- TTL 値の集中管理（環境変数 / 設定ファイル化）の選択肢を評価する
- 共通値と環境固有値（namespace_id）の分離方針を明確化する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV バインディング設定方法・wrangler.toml 構造 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | タスク概要・スコープ確認 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-07/ac-matrix.md | AC トレース（前 Phase 成果物） |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | 設定 DRY 化方針の参照 |

## 実行手順

### ステップ 1: 現状の設定構造の把握

- wrangler.toml の KV namespace バインディング定義を確認する
- production / staging 環境間で重複している設定項目を特定する
- バインディング名・TTL 値が `[env.production]` / `[env.staging]` に分散しているか確認する

### ステップ 2: DRY 化方針の設計

- バインディング名（`SESSION_KV`）をトップレベル / 共通定数として配置する方針を文書化する
- 環境固有値（`id` = KV Namespace ID）のみ `[env.*]` セクションに記載する方針を確認する
- TTL 値（セッション TTL・キャッシュ TTL 等）を `[vars]` / 環境変数で集中管理する選択肢を評価する
- preview_id（local 開発用）の取り扱い方針を決定する

### ステップ 3: Before / After 比較ドキュメントの作成

- Before（DRY 化前の想定構造）を記録する
- After（DRY 化後の推奨構造）を記録する
- 変更理由と根拠を明記する

## Before / After（設定変更前後の比較）【必須】

### Before（DRY 化前・重複あり）

```toml
# 各環境に同一の binding 定義が重複し、TTL もコード内ハードコード（推奨しない）
[env.staging]
kv_namespaces = [
  { binding = "SESSION_KV", id = "<staging-namespace-id>" }
]

[env.production]
kv_namespaces = [
  { binding = "SESSION_KV", id = "<production-namespace-id>" }
]
# TTL はソースコード内に各箇所で散在
# const SESSION_TTL = 3600  // 認証セッション
# const CACHE_TTL = 300     // 一時キャッシュ
```

### After（DRY 化後・推奨構造）

```toml
# トップレベル: ローカル開発用（preview_id でエミュレーション、binding 名は全環境共通）
[[kv_namespaces]]
binding = "SESSION_KV"
# KV Namespace ID は Cloudflare Dashboard / wrangler kv:namespace create で発行する値を使用
# 機密情報ではないが、production / staging の取り違え防止のため env セクションで分離
id = "<local-preview-id>"
preview_id = "<local-preview-id>"

# TTL 値は [vars] で一元管理し、Worker 側から env.SESSION_BLACKLIST_TTL_SECONDS などで参照
[vars]
SESSION_BLACKLIST_TTL_SECONDS = "86400"   # JWT 失効済み jti TTL（24 時間）
CONFIG_CACHE_TTL_SECONDS     = "3600"     # 設定キャッシュ TTL（1 時間）
RATE_LIMIT_WINDOW_SECONDS    = "60"       # レートリミット window（60 秒）

[env.staging]
[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-namespace-id>"  # staging KV Namespace ID

[env.production]
[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-namespace-id>"  # production KV Namespace ID
```

### 差分サマリー

| 項目 | Before | After | 理由 |
| --- | --- | --- | --- |
| バインディング名 | 各環境で重複定義 | 全環境で `SESSION_KV` に統一（不変条件として明示） | 下流タスクが参照する binding 名を一意化 |
| TTL 値 | ソースコード内で散在 | `[vars]` セクションで集中管理 | 設定変更時の修正箇所を 1 箇所に集約 |
| namespace ID | 環境固有値として分離済み | 変更なし（取り違え防止のため env セクション維持） | production / staging の混入リスク回避 |
| preview_id | 未定義 | local 開発用に明示 | wrangler dev のローカルエミュレーション対応 |
| TTL ポリシー | 未定義 | KV 最終的一貫性（最大 60 秒）を考慮した最小 TTL を文書化 | 一貫性制約に基づく設計指針を残す |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | DRY 化方針を設計ドキュメントに反映 |
| Phase 5 | DRY 化後の wrangler.toml 構造に基づいてセットアップを実行 |
| Phase 9 | DRY 化後の設定が品質基準（無料枠 / secret hygiene）を満たすか確認 |

## 多角的チェック観点（AIが判断）

- 価値性: DRY 化によって TTL 変更・バインディング名変更時の修正箇所が減るか。
- 実現性: wrangler.toml の制約内で DRY 化が実現可能か（KV namespace ID は環境別必須）。
- 整合性: production / staging の namespace ID が環境固有値として正しく分離され取り違えが起きない構造か。
- 運用性: 新環境追加時に最小限の変更で済む構造になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before 構造の記録 | 8 | completed | 重複パターンの文書化 |
| 2 | After 構造の設計 | 8 | completed | 推奨 wrangler.toml 構造 |
| 3 | TTL 集中管理方針の評価 | 8 | completed | `[vars]` 方式の採否 |
| 4 | DRY 化方針ドキュメント作成 | 8 | completed | outputs/phase-08/dry-config-policy.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/dry-config-policy.md | DRY 化方針と Before/After 比較 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- Before / After の wrangler.toml 構造が文書化されている
- バインディング名（`SESSION_KV`）の共通化方針が確定している
- TTL 値の集中管理方針（`[vars]` 方式）が評価・記録されている
- 環境固有値（namespace ID）と共通値の分離方針が明確化されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: DRY 化後の wrangler.toml 推奨構造・TTL 集中管理方針・バインディング名規約を Phase 9 に引き継ぐ。
- ブロック条件: Before / After 比較が未作成なら次 Phase に進まない。
