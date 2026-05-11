# Phase 11: 手動テスト / 受入 evidence（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-10.md` GO 判定 |
| 出力 | draft PR-B 実 run 観測 / coverage 実測 / 故意 79.99% fail 再現 / artifact 取得確認 |
| 保存先 | `outputs/phase-11/` |

---

## 1. 手動テストフロー

```
Step 1: feature branch 作成（feat/e2e-coverage-gate）
Step 2: phase-5 の差分を全て適用 + commit
Step 3: PR-B を dev 向け draft 作成
Step 4: e2e-tests-coverage-gate job 実行 + green 観測
Step 5: coverage / monocart artifact 取得
Step 6: 故意 79.99% fail 再現（ローカル fixture or 一時 PR）
Step 7: HTML report artifact が failure 時のみ存在することを確認
Step 8: evidence を outputs/phase-11/ に保存
```

---

## 2. Step 1-2: feature branch + 実装適用

| # | 操作 | 確認 |
|---|------|------|
| A-01 | `bash scripts/new-worktree.sh feat/e2e-coverage-gate` | worktree 作成 |
| A-02 | phase-5 §1〜§4 の差分を適用 | `git status` |
| A-03 | `mise exec -- pnpm install`（lockfile 更新確認） | exit 0 |
| A-04 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| A-05 | `mise exec -- pnpm lint` | exit 0 |
| A-06 | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` | violation 0 |
| A-07 | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` | violation 0 |
| A-08 | commit + push | — |

---

## 3. Step 3-5: draft PR + green run + artifact 取得

| # | 操作 | evidence 保存先 |
|---|------|----------------|
| B-01 | `gh pr create --base dev --draft --title "feat(ci): e2e-tests hard gate (3b)"` | PR URL を `outputs/phase-11/pr-b-url.txt` |
| B-02 | `e2e-tests-coverage-gate` job 実行 + green | `gh run view <run-id> --json conclusion,status,url,headSha > outputs/phase-11/pr-b-e2e-run.txt` |
| B-03 | `gh run download <run-id> --name e2e-coverage-<sha> --dir outputs/phase-11/coverage/` | `coverage/lcov.info` / `coverage/summary/coverage-summary.json` |
| B-04 | `jq '.total.lines.pct' outputs/phase-11/coverage/summary/coverage-summary.json > outputs/phase-11/coverage-line-pct.txt` | `>= 80` |
| B-05 | `gh run download <run-id> --name e2e-monocart-<sha> --dir outputs/phase-11/monocart/` | `index.html` |
| B-06 | `outputs/phase-11/coverage-summary.json`（B-03 の summary を直 copy） | — |
| B-07 | server fetch 用 mock API / seed / `INTERNAL_API_BASE_URL` の適用結果を記録 | `outputs/phase-11/server-fetch-mock-evidence.md` |

### 3.1 期待実測（参考レンジ）

| metric | 期待 | 根拠 |
|--------|------|------|
| `total.lines.pct` | `>= 80` | quality-gates.md §7.5 standard tier |
| job 所要時間 | `<= 30 min` | phase-6 §1.1 試算（≈12 min） + timeout 30 min |
| critical-route smoke | green | Stage 2 baseline |

---

## 4. Step 6: 故意 79.99% fail 再現（AC-02 担保）

### 4.1 オプション A — fixture によるローカル再現（推奨）

```bash
THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/fail-79 \
  bash scripts/coverage-gate-e2e.sh
echo "exit=$?"   # exit=1
```

期待出力:

```
::error::line coverage 79.99 < 80
exit=1
```

evidence 保存: `outputs/phase-11/coverage-gate-failure-fixture.txt`

### 4.2 オプション B — 一時 PR で実 CI fail（補強）

| # | 操作 | evidence |
|---|------|---------|
| C-01 | `feat/e2e-coverage-gate-fail-demo` を切り、`apps/web/src/` 配下の広範な path を意図的に低カバレッジ化 | — |
| C-02 | draft PR で `e2e-tests-coverage-gate` が `failure` | `outputs/phase-11/coverage-gate-failure-evidence.md`（log 抜粋 + run URL） |
| C-03 | revert + branch 破棄 | — |

> オプション A だけで AC-02 の機械検証は成立する。オプション B は CI 経路の最終確認として追加実施（任意）。

---

## 5. Step 7: HTML report artifact 条件確認（AC-3b-5 担保）

