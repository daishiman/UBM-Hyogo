# Phase 1 — 要件定義

**[実装区分: 実装仕様書]**

## 1. 要件レビュー思考法（3 系統）

### システム系
- **真の論点**: 24h verification 後の **遅延型異常**（cron drift / D1 write amplification / cost creep / authz silent regression）を D+7 / D+30 で検出する仕組みが unassigned。
- **境界**: 09c は D+1 まで。本タスクは D+7 / D+30 のみを所掌。D+0〜D+1 の改修は範囲外。
- **因果**: 24h baseline → 1週間 trend → 1か月 trend という3段階で見ないと free-tier 超過 / silent error rate 上昇を月次まで見逃す。

### 戦略・価値系
- **価値**: free plan ($0) を維持しながら長期 production 健全性を可観測化。インシデント発見の MTTD を月次 → 週次へ短縮。
- **コスト**: 有料 APM 不採用。GitHub Actions scheduled (`cron`) は無料枠で十分（D+7 / D+30 1 回ずつ起動）。
- **代替**: 手動カレンダー reminder のみ → 期日忘れリスク高。Cloudflare Workers cron 追加 → 無料枠 3 本（既使用）超過リスク。**GitHub Actions が最適**。

### 問題解決系
- **改善優先順位**:
  1. (高) 期日忘れ防止 — reminder Issue 自動起票
  2. (高) 観測指標 / 閾値の固定 — runbook
  3. (中) SSOT 反映 — aiworkflow-requirements 導線
  4. (低) 実 metric 自動取得 — Cloudflare API は user token 必要なため scope 外

## 2. artifacts.json metadata

```json
{
  "metadata": {
    "taskType": "implementation",
    "visualEvidence": "NON_VISUAL",
    "workflow_state": "spec_created",
    "irreversible": false,
    "free_plan_constraint": true
  }
}
```

## 3. 観測指標 / 閾値（24h baseline 整合）

| 指標 | 24h (09c) | D+7 閾値 | D+30 閾値 | evidence path |
| --- | --- | --- | --- | --- |
| req/day（API total） | < 100k | 7日平均 < 100k かつ DoD 比 +50% 以下 | 30日平均 < 100k かつ 7日平均比 +30% 以下 | Cloudflare Analytics → `outputs/phase-11/d7-metrics.json` |
| D1 reads/day | < 5M | 7日平均 < 5M | 30日平均 < 5M | `wrangler d1 insights` 出力 |
| D1 writes/day | < 100k | 7日平均 < 100k | 30日平均 < 100k | 同上 |
| error rate (5xx) | < 1% | 7日 p95 < 1% | 30日 p95 < 1% | `post-release-dashboard.yml` artifact |
| cron success rate (3 cron) | 100% | 7日 100% | 30日 ≥ 99% | Workers logs (manual export) |
| authz smoke (admin / member 403) | PASS | D+7 manual smoke PASS | D+30 manual smoke PASS | `outputs/phase-11/authz-d7.md` / `authz-d30.md` |
| free plan headroom (req / D1) | ≥ 70% | ≥ 60% | ≥ 50% | derived from above |

**閾値超過時の分岐**:
- WARN（閾値到達 80%）: reminder Issue にコメント追加 / 監視継続
- CRITICAL（閾値超過）: rollback 検討 → `docs/runbooks/post-release-long-term-observation.md` Section 4 へ
- silent regression（authz 失敗 / cron 0%）: 即時 rollback + postmortem 起票

## 4. 機能要件

| ID | 要件 | 優先 |
| --- | --- | --- |
| FR-01 | D+7 / D+30 で reminder Issue を自動起票する | MUST |
| FR-02 | reminder Issue 本文に観測指標 / 閾値 / evidence path / 分岐手順を含める | MUST |
| FR-03 | reminder workflow は手動 `workflow_dispatch` でも起動できる | MUST |
| FR-04 | observation runbook が `docs/runbooks/` に存在する | MUST |
| FR-05 | SSOT (`aiworkflow-requirements`) 経由で runbook が検索可能 | MUST |
| FR-06 | 09c Phase 12 unassigned 行が consumed trace へ書き換わる | MUST |
| FR-07 | reminder workflow が local YAML / bash syntax / unit test PASS し、actionlint / shellcheck は UT-350-FU-01 で CI gate 化される | MUST |

## 5. 非機能要件

- **コスト**: $0（GitHub Actions scheduled 無料枠 / Cloudflare 無追加）
- **冪等性**: reminder Issue 起票時に同タイトルの open Issue があれば skip
- **保守性**: shell は POSIX 準拠 / `set -euo pipefail`
- **可観測性**: workflow run log が GitHub に残る

## 6. 制約

| 制約 | 内容 |
| --- | --- |
| C-01 | Cloudflare cron は 3 本上限（既使用）— 新規 Workers cron 追加禁止 |
| C-02 | runtime metric の auto fetch は user token を要するため Phase 11 で `PENDING_RUNTIME_EVIDENCE` 扱い |
| C-03 | reminder Issue の起票宛先 repo は `daishiman/UBM-Hyogo` 固定 |
| C-04 | release 日（D+0）は手動 `workflow_dispatch` の input か release tag から導出 |

## 7. 完了条件（Phase 1）

- [ ] 観測指標 / 閾値 / evidence path 表が確定
- [ ] 異常時分岐（WARN / CRITICAL / silent）が定義済
- [ ] FR-01〜FR-07 が列挙済
- [ ] 制約 C-01〜C-04 が記述済
- [ ] artifacts.json metadata が確定（taskType=implementation / visualEvidence=NON_VISUAL）

## 8. 検証コマンド

```bash
rg -n "1 week|1 month|D\+7|D\+30|長期観測" docs/30-workflows/issue-350-long-term-production-observation
```

期待: 本仕様書群がヒットすること。
