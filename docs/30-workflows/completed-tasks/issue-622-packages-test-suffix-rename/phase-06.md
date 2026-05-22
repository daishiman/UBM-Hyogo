# Phase 6 — 実装サイクル handoff（git mv 手順 / ADR draft）

## 6.1 後続実装プロンプト（03.実装.md）への引き渡し情報

### 6.1.1 実装ブランチ作成

```bash
git fetch origin dev
git checkout -b refactor/issue-622-packages-test-suffix-rename origin/dev
```

### 6.1.2 ADR ファイルの作成

#### `packages/shared/ADR-test-suffix.md`（新規・必須）

```markdown
# ADR — packages/shared test suffix

- Status: Accepted (2026-05-11)
- Context: モノレポ横断ルール（`apps/api` Issue #325, `apps/web` Issue #621）に追随し、`.spec.ts` に統一する。
- Decision:
  - 横断ルール: すべての test ファイルは `*.spec.ts` / `*.spec.tsx` を使用する。`*.test.ts` は禁止。
  - shared 固有: 種別 prefix（`.unit` / `.zod` / `.db` 等）は本タスクでは導入しない。将来必要に応じて別タスクで段階導入する。
- Consequences:
  - `find packages/shared -name '*.test.ts'` は常に 0 件
  - ルート vitest.config の `include` glob `{test,spec}` 二段階は本 ADR の対象外（followup-003 で単一収斂）
- Related: Issue #325, Issue #622, packages/integrations/ADR-test-suffix.md
```

#### `packages/integrations/ADR-test-suffix.md`（新規・必須）

```markdown
# ADR — packages/integrations test suffix

- Status: Accepted (2026-05-11)
- Context: モノレポ横断ルールに追随し、`.spec.ts` に統一する。
- Decision:
  - 横断ルール: `*.spec.ts` / `*.spec.tsx` を使用。`*.test.ts` 禁止。
  - integrations 固有: 既存の contract 慣例（`auth.contract.test.ts`）は `auth.contract.spec.ts` に rename して温存する。新規 prefix（`.unit` / `.mapper` 等）の導入は将来別タスク。
- Consequences:
  - `find packages/integrations -name '*.test.ts'` は常に 0 件
- Related: Issue #325, Issue #622, packages/shared/ADR-test-suffix.md
```

### 6.1.3 rename 実行手順

```bash
# 1. Phase 5 で確定した CSV をもとに git mv を一括実行
CSV="docs/30-workflows/issue-622-packages-test-suffix-rename/outputs/phase-05/rename-mapping.csv"
tail -n +2 "$CSV" | while IFS=, read -r pkg before after category; do
  git mv "$before" "$after"
done

# 2. 残存確認
test "$(find packages -name '*.test.ts' -o -name '*.test.tsx' | wc -l)" = "0"
test "$(find packages -name '*.spec.ts' -o -name '*.spec.tsx' | wc -l)" = "28"
```

### 6.1.4 commit 分割

```bash
# commit A: shared
git add packages/shared/ADR-test-suffix.md
git add -A packages/shared/src/
git commit -m "refactor(shared): rename test suffix .test.ts → .spec.ts (issue-622)"

# commit B: integrations
git add packages/integrations/ADR-test-suffix.md
git add -A packages/integrations/
git commit -m "refactor(integrations): rename test suffix .test.ts → .spec.ts (issue-622)"

# commit C: evidence
git add docs/30-workflows/issue-622-packages-test-suffix-rename/outputs/
git commit -m "docs(issue-622): add rename-mapping.csv and Phase 11 evidence"
```

## 6.2 検証コマンド（実装直後に実行）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -r test
mise exec -- pnpm --filter '@ubm-hyogo/shared' test
mise exec -- pnpm --filter '@ubm-hyogo/integrations' test
mise exec -- pnpm --filter '@ubm-hyogo/integrations-google' test
```

## 6.3 ファイル変更サマリー（後続実装が迷わない粒度）

| 変更 | 種別 | 件数 |
| --- | --- | --- |
| ADR 新規 | 新規作成 | 2 ファイル |
| test rename | `git mv` | 28 ファイル |
| rename-mapping.csv | 新規作成 | 1 ファイル |
| Phase 11 evidence | 新規作成 | 数ファイル（typecheck/lint/test ログ） |

合計影響ファイル: 約 32-35 ファイル（rename は同一 path 2 件として数えない）。
