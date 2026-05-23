# Phase 11: 手動テスト / Evidence（RB-02 Composite setup action）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-10.md` GO 判定 |
| 出力 | draft PR 実 run 観測 / before-after 行数集計 / actionlint 出力 / branch protection drift なし証跡 |
| 保存先 | `outputs/phase-11/evidence/` |
| 分類 | NON_VISUAL（CI infra 改修・UI 影響なし） |

---

## 1. NON_VISUAL タスクの evidence 方針

本タスクは composite action を `.github/actions/setup-project/` に新規追加し、7 workflow job の setup ステップを置換する **CI infra 改修** であるため、screenshot 系 evidence は不要。代替として以下 4 種を保存する。

| 種別 | 目的 | 保存先 |
|------|------|--------|
| GHA run URL 一覧 | composite action 呼び出し後の全 required check が green であることの証跡 | `outputs/phase-11/evidence/gha-run-urls.md` |
| actionlint 出力ログ | composite action / 呼び出し側 workflow が syntax error / typo を含まないこと | `outputs/phase-11/evidence/actionlint.log` |
| before/after 行数集計 | DoD-2「setup 行数 70% 以上削減」の数値根拠 | `outputs/phase-11/evidence/setup-lines-delta.md` |
| branch protection diff | DoD-4「required contexts が変更されていない」ことの構造的証跡 | `outputs/phase-11/evidence/branch-protection-diff.json` |

---

## 2. 手動テスト全体フロー

```
Step A: feat/issue-627-composite-setup-action で draft PR 作成（composite action + 7 workflow 置換）
   ↓ run 観測（全 required check green）
Step B: before-after 行数集計（git show + wc -l で差分計測）
   ↓
Step C: actionlint を composite action + 7 workflow に実行
   ↓
Step D: branch protection の required contexts が before-after で差分 0 であることを確認
   ↓
Step E: PR を ready for review 化（draft 解除）
```

---

## 3. Step A — draft PR run 観測

| # | 操作 | evidence 保存先 |
|---|------|----------------|
| A-01 | `feat/issue-627-composite-setup-action` を `dev` 向け draft PR として push | `outputs/phase-11/evidence/gha-run-urls.md` に PR URL |
| A-02 | `ci` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` / `workflow-shell-lint` の全 required check が green | `gh run list --branch feat/issue-627-composite-setup-action --json databaseId,name,conclusion` の出力を上記ファイルへ |
| A-03 | composite action 呼び出し job の log を取得し `Setup Node.js` / `Install dependencies` ステップが期待どおりに展開されたことを確認 | `gh run view <run-id> --log > outputs/phase-11/evidence/composite-step-expansion.log` |

### 3.1 `gha-run-urls.md` フォーマット

```markdown
# GHA Run URLs — Issue #627

| job | run URL | conclusion | duration |
|-----|---------|------------|----------|
| ci / typecheck | https://github.com/daishiman/UBM-Hyogo/actions/runs/<id> | success | <sec> |
| ci / lint | ... | success | ... |
| ci / test | ... | success | ... |
| lighthouse-ci | ... | success | ... |
| e2e-tests / e2e-shard | ... | success | ... |
| e2e-tests / report-merge | ... | success | ... |
| pr-build-test | ... | success | ... |
```

---

## 4. Step B — before-after 行数集計

### 4.1 計測コマンド

```bash
# dev（before）での setup 行数
git fetch origin dev
git show origin/dev:.github/workflows/lighthouse.yml \
  | awk '/^    - (name|uses):/' | wc -l > /tmp/before-lighthouse.txt
# 同様に e2e-tests.yml / ci.yml / pr-build-test.yml に対して実行

# feat ブランチ（after）
git show HEAD:.github/workflows/lighthouse.yml \
  | awk '/^    - (name|uses):/' | wc -l > /tmp/after-lighthouse.txt
# 同様に他 workflow に対しても実行
```

### 4.2 `setup-lines-delta.md` フォーマット

```markdown
# Setup Lines Delta — Issue #627

計測対象: `actions/checkout` + `setup-node@v4` + `pnpm install` 3 ステップ群の合計行数（YAML の `- name:` / `- uses:` 行数）。

| workflow | job | before 行数 | after 行数 | 削減 |
|---------|-----|-----------|----------|------|
| lighthouse.yml | lighthouse | 12 | 2 | -10 |
| e2e-tests.yml | e2e-shard | 12 | 2 | -10 |
| e2e-tests.yml | report-merge | 12 | 2 | -10 |
| ci.yml | typecheck | 12 | 2 | -10 |
| ci.yml | lint | 12 | 2 | -10 |
| ci.yml | test | 12 | 2 | -10 |
| pr-build-test.yml | pr-build-test | 10 | 2 | -8 |
| **合計** | — | **82** | **14** | **-68 (83% 削減)** |

