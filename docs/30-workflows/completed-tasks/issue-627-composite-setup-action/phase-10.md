# Phase 10: 受け入れテスト（DoD trace / 削減実測 / GO 判定）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-1.md` ～ `phase-9.md` / `outputs/phase-11/evidence/`（Phase 8-9 で生成） |
| 出力 | DoD-1..DoD-5 trace / 削減行数 before-after 比較 / branch protection drift report / GO/NO-GO |
| 運用 | solo（self-acceptance） |

---

## 0. 目的

Issue #627 の **全体 DoD-1..DoD-5**（index.md §6）が `phase-1`～`phase-9` のいずれかで担保されていることを trace し、削減実測値と branch protection の drift 不在をもって最終 GO を出す。

---

## 1. DoD trace（index.md §6 → phase）

| DoD | 内容 | 担保 phase | 担保コマンド / 観点 |
|-----|------|-----------|------------------|
| DoD-1 | `.github/actions/setup-project/action.yml` 存在 + composite structure / SHA pin gate pass + workflow actionlint pass | phase-6（実装）/ phase-8 §1 §2 | AL-01 / CA-01 |
| DoD-2 | 7 job が composite 呼び出しに置換、削減行数を `outputs/phase-11/evidence/setup-lines-delta.md` に保存 | phase-7（置換）/ phase-8 §4 §5 | G-04 hit >= 7 / D-01..D-03 |
| DoD-3 | draft PR で `ci` / `lighthouse-ci` / `e2e-tests` / `pr-build-test` の全 required check が green | phase-9 §2 | M-01..M-04 全 `success` |
| DoD-4 | branch protection の required contexts が変更されていない | phase-9 §4 / 本 phase §3 | R-03 diff empty |
| DoD-5 | Issue #627 reference（CLOSED 維持 / close keyword 禁止） | phase-13 | `gh issue view 627 --json state,closedAt` |

---

## 2. 削減行数の before-after 比較（実測）

### 2.1 before（origin/dev 時点）

| workflow | setup boilerplate 行数（実測） |
|---------|----------------------------|
| `ci.yml` (3 job) | Phase 11 実測で記録 |
| `lighthouse.yml` (1 job) | Phase 11 実測で記録 |
| `e2e-tests.yml` (2 job) | Phase 11 実測で記録 |
| `pr-build-test.yml` (1 job) | Phase 11 実測で記録 |
| **合計** | Phase 11 `setup-lines-delta.md` を正本にする |

測定コマンド:

```bash
git show origin/dev:.github/workflows/ci.yml | grep -cE 'checkout@v4|setup-node@v4|pnpm/action-setup@v4|pnpm install --frozen-lockfile|mise-action'
git show origin/dev:.github/workflows/lighthouse.yml | grep -cE 'checkout@v4|setup-node@v4|pnpm/action-setup@v4|pnpm install --frozen-lockfile'
git show origin/dev:.github/workflows/e2e-tests.yml | grep -cE 'checkout@v4|setup-node@v4|pnpm/action-setup@v4|pnpm install --frozen-lockfile'
git show origin/dev:.github/workflows/pr-build-test.yml | grep -cE 'checkout@v4|mise-action|pnpm install --frozen-lockfile'
```

### 2.2 after（本 PR 時点）

```bash
grep -cE 'checkout@v4|setup-node@v4|pnpm/action-setup@v4|pnpm install --frozen-lockfile|mise-action' .github/workflows/ci.yml .github/workflows/lighthouse.yml .github/workflows/e2e-tests.yml .github/workflows/pr-build-test.yml
```

期待: 4 workflow 合計 **0**（全て composite 内に移動）。

### 2.3 判定

| # | 指標 | pass 条件 |
|---|------|---------|
| AT-01 | 削減率 `(B - A) / B` | >= 0.70（70%）|
| AT-02 | composite 呼び出し件数 | >= 7 |
| AT-03 | `.github/actions/setup-project/action.yml` 純増行数 | < 60 行（過剰抽象化を避ける） |

