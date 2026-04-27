# Phase 8: 設定 DRY 化方針

## 目的

`apps/api/wrangler.toml` における KV namespace バインディング設定（production / staging）の重複を排除し、バインディング名・TTL 値・運用ポリシーが DRY に管理されている状態を文書化する。

## Before / After 比較

### Before（DRY 化前・想定構造）

```toml
# 各環境に同一の binding 定義が重複し、TTL もコード内ハードコード
[env.staging]
kv_namespaces = [
  { binding = "SESSION_KV", id = "<staging-namespace-id>" }
]

[env.production]
kv_namespaces = [
  { binding = "SESSION_KV", id = "<production-namespace-id>" }
]
# TTL はソースコード内に各箇所で散在
# const SESSION_TTL = 86400  // セッションブラックリスト
# const CACHE_TTL = 3600     // 設定キャッシュ
# const RATE_LIMIT_TTL = 60  // レートリミット
```

### After（DRY 化後・推奨構造）

```toml
# トップレベル: ローカル開発用（preview_id でエミュレーション、binding 名は全環境共通）
[[kv_namespaces]]
binding = "SESSION_KV"
id = "<local-preview-id>"
preview_id = "<local-preview-id>"

# TTL 値は [vars] で一元管理し、Worker 側から env.SESSION_BLACKLIST_TTL_SECONDS 等で参照
[vars]
SESSION_BLACKLIST_TTL_SECONDS = "86400"   # セッションブラックリスト TTL（24h・JWT 有効期限と一致）
CONFIG_CACHE_TTL_SECONDS     = "3600"     # 設定キャッシュ TTL（1h）
RATE_LIMIT_WINDOW_SECONDS    = "60"       # レートリミットウィンドウ TTL（60s）

[env.staging]
[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-namespace-id>"
preview_id = "<staging-kv-preview-namespace-id>"

[env.production]
[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-namespace-id>"
```

## 差分サマリー

| 項目 | Before | After | 理由 |
| --- | --- | --- | --- |
| バインディング名 | 各環境で重複定義（同じ `SESSION_KV` を 2 箇所） | 全環境で `SESSION_KV` に統一（不変条件として明示） | 下流タスクが参照する binding 名を一意化、レビュー時に取り違え検出が容易 |
| TTL 値 | ソースコード内で散在 | `[vars]` セクションで集中管理 | 設定変更時の修正箇所を 1 箇所に集約、無料枠運用方針との整合確認が容易 |
| namespace ID | 環境固有値として分離済み | 変更なし（取り違え防止のため env セクション維持） | production / staging の混入リスク回避（FC-03） |
| preview_id | 未定義 | local 開発用 + staging に明示 | wrangler dev のローカルエミュレーション対応 + production には設定しない |
| TTL ポリシー | 未定義 | KV 最終的一貫性（最大 60 秒）を考慮した最小 TTL を文書化（ttl-policy.md） | 一貫性制約に基づく設計指針を残す |

## DRY 化方針の不変条件

1. **バインディング名統一**: 全環境で `SESSION_KV`。下流タスクの `env.SESSION_KV` 参照を環境差なしで成立させる
2. **TTL 集中管理**: `[vars]` セクションで一元管理。コード内の散在を禁止
3. **namespace ID 分離維持**: 取り違え防止のため `[env.production]` / `[env.staging]` で別 ID を保持。共通化しない
4. **preview_id は staging のみ**: production には設定せず、本番への preview 経由アクセスを禁止
5. **web 側へのバインディング配置禁止**: KV は `apps/api` のみ。`apps/web/wrangler.toml` には追加しない

## DRY 化の効果

| 観点 | 効果 |
| --- | --- |
| 価値性 | TTL 変更時の修正箇所が 1 箇所（`[vars]` セクション）に集約 |
| 実現性 | `wrangler.toml` の制約内で実現可能（`[vars]` は wrangler 標準機能） |
| 整合性 | namespace ID の取り違え防止と DRY 化が両立 |
| 運用性 | 新環境（例: 別リージョン）追加時に `[env.<new>]` セクション追加のみで済む |

## 完了条件

- [x] Before / After の wrangler.toml 構造が文書化されている
- [x] バインディング名（`SESSION_KV`）の共通化方針が確定している
- [x] TTL 値の集中管理方針（`[vars]` 方式）が記録されている
- [x] 環境固有値（namespace ID）と共通値の分離方針が明確化されている

## 次 Phase 引き継ぎ事項

- DRY 化後の wrangler.toml 推奨構造を Phase 9 品質保証で「整合性チェック」の対象に渡す
- TTL 集中管理方針（`[vars]`）を Phase 12 implementation-guide.md に反映
