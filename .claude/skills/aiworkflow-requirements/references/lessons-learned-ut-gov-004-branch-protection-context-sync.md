# Lessons Learned: UT-GOV-004 branch protection required_status_checks contexts 同期

> 由来: `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/`
> 完了日: 2026-04-29
> タスク種別: governance / docs-only / NON_VISUAL / spec_created
> 出典: `index.md` §苦戦箇所・知見、`outputs/phase-12/system-spec-update-summary.md`

## 概要

GitHub branch protection の `required_status_checks.contexts` 草案 8 件を、`.github/workflows/` 配下に実在する workflow `name:` / job `name:` と同期し、過去 30 日以内に GitHub 上で `conclusion=success` 実績が確認できる 3 contexts のみを Phase 1 投入対象として確定した。UT-GOV-001 への入力契約は `outputs/phase-08/confirmed-contexts.yml` に一本化。

## branch protection 運用ルール 4 項目（system-spec-update-summary.md §4 正本）

| 規則 | 出典 AC | 内容 |
| --- | --- | --- |
| L-GOV004-AC3 | AC-3 | 投入文字列は `gh api repos/:owner/:repo/commits/:sha/check-runs` で過去 30 日以内に少なくとも 1 回 `conclusion=success` の check-run 実績を持つこと。実績なしの context は Phase 1 投入対象から除外する |
| L-GOV004-AC8 | AC-8 | context は必ず `<workflow name> / <job name>` のフルパスで記載する。同名 job が複数 workflow に存在しても別物として扱う（例: `ci / lint` ≠ `pr-check / lint`） |
| L-GOV004-AC9 | AC-9 | context 名変更を伴う workflow refactor は branch protection 設定更新と同一 PR で行う（経路 A）。または事前に新旧両方を contexts に並べ、旧側で 1 回 PASS してから旧を外す（経路 B） |
| L-GOV004-AC5 | AC-5 | lefthook hook と CI job は同一 `pnpm` script を呼び出す規約とする（例: `pnpm typecheck` / `pnpm lint`）。別実装にするとローカル PASS → CI FAIL のドリフトが常態化する |

## 苦戦箇所 6 件（index.md §苦戦箇所・知見 由来）

### L-GOV004-001: 存在しない context 名による merge 完全停止

草案 8 contexts のうち実在しない名前を投入すると、その branch への全 PR が `Expected — Waiting for status to be reported` で永遠に止まり、admin override か protection 修正でしか解除できない。

- **教訓**: 投入前の check-run 実績確認 (`gh api ... /check-runs`) を AC-3 として必須化。
- **再発防止**: `confirmed-contexts.yml` を「実績ある context のみ」を機械可読正本として採用し、UT-GOV-001 はこのファイルだけを apply 入力にする。

### L-GOV004-002: context 名生成規則の混乱

workflow `name:` と job `name:` のどちらが context 名になるかは GitHub 内部規則に依存。一般則は `<workflow name> / <job name>`、matrix 時は `<workflow> / <job> (<matrix-values>)`。`name:` 省略時は YAML キー名が使われるため、後付け `name:` 追加で過去実績が無効化される。

- **教訓**: `name:` 不変 24 時間ルールを Phase 2 投入条件に明文化。
- **参照**: `outputs/phase-05/workflow-job-inventory.md`、`confirmed-contexts.yml` `rollout_conditions.phase_2`。

### L-GOV004-003: 同名 job が複数 workflow に存在するケース

`lint` という job 名が `ci.yml` と `pr-check.yml` 両方にあれば context は別物（`ci / lint` と `pr-check / lint`）。

- **教訓**: AC-8 として「`<workflow> / <job>` フルパス記載必須」を運用ルール化。
- **再発防止**: `confirmed-contexts.yml` の `evidence[].workflow_name` / `job_name` で出処を明示。

### L-GOV004-004: `strict: true`（up-to-date 必須）のトレードオフ

有効化すると base 最新取り込み必須となり merge 摩擦が増える。dev は摩擦低減を優先し `false`、main は壊れリスク回避を優先し `true` の段階適用とする。

- **教訓**: dev / main 別の strict 採否決定を `outputs/phase-09/strict-decision.md` に明文化し、`confirmed-contexts.yml.strict` の dev/main 別値で正本化。

### L-GOV004-005: lefthook と CI のドリフト

別実装になるとローカル PASS → CI FAIL の摩擦が常態化する。

- **教訓**: AC-5 として「同一 `pnpm` script を双方から呼ぶ」を規約化。
- **対応表正本**: `outputs/phase-08/lefthook-ci-mapping.md`（`task-git-hooks-lefthook-and-post-merge` と整合）。

### L-GOV004-006: 段階適用時の名前変更事故

フェーズ 1 投入後の workflow refactor で `name:` が変わると即座に merge 不能。

- **教訓**: AC-9 として 2 経路を運用ルール化（同一 PR で branch protection 更新 / 新旧並列 → 旧側 PASS 確認後に旧外す）。
- **検出**: workflow `name:` drift の自動検出は UT-GOV-007 にリレー。

## 機械可読正本（UT-GOV-001 への入力契約）

`docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml`

```yaml
required_status_checks:
  contexts:
    - "ci"                             # .github/workflows/ci.yml
    - "Validate Build"                 # .github/workflows/validate-build.yml
    - "verify-indexes-up-to-date"      # .github/workflows/verify-indexes.yml
  strict:
    dev: false
    main: true
```

Phase 2 候補 4 件（`unit-test` / `integration-test` / `security-scan` / `docs-link-check`）は workflow 未実装のため UT-GOV-005 にリレーし、新設後に `name:` 不変 24 時間 + 1 回成功確認 + branch protection 更新と同一 PR の 3 条件で追加投入する。

## 関連リレー先

| relay 先 | 責務 |
| --- | --- |
| UT-GOV-001 | `confirmed-contexts.yml` を唯一の入力として branch protection を apply |
| UT-GOV-005 | docs-only / non-visual / template / skill sync 系 CI 新設（Phase 2 候補 4 件の供給） |
| UT-GOV-007 | GitHub Actions action ピン留め + workflow `name:` drift 自動検出 |
| task-git-hooks-lefthook-and-post-merge | lefthook hook ↔ CI job 同一 pnpm script 規約の対応表整合 |

## 不変条件 touched

CLAUDE.md §「重要な不変条件」#1〜#7 への影響なし。本タスクは GitHub governance 層に閉じる。