DoD-2（70% 以上削減）: ✅ 充足
```

> 数値は実測で更新する。上表はテンプレート例であり、phase-7 実装結果に依存する。

---

## 5. Step C — actionlint 実行

### 5.1 コマンド

```bash
mise exec -- pnpm dlx actionlint \
  .github/actions/setup-project/action.yml \
  .github/workflows/lighthouse.yml \
  .github/workflows/e2e-tests.yml \
  .github/workflows/ci.yml \
  .github/workflows/pr-build-test.yml \
  2>&1 | tee outputs/phase-11/evidence/actionlint.log
```

### 5.2 期待

| # | 期待 |
|---|------|
| C-01 | exit code 0 |
| C-02 | log に `error:` 行が 0 件 |
| C-03 | composite action 側の `inputs:` / `outputs:` / `runs:` の構造警告 0 件 |

---

## 6. Step D — branch protection drift なし確認

### 6.1 before snapshot（PR 作成前）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts' \
  > outputs/phase-11/evidence/branch-protection-before.json
```

### 6.2 after snapshot（PR ready 後・merge 前）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts' \
  > outputs/phase-11/evidence/branch-protection-after.json
```

### 6.3 差分計算

```bash
diff outputs/phase-11/evidence/branch-protection-before.json \
     outputs/phase-11/evidence/branch-protection-after.json \
  > outputs/phase-11/evidence/branch-protection-diff.json
```

### 6.4 期待

| # | 期待 |
|---|------|
| D-01 | `branch-protection-diff.json` が空ファイル（diff 0 行）|
| D-02 | DoD-4（required contexts 不変）✅ 充足 |

> 本タスクは branch protection を **一切変更しない**。drift があれば即 fail として扱い、PR ready 化を中止する。

---

## 7. evidence 一覧（保存ファイル）

| path | 内容 |
|------|------|
| `outputs/phase-11/evidence/gha-run-urls.md` | 全 required check の run URL + conclusion 表 |
| `outputs/phase-11/evidence/composite-step-expansion.log` | composite action 呼び出し時の job log（1 件代表）|
| `outputs/phase-11/evidence/setup-lines-delta.md` | before-after 行数集計表 + 削減率 |
| `outputs/phase-11/evidence/actionlint.log` | actionlint 全 workflow + composite action 実行ログ |
| `outputs/phase-11/evidence/branch-protection-before.json` | dev required contexts（PR 作成前）|
| `outputs/phase-11/evidence/branch-protection-after.json` | dev required contexts（PR ready 後）|
| `outputs/phase-11/evidence/branch-protection-diff.json` | 上 2 ファイルの diff（空ファイル期待）|

---

## 8. rollback 手順

| 状況 | rollback |
|------|---------|
| draft PR で required check が fail | composite action の `inputs` 既定値・`run:` シェルを修正し再 push（最大 3 回まで自動修復、それ以上は phase-9 統合テストに戻る）|
| merge 後に致命的 CI 障害発覚 | `gh pr revert <PR>` で revert PR を `dev` に作成 → 即 merge |
| 行数削減が 70% に満たない | composite action の input 設計を見直す（phase-4 に戻る）。70% 未満では本 phase を完了させない |

---

## 9. 終了基準

| # | 条件 |
|---|------|
| EX-01 | Step A..D 全て期待観測（全 required check green / diff 0 / actionlint 0 violation） |
| EX-02 | 削減率が 70% 以上（DoD-2 充足）|
| EX-03 | evidence ファイル §7 が全件揃う |
| EX-04 | draft → ready for review に昇格できる状態 |

---

## 10. 引き継ぎ（Phase 12 へ）

| 項目 | 内容 |
|------|------|
| Phase 12 タスク | `docs/30-workflows/e2e-quality-uplift/backlog.md` RB-02 行を `closed (#627)` 更新 / LOGS.md / topic-map / 中学生レベル概念説明 |

---

## DoD（Phase 11 完了条件）

| # | 条件 |
|---|------|
| D-01 | Step A..D 手順が記述済 |
| D-02 | evidence §7 全 path が確定 |
| D-03 | branch protection drift 確認手順が記述済 |
| D-04 | rollback 手順が記述済 |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 11
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

composite action 導入の draft PR 実 run / 行数削減実測 / actionlint / branch protection drift 確認を実施し evidence を確定する。

## 実行タスク

- Step A: draft PR run 観測
- Step B: before-after 行数集計
- Step C: actionlint 実行
- Step D: branch protection drift 確認

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/index.md
- phase-7.md / phase-9.md（本サブタスク内）

## 実行手順

1. draft PR を作成し全 required check を観測。
2. before-after で setup 行数を集計し 70% 以上削減を確認。
3. actionlint を全対象に実行。
4. branch protection の before/after snapshot で diff 0 を確認。
5. draft → ready 化準備を整える。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として GHA run 観測、actionlint、行数集計、branch protection diff を使用する。
- screenshot 系 evidence は不要。代替 evidence を `outputs/phase-11/evidence/` に保存する。

## 成果物

- 本 phase markdown
- outputs/phase-11/evidence/* evidence 一式

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL のため CI gate / 行数削減で代替）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
