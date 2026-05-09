# Phase 7: カバレッジ確認（Stage 3）

| 項目 | 値 |
|------|----|
| 入力 | `phase-6.md` |
| 出力 | line coverage >= 70% gate の実測検証結果 / Q-03 縮退判定 |
| 前提 | Stage 2 完了（`docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` の spec package materialized）。coverage 70% の実測は Stage 3 が取得する |

---

## 1. 前提条件確認（Stage 2 連携）

| # | 確認項目 | コマンド | 期待 |
|---|---------|----------|------|
| C-01 | Stage 2 spec package exists | `test -f docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md && test -f docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/artifacts.json` | exit 0 |
| C-02 | Stage 2 で flaky test quarantine 済 | Stage 2 phase-6 / phase-9 の記述 | 記載あり |
| C-03 | `@critical-route` tag が Stage 2 で付与済 | `grep -r '@critical-route' apps/web/playwright/tests/critical/ \| wc -l` | `>= 1` |

C-01 が NG なら Stage 3 の coverage gate を有効化しない（Stage 2 に差戻し）。coverage 数値は Stage 3 Phase 11 の `outputs/phase-11/coverage-summary.json` で初めて PASS/FAIL 判定する。

---

## 2. coverage gate 実測検証手順

### 2.1 ローカル run

| # | 操作 | 期待 |
|---|------|------|
| L-01 | `pnpm install --frozen-lockfile` | exit 0 |
| L-02 | `pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium` | exit 0 |
| L-03 | `pnpm --filter @ubm-hyogo/web e2e` | 全件 pass |
| L-04 | `bash scripts/coverage-gate-e2e.sh` | exit 0 / `total.lines.pct >= 70` |
| L-05 | `apps/web/coverage/summary/coverage-summary.json` 内容確認 | `lines.pct` を控える |

### 2.2 CI run（PR-B が dev に未マージの段階で draft PR 経由で実行）

| # | 操作 | 期待 |
|---|------|------|
| CI-01 | draft PR を `dev` 向けに作成 | `e2e-tests-coverage-gate` job 起動 |
| CI-02 | green run を観測 | `pct >= 70` |
| CI-03 | `gh run download <run-id> --name e2e-coverage-<sha>` で artifact 取得 | `coverage-summary.json` 内容で再確認 |

### 2.3 しきい値割れ再現（dummy）

| # | 操作 | 期待 |
|---|------|------|
| N-01 | テンポラリブランチで `apps/web/src/lib/env.ts`、`apps/web/app/profile/page.tsx`、`apps/web/src/components/profile/RequestActionPanel.tsx` の広範な path を `/* istanbul ignore next */` 削除等で coverage 落とす | line < 70 |
| N-02 | 同 PR で `e2e-tests-coverage-gate` が `failure` | `gh run view --log` に `line coverage X < 70` |
| N-03 | テンポラリブランチを破棄 | — |

---

## 3. Q-03 縮退判定（`/profile` a11y）

phase-1 §5 / phase-3 §4 で deferred とした `/profile` 未認証時の a11y >= 90 を本 Phase で実測判定する。

### 3.1 判定手順

| # | 操作 | 判定 |
|---|------|------|
| Q-A | ローカルで `pnpm --filter @ubm-hyogo/web build && pnpm --filter @ubm-hyogo/web start &` | — |
| Q-B | `pnpm dlx @lhci/cli@0.14 collect --url=http://localhost:3000/profile --numberOfRuns=3` | 3 run のスコア取得 |
| Q-C | a11y score 中央値 | **>= 0.90** なら 4 routes 維持 / **< 0.90** なら縮退 |

### 3.2 縮退時の手当て

| # | 内容 |
|---|------|
| R-01 | `lighthouserc.json` の `ci.collect.url` から `http://localhost:3000/profile` を削除（残 3 routes） |
| R-02 | `phase-11.md` evidence に縮退理由・観測スコア・スクリーンショットを保存 |
| R-03 | `phase-12.md` LOGS.md 更新時に「Q-03 縮退」の項目を明記 |
| R-04 | Stage 4 以降の課題として「`/profile` 認証 fixture を導入し再 enroll」を記録 |

### 3.3 縮退しないケース（`/profile` 維持）

| # | 内容 |
|---|------|
| K-01 | `lighthouserc.json` 4 routes をそのまま採用 |
| K-02 | `phase-11.md` に 4 routes の実測スコアを記録 |

---

## 4. coverage 実測の保存先

| ファイル | 内容 |
|---------|------|
| `outputs/phase-7/coverage-baseline.json` | Stage 3 着手時の baseline（Stage 2 産物のコピー） |
| `outputs/phase-7/coverage-stage3-pr-b.json` | PR-B draft run の実測値 |
| `outputs/phase-7/coverage-gate-evidence.md` | gate dry-run の判定ログ |
| `outputs/phase-7/lhci-profile-q03-judgement.md` | Q-03 縮退判定結果（採否 + 数値） |

---

## 5. 終了基準

| # | 条件 |
|---|------|
| EX-01 | C-01..C-03 全て pass |
| EX-02 | L-04 と CI-02 が両方 pass で line >= 70 |
| EX-03 | Q-03 判定が「維持」または「縮退」のいずれかで確定し、対応する成果物が保存されている |
| EX-04 | N-01..N-03 でしきい値割れ時 `failure` が観測されている（gate が機能している証拠） |

---

## 6. 引き継ぎ（Phase 8 へ）

| 項目 | 内容 |
|------|------|
| Phase 8 入力 | `outputs/phase-7/coverage-gate-evidence.md` |
| 検討課題 | 重複 workflow 削減 / reusable workflow 抽出可否 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3
- phase: 7
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
