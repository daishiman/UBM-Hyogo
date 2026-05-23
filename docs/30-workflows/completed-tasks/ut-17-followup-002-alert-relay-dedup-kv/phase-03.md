# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## 目的

Phase 1-2 の要件・設計の整合性を判定し、Phase 4 着手可否を決める。

## レビュー観点

### 1. 真の論点

> isolate 跨ぎでも dedup TTL 内に Slack 二重配信を発生させないこと。

設計はこの論点に直接応答している（KV による外部化）。

### 2. 因果ループ / 責務境界

- **強化ループ**: in-memory dedup → isolate 切替 → dedup 抜け → Slack 二重 → アラート疲労 → 本物障害見逃し。本タスクで遮断する。
- **責務境界**:
  - dedup state の永続化 = KV
  - dedup key 構築 = handler
  - TTL 管理 = KV `expirationTtl`
  - Slack 配信 = 既存 `sendSlackMessage`（無変更）
  - 認証 = `verifyCfWebhookAuth`（無変更）

衝突・所有権の重複なし。

### 3. 価値とコストの均衡

| 項目 | 評価 |
|------|------|
| 価値 | isolate 跨ぎ二重通知を実用上排除（HIGH） |
| コスト | KV namespace 作成・wrangler.toml 編集・test stub・dedup ロジック書き換え（LOW、小規模） |
| 将来拡張 | KV operation metrics 監視は別タスク。本仕様には含まない |

均衡良好。

### 4. 改善優先順位

| 項目 | 優先度 | 本仕様での扱い |
|------|--------|--------------|
| isolate 跨ぎ dedup の永続化 | 必須 | 実装 |
| KV operation 監視 | 中 | 別タスク（UT-17 親の analytics で対応） |
| KV consistency 改善（DO 化等） | 低 | 別タスク（過剰） |

### 5. 4 条件評価

| 条件 | 評価 |
|------|------|
| 価値性 | 二重通知ノイズを実用排除し、アラート疲労を低減する |
| 実現性 | 変更ファイル 6 件・テスト 1 ケース追加で完了。1 サイクル内で十分 |
| 整合性 | 親 UT-17 設計、CLAUDE.md の Cloudflare CLI ラッパー方針、`apps/api` 責務境界と矛盾なし |
| 運用性 | namespace 作成は `bash scripts/cf.sh` ラッパーで再現可能。runbook に追記 |

## 主要リスクと緩和

| リスク | 緩和 |
|--------|------|
| KV eventual consistency による race | 「同一リクエスト内 read→put の二重実行を許容」と spec / docstring に明記。in-memory 版より大幅改善する点で妥協 |
| binding 未設定で本番落ち | `Env` 型を必須プロパティにする。Phase 5 で wrangler.toml に namespace_id 直書き |
| `wrangler` 直接実行混入 | Phase 5 手順に `bash scripts/cf.sh` 経由を明記。grep gate を Phase 9 で確認 |
| Miniflare の KV stub と本番差異 | TTL 経過 / `null` 返却の仕様準拠を Phase 4 テストで実測確認 |

## 判定

- 判定: **PASS（Phase 4 に進む）**
- MINOR 指摘: namespace_id を未確定のまま Phase 5 で取得 → Phase 4 では `<staging_namespace_id>` の placeholder で記述可。Phase 5 完了時に実 ID 反映を必須化。

## 完了条件

`outputs/phase-03/design-review.md` に PASS 判定と上記表が記録されている。
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 3
- status: completed

## 目的

設計レビューでリスクと整合性を確認する。

## 実行タスク

- KV consistency、Slack retry、設定境界をレビューする。

## 参照資料

- `outputs/phase-03/design-review.md`

## 成果物/実行手順

- `outputs/phase-03/design-review.md`

## 完了条件

- [x] 設計レビュー結果が記録されている

## 統合テスト連携

- 指摘事項を Phase 4/5 の tests と実装へ反映する。