実測値は `outputs/phase-11/evidence/setup-lines-delta.md` に before/after/削減率の 3 値で記録する。

---

## 3. branch protection contexts drift 確認

### 3.1 取得

| # | コマンド | 保存先 |
|---|---------|--------|
| BP-01 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` | `outputs/phase-11/evidence/branch-protection-dev-after.json` |
| BP-02 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` | `outputs/phase-11/evidence/branch-protection-main-after.json` |

### 3.2 diff

| # | コマンド | 期待 |
|---|---------|------|
| BP-03 | `diff outputs/phase-11/evidence/branch-protection-dev.json outputs/phase-11/evidence/branch-protection-dev-after.json` | empty diff |
| BP-04 | `jq -r '.required_status_checks.contexts[]' outputs/phase-11/evidence/branch-protection-dev-after.json \| sort` | 既存 contexts と同一集合 |
| BP-05 | `jq '.required_pull_request_reviews' outputs/phase-11/evidence/branch-protection-dev-after.json` | `null`（solo policy 不変） |
| BP-06 | `jq '.enforce_admins.enabled' outputs/phase-11/evidence/branch-protection-dev-after.json` | `true` |

> BP-03 で差分が出た場合は **本 PR スコープ外の drift**。Phase 7 に戻る前に CLAUDE.md governance ポリシーを再確認し、別 issue 化を検討する。

---

## 4. 不変条件 drift チェック

| # | 不変条件 | drift 判定 |
|---|---------|-----------|
| INV-01 | `required_pull_request_reviews=null` | BP-05 で確認 |
| INV-02 | `enforce_admins=true` | BP-06 で確認 |
| INV-03 | required contexts に `ci` / `lighthouse-ci` / `e2e-tests` / `pr-build-test` を含む | BP-04 で確認 |
| INV-04 | `wrangler` 直叩き禁止 | `grep -RE '\bwrangler\b' .github/actions/setup-project/action.yml .github/workflows/*.yml` → hit 0 |
| INV-05 | `apps/web/src` への `process.env.*` 新規追加なし | `git diff origin/dev...HEAD -- apps/web/src/` → 0 ファイル |
| INV-06 | CONST_007 single cycle | phase-1→13 一直線（本 phase 内で再確認） |

---

## 5. self-review checklist

### 5.1 仕様整合

| # | 項目 | 確認 |
|---|------|------|
| R-01 | index.md §6 DoD-1..DoD-5 全件が §1 trace に登場 | ✅ |
| R-02 | 7 job 置換 → composite 呼び出しの 1:1 対応 | phase-7 §1 |
| R-03 | `setup-strategy: mise` 分岐の動作が phase-9 C-04 で観測 | ✅ |
| R-04 | context 名 drift なし（BLK-01 系再発防止） | BP-04 |
| R-05 | 削減目標 70% 達成 | AT-01 |

### 5.2 ファイル責務分離

| 成果物 | 責務 | 重複なし確認 |
|--------|------|-------------|
| `.github/actions/setup-project/action.yml` | setup boilerplate の単一定義 | ✅ |
| 4 workflow (`ci` / `lighthouse` / `e2e-tests` / `pr-build-test`) | job 構成 / step 実体 / `uses:` 呼び出しのみ | ✅ |

---

## 6. 受入基準 trace（task 採用条件 → phase）

| 採用条件（index.md §1） | 担保 phase |
|----------------------|-----------|
| 3a Lighthouse CI 稼働済 | phase-1 §1 / phase-9 M-02 |
| 3b E2E hard gate 稼働済 | phase-1 §1 / phase-9 M-03 |
| setup 重複の実測 7 箇所 | phase-4 §1.1 / 本 phase §2 |
| `.github/actions/` 未導入 | phase-6 §1 |
| 他タスクでの解決なし | phase-1 §1 |

---

## 7. 残課題

