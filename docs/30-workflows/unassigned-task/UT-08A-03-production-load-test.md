# UT-08A-03: production 環境負荷テスト

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-08A-03 |
| タスク名 | production 環境負荷テスト |
| 分類 | operations / NON_VISUAL |
| 対象機能 | Cloudflare Workers (`apps/api` / `apps/web`) / D1 |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | 08a Phase 12 unassigned-task-detection §3 |
| 発見日 | 2026-04-30 |
| 検出元ファイル | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` |
| 推奨割当 | 09b 以降の release runbook（運用フェーズ） |

## 概要

無料枠制約下での MVP 公開後の運用フェーズに向けて、Cloudflare Workers free tier / D1 free tier の上限（CPU 時間・request/day・D1 row read/day 等）に対する負荷シナリオと thresholds を定義し、実測する。

## 背景

08a は contract / authz / repository / type / lint の自動テスト整備が責務であり、production 相当の負荷観測は scope out。Cloudflare 無料枠は `100,000 req/day` / `10ms CPU/req` / `D1 5M reads/day` 等のハードリミットがあり、超過時の挙動（503・throttling・課金移行）を MVP 期間内に把握しておく必要がある。

## 受入条件

- 想定 MVP 利用者規模（同時接続・peak RPS）を `docs/00-getting-started-manual/specs/00-overview.md` に基づき定義する。
- k6 / artillery / wrangler tail の組合せで public route の代表 endpoint に対して負荷シナリオを実行し、p50/p95/p99 latency と error rate を記録する。
- D1 read/write の daily quota 消費見込みを実測 1 日サンプルから外挿する。
- 結果を `docs/30-workflows/` の運用 runbook に格納し、09b release gate に紐付ける。

## 苦戦箇所【記入必須】

- 対象: Cloudflare Workers 無料枠の負荷テスト実施環境
- 症状: 自分自身が production environment に対して負荷テストを実施すると、無料枠を消費して実ユーザーへの 503 を誘発するリスクがある。staging 環境での測定は workers-free と D1-free の単一枠を共有するため、本番影響を完全に切り離せない。実施タイミング・観測経路・abort 条件を明確に決めないと運用障害化する。
- 参照: `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §3

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 無料枠を負荷テストで使い切り実ユーザーが 503 になる | 深夜帯・staging 専用環境・上限直前で abort する thresholds を runbook に明記する |
| 計測値が一過性で運用判断に使えない | 1 日連続稼働の sample と peak シナリオの 2 種を最小実施し、外挿根拠を残す |
| 課金移行のトリガを引く | wrangler observability の usage metric を測定中は常時監視し、80% 到達で停止する |

## 検証方法

### 要件検証

```bash
rg "100,?000|free.?tier|cpu.?time|daily.?limit" docs/00-getting-started-manual
```

期待: 無料枠制約が現行仕様にどこまで明記されているかを確認し、不足があれば本タスクで補う。

### 観測準備

```bash
bash scripts/cf.sh whoami
```

期待: `scripts/cf.sh` 経由で wrangler observability にアクセス可能。

## スコープ

### 含む

- 負荷シナリオ定義（peak / 1 日連続）
- 実行環境（staging or production 限定 window）の選択
- 結果集計と 09b release gate への紐付け

### 含まない

- visual regression（UT-08A-02）
- KV / R2 stress test（別タスクで個別対応）
- 商用課金プラン移行検討

## 関連

- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
