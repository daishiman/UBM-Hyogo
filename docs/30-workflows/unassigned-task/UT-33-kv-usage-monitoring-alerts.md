# UT-33: Cloudflare KV 使用量監視・アラート設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-33 |
| タスク名 | Cloudflare KV 使用量監視・アラート設定 |
| 優先度 | LOW |
| 推奨Wave | Wave 2 |
| 状態 | unassigned |
| 種別 | operations |
| 作成日 | 2026-04-27 |
| 検出元 | UT-13 Phase 12 unassigned-task-detection |
| 既存タスク組み込み | なし |

## 目的

Cloudflare KV の無料枠（100k read/day、1k write/day、1GB storage）消費を監視し、UT-13 で定めた閾値（read 70%、write 70%/90%、storage 70%）を超える前に検知・対応できる体制を構築する。枯渇時のフォールバック手順も確立する。

## スコープ

### 含む

- Cloudflare Analytics Dashboard での KV 使用量確認手順の文書化
- 監視閾値の設定（read 70%=7万/日 警告、write 70%=700/日 警告・90%=900/日 対応）
- アラート通知方法の設定（Cloudflare Notifications または外部 webhook）
- 枯渇時フォールバック手順：
  - write 枯渇 → レートリミット用途を停止し Durable Objects 移行検討
  - storage 枯渇 → TTL 経過済みキーの bulk delete
- レートリミット用途の Durable Objects 移行検討（write 節約のための設計評価）

### 含まない

- KV Namespace の実作成（UT-35 のスコープ）
- UT-08（常設モニタリング）との統合（別タスク）
- Durable Objects の実装（本タスクは検討・判断のみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-35 KV Namespace 実 ID 発行 | Namespace が実存在してから使用量が発生する |
| 上流 | UT-32 Worker SESSION_KV helper 実装 | 実際の read/write が発生し始めてから監視が意味を持つ |
| 関連 | UT-08 モニタリング/アラート設計 | アラート通知インフラを共有する可能性がある |

## 参照

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/free-tier-policy.md`（無料枠運用方針の正本）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（KV セッションキャッシュ → 無料枠と運用方針セクション）

## 苦戦箇所・知見

**Cloudflare KV 使用量の可視化**:
Cloudflare Analytics は KV の read/write 使用量を日次グラフで表示するが、API 経由でのリアルタイム取得は GraphQL Analytics API（`cloudflareWorkersKvOperationsAdaptiveGroups`）経由となる。ダッシュボード閲覧で十分な場合と、自動アラートが必要な場合で実装コストが大きく異なる。

**write 1k/日 の消費速度**:
レートリミットカウンタは 60〜600 秒 TTL で書き込みが発生する。アクティブユーザー数 × リクエスト頻度によっては数十〜数百 write/日 になり、1k 上限に近づく可能性がある。セッションブラックリストは「ログアウト時のみ write」なので消費が少ない。レートリミット用途が先に枯渇する可能性を前提に設計する。

**Durable Objects 移行の判断タイミング**:
Durable Objects は強一貫性保証があり write 制限もないが、実装コストが高い。移行判断は「write 90%（900/日）を月 2 回以上超えたら移行を本格検討」のような定量基準を設けると判断が速い。本タスクでは移行判断基準の文書化のみで十分で、実装は別タスクに切り出す。
