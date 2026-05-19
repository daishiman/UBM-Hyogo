# 2026-05-19 - sync-merge 後の phase12-compliance-guard が spec-only / flat-layout の workflow root を fail させる

## Summary

- `dev → feature` の sync-merge 後 `git push` で pre-push hook `scripts/hooks/phase12-compliance-guard.sh` が以下 4 種の workflow root を fail させた:
  1. `docs/30-workflows/issue-766-dialog-refresh-order/` — flat-layout（phase-1..13-*.md）の spec のみで `outputs/phase-12/phase12-task-spec-compliance-check.md` が未生成
  2. `docs/30-workflows/issue-768-login-loading-and-error-focus/` — 同上
  3. `docs/30-workflows/issue-770-profile-loading-skeleton/` — file 存在するが canonical heading（`workflow_state` and phase status consistency / Phase 11 evidence file inventory / Phase 12 strict 7 file inventory / Skill/reference/system spec same-wave sync / Runtime or user-gated boundary / Archive/delete stale-reference gate）逐語不一致
  4. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/` — `Phase 11 evidence file inventory` テーブルが `ファイル / 状態 / 用途` 列で `Classification / Path / Status` parser 規約から外れて `<empty-or-missing-table>` fail
- 4 root すべて `outputs/phase-12/phase12-task-spec-compliance-check.md` を canonical heading 9 個逐語 + `Classification / Path / Status` 3 列固定の Phase 11 evidence inventory で書き直し / 新規生成し、`pnpm verify:phase12-compliance` で全 root PASS を確認した。
- `verify-phase12-compliance` の changed-roots 検出は `git diff origin/dev...HEAD` ベースのため、sync-merge により diff スコープが広がり過去 PR の遺漏が後追いで失敗する。原因はテンプレ規約の周知不足であり、再発防止として task-specification-creator skill に「spec-only / flat-layout でも compliance file は必須」「Phase 11 evidence inventory 列は `Classification / Path / Status` 固定」を追記する。

## Lessons

- L-DEVSYNC-016: spec_created（docs-only / flat-layout phase-N-*.md 形式）の workflow root でも `outputs/phase-12/phase12-task-spec-compliance-check.md` は CI gate 必須。`Phase 11 evidence file inventory` は `Classification / Path / Status` 3 列 / `Status ∈ {present, pending, n/a}` で空テーブル禁止（n/a 1 行で記す）。
- L-DEVSYNC-017: sync-merge を契機に `verify-phase12-compliance` が「過去 PR で見落とした workflow root」を後追いで block するため、merge 直後に `pnpm verify:phase12-compliance` を `pnpm typecheck && pnpm lint` と並行で走らせると pre-push 直前の rework を防げる。
- L-DEVSYNC-018: canonical heading 9 個（`Summary verdict` / `Changed-files classification` / `` `workflow_state` and phase status consistency `` / `Phase 11 evidence file inventory` / `Phase 12 strict 7 file inventory` / `Skill/reference/system spec same-wave sync` / `Runtime or user-gated boundary` / `Archive/delete stale-reference gate` / `Four-condition verdict`）は逐語一致が必須。`And` / 大文字化 / 番号付け除去等の表記揺れで fail する。

## Boundary

skill reference / changelog 文書のみ。CI gate 仕様・verifier 実装・runtime コードは不変。
