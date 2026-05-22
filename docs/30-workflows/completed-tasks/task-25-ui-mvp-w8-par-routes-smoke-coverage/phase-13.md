# Phase 13: PR 作成（ユーザー明示承認後のみ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 13 / PR作成 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 13 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 13 の判断結果を `phase-13.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `phase-13.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 13 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 詳細

## 1. 状態

`blocked` — user の明示承認まで実施しない。

## 2. PR 構成

| 項目 | 値 |
|------|----|
| base ブランチ | `dev` |
| ブランチ | `feat/ui-mvp-task-25-routes-smoke-coverage` |
| タイトル候補 | `docs(ui-mvp): add 17 URL smoke entries + 2 component surfaces Playwright smoke coverage matrix (task-25)` |
| 主要差分 | `docs/30-workflows/task-25-.../` 一式 + `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 3. PR 本文骨子

```
## Summary
- task-18 で実装した CI gate（playwright-smoke / verify-design-tokens）が「何を守るか」を 17 URL smoke + 2 component surfaces × 5 軸の matrix で文書化
- 既存 4 visual baseline との関係を明示し、残り 15 non-baseline surfaces を future candidate として整理
- docs-only / NON_VISUAL / verify_existing（apps/ への code 変更ゼロ）

## Coverage
- 17 URL smoke entries + 2 component surfaces × {status / DOM / token / a11y / interaction}
- 4 visual baseline: login / public-top / admin-dashboard / profile
- CI gate refs: playwright-smoke / smoke (chromium), playwright-smoke / visual (chromium, 4 screens), verify-design-tokens / verify-design-tokens

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] matrix の 17 URL smoke 行が full-smoke.spec.ts の ROUTES[] と一致し、2 component surface 行が `error.tsx` / `loading.tsx` と一致
- [ ] visual baseline 4 件と matrix の `✓` セルが一致

## Out of scope
- 残り 15 non-baseline surfaces の visual baseline 採取（U1 として未タスク化）
- error / loading observability standardize（U2 / U3 として未タスク化）
```

## 4. 事前チェック

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` の出力が docs-only に閉じる
- [ ] Phase 12 strict 7 成果物すべて存在
- [ ] Phase 11 manual-test-result.md が NON_VISUAL 宣言を含む

## 5. 承認待ち

user が「PR 作成」「PR 出して」「diff-to-pr」を明示するまで `gh pr create` を実行しない。
