# Phase 13: PR 作成（3a Lighthouse CI 導入）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-12.md` 完了 |
| 出力 | PR-A（base=`dev`, head=`feat/lighthouse-ci`） |
| PR スコープ | 3a 単独（lighthouse.yml + lighthouserc.json + apps/web/package.json + pnpm-lock.yaml + spec + evidence + LOGS + backlog + topic-map） |

---

## 1. PR 構造

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `feat/lighthouse-ci` |
| title | `feat(ci): add Lighthouse CI hard gate for 4 routes (perf>=80 / a11y>=90 / bp>=90 / seo>=80)` |
| label（任意） | `ci`, `quality-gate`, `stage-3-impl-3a` |
| reviewer | なし（solo policy） |
| draft? | 初回 push は draft（実 run 観測のため）→ Phase 11 evidence 揃ったら ready for review |

---

## 2. PR-A 本文テンプレート

```markdown
## Summary

- Lighthouse CI を hard CI gate として導入。`/`, `/(public)/members`, `/profile`, `/login` の 4 routes に対し perf>=80 / a11y>=90 / best-practices>=90 / seo>=80 を assertion し、PR ブロックする。
- workflow `name:` / `jobs.<id>.name:` を `lighthouse-ci` に確定（branch protection context との整合）。
- artifact `lhci-report-${{ github.sha }}` を retention 7 日でアップロード。
- 親ワークフロー `e2e-quality-uplift-stage-3` の 3a 単独スコープ。3b（e2e hard gate）/ 3c（branch protection contexts）は別 PR / 別オペレーション。

## Spec

- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/index.md`
- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/phase-{1..13}.md`

## 変更ファイル

- `lighthouserc.json`（新規）— 4 routes / desktop preset / 4 assertion
- `.github/workflows/lighthouse.yml`（新規）— `pull_request: { branches: [dev] }` / timeout 15 / cache pnpm
- `apps/web/package.json`（edit）— `@lhci/cli@^0.14.0` を devDependencies に追加
- `pnpm-lock.yaml`（regenerate）

## Evidence（`docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/outputs/phase-11/`）

- `lhci-scores.json` — Lighthouse 4 routes 実測（または Q-02 縮退時 3 routes）
- `lhci-runs-5x.json` / `lhci-stability-summary.md` — 5 連続 run のばらつき観測
- `lhci-profile-q02-judgement.md` — Q-02 縮退判定（維持 or 縮退）
- `lighthouse-fail.log` — 故意閾値割れ再現で fail を観測した log
- `lhci-report-*.png` — Lighthouse report スクリーンショット（4 routes / 縮退時 3）
- `pr-a-lighthouse.log` — CI run log
- `registered-contexts.txt` — merge 後 dev で `lighthouse-ci` が check-runs に登録された証跡

## ドキュメント更新

- `CLAUDE.md`: 「よく使うコマンド」に Lighthouse ローカル実行コマンドを追記
- `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/LOGS.md`: 新規
- `docs/30-workflows/LOGS.md`: 3a 完了 1 行追記
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.*`: `lighthouse-ci` / `ci-quality-gate` entry 追加 + `pnpm indexes:rebuild` 反映
- `docs/30-workflows/e2e-quality-uplift/backlog.md`: RB-01..RB-04 / EXT-X1 / OBS-01 引き取り

## 受入基準（index.md AC-3a-1..5）

| AC | 状態 |
|----|------|
| AC-3a-1 PR to dev で `lighthouse-ci` job 起動 | pending until draft PR run（Phase 11 §2） |
| AC-3a-2 4 routes 全 pass | pending until `lhci-scores.json` capture |
| AC-3a-3 閾値割れで fail | pending until `lighthouse-fail.log` capture |
| AC-3a-4 artifact retention 7 日 | pending until `gh run download` verification |
| AC-3a-5 `name:` / `jobs.<id>.name:` が `lighthouse-ci` 完全一致 | local pass（workflow grep / review） |

## 後続作業（本 PR 範囲外）

- 3b: `.github/workflows/e2e-tests.yml` を hard gate 化（別 PR-B）
- 3c: `gh api PUT` で `dev` / `main` の `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` を追加（手動オペレーション、3a / 3b 両 merge 後）