| ID | 内容 | 引き取り先 |
|----|------|-----------|
| RB-05 | mise 系統と setup-node 系統の統一 | Stage 4 backlog（index 非ゴール §3） |
| EXT-Y1 | composite action の単体 reusable workflow 化（`workflow_call`） | 別タスク |
| EXT-Y2 | `actions/cache@v4` の hash key を composite 内に集約 | 別タスク（cache 失効を最小化したい場合） |

---

## 8. GO / NO-GO

| 観点 | 判定根拠 |
|------|---------|
| DoD-1..DoD-5 trace 完備 | §1 |
| 削減目標 70% 達成 | AT-01 |
| context drift なし | BP-03 / BP-04 |
| INV-01..INV-06 drift なし | §4 |
| 残課題が引き取り先付き | §7 |

### 結論

**GO**（Phase 11 evidence 整理 → Phase 12 docs → Phase 13 PR merge へ進む）。

NO-GO 条件: AT-01 が 70% 未満、BP-03 に diff、M-01..M-04 のいずれかが `failure` の場合は phase-7 もしくは phase-6 に戻る。

---

## 9. evidence 保存先

| ファイル | 内容 |
|---------|------|
| `outputs/phase-11/evidence/setup-lines-delta.md` | before / after / 削減率（§2） |
| `outputs/phase-11/evidence/branch-protection-dev-after.json` | BP-01 |
| `outputs/phase-11/evidence/branch-protection-main-after.json` | BP-02 |
| `outputs/phase-11/evidence/dod-trace.md` | §1 の表を独立ファイル化 |
| `outputs/phase-11/evidence/inv-drift-check.md` | §4 の表 |
| `outputs/phase-11/evidence/go-no-go.md` | §8 の判定根拠 |

---

## DoD（Phase 10 完了条件）

| # | 条件 |
|---|------|
| D-01 | DoD-1..DoD-5 が担保 phase 名で trace 済 |
| D-02 | 削減行数 before/after が実測コマンド付きで記述、AT-01..AT-03 判定基準確定 |
| D-03 | BP-01..BP-06 で branch protection drift を検査済 |
| D-04 | INV-01..INV-06 drift チェック完了 |
| D-05 | 残課題 RB-05 / EXT-Y1 / EXT-Y2 が引き取り先付きで列挙 |
| D-06 | GO / NO-GO 結論と根拠が明示 |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 10
- task classification: implementation / NON_VISUAL（CI infra acceptance）
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

Issue #627 の全体 DoD trace、削減実測、branch protection drift 不在、不変条件 drift 不在をもって、composite setup action 導入の最終受け入れ判定を行う。

## 実行タスク

- DoD-1..DoD-5 を担保 phase に trace する。
- 削減行数を before/after で実測し 70% 達成を確認する。
- branch protection contexts の drift 不在を `gh api` diff で確認する。
- INV-01..INV-06 を再点検する。
- 残課題を引き取り先付きで列挙する。
- GO / NO-GO を結論付ける。

## 参照資料

- docs/30-workflows/completed-tasks/3a-lighthouse-ci/phase-10.md（フォーマット参考）
- docs/30-workflows/issue-627-composite-setup-action/index.md
- phase-1.md..phase-9.md（本サブタスク内）

## 実行手順

1. §1 DoD trace を完成。
2. §2 削減行数を実測しコマンド記録。
3. §3 BP-01..BP-06 で branch protection drift を確認。
4. §4 INV drift を確認。
5. §7 残課題を整理。
6. §8 GO/NO-GO を結論付け。

## 統合テスト連携

- 本 phase は受け入れ判定であり Playwright を直接実行しない。phase-9 で観測した実 setup-strategy ログを根拠資料として参照する。

## 成果物

- 本 phase markdown
- `outputs/phase-11/evidence/` 配下 6 ファイル（§9）
- GO 判定（Phase 11 着手の gate）

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier（NON_VISUAL / CI infra のため lines 計測対象外）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
