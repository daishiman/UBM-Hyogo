# UT-13: Cloudflare KV セッションキャッシュ設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-13 |
| タスク名 | Cloudflare KV セッションキャッシュ設定 |
| 優先度 | LOW |
| 推奨Wave | Wave 2+ |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-02) |

## 目的

セッション管理・設定キャッシュのための Cloudflare KV Namespace を設定し、Cloudflare Workers からのバインディングを確立する。無料枠（100,000読み/日・1,000書き/日）内で運用できる構成を定義し、認証機能実装時に KV を活用できる状態を整える。

## スコープ

### 含む
- KV Namespace 作成（production / staging 分離）
- `wrangler.toml` への KV バインディング設定追加
- TTL（Time-To-Live）設定方針の定義
- KV 使用用途の明確化（セッション / 設定キャッシュ / レートリミットカウンタ）
- 無料枠内での運用方針

### 含まない
- セッション管理ロジックの実装（→ 認証機能実装タスクで実施）
- KV を使ったキャッシュ戦略の実装（→ アプリケーション層で対応）
- Durable Objects を使ったリアルタイム状態管理（→ 別途検討）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・Workers 設定の確定が前提 |
| 上流 | 認証機能実装タスク（将来） | セッション管理の要件が確定してから KV 設計を最終化 |
| 下流 | 認証機能実装タスク（将来） | KV バインディング名が確定後に実装可能 |

## UT-08 設計ハンドオフ

UT-08 監視・アラート設計では `auth.fail` を任意 WAE イベントとして定義している。UT-13 または後続の認証実装で、認証失敗を監視対象に含めるかを再判定する。

| 項目 | UT-08 側の現在地 |
| --- | --- |
| 任意イベント | `auth.fail` |
| 採否条件 | 認証実装のエラー分類とPII除外方針が確定してから採用 |
| PII制約 | email / userId / IP は WAE data point に格納しない |
| 参照 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/wae-instrumentation-plan.md` |

## 着手タイミング

> **着手前提**: 認証機能の実装計画が具体化した段階で着手すること。KV はセッション管理・レートリミット等のユースケースが確定してから設定するのが適切。

| 条件 | 理由 |
| --- | --- |
| 認証機能の実装計画確定 | KV Namespace の用途・数・TTL 要件が確定するため |
| 01b タスク完了 | Workers バインディング設定の基盤が確立済みであること |

## 苦戦箇所・知見

**1. KV の一貫性モデルの制約**
Cloudflare KV は最終的一貫性（Eventual Consistency）モデルを採用している。書き込み後、他リージョンへの反映に最大60秒かかる。セッション無効化（ログアウト）を即時反映する用途には適さない。この制約を認証設計時に明示し、セキュリティ要件の高い操作（ログアウト・権限変更）には KV を使わない設計を推奨。

**2. 無料枠の書き込み制限**
無料枠の書き込みは 1,000件/日 のみ。セッション作成のたびに KV 書き込みが発生する設計にすると、アクティブユーザーが数百人規模で枯渇する。セッション更新（更新タイミングの間引き）や、書き込みを最小化する設計（JWT + KV ブラックリスト方式等）を検討すること。

**3. Namespace の命名と分離**
production と staging で Namespace ID が異なるため、`wrangler.toml` の `[env.production]` / `[env.staging]` セクションでそれぞれ正しい ID を設定する必要がある。ID の取り違えが本番データ混入のリスクになるため、設定ファイルのレビューを必須とする。

## 実行概要

- Cloudflare Dashboard から KV Namespace を2つ作成（`ubm-hyogo-kv-prod` / `ubm-hyogo-kv-staging`）
- `wrangler.toml` の production/staging 環境それぞれに KV バインディングを追加
- Workers から KV への読み書き動作確認（シンプルなキー/バリュー設定テスト）
- TTL 設定のベストプラクティスをドキュメント化
- 無料枠使用量の確認方法をドキュメント化

## 完了条件

- [ ] KV Namespace が production / staging で作成済み
- [ ] `wrangler.toml` に正しい KV バインディングが設定済み
- [ ] Workers から KV への読み書きが動作確認済み
- [ ] TTL 設定方針がドキュメント化済み
- [ ] 無料枠内での運用方針が明文化済み
- [ ] Namespace 名・バインディング名が下流タスク向けにドキュメント化済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | Cloudflare リソース作成手順の参考 |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | Workers バインディング設計の参考 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers バインディング設定方針 |
