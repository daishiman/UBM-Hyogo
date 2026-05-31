---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 13
phase_name: PR
created_at: 2026-05-29
---

# Phase 13: PR

[実装区分: 実装仕様書]

> 状態: `pending_user_approval`。実装は親 Task A-E 完了後に親 `feat/unified-sidebar-shell` 系列で
> 行い、commit / push / PR / 空コミット再トリガー / required status check PUT は全て user-gated。

## 1. branch

実装は親 workflow と同一の `feat/unified-sidebar-shell` 系列で行う（Task A-E と統合）。
仕様作成自体は `docs/task-f-visual-baseline-smoke-spec` で完結する。

## 2. base

`dev`（CLAUDE.md 既定の PR base ブランチ）。production リリース時のみ `dev → main`。

## 3. PR タイトル案

`test(sidebar-shell): visual baseline (7 screenshot) + smoke (6 case)`

## 4. PR 本文要点

- 統合 collapsible Sidebar Shell（公開 / 会員 / 管理の 3 層共通）に対し、3 role × 3 viewport の **7 visual baseline** + **6 smoke ケース** を捕捉
- 追加ファイル: spec 2（`sidebar-shell-smoke.spec.ts` / `sidebar-shell-visual.spec.ts`）+ helper 1（`_helpers.ts`）+ `playwright.config.ts` の project 3 追加・testIgnore 追記 + `.github/workflows/playwright-smoke.yml` の smoke matrix 拡張・visual matrix 追加
- パストポロジ補正: source task の `apps/web/tests/e2e/sidebar-shell-*.spec.ts` を実構造 `apps/web/playwright/tests/sidebar-shell/` へ補正（phase-1 §7）
- local 完結: 既存 `apps/web/playwright/fixtures/auth.ts` 拡張 `test`（`anonymousPage`/`memberPage`/`adminPage` + `mockApi`）のみ使用。新規 storageState / staging 依存なし
- bot baseline push 後の **空コミット再トリガー**（GITHUB_TOKEN は `pull_request` 非発火）を明記
- required status check 候補 4 件（実 PUT は user-gated）

---

## 5. required status check 候補（user-gated PUT）

- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (sidebar-shell desktop)`
- `playwright-smoke / visual (sidebar-shell tablet)`
- `playwright-smoke / visual (sidebar-shell mobile)`

実 `gh api -X PUT /repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` への追加は **user 明示承認後のみ**。read-only `gh api` で before JSON を事前 evidence として取得可能。

---

## 6. DoD（Definition of Done）

- [ ] spec 2 + helper 1 + `playwright.config.ts` + `playwright-smoke.yml` 配置（Phase 2 §1 §7 §8）
- [ ] smoke S1〜S6 の 6 ケース全 green
- [ ] visual V1〜V7 の 7 `-linux.png` baseline 配置（`find apps/web/playwright/tests/sidebar-shell -name '*-sidebar-shell-visual-*-linux.png' | wc -l` = 7）
- [ ] regression dry-run（token 改変 → fail → revert）で visual diff 検出を確認
- [ ] grep gate: 旧パス `apps/web/tests/e2e/sidebar-shell` への参照 0 件
- [ ] Phase 11 evidence 表埋め（smoke 6 結果 / visual 7 baseline path / status）
- [ ] required check 候補列挙（実 PUT は user-gated・未実施でも DoD pass）
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- bash scripts/verify-pr-ready.sh` green
- [ ] `mise exec -- pnpm gate-metadata:validate` ERROR:0
- [ ] `mise exec -- pnpm verify:phase12-compliance` pass
- [ ] `mise exec -- pnpm indexes:rebuild` idempotent（md5 一致）
- [ ] 不変条件: macOS 撮影分の `-darwin.png` が staged になっていない
- [ ] 親 Task A-E（shell primitive / user-menu / public+member layout / admin layout / mobile drawer）完了・統合確認
- [ ] bot baseline push 後の空コミット再トリガー実施（user-gated）

---

## 7. 実行コマンド（PR 作成）

```bash
# 既定ブランチ dev に対する PR
gh pr create --base dev --title "test(sidebar-shell): visual baseline (7 screenshot) + smoke (6 case)" \
  --body "$(cat <<'EOF'
## Summary
- 統合 collapsible Sidebar Shell（公開 / 会員 / 管理の 3 層共通）に対し、3 role × 3 viewport の 7 visual baseline + 6 smoke ケースを捕捉
- 追加: spec 2 + helper 1 + playwright.config.ts（project 3 追加 / testIgnore 追記） + playwright-smoke.yml（smoke matrix 拡張 / visual matrix 追加）
- パストポロジ補正: source task の apps/web/tests/e2e/sidebar-shell-*.spec.ts を実構造 apps/web/playwright/tests/sidebar-shell/ へ補正
- local 完結: 既存 auth fixture（anonymousPage / memberPage / adminPage + mockApi）のみ使用。新規 storageState / staging 依存なし
- bot baseline push 後の空コミット再トリガーを明記（GITHUB_TOKEN は pull_request 非発火のため）

## Test plan
- [ ] CI playwright-smoke / smoke (chromium) で sidebar-shell-smoke 6 ケース green
- [ ] CI playwright-smoke / visual (sidebar-shell desktop / tablet / mobile) 3 matrix 全 green
- [ ] find apps/web/playwright/tests/sidebar-shell -name '*-sidebar-shell-visual-*-linux.png' | wc -l = 7
- [ ] regression dry-run で visual diff 検出
- [ ] 旧パス apps/web/tests/e2e/sidebar-shell への参照 0 件

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## 8. 不変条件再掲

- `-linux.png` 正本（CI Linux runner 撮影。macOS 撮影分 `-darwin.png` は commit しない）
- 認証経路は既存 `apps/web/playwright/fixtures/auth.ts` 拡張 `test`（`anonymousPage`/`memberPage`/`adminPage` + `mockApi`）を継承し、新規 storageState を作らない
- bot baseline push 後は **空コミット再トリガー必須**（GITHUB_TOKEN の `pull_request` 非発火制限）
- 親 Task A-E 完了・統合が着手前提（sibling task への技術的依存）
- smoke / visual は local（`mockApi` + auth fixture）で完結し、staging API には依存しない
