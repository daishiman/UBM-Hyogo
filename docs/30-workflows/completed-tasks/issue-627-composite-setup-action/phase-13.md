# Phase 13: PR 作成 / Issue 参照（RB-02 Composite setup action）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-12.md` 完了 |
| 出力 | PR（base=`dev`, head=`feat/issue-627-composite-setup-action`）+ Issue #627 reference |
| PR スコープ | composite action 新規 + 7 workflow 置換 + spec + evidence + LOGS + backlog + topic-map + CLAUDE.md |

---

## 1. PR 構造

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `feat/issue-627-composite-setup-action` |
| title | `feat(ci): add composite setup-project action and dedupe 7 workflow jobs (#627)` |
| label（任意） | `ci`, `refactor`, `rb-02` |
| reviewer | なし（solo policy） |
| reference issue | `Refs #627` のみを body に含める（Issue #627 は既に CLOSED） |
| draft? | 初回 push は draft（実 run 観測のため）→ Phase 11 evidence 揃ったら ready for review |
| user approval gate | commit / push / PR 作成 / draft 解除はユーザー明示承認後のみ |

---

## 2. PR 本文テンプレート

`.claude/commands/ai/diff-to-pr.md` 互換フォーマット。`outputs/phase-13/pr-body.md` として保存し `gh pr create --body-file` で投入する。