| # | 内容 | 期待 |
|---|------|------|
| D-01 | green run（B-02）で `e2e-html-report-<sha>` artifact | **存在しない**（`if: failure()`） |
| D-02 | failure run（C-02）で `e2e-html-report-<sha>` artifact | **存在し** retention 7 日で取得可 |
| D-03 | `gh run download <failure-run-id> --name e2e-html-report-<sha>` | `playwright-report/html/index.html` 取得可 |

evidence 保存: `outputs/phase-11/html-report-conditional-evidence.md`

---

## 6. evidence 一覧（保存ファイル）

| path | 内容 |
|------|------|
| `outputs/phase-11/pr-b-url.txt` | PR-B URL |
| `outputs/phase-11/pr-b-e2e-run.txt` | e2e run metadata / URL / conclusion |
| `outputs/phase-11/server-fetch-mock-evidence.md` | server fetch 用 mock API / seed / `INTERNAL_API_BASE_URL` 差し替え証跡 |
| `outputs/phase-11/coverage/summary/coverage-summary.json` | line coverage summary |
| `outputs/phase-11/coverage-summary.json` | 同 summary の直配置 copy |
| `outputs/phase-11/coverage-line-pct.txt` | 抽出 line.pct |
| `outputs/phase-11/monocart/index.html` | monocart report |
| `outputs/phase-11/coverage-gate-failure-fixture.txt` | fixture fail 再現結果 |
| `outputs/phase-11/coverage-gate-failure-evidence.md` | （任意 / オプション B 実施時）実 CI fail 記録 |
| `outputs/phase-11/html-report-conditional-evidence.md` | green/failure での artifact 有無記録 |
| `outputs/phase-11/registered-context.txt` | check-runs 名一覧（3c 連携用） |

`.log` は `.gitignore` 対象になりやすいため、Phase 11 の canonical evidence は tracked `.txt` / `.md` / `.json` とする。

### 6.1 context 登録確認（3c 連携）

```bash
# 3b merge 後、dev HEAD の check-runs を取得
HEAD_SHA=$(gh api repos/daishiman/UBM-Hyogo/branches/dev | jq -r '.commit.sha')
gh api "repos/daishiman/UBM-Hyogo/commits/$HEAD_SHA/check-runs" \
  | jq -r '.check_runs[].name' \
  | sort -u \
  > outputs/phase-11/registered-context.txt

grep -F 'e2e-tests-coverage-gate' outputs/phase-11/registered-context.txt
# hit 1 で 3c 実行可（別 spec）
```

---

## 7. rollback 手順

問題発生時は revert で復帰可。

```bash
git revert <commit-sha>
git push
```

| 対象 | rollback 効果 |
|------|--------------|
| `.github/workflows/e2e-tests.yml` | `workflow_dispatch` 単独運用に復帰 |
| `apps/web/playwright.config.ts` | reporter 配列が `html`/`json`/`list` 3 件のみに復帰 |
| `apps/web/package.json` + `pnpm-lock.yaml` | `monocart-reporter` / `c8` 除去 |
| `scripts/coverage-gate-e2e.sh` | ファイル削除 |

> 3c 適用後は context 未登録となり PR 永久 pending を招くため、rollback 前に 3c の payload からも `e2e-tests-coverage-gate` を除去する必要がある。

---

## 8. 終了基準

| # | 条件 |
|---|------|
| EX-01 | Step 1-2 全 step pass |
| EX-02 | Step 3-5 で green run 観測 + line.pct >= 80 |
| EX-03 | Step 6 オプション A で fixture fail (exit 1 / `::error::`) 再現 |
| EX-04 | Step 7 で green / failure 別の HTML report 有無が確認 |
| EX-05 | evidence ファイル §6 が全件揃う（D-02 オプション B は任意） |

---

## 9. 引き継ぎ（Phase 12 へ）

| 項目 | 内容 |
|------|------|
| Phase 12 タスク | CLAUDE.md「よく使うコマンド」/ specs ドキュメント更新 / 3c spec への context 登録通知 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 11
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented-local

## 目的

3b の draft PR 実 run / coverage 実測 / fail 再現 / artifact 取得の手動オペレーション手順と evidence 保存先を確定する。

## 実行タスク

- 親 phase-11.md §3 / §6 から 3b 関連箇所を抽出。
- 故意 79.99% fail 再現を fixture モード優先で再構成。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-11.md

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
