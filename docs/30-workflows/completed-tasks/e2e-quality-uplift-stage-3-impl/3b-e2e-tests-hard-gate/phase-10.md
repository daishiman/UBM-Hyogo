# Phase 10: 最終レビュー（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` ～ `phase-9.md` |
| 出力 | self-review checklist / 不変条件 drift チェック / GO/NO-GO |
| 運用 | solo（self-review。レビュアー必須化なし） |

---

## 1. self-review checklist

### 1.1 仕様整合

| # | 項目 | 確認 |
|---|------|------|
| R-01 | AC-3b-1..AC-3b-6 が phase-5 実装で全件カバー | ✅ |
| R-02 | phase-2.md の workflow 構造 / reporter / coverage gate と phase-5 実装が 1:1 対応 | ✅ |
| R-03 | BLK-3b-01..BLK-3b-03 の解消手順が phase-4..phase-13 のどこかに登場 | BLK-3b-01: phase-5 §7 / BLK-3b-02: phase-1 §2 / BLK-3b-03: phase-13 §手動オペレーション順序 |
| R-04 | Q-3b-01..Q-3b-03 の判定が固定 | Q-3b-01 採用 / Q-3b-02 monocart 経由 / Q-3b-03 failure 時のみ |
| R-05 | Stage 2 完了が前提として明示 | phase-1 §2 / phase-4 §0 / phase-7 §1 |

### 1.2 不変条件 drift チェック（3b 固有）

| # | 不変条件 | drift 判定 |
|---|---------|-----------|
| INV-01 | 既存 reporter（`html`/`json`/`list`）維持 | drift なし（phase-5 §1.2 で末尾追加のみ） |
| INV-02 | reporter 配列順序保持 | drift なし |
| INV-03 | coverage threshold は `quality-gates.md §7.5` 参照（80%） | drift なし（script 内コメントで根拠 path 記載 phase-5 §3） |
| INV-04 | `wrangler` 直叩き禁止 | drift なし（CI 内で `wrangler` 不使用） |
| INV-05 | context 名 `e2e-tests-coverage-gate` 完全一致 | drift なし（phase-5 §4 / phase-9 Y-02） |
| INV-06 | major version 固定（`@v4`） | drift なし（phase-5 §4 / phase-9 Y-04） |
| INV-07 | `pnpm 10.33.2` / `node 24.15.0`（CLAUDE.md / `.mise.toml`） | drift なし |
| INV-08 | `127.0.0.1` 等の開発用 endpoint 焼き込み禁止 | drift なし（phase-9 S-05） |

### 1.3 CONST_007 single cycle

| # | 項目 | 確認 |
|---|------|------|
| C-01 | Phase 1→2→3→...→13 が一直線 | ✅ |
| C-02 | 戻りループ・条件分岐ループなし | ✅ |

### 1.4 ファイル責務分離

| 成果物 | 責務 | 重複なし確認 |
|--------|------|-------------|
| `apps/web/playwright.config.ts` | reporter 設定 | ✅（既存責務に追加のみ） |
| `apps/web/package.json` | 依存宣言 | ✅ |
| `.github/workflows/e2e-tests.yml` | e2e + coverage gate CI | ✅ |
| `scripts/coverage-gate-e2e.sh` | E2E coverage 80% 判定ロジック | ✅（既存 `coverage-guard.sh` と責務分離 — phase-8 §2） |
| `scripts/__tests__/coverage-gate-e2e.fixture/` | 単体テスト fixture | ✅ |

---

## 2. 受入基準 trace（index.md AC-02..AC-04）

| AC | 担保 phase | 担保内容 |
|----|-----------|---------|
| AC-02 | phase-2 §2 / phase-4 §2 / phase-5 §2 §3 §4 / phase-7 §2 / phase-11 §3 | gate script + dummy fail 再現 + critical-route fail-fast |
| AC-03 | phase-2 §1 / phase-5 §1 | reporter swap 差分（末尾追加） |
| AC-04 | phase-2 §3 §4 / phase-5 §4 / phase-11 §3 | artifact 設計 + `gh run download` |

### 2.1 補助 AC trace

| AC | 担保 phase |
|----|-----------|
| AC-3b-1 PR トリガで job 起動 | phase-2 §3.1 / phase-5 §4 / phase-11 §3 |
| AC-3b-2 line < 80 で fail | phase-5 §3 / phase-7 §2.4 / phase-11 §3 |
| AC-3b-3 critical-route fail-fast | phase-2 §3.3 / phase-5 §4 / phase-11 §3 |
| AC-3b-4 coverage artifact retention 14 日 | phase-2 §4 / phase-5 §4 |
| AC-3b-5 failure 時 HTML report retention 7 日 | phase-2 §4 / phase-5 §4 |
| AC-3b-6 monocart 含み既存維持 | phase-2 §1 / phase-5 §1 |

---

## 3. リスク再点検

| risk（phase-2 §7） | 緩和反映 phase | 状態 |
|-------------------|---------------|------|
| coverage flakiness | phase-6 §2 | F-01..F-05 緩和策確認 |
| reporter 追加で evidence 破損 | phase-5 §1 | 既存 reporter 維持を明示 |
| context タイポで永久 pending | phase-4 §6 / phase-9 Y-02 | 名称完全一致 + 1 PR 観測必須化 |
| critical-route retry 過多 | phase-6 §2.2 | retries=2 維持 |
| monocart source map 解決失敗 | phase-2 §2.1 | sourceFilter で限定 |

---

## 4. 残課題（3b 終了後に残るもの）

| ID | 内容 | 引き取り先 |
|----|------|-----------|
| RB-3b-01..RB-3b-04 | composite action / build 共有 / paths filter / shell helper 抽出 | Stage 4 backlog（phase-12 で記録） |
| 3c branch protection | `e2e-tests-coverage-gate` を required contexts に追加 | 別 spec：`../3c-branch-protection-contexts/` |

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

**GO** — Phase 11（手動テスト / evidence）へ進む。3a と並走可。3c は本タスクの context 登録後に別 spec で実施。

---

## 6. 引き継ぎ（Phase 11 へ）

| 項目 | 内容 |
|------|------|
| Phase 11 タスク | draft PR で実 CI run 観測 / coverage line >= 80 実測 / 故意 79.99% fail 再現 / artifact 取得確認 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 10
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented-local

## 目的

3b の AC trace / INV drift / CONST_007 / 残課題引き取り先を self-review で確認し、Phase 11 への移行を確定する。

## 実行タスク

- 親 phase-10.md §1 / §2 から 3b 関連箇所を抽出。
- AC-02..AC-04 と AC-3b-1..6 の trace 表を整備。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-10.md

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
- 必要に応じた apps/web / scripts / .github 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=80%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
