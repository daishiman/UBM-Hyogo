# Phase 4: テスト作成（targeted: matrix 整合確認）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-ui-mvp-w8-par-routes-smoke-coverage` |
| Phase | 4 / テスト作成 |
| Status | `spec_created` |
| Classification | `docs-only / NON_VISUAL / verify_existing` |
| 主成果物 | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 目的

Current worktree の 17 URL smoke entries と 2 component-only surfaces を、Phase 4 の観点から coverage matrix へ矛盾なく接続する。

## 実行タスク

- 既存 Playwright smoke / visual spec と親 workflow SCOPE の current facts を確認する。
- Phase 4 の判断結果を `outputs/phase-04/test-plan.md` と main deliverable に同期する。
- root / outputs artifacts parity と docs-only / NON_VISUAL 境界を崩さない。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `apps/web/playwright/tests/full-smoke.spec.ts`
- `apps/web/playwright/tests/visual/*.spec.ts`
- `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/artifacts.json`

## 成果物/実行手順

- 成果物: `outputs/phase-04/test-plan.md`
- 手順: current facts を確認し、docs-only matrix と Phase evidence のみを更新する。

## 完了条件

- [x] Phase 4 の成果物パスが明記されている。
- [x] docs-only / NON_VISUAL / verify_existing の境界が明記されている。
- [x] 新規 runtime code / CI workflow 変更が scope 外として扱われている。

## 統合テスト連携

- docs-only / NON_VISUAL のため、この Phase では新規自動テストを追加しない。
- 実行可能な正本は `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts`、証跡は `outputs/phase-04/test-plan.md` に集約する。

## 詳細

> `implementation_mode = "verify_existing"` のため、本タスクは「新規実装の RED テスト作成」ではなく、**matrix 文書の整合性を確認する targeted check の設計**を行う。

## 1. 検証観点

| ID | 観点 | 検証手段 |
|----|------|----------|
| T1 | matrix の 19 surface 行と `full-smoke.spec.ts` の `ROUTES[]` が 1:1 で対応する | grep + 手動突合（Phase 6） |
| T2 | 4 visual baseline と matrix の `visual baseline` 列が 1:1 で対応する | `ls apps/web/playwright/tests/visual/*.spec.ts` と matrix 突合 |
| T3 | 各 route の DOM selector が `data-testid` 規約（kebab-case / 層 prefix）に従う | matrix → 実 source（`apps/web/src/app/**/page.tsx`）への grep |
| T4 | CI gate job 名 3 本が matrix 内の参照と一致する | `.github/workflows/playwright-smoke.yml` の `name:` / `jobs.<id>.name` を grep |
| T5 | token 軸の正本パスが 09b JSON / tokens.css / globals.css の 3 か所と一致する | task-18 §0.4 §0.6 と matrix 突合 |
| T6 | 共通 3（error / not-found / loading）行に observability 戦略 or `N/A + future task` が記載 | matrix の該当 3 行を目視確認 |
| T7 | 既存 spec → matrix 行 の逆引きマップに重複・欠落なし | matrix section 9 を tabular validator で検査 |

## 2. matrix 整合 lint（manual check）

Phase 6 で以下を実行する:

```bash
# T1: 19 surface 行確認
grep -E '^\| [0-9]+ ' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md | wc -l
# 期待: 19

# T2: visual baseline ファイル数確認
ls apps/web/playwright/tests/visual/*.spec.ts | wc -l
# 期待: 4

# T3: data-testid 規約 grep
grep -RhoE 'data-testid="[a-z0-9-]+"' apps/web/src/app | sort -u

# T4: CI gate job 名確認
grep -E '^\s*name:' .github/workflows/playwright-smoke.yml

# T5: token SSOT path 確認
grep -E '09b-design-tokens\.md|tokens\.css|globals\.css' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
```

## 3. 期待結果

- T1〜T7 すべて PASS（matrix 自体が source of truth と整合）
- 不一致発見時は matrix を修正し再実行（gate は matrix 側のみ）

## 4. NON_VISUAL 宣言

UI/UX 変更を伴わないため、Playwright spec 追加・スクリーンショット採取・renderer test は行わない。`outputs/phase-11/manual-test-result.md` で文書整合チェックリストを代替証跡とする。
