# Phase 3: 設計レビュー（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` |
| 出力 | 4-condition gate 判定 / GO・NO-GO |

---

## 1. 4-condition gate

| # | 条件 | 評価 | 根拠 |
|---|------|------|------|
| C1 | 受入基準が測定可能 | PASS | AC-3a-1..4 / AC-3b-1..6 / AC-3c-1..5 が全て `gh run` / `gh api` / artifact / `jq` で機械検証可能 |
| C2 | 不変条件と矛盾しない | PASS | `required_pull_request_reviews=null` / `lock_branch=false` を payload で明示維持。standard tier=70% を quality-gates.md から踏襲。`wrangler` 直叩きなし |
| C3 | 依存タスクが解決済み or ブロッキングが明示 | CONDITIONAL | Stage 2（`docs/30-workflows/e2e-quality-uplift-stage-2/`）は artifacts と Phase 1-13 を保有し、Stage 3 着手条件を満たす |
| C4 | リスクと緩和策が一対 | PASS | phase-2.md §5 で 7 リスク全てに対し具体的緩和策を 1 対 1 紐付け |

---

## 2. blocking dependencies

| ID | 内容 | 解消条件 |
|----|------|----------|
| BLK-01 | Stage 2 dependency verified | `docs/30-workflows/e2e-quality-uplift-stage-2/index.md` と artifacts.json が存在し、runtime E2E は Stage 3 の user-gated evidence として分離 |
| BLK-02 | `monocart-reporter` / `c8` / `@lhci/cli` が `apps/web/package.json` に未追加 | Phase 5 実装内で `pnpm add -D` を実行し lockfile に反映 |
| BLK-03 | Stage 3a / 3b の context 名が GitHub に未登録のまま 3c を実行すると PR 永久 pending | 3a / 3b を dev へマージし、それぞれ実 run を 1 回観測してから 3c を実行する順序を厳守 |

---

## 3. 非 blocking 観測事項

| ID | 内容 | 取扱 |
|----|------|------|
| OBS-01 | `enforce_admins=false` 現状（CLAUDE.md 期待値 `true` と drift） | Stage 3 スコープ外。別 governance drift workflow で扱う |
| OBS-02 | `required_linear_history=false`（CLAUDE.md は `required_linear_history` 推奨） | 同上、Stage 3 では現状維持 |
| OBS-03 | Lighthouse perf スコアの CI ランナー揺らぎ | Phase 11 evidence で 5 PR 以上の連続 run を観測してしきい値の妥当性を再評価 |

---

## 4. open questions（再掲 + 判定）

| # | 質問 | Phase 3 判定 |
|---|------|--------------|
| Q-01 | `enforce_admins` drift 是正 | **deferred** — Stage 3 スコープ外 |
| Q-02 | Lighthouse baseURL は localhost か preview か | **localhost 確定**（CI 安定優先 / token 不要 / `pnpm start` 利用） |
| Q-03 | `/profile` 未認証時 a11y 達成可否 | **Phase 5 実測判定** — 未達なら lighthouserc から `/profile` を除去し 3 routes に縮退 |

---

## 5. GO / NO-GO

| 観点 | 判定 |
|------|------|
| 設計の一貫性 | GO |
| 受入基準の検証可能性 | GO |
| solo dev policy（`required_pull_request_reviews=null`）整合 | GO |
| CONST_007 single cycle 遵守（Phase 1→2→3 一直線、ループなし） | GO |
| Stage 2 依存解消 | **CONDITIONAL GO** |

### 結論

**CONDITIONAL GO** — Stage 3 の Phase 4（実装計画）以降への移行は **Stage 2 完了**を前提とする。Stage 2 の Phase 3 GO 判定が出た時点で本 Stage 3 は無条件 GO に昇格する。

順序遵守:

1. Stage 2 GO 確認
2. 3a Lighthouse CI を独立 PR で `dev` へマージ
3. 3b `e2e-tests.yml` hard gate を独立 PR で `dev` へマージ
4. 3a / 3b の context が 1 PR の green run で GitHub 側に登録されたことを `gh api repos/daishiman/UBM-Hyogo/commits/<sha>/check-runs` で確認
5. 3c branch protection を `dev` → `main` の順で `gh api PUT` 実行
6. 適用後 `jq` で 5 contexts / `required_pull_request_reviews=null` / `lock_branch=false` の drift なしを Phase 11 evidence に保存

---

## 6. Phase 4 への引き継ぎ事項

| 項目 | 内容 |
|------|------|
| 実装順序 | 3a → 3b → 3c（順序厳守） |
| PR 分割 | 3a 単独 PR / 3b 単独 PR / 3c は PR 不要（手動 `gh api`） |
| evidence 保存先 | `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/` |
| rollback 戦略 | branch protection は適用前 payload を `branch-protection-pre.json` として保存し、問題発生時は同 payload を PUT で戻す |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 3
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 3 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