```markdown
## Summary

- `.github/actions/setup-project/action.yml` を composite action として新規追加し、7 workflow job の checkout 後 setup ブロックを `uses: ./.github/actions/setup-project` に集約。
- setup 行数を実測で 70% 以上削減（実測は `outputs/phase-11/evidence/setup-lines-delta.md` 参照）。
- `mise exec` 系統（`pr-build-test.yml`）と `setup-node` 系統（`ci.yml` / `lighthouse.yml` / `e2e-tests.yml`）の双方を input `setup-strategy: mise|setup-node` で切り替え可能に設計。
- branch protection の `required_status_checks.contexts` は **一切変更しない**（before/after snapshot diff = 0）。

Refs #627.

## Spec

- `docs/30-workflows/issue-627-composite-setup-action/index.md`
- `docs/30-workflows/issue-627-composite-setup-action/phase-{1..13}.md`

## 変更ファイル

- `.github/actions/setup-project/action.yml`（新規）
- `.github/workflows/lighthouse.yml`（edit / setup ステップを 1 行 uses に置換）
- `.github/workflows/e2e-tests.yml`（edit / 2 job 置換）
- `.github/workflows/ci.yml`（edit / 3 job 置換）
- `.github/workflows/pr-build-test.yml`（edit / 1 job 置換）
- `docs/30-workflows/issue-627-composite-setup-action/`（spec 群 + evidence + LOGS.md 新規）
- `docs/30-workflows/LOGS.md`（1 行追記）
- `docs/30-workflows/e2e-quality-uplift/backlog.md`（RB-02 行を `closed (#627)` 更新）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.*`（2 entry 追加 + rebuild 反映）
- `CLAUDE.md`（actionlint 1 行追記）

## 影響範囲

| 層 | 影響 |
|----|------|
| アプリ runtime（`apps/web` / `apps/api`） | なし（CI infra のみ）|
| D1 schema | なし |
| Cloudflare Workers deploy | なし |
| GitHub Actions workflow | setup ステップ展開方法が変更されるが、各 job の output / artifact / required check 名は不変 |
| branch protection | 不変（drift 0 を evidence で証跡）|

## Before / After 行数

| workflow | job | before | after | delta |
|---------|-----|--------|-------|-------|
| lighthouse.yml | lighthouse | 12 | 2 | -10 |
| e2e-tests.yml | e2e-shard | 12 | 2 | -10 |
| e2e-tests.yml | report-merge | 12 | 2 | -10 |
| ci.yml | typecheck | 12 | 2 | -10 |
| ci.yml | lint | 12 | 2 | -10 |
| ci.yml | test | 12 | 2 | -10 |
| pr-build-test.yml | pr-build-test | 10 | 2 | -8 |
| **合計** | — | **82** | **14** | **-68 (83% 削減)** |

> 実数は `outputs/phase-11/evidence/setup-lines-delta.md` を正本とし、PR 作成時の実測値で更新する。

## Evidence（`docs/30-workflows/issue-627-composite-setup-action/outputs/phase-11/evidence/`）

- `gha-run-urls.md` — 全 required check（ci / coverage-gate / lighthouse-ci / e2e-tests-coverage-gate / build-test / workflow-shell-lint）の run URL + green conclusion
- `setup-lines-delta.md` — before-after 行数集計表 + 削減率
- `actionlint.log` — composite action + 全 workflow を actionlint 実行（violation 0）
- `branch-protection-before.json` / `branch-protection-after.json` / `branch-protection-diff.json` — required contexts drift 0 の証跡
- `composite-step-expansion.log` — composite action 呼び出し時の展開 log（1 件代表）

## Test plan

- [ ] workflow YAML を `actionlint` で violation 0、`.github/actions/setup-project/action.yml` を composite structure / SHA pin gate で pass
- [ ] ユーザー明示承認後、`feat/issue-627-composite-setup-action` で draft PR を作成し、全 required check（ci / coverage-gate / lighthouse-ci / e2e-tests-coverage-gate / build-test / workflow-shell-lint）が green
- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` で `required_status_checks.contexts` が PR 作成前後で差分 0
- [ ] `outputs/phase-11/evidence/setup-lines-delta.md` の削減率 >= 70%
- [ ] `verify-indexes-up-to-date` job が pass（topic-map 更新後 `pnpm indexes:rebuild` 反映済）

## ドキュメント更新

- `CLAUDE.md`: actionlint 1 行コマンド追記
- `docs/30-workflows/issue-627-composite-setup-action/LOGS.md`: 新規
- `docs/30-workflows/LOGS.md`: 1 行追記
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.*`: `composite-action` / `ci-setup-dedup` entry 追加
- `docs/30-workflows/e2e-quality-uplift/backlog.md`: RB-02 を `closed (#627)` 更新

## 後続作業（本 PR 範囲外）

- RB-05 候補: `mise exec` 系統と `setup-node` 系統の統一（composite action の input `setup-strategy` を将来 1 本化）

## CONST_007 / solo policy

- single-cycle scope 遵守（Phase 1→2→...→13 一直線）
- `required_pull_request_reviews=null` 維持（本 PR は branch protection を変更しない）
- `lock_branch=false` / `enforce_admins` 既存値維持

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 3. PR 作成コマンド

```bash
# 1. PR 本文を outputs/phase-13/pr-body.md に書き出す
mkdir -p docs/30-workflows/issue-627-composite-setup-action/outputs/phase-13
# §2 のテンプレートを pr-body.md に投入

# 2. ユーザー明示承認後に draft PR 作成
gh pr create \
  --base dev \
  --head feat/issue-627-composite-setup-action \
  --title "feat(ci): add composite setup-project action and dedupe 7 workflow jobs (#627)" \
  --body-file docs/30-workflows/issue-627-composite-setup-action/outputs/phase-13/pr-body.md \
  --draft

# 3. Phase 11 evidence 確定後、ユーザー明示承認後に draft 解除
gh pr ready <PR>
```

---

## 4. PR 作成前 final checklist

| # | 項目 | 確認方法 |
|---|------|---------|
| F-01 | `git status --porcelain` 空 | `git status --porcelain` |
| F-02 | `git diff dev...HEAD --name-only` で含まれる変更がスコープ通り | 実行 + 目視（composite action + 4 workflow + spec 群 + evidence + docs）|
| F-03 | `pnpm typecheck` / `pnpm lint` pass | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| F-04 | `actionlint` 0 violation | workflow YAML files only; composite action is covered by structure / SHA pin gate |
| F-05 | evidence ファイル全件存在（phase-11 §7）| `ls outputs/phase-11/evidence/` |
| F-06 | LOGS.md / topic-map / backlog / CLAUDE.md 全て更新済 | `git diff` で目視 |
| F-07 | `verify-indexes-up-to-date` 想定 pass（local rebuild 済）| `mise exec -- pnpm indexes:rebuild` 実行後 git diff = 0 |
| F-08 | branch protection drift 0 | `outputs/phase-11/evidence/branch-protection-diff.json` が空 |
| F-09 | PR 本文に `Refs #627` を含み、`Closes` / `Fixes` / `Resolves` を含まない | grep で確認 |

---

## 5. Issue #627 参照手順（CLOSED 維持）

PR 本文には `Refs #627` のみを含める。Issue #627 は既に CLOSED のため、GitHub の自動 close keyword や issue close command は使わず、reopen / close 操作もしない。

```bash
gh issue view 627 --json state,closedAt
# 期待: { "state": "CLOSED", "closedAt": "<timestamp>" }
```

---

## 6. PR merge 後

| # | 操作 |
|---|------|
| M-01 | `feat/issue-627-composite-setup-action` を削除（local + remote）|
| M-02 | `docs/30-workflows/issue-627-composite-setup-action/index.md` の `workflow_state` を `done` に更新（dev で直接 fixup commit 可、または `completed-tasks/` 配下に移動）|
| M-03 | dev で次 PR 1 件を起動し、composite action が期待どおりに展開されることを観測 |
| M-04 | RB-05（mise / setup-node 統一）の Issue 起票検討 |

---

## 7. 終了基準

| # | 条件 |
|---|------|
| EX-01 | PR が `dev` に merge されている |
| EX-02 | Issue #627 は CLOSED 維持（reopen/close しない）|
| EX-03 | dev で composite action が展開されることを次 PR で観測 |
| EX-04 | spec / LOGS / topic-map / backlog / CLAUDE.md が反映済 |

---

## 8. RB-02 終了

本 Phase 完了をもって `docs/30-workflows/issue-627-composite-setup-action` を終了し、`docs/30-workflows/e2e-quality-uplift/backlog.md` の RB-02 行は `closed (#627)` 状態となる。

---

## DoD（Phase 13 完了条件）

| # | 条件 |
|---|------|
| D-01 | PR title / body / base / head が確定 |
| D-02 | F-01..F-09 final checklist が網羅 |
| D-03 | Issue #627 CLOSED 維持と `Refs #627` only rule が記述 |
| D-04 | merge 後 M-01..M-04 が記述 |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 13
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

PR 作成と Issue #627 の `Refs` trace、merge 後オペレーションを確定し、RB-02 単独サイクルを完結させる。

## 実行タスク

- PR title / body / base / head を確定。
- final checklist F-01..F-09 を網羅。
- Issue #627 CLOSED 維持と `Refs #627` only rule を確定。
- merge 後オペレーションを確定。

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/index.md
- phase-11.md / phase-12.md（本サブタスク内）
- .claude/commands/ai/diff-to-pr.md

## 実行手順

1. PR body を `outputs/phase-13/pr-body.md` に書き出す。
2. ユーザー明示承認後に `gh pr create --draft --base dev` で PR 作成。
3. evidence 確定後、ユーザー明示承認後に `gh pr ready` で draft 解除。
4. `gh issue view 627 --json state,closedAt` で CLOSED 維持を確認する。
5. M-01..M-04 を実行。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として GHA run 観測、actionlint、行数集計、branch protection diff を使用する。
- screenshot 不要のため Phase 11 の代替 evidence を PR 本文に参照する。

## 成果物

- 本 phase markdown
- PR（base dev）
- Issue #627 reference

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
