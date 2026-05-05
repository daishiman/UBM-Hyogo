# Phase 3: 設計レビュー

## 判定: **PASS-MINOR**

Phase 2 設計は CLAUDE.md ルール（`scripts/cf.sh` 必須）と不変条件 #5（3 層分離）に整合し、目的（実 binding 経由 smoke）を達成可能。MINOR 指摘 2 点を Phase 5 runbook で吸収する。

## 代替案比較

### 案 A: 全部 staging で済ます（local smoke 省略）

| 観点 | 評価 |
| --- | --- |
| 利点 | esbuild mismatch 問題を回避できる。staging が production と同一 runtime のため信頼度高 |
| 欠点 | (1) staging deploy ごとにイテレーションが遅い。(2) D1 staging データを smoke 用に汚す or seed 別途用意が必要。(3) ローカル開発体験が改善しないまま残り、再発する |
| 不変条件適合 | #5 適合。ただし local 検証ループが無いため、`apps/web` の D1 直接 import 等の lint 失敗を CI まで遅延させる |
| 判定 | **不採用**。CLAUDE.md は `scripts/cf.sh` 経由で local 起動可能と明記しているため local 省略は逃げ |

### 案 B: local 必須 + staging 必須（**採用**）

| 観点 | 評価 |
| --- | --- |
| 利点 | local で素早く反復、staging で実 Cloudflare runtime 確認の二段網羅。本タスクの「mock では検出不能領域」を完全カバー |
| 欠点 | esbuild mismatch を最初に解く必要がある（→ `scripts/cf.sh` 採用で恒久解決） |
| 不変条件適合 | #5 完全適合（経路自体を 2 環境で踏む） |
| 判定 | **採用** |

### 案 C: vitest + miniflare で D1 in-memory smoke

| 観点 | 評価 |
| --- | --- |
| 利点 | CI に組込可能 / 高速 |
| 欠点 | (1) miniflare は実 Cloudflare runtime ではないため staging 固有問題（vars / route / asset binding）を検出できない。(2) 本タスクのスコープ（手動 smoke）を超える |
| 判定 | **不採用**（08a の test 戦略と責務が重複。本 followup は手動 smoke gate として独立価値がある） |

## MINOR 指摘事項

### M-1: D1 binding 未 apply 時の振る舞い

local で D1 migration が未 apply の場合、`/members` が空配列 200 を返す可能性があり「mock と区別がつかない」状態になる。

**対応**: Phase 5 runbook の「事前準備」に migration 状況確認コマンドを必須ステップとして明記。

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev
# 全 migration が applied であることを確認
```

### M-2: staging `PUBLIC_API_BASE_URL` の確認手順

Phase 2 では「vars dump」と曖昧。具体的に `wrangler.toml` の `[env.staging.vars]` セクションを Read するか、`bash scripts/cf.sh ... vars list` の正確な手順を Phase 5 で確定する。

**対応**: Phase 5 runbook に `apps/web/wrangler.toml` の `[env.staging.vars]` を Read で確認する手順を追記。

## MAJOR 指摘事項

なし。

## 不変条件 trace 再確認

| # | 設計での担保 |
| --- | --- |
| #5 | smoke 経路自体が `apps/web → apps/api → D1` を踏む。さらに AC-7 で `apps/web` 配下の D1 直接 import 0 件を `rg` で確認 |
| #1 | `/members` レスポンス内の任意項目（extraFields 経路）が 200 で返ることで間接確認 |
| #6 | smoke 対象に GAS endpoint を含めない |

## レビュー結論

- **採用案**: 案 B（local 必須 + staging 必須）
- **MINOR 2 件** を Phase 5 runbook へ持ち越し
- 次フェーズ（Phase 4 テスト戦略）では curl matrix を route × env × expected status の 8 セルで明示する

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 3
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 目的

Phase 3 の責務を、real Workers + D1 smoke 仕様の AC と不変条件に接続して明確化する。

## 実行タスク

- 設計リスクを PASS / MINOR / MAJOR で判定する
- 未解決リスクが Phase 4 以降に trace されていることを確認する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] Phase 3 の成果物が存在する
- [ ] AC / evidence / dependency trace に矛盾がない

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。

