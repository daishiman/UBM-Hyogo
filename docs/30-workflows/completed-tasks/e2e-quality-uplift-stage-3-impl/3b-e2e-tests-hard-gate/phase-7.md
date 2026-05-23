# Phase 7: カバレッジ確認（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-6.md` |
| 出力 | line coverage >= 80% gate の実測検証手順 / 80% 達成エビデンス取得手順 |
| 前提 | Stage 2 完了（coverage 80% 達成済） |

---

## 1. 前提条件確認（Stage 2 連携）

| # | 確認項目 | コマンド | 期待 |
|---|---------|----------|------|
| C-01 | Stage 2 phase-7 evidence で line >= 80 を達成 | `cat docs/30-workflows/e2e-quality-uplift-stage-2/outputs/phase-7/coverage-summary.json \| jq '.total.lines.pct'` | `>= 80` |
| C-02 | Stage 2 で flaky test quarantine 済 | Stage 2 phase-6 / phase-9 の記述 | 記載あり |
| C-03 | `@critical-route` tag が Stage 2 で付与済 | `grep -r '@critical-route' apps/web/playwright/tests/critical/ \| wc -l` | `>= 1` |

C-01 が NG なら 3b の coverage gate を有効化しない（Stage 2 に差戻し）。

---

## 2. coverage gate 実測検証手順

### 2.1 ローカル run

| # | 操作 | 期待 |
|---|------|------|
| L-01 | `mise exec -- pnpm install --frozen-lockfile` | exit 0 |
| L-02 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium firefox webkit` | exit 0 |
| L-03 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e --grep @critical-route`（smoke） | 全 pass |
| L-04 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e`（全件） | 全 pass |
| L-05 | `bash scripts/coverage-gate-e2e.sh` | exit 0 / `::notice::line coverage <pct> >= 80` |
| L-06 | `apps/web/coverage/summary/coverage-summary.json` 内容確認 | `lines.pct` を控える |

### 2.2 CI run（PR-B が dev 未マージの段階で draft PR 経由）

| # | 操作 | 期待 |
|---|------|------|
| CI-01 | draft PR を `dev` 向けに作成 | `e2e-tests-coverage-gate` job 起動 |
| CI-02 | green run を観測 | `pct >= 80` |
| CI-03 | `gh run download <run-id> --name e2e-coverage-<sha>` で artifact 取得 | `coverage-summary.json` 内容で再確認 |
| CI-04 | `gh run download <run-id> --name e2e-monocart-<sha>` で monocart report 取得 | `index.html` 取得 |

### 2.3 80% 達成エビデンス取得手順（AC-02 / AC-04 担保）

```bash
# 1. PR run id を取得
RUN_ID=$(gh run list --workflow=e2e-tests.yml --branch=<feature-branch> --limit=1 --json databaseId --jq '.[0].databaseId')

# 2. coverage artifact を取得
gh run download "${RUN_ID}" --name "e2e-coverage-$(git rev-parse HEAD)" \
  --dir outputs/phase-7/

# 3. line.pct を抽出して保存
jq '.total.lines.pct' outputs/phase-7/coverage/summary/coverage-summary.json \
  > outputs/phase-7/coverage-line-pct.txt

# 4. >= 80 を assert
PCT=$(cat outputs/phase-7/coverage-line-pct.txt)
awk "BEGIN { exit !(${PCT} >= 80) }" \
  && echo "line coverage ${PCT} >= 80 (PASS)" \
  || { echo "line coverage ${PCT} < 80 (FAIL)"; exit 1; }
```

### 2.4 しきい値割れ再現（dummy / 79.99% 再現）

| # | 操作 | 期待 |
|---|------|------|
| N-01 | 一時ブランチで `apps/web/src/` 配下の広範な path を意図的に低カバレッジ化（例: 大型 module の test を skip） | line < 80 |
| N-02 | 同 PR で `e2e-tests-coverage-gate` が `failure` | `gh run view --log` に `::error::line coverage <pct> < 80` |
| N-03 | 一時ブランチを破棄 | — |

> 代替として phase-4 §2.1 の fixture（FIX-B = 79.99%）を使い `THRESHOLD_FIXTURE` モードでローカル fail を再現することも可。

---

## 3. coverage 実測の保存先

| ファイル | 内容 |
|---------|------|
| `outputs/phase-7/coverage-baseline.json` | Stage 3 着手時の baseline（Stage 2 産物のコピー） |
| `outputs/phase-7/coverage-stage3-pr-b.json` | PR-B draft run の実測値 |
| `outputs/phase-7/coverage-line-pct.txt` | 抽出 line.pct（assert 用） |
| `outputs/phase-7/coverage-gate-evidence.md` | gate dry-run の判定ログ集約 |

---

## 4. 終了基準

| # | 条件 |
|---|------|
| EX-01 | C-01..C-03 全 pass |
| EX-02 | L-05 と CI-02 が両方 pass で line >= 80 |
| EX-03 | §2.3 の手順で `coverage-line-pct.txt` が生成され、`>= 80` を assert 通過 |
| EX-04 | N-01..N-03（または fixture FIX-B）でしきい値割れ時 `failure` が観測されている |

---

## 5. 引き継ぎ（Phase 8 へ）

| 項目 | 内容 |
|------|------|
| Phase 8 入力 | `outputs/phase-7/coverage-gate-evidence.md` |
| 検討課題 | 既存 `coverage-guard.sh` との重複解消方針 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 7
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented-local

## 目的

3b の coverage gate が実測 80% を満たし、AC-02 / AC-04 の evidence 取得手順を確定する。

## 実行タスク

- 親 phase-7.md §2 から 3b 関連箇所を抽出。
- 80% 達成エビデンス抽出スクリプトを明示。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-7.md

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
