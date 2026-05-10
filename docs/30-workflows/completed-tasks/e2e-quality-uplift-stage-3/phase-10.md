# Phase 10: 最終レビュー（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` ～ `phase-9.md` |
| 出力 | self-review checklist / 不変条件 drift チェック / GO/NO-GO |
| 運用 | solo（レビュアー必須化なし。self-review のみ） |

---

## 1. self-review checklist

### 1.1 仕様整合

| # | 項目 | 確認 |
|---|------|------|
| R-01 | サブタスク 3a / 3b / 3c の受入基準（phase-1 §2.3 / §3.3 / §4.3）が phase-5 実装で全件カバー | ✅ |
| R-02 | phase-2.md の workflow 構造と phase-5 実装が 1:1 対応 | ✅ |
| R-03 | phase-3 BLK-01..BLK-03 解消手順が phase-4..phase-13 のどこかに登場 | BLK-01: phase-4 §0 / BLK-02: phase-5 §4 / BLK-03: phase-4 §3.2 + phase-5 §3.1 |
| R-04 | Q-01..Q-03 の判定が固定 | Q-01 deferred / Q-02 localhost / Q-03 phase-7 §3 |
| R-05 | Stage 2 完了が前提として明示 | phase-4 §0 / phase-7 §1 |

### 1.2 不変条件 drift チェック

| # | 不変条件 | drift 判定 |
|---|---------|-----------|
| INV-01 | `required_pull_request_reviews=null`（solo policy） | drift なし（payload で明示維持） |
| INV-02 | `lock_branch=false` | drift なし |
| INV-03 | `required_status_checks.strict=false`（merge queue 未導入） | drift なし |
| INV-04 | Lighthouse CI は PR to `dev` のみ | drift なし（`on.pull_request.branches: [dev]`） |
| INV-05 | coverage threshold は `quality-gates.md §7.5` 参照（70%） | drift なし（script 内コメントで根拠 path 記載） |
| INV-06 | `wrangler` 直叩き禁止 | drift なし（CI 内で `wrangler` 不使用） |
| INV-07 | `enforce_admins` 既存値維持（既存 `false`） | drift なし（payload で `false` 明示） |

### 1.3 CONST_007 single cycle

| # | 項目 | 確認 |
|---|------|------|
| C-01 | Phase 1→2→3→...→13 が一直線 | ✅ |
| C-02 | 戻りループ・条件分岐ループなし | ✅（Q-03 縮退判定は phase-7 内で完結し phase 戻り発生なし） |

### 1.4 ファイル責務分離

| 成果物 | 責務 | 重複なし確認 |
|--------|------|-------------|
| `lighthouserc.json` | Lighthouse assertion 値 | ✅ |
| `.github/workflows/lighthouse.yml` | lhci CI 実行 | ✅ |
| `.github/workflows/e2e-tests.yml` | e2e + coverage gate CI | ✅ |
| `apps/web/playwright.config.ts` | reporter 設定 | ✅（既存責務に追加のみ） |
| `scripts/coverage-gate-e2e.sh` | coverage 70% 判定ロジック | ✅ |

---

## 2. 受入基準 trace（index.md AC-01..AC-06）

| AC | 担保 phase | 担保内容 |
|----|-----------|---------|
| AC-01 | phase-2 §1 / phase-4 §1 / phase-5 §1 / phase-11 §lhci | lighthouserc + workflow + 実 PR 観測 |
| AC-02 | phase-2 §2 / phase-4 §2 / phase-5 §2 / phase-7 §2 | gate script + dummy fail 再現 |
| AC-03 | phase-2 §2.1 / phase-5 §2.1 | reporter swap 差分 |
| AC-04 | phase-2 §2.4 / phase-5 §2.4 | artifact 設計 |
| AC-05 | phase-2 §3 / phase-5 §3 / phase-11 §branch-protection | gh api PUT + jq 検証 |
| AC-06 | phase-9 §4 / phase-11 §branch-protection | payload schema + post 検証 |

---

## 3. リスク再点検

| risk（phase-2 §5） | 緩和反映 phase | 状態 |
|-------------------|---------------|------|
| CI minute budget 超過 | phase-6 §1 | 試算済（4% 余裕） |
| coverage flakiness | phase-6 §2 | F-01..F-05 緩和策確認 |
| Lighthouse perf 揺らぎ | phase-7 §3 / phase-11 | 5 連続 run 観測手順あり |
| `/profile` a11y 偏り | phase-7 §3 | Q-03 判定手順確定 |
| reporter 追加で evidence 破損 | phase-5 §2.1 | 既存 reporter 維持を明示 |
| branch protection PUT で `{}` drift | phase-9 §4 | payload schema 検証 BP-01..BP-04 |
| context タイポで永久 pending | phase-4 §3.2 / phase-9 Y-02 | 名称完全一致 + 1 PR 観測必須化 |

---

## 4. 残課題（Stage 3 終了後に残るもの）

| ID | 内容 | 引き取り先 |
|----|------|-----------|
| OBS-01 | `enforce_admins=false` drift（CLAUDE.md 期待 `true`） | 別 governance drift workflow |
| OBS-02 | `required_linear_history=false` | 同上 |
| RB-01..RB-04 | reusable workflow / composite action / paths filter / merge queue | Stage 4 backlog（phase-12 で記録） |
| EXT-01 | `/profile` 認証済 a11y 計測 | Stage 4 以降 |

---

## 5. GO / NO-GO

| 観点 | 判定 |
|------|------|
| 全 AC trace 完備 | GO |
| 全 INV drift なし | GO |
| CONST_007 遵守 | GO |
| 残課題が引き取り先に明示 | GO |
| Stage 2 完了前提が明示 | GO |

### 結論

**GO**（Stage 2 完了済みを前提として無条件 GO。Stage 2 未完なら CONDITIONAL GO に降格し phase-4 §0 で阻止）。

---

## 6. 引き継ぎ（Phase 11 へ）

| 項目 | 内容 |
|------|------|
| Phase 11 タスク | draft PR で実 CI run 観測 / Lighthouse 実測スコア取得 / branch protection 適用 evidence |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 10
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