## CONST_007 / solo policy

- single-cycle scope 遵守（Phase 1→2→...→13 一直線）
- `required_pull_request_reviews=null` 維持（本 PR は branch protection を変更しない）
- `lock_branch=false` / `enforce_admins` 既存値維持

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 3. PR 作成コマンド

```bash
gh pr create \
  --base dev \
  --head feat/lighthouse-ci \
  --title "feat(ci): add Lighthouse CI hard gate for 4 routes (perf>=80 / a11y>=90 / bp>=90 / seo>=80)" \
  --body-file docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/outputs/phase-13/pr-body.md \
  --draft
```

`outputs/phase-13/pr-body.md` に §2 のテンプレートを投入してから実行する。Phase 11 evidence 確定後 `gh pr ready <PR>` で draft → ready 化する。

---

## 4. PR 作成前 final checklist

| # | 項目 | 確認方法 |
|---|------|---------|
| F-01 | `git status --porcelain` 空 | `git status --porcelain` |
| F-02 | `git diff dev...HEAD --name-only` で含まれる変更がスコープ通り | 実行 + 目視（4 ファイル + spec 群 + evidence + docs） |
| F-03 | `pnpm typecheck` / `pnpm lint` pass | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| F-04 | `actionlint` 0 violation | `mise exec -- pnpm dlx actionlint .github/workflows/lighthouse.yml` |
| F-05 | `lhci healthcheck` exit 0 | `mise exec -- pnpm exec lhci healthcheck --config=./lighthouserc.json` |
| F-06 | evidence ファイル全件存在（phase-11 §5） | `ls outputs/phase-11/` |
| F-07 | LOGS.md / topic-map / backlog / CLAUDE.md 全て更新済 | `git diff` で目視 |
| F-08 | `verify-indexes-up-to-date` 想定 pass（local rebuild 済） | `mise exec -- pnpm indexes:rebuild` 実行後 git diff = 0 |
| F-09 | 3b / 3c の差分が混入していないこと | `git diff dev...HEAD --name-only \| grep -E 'e2e-tests\.yml\|playwright\.config\.ts\|coverage-gate-e2e\.sh'` 該当 0 |

---

## 5. PR merge 後

| # | 操作 |
|---|------|
| M-01 | `feat/lighthouse-ci` を削除（local + remote） |
| M-02 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/index.md` の Phase 13 状態を `done` に更新（commit 込み・追加 PR 不要なら `dev` で直接更新） |
| M-03 | dev で 1 PR 通して `lighthouse-ci` が check-runs に登場することを観測 → `outputs/phase-11/registered-contexts.txt` 保存 |
| M-04 | 3b / 3c に着手（別 worktree / 別 PR） |

---

## 6. 終了基準

| # | 条件 |
|---|------|
| EX-01 | PR-A が `dev` に merge されている |
| EX-02 | dev で `lighthouse-ci` context が登録されており次 PR で実行されることを観測 |
| EX-03 | 本サブタスクの spec / LOGS / topic-map / backlog が反映 |
| EX-04 | 3b / 3c への引継 backlog が記録 |

---

## 7. 3a 終了

本 Phase 完了をもって `e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci` を終了。後続の 3b / 3c は親ワークフロー `e2e-quality-uplift-stage-3` の進行に従う。

---

## DoD（Phase 13 完了条件）

| # | 条件 |
|---|------|
| D-01 | PR title / body / base / head が確定 |
| D-02 | F-01..F-09 final checklist が網羅 |
| D-03 | merge 後 M-01..M-04 が記述 |
| D-04 | 3b / 3c への引継が記述 |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

PR-A の作成と merge 後オペレーションを確定し、3a 単独サイクルを完結させる。

## 実行タスク

- PR title / body / base / head を確定。
- final checklist を網羅。
- merge 後オペレーションを確定。

## 参照資料

- docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-13.md
- phase-11.md / phase-12.md（本サブタスク内）

## 実行手順

1. PR body を `outputs/phase-13/pr-body.md` に書き出す。
2. `gh pr create --draft` で PR-A 作成。
3. evidence 確定後 `gh pr ready` で draft 解除。
4. merge 後 M-01..M-04 を実行。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- PR-A（base dev）

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
