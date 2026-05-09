# Phase 3: 設計レビュー（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` / `phase-2.md` |
| 出力 | 4-condition gate 判定 / blocking dependencies / GO・NO-GO |
| 運用 | solo（self-review。レビュアー必須化なし） |

---

## 1. 4-condition gate

| # | 条件 | 評価 | 根拠 |
|---|------|------|------|
| C1 | 受入基準が測定可能 | PASS | AC-3b-1..6 が `gh run` / artifact / `jq` で機械検証可能 |
| C2 | 不変条件と矛盾しない | PASS | 既存 reporter 末尾追加のみ / context 名完全一致 / 70% は quality-gates.md §7.5 正本参照 / `wrangler` 不使用 |
| C3 | 依存タスクが解決済み or ブロッキングが明示 | CONDITIONAL | Stage 2 完了確認済（phase-1 §2）。3a / 3c との順序を BLK で明示 |
| C4 | リスクと緩和策が一対 | PASS | phase-2 §7 で 5 リスク全てに 1 対 1 緩和策 |

---

## 2. solo policy 整合

| # | 項目 | 判定 | 備考 |
|---|------|------|------|
| SP-01 | `required_pull_request_reviews=null` 維持 | PASS | 3b 単体ではブランチ保護 payload を変更しない（3c 担当） |
| SP-02 | レビュアー必須化なし | PASS | self-review のみ |
| SP-03 | `enforce_admins` 既存値維持 | PASS | 3b 単体では変更しない |
| SP-04 | `lock_branch=false` 維持 | PASS | 同上 |

---

## 3. 既存 reporter 互換性チェック

| # | 互換性観点 | 判定 |
|---|-----------|------|
| RC-01 | `html` reporter 出力先（`${EVIDENCE_DIR}/playwright-report/html`） | 維持 |
| RC-02 | `json` reporter 出力先（`${EVIDENCE_DIR}/playwright-report/results.json`） | 維持 |
| RC-03 | `list` reporter（stdout） | 維持 |
| RC-04 | reporter 配列順序（既存 3 件→末尾に monocart 追加） | 順序保持 |
| RC-05 | Stage 0/1 evidence path 参照側（grep / artifact 取得） | 影響なし |
| RC-06 | TypeScript 型不整合の有無 | `monocart-reporter` 型は library 提供 / `apps/web/playwright.config.ts` は型推論で吸収 |

---

## 4. 依存関係チェック

### 4.1 内部依存

| ID | 依存先 | 状態 |
|----|--------|------|
| DEP-01 | Stage 2 の coverage 70% 到達 | 完了 |
| DEP-02 | Stage 2 の `@critical-route` tag 付与 | 完了 |
| DEP-03 | `apps/web/playwright.config.ts` の `EVIDENCE_DIR` 規約 | 既存 |

### 4.2 外部 / 並走サブタスク依存

| ID | 関係 | 内容 |
|----|------|------|
| EXT-3a | parallel | 3a Lighthouse CI と独立 PR で並走可。コンフリクト無し（編集ファイル重複なし） |
| EXT-3c | downstream | 3c は本タスクの context（`e2e-tests-coverage-gate`）が GitHub に登録された後に branch protection PUT を実行。順序逆転は PR 永久 pending を招く（BLK-03） |

---

## 5. blocking dependencies

| ID | 内容 | 解消条件 |
|----|------|----------|
| BLK-3b-01 | `monocart-reporter` / `c8` が `apps/web/package.json` 未追加 | Phase 5 実装で `pnpm add -D` を実行し lockfile に反映 |
| BLK-3b-02 | `@critical-route` tag 付与済（Stage 2 引き継ぎ） | 確認済（phase-1 §2） |
| BLK-3b-03 | 3b context 名 `e2e-tests-coverage-gate` が GitHub 未登録のまま 3c 実行は禁止 | 3b を `dev` merge 後、1 PR で実 run 観測してから 3c へ |

---

## 6. 非 blocking 観測事項

| ID | 内容 | 取扱 |
|----|------|------|
| OBS-3b-01 | CI minute budget が 4% 余裕（phase-6 で詳細） | phase-6 で path filter 採否判断 |
| OBS-3b-02 | `monocart-reporter` の library 更新で型変更可能性 | `^2.9.0` で minor 更新追従。breaking 時は phase-9 actionlint / typecheck で検出 |

---

## 7. open questions（再掲 + 判定）

| # | 質問 | Phase 3 判定 |
|---|------|--------------|
| Q-3b-01 | `entryFilter` を `_next/static/` に限定するか | **採用**（flaky 削減） |
| Q-3b-02 | c8 単独 vs. monocart 経由 | **monocart 経由**（二重計測回避） |
| Q-3b-03 | HTML report の常時 upload vs. failure 時のみ | **failure 時のみ**（artifact 容量節約） |

---

## 8. GO / NO-GO

| 観点 | 判定 |
|------|------|
| 設計の一貫性 | GO |
| 受入基準の検証可能性 | GO |
| solo dev policy 整合 | GO |
| CONST_007 single cycle 遵守 | GO |
| Stage 2 依存解消 | GO |

### 結論

**GO** — Phase 4 へ進む。3b は 3a と独立 PR で並走可。3c は 3b の context 登録後に実行。

---

## 9. Phase 4 への引き継ぎ事項

| 項目 | 内容 |
|------|------|
| 実装順序 | 3b 単独 PR-B として進行。3a と並走可。3c は本タスクの context 登録後に別途 |
| evidence 保存先 | `outputs/phase-11/` |
| rollback 戦略 | reporter swap は revert で復帰可。workflow YAML も revert で復帰可 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 3
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3b の設計が 4-condition gate を通過し、solo policy / 既存 reporter / 依存関係に矛盾がないことを self-review で確認する。

## 実行タスク

- 親 phase-3.md から 3b 関連箇所を抽出。
- BLK / OBS / Q を 3b スコープで再整理。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-3.md

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
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
