# Phase 4: テスト作成（targeted: matrix 整合確認）

> `implementation_mode = "verify_existing"` のため、本タスクは「新規実装の RED テスト作成」ではなく、**matrix 文書の整合性を確認する targeted check の設計**を行う。

## 1. 検証観点

| ID | 観点 | 検証手段 |
|----|------|----------|
| T1 | matrix の 19 行と `full-smoke.spec.ts` の `ROUTES[]` が 1:1 で対応する | grep + 手動突合（Phase 6） |
| T2 | 4 visual baseline と matrix の `visual baseline` 列が 1:1 で対応する | `ls apps/web/playwright/tests/visual/*.spec.ts` と matrix 突合 |
| T3 | 各 route の DOM selector が `data-testid` 規約（kebab-case / 層 prefix）に従う | matrix → 実 source（`apps/web/src/app/**/page.tsx`）への grep |
| T4 | CI gate job 名 3 本が matrix 内の参照と一致する | `.github/workflows/playwright-smoke.yml` の `name:` / `jobs.<id>.name` を grep |
| T5 | token 軸の正本パスが 09b JSON / tokens.css / globals.css の 3 か所と一致する | task-18 §0.4 §0.6 と matrix 突合 |
| T6 | 共通 3（error / not-found / loading）行に observability 戦略 or `N/A + future task` が記載 | matrix の該当 3 行を目視確認 |
| T7 | 既存 spec → matrix 行 の逆引きマップに重複・欠落なし | matrix section 9 を tabular validator で検査 |

## 2. matrix 整合 lint（manual check）

Phase 6 で以下を実行する:

```bash
# T1: 19 行確認
grep -E '^\| [0-9]+ ' docs/30-workflows/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md | wc -l
# 期待: 19

# T2: visual baseline ファイル数確認
ls apps/web/playwright/tests/visual/*.spec.ts | wc -l
# 期待: 4

# T3: data-testid 規約 grep
grep -RhoE 'data-testid="[a-z0-9-]+"' apps/web/src/app | sort -u

# T4: CI gate job 名確認
grep -E '^\s*name:' .github/workflows/playwright-smoke.yml

# T5: token SSOT path 確認
grep -E '09b-design-tokens\.md|tokens\.css|globals\.css' docs/30-workflows/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md
```

## 3. 期待結果

- T1〜T7 すべて PASS（matrix 自体が source of truth と整合）
- 不一致発見時は matrix を修正し再実行（gate は matrix 側のみ）

## 4. NON_VISUAL 宣言

UI/UX 変更を伴わないため、Playwright spec 追加・スクリーンショット採取・renderer test は行わない。`outputs/phase-11/manual-test-result.md` で文書整合チェックリストを代替証跡とする。
