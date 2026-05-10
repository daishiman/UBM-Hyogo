# Phase 13: PR 作成（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-12.md` 完了 |
| 出力 | PR-B（base=`dev`, head=`feat/e2e-coverage-gate`） |
| PR スコープ | PR-B 単独（3a / 3c は別 PR / 別 spec） |

---

## 1. PR 構造

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `feat/e2e-coverage-gate` |
| title | `feat(ci): e2e-tests hard gate (line>=70 / critical-route fail-fast / monocart) — task-3b` |
| label（任意） | `ci` / `coverage` / `stage-3-3b` |
| reviewer | なし（solo policy） |

---

## 2. PR 含むファイル（PR-B スコープ）

| ファイル | 種別 |
|---------|------|
| `.github/workflows/e2e-tests.yml` | edit（major rewrite） |
| `apps/web/playwright.config.ts` | edit（reporter 末尾追加） |
| `apps/web/package.json` | edit（devDependencies 追加） |
| `scripts/coverage-gate-e2e.sh` | new |
| `scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-69,missing}/` | new（Phase 4 fixture） |
| `pnpm-lock.yaml` | regenerate |
| spec 群 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/**` |
| evidence | `outputs/phase-11/**`（spec 配下） |
| CLAUDE.md | edit（「よく使うコマンド」追記） |

---

## 3. PR 本文テンプレート

```markdown
## Summary

- `.github/workflows/e2e-tests.yml` を PR トリガ + hard CI gate に major rewrite。
- `e2e-tests-coverage-gate` job: critical-route fail-fast smoke → 全件 e2e → line coverage >= 70% gate。
- `apps/web/playwright.config.ts` reporter 末尾に `monocart-reporter` を追加（既存 `html`/`json`/`list` 維持）。
- `scripts/coverage-gate-e2e.sh` 新規（c8 json-summary + jq + awk による 70% 判定）。
- coverage / monocart artifact を `actions/upload-artifact@v4` で取得可。失敗時のみ Playwright HTML report もアップロード。

## Spec

- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/phase-{1..13}.md`
- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/index.md`
- 親ワークフロー: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`

## 受入基準（親 index.md AC-02..AC-04）

| AC | 状態 |
|----|------|
| AC-02 line<70 で fail / critical-route smoke fail で fail | pass（Phase 11 §3 §4） |
| AC-03 monocart-reporter 追加 + 既存 reporter 維持 | pass（Phase 5 §1） |
| AC-04 coverage / failure HTML report の artifact 取得可 | pass（Phase 11 §3 §5） |

### 補助 AC

| AC | 状態 |
|----|------|
| AC-3b-1 PR トリガで起動 | pass |
| AC-3b-2 line<70 で fail | pass |
| AC-3b-3 critical-route fail-fast | pass |
| AC-3b-4 coverage artifact retention 14 日 | pass |
| AC-3b-5 failure 時のみ HTML report retention 7 日 | pass |
| AC-3b-6 既存 reporter 維持 | pass |

## Evidence（`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-11/`）

- `pr-b-e2e.log` — e2e run log
- `coverage/summary/coverage-summary.json` — line coverage summary
- `coverage-line-pct.txt` — line.pct（>= 70 を assert）
- `monocart/index.html` — monocart report
- `coverage-gate-failure-fixture.log` — 69% fixture fail 再現ログ
- `html-report-conditional-evidence.md` — green/failure での artifact 有無

## ドキュメント更新

- `CLAUDE.md`「よく使うコマンド」: E2E + coverage gate コマンド追記
- `docs/30-workflows/e2e-quality-uplift/backlog.md`: RB-3b-01..RB-3b-04 追記
- `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/LOGS.md`: 3b 完了 1 行追記（親ワークフロー）

## 並走サブタスクとの関係

- 3a Lighthouse CI（`../3a-lighthouse-ci/`）と独立 PR で並走可。コンフリクトなし。
- 3c branch protection（`../3c-branch-protection-contexts/`）は本 PR merge 後、`e2e-tests-coverage-gate` context が GitHub に登録されてから別途実施。順序逆転は PR 永久 pending を招く。

## CONST_007 / solo policy

- single-cycle scope 遵守（Phase 1→2→...→13 一直線）
- `required_pull_request_reviews=null` 維持（本 PR 単体ではブランチ保護未変更）
- `wrangler` 直叩きなし

## 残課題（backlog 記録済）

- RB-3b-01..RB-3b-04: composite action / build 共有 / paths filter / shell helper 抽出
- 3c branch protection: `../3c-branch-protection-contexts/` で実施

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 4. PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --head feat/e2e-coverage-gate \
  --title "feat(ci): e2e-tests hard gate (line>=70 / critical-route fail-fast / monocart) — task-3b" \
  --body-file docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-13/pr-body.md
```

`outputs/phase-13/pr-body.md` に §3 のテンプレートを投入してから実行する。

---

## 5. PR 作成前 final checklist

| # | 項目 | 確認方法 |
|---|------|---------|
| F-01 | `git status --porcelain` 空 | 実行 |
| F-02 | `git diff dev...HEAD --name-only` で含まれる変更がスコープ通り | 実行 + 目視 |
| F-03 | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` pass | 実行 |
| F-04 | `pnpm dlx actionlint -color .github/workflows/e2e-tests.yml` violation 0 | 実行 |
| F-05 | `pnpm dlx shellcheck scripts/coverage-gate-e2e.sh` violation 0 | 実行 |
| F-06 | evidence ファイル全件存在（phase-11 §6） | `ls outputs/phase-11/` |
| F-07 | CLAUDE.md / backlog / 親 LOGS 全て更新済 | git diff で目視 |
| F-08 | reporter 配列が「既存 3 件→monocart」順で末尾追加のみ | `sed -n '15,32p' apps/web/playwright.config.ts` |
| F-09 | `name: e2e-tests` / `jobs.e2e.name: e2e-tests-coverage-gate` 完全一致 | grep |
| F-10 | しきい値 70 のコメントに quality-gates.md §7.5 が含まれる | `grep -F 'quality-gates.md §7.5' scripts/coverage-gate-e2e.sh` |

---

## 6. PR merge 後

| # | 操作 |
|---|------|
| M-01 | `gh run list --workflow=e2e-tests.yml --branch=dev --limit=1` で `success` 観測 |
| M-02 | dev HEAD の check-runs に `e2e-tests-coverage-gate` 登場確認（phase-11 §6.1） |
| M-03 | 観測 evidence を 3c spec の前提として引き渡し |
| M-04 | `feat/e2e-coverage-gate` を削除（local + remote） |
| M-05 | 親ワークフロー `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/index.md` の Subtask 3b 行を done に更新 |

---

## 7. 終了基準

| # | 条件 |
|---|------|
| EX-01 | PR-B が `dev` に merge されている |
| EX-02 | merge 後 dev で `e2e-tests-coverage-gate` job が green |
| EX-03 | check-runs に `e2e-tests-coverage-gate` context が登録済 |
| EX-04 | 3c spec が本 PR merge を前提として進行可能な状態 |

---

## 8. Subtask 3b 終了

本 Phase 完了をもって `e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate` を終了する。3c は別 spec で起票し、本タスクの context 登録を前提として `gh api` PUT を実行する。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3b 単独 PR-B（base=dev / head=feat/e2e-coverage-gate）を作成し、AC-02..AC-04 と AC-3b-1..6 の trace を本 PR に集約する。

## 実行タスク

- 親 phase-13.md PR-B スコープから 3b 関連箇所を抽出。
- PR 本文テンプレート / final checklist / merge 後手順を確定。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-13.md

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
