# Phase 3: 設計レビュー（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` |
| 出力 | 4-condition gate 判定 / 命名整合性 / solo policy 整合 / GO・NO-GO |

---

## 1. 4-condition gate

| # | 条件 | 評価 | 根拠 |
|---|------|------|------|
| C1 | 受入基準が測定可能 | PASS | AC-3a-1..5 が `gh run` / `gh api check-runs` / artifact / `jq` で機械検証可能 |
| C2 | 不変条件と矛盾しない | PASS | `required_pull_request_reviews=null` / Lighthouse は PR to `dev` のみ / `wrangler` 直叩きなし / `process.env.*` 直接参照なし |
| C3 | 依存タスクが解決済み or ブロッキングが明示 | CONDITIONAL | Stage 2 完了が前提（親 stage-3 phase-3 CONDITIONAL GO 解消条件と同じ） |
| C4 | リスクと緩和策が一対 | PASS | phase-2 §5 で 5 リスク全てに具体的緩和策を 1 対 1 紐付け |

---

## 2. 依存・命名・solo policy 整合性チェックリスト

### 2.1 依存

| ID | 内容 | 解消条件 |
|----|------|----------|
| DEP-01 | Stage 2 完了 | 親 `docs/30-workflows/e2e-quality-uplift-stage-2/index.md` の Phase 13 done |
| DEP-02 | `pnpm --filter @ubm-hyogo/web build` の CI 実績 | `pr-build-test.yml` 過去 run green |
| DEP-03 | `@lhci/cli` 未導入 | Phase 5 内で `pnpm add -D` 実行・lockfile commit |
| DEP-04 | context `lighthouse-ci` の GitHub 登録 | 本 PR (PR-A) merge 後の dev で 1 回 success run を実観測（Phase 11） |

### 2.2 命名整合性

| 観点 | 一致箇所 | 状態 |
|------|---------|------|
| workflow `name:` | `lighthouse-ci`（YAML）= context 名（3c 適用 payload） | OK |
| `jobs.lighthouse.name:` | `lighthouse-ci` = check-runs API の `name` 値 | OK |
| concurrency group | `lighthouse-${{ github.ref }}`（独立衝突回避） | OK |
| artifact name | `lhci-report-${{ github.sha }}`（sha 単位衝突回避） | OK |
| feature branch | `feat/lighthouse-ci`（PR-A 専用） | OK |

> タイポは BLK-01（context 永久 pending）を発動するため、workflow merge 前に `grep -n '^name:' .github/workflows/lighthouse.yml` で再確認。

### 2.3 solo policy 整合

| 観点 | 値 | 整合 |
|------|----|------|
| `required_pull_request_reviews` | `null` 維持（本 PR は変更しない） | OK |
| `lock_branch` | `false` 維持 | OK |
| `enforce_admins` | 既存値 `false` 維持（CLAUDE.md governance drift は本タスク範囲外） | OK（既存維持） |
| Lighthouse trigger | `pull_request: { branches: [dev] }` のみ（`main` への 2 重実行なし） | OK |

---

## 3. blocking dependencies

| ID | 内容 | 解消条件 |
|----|------|----------|
| BLK-01 | context `lighthouse-ci` 名のタイポは branch protection 適用後に永久 pending を引き起こす | Phase 9 §2 の `Y-02` で名称完全一致を検査。Phase 11 で 1 PR success 観測してから 3c 実行 |
| BLK-02 | `@lhci/cli` lockfile 未反映 | Phase 5 §3 の `pnpm add -D` 実行と `pnpm-lock.yaml` commit |
| BLK-03 | `/profile` 未認証 a11y < 0.90 で常時 fail | Phase 7 §3 の Q-02 縮退判定で 3 routes 構成へ降格 |

---

## 4. 非 blocking 観測事項

| ID | 内容 | 取扱 |
|----|------|------|
| OBS-01 | `enforce_admins=false` 現状（CLAUDE.md 期待値 `true` と drift） | 本タスクスコープ外。別 governance drift workflow で扱う |
| OBS-02 | Lighthouse perf スコアの CI ランナー揺らぎ | Phase 11 で 5 連続 run 観測してしきい値の妥当性を再評価 |

---

## 5. open questions（再掲 + 判定）

| # | 質問 | Phase 3 判定 |
|---|------|--------------|
| Q-01 | Lighthouse baseURL は localhost か preview か | **localhost 確定**（CI 安定優先 / token 不要 / `pnpm start` 利用） |
| Q-02 | `/profile` 未認証時 a11y >= 0.90 達成可否 | **Phase 7 実測判定** — 未達なら lighthouserc から `/profile` を除去し 3 routes に縮退 |
| Q-03 | `LHCI_GITHUB_APP_TOKEN` 採用 | **不採用確定** — `assert` の job 失敗で十分 |

---

## 6. GO / NO-GO

| 観点 | 判定 |
|------|------|
| 設計の一貫性 | GO |
| 受入基準の検証可能性 | GO |
| solo dev policy 整合 | GO |
| CONST_007 single cycle 遵守 | GO |
| Stage 2 依存解消 | **CONDITIONAL GO** |

### 結論

**CONDITIONAL GO** — Stage 2 完了が確認された時点で無条件 GO に昇格。Phase 4 着手前に `docs/30-workflows/e2e-quality-uplift-stage-2/index.md` の Phase 13 が `done` 表記であることを再確認する。

---

## 7. Phase 4 への引き継ぎ事項

| 項目 | 内容 |
|------|------|
| 実装順序 | Phase 4（テスト計画）→ Phase 5（実装）→ Phase 11（実 PR run 観測） |
| PR 分割 | PR-A 単独（3a のみ）。3b / 3c の差分は混入させない |
| evidence 保存先 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/outputs/phase-11/` |
| rollback 戦略 | PR-A revert で `lighthouse.yml` / `lighthouserc.json` / `apps/web/package.json` 差分を戻す |

---

## DoD（Phase 3 完了条件）

| # | 条件 |
|---|------|
| D-01 | C1..C4 全 PASS（C3 は CONDITIONAL GO 明記） |
| D-02 | DEP-01..DEP-04 / BLK-01..BLK-03 が列挙済 |
| D-03 | Q-01..Q-03 の判定が確定（Q-02 のみ Phase 7 実測判定） |
| D-04 | solo policy 整合表で全 OK |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 3
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

Phase 1-2 の設計を 4-condition gate / 依存 / 命名 / solo policy で精査し GO 判定する。

## 実行タスク

- 4-condition gate を 1 対 1 で評価する。
- DEP / BLK / OBS / Q を整理する。
- GO/NO-GO を判定する。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-3.md
- phase-1.md / phase-2.md（本サブタスク内）

## 実行手順

1. C1..C4 を評価。
2. DEP / BLK を分類。
3. Q-01..Q-03 を判定確定。
4. GO/NO-GO 結論を提示。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。

## 成果物

- 本 phase markdown
- GO/NO-GO 判定（Phase 4 着手の gate）

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスク自体は NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
