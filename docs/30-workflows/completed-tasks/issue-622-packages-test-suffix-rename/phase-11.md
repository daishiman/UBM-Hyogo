# Phase 11 — 実行 evidence（NON_VISUAL）

## 11.1 実行結果

本タスクは UI 変更を伴わないため `visualEvidence: NON_VISUAL` とし、スクリーンショットは不要。2026-05-11 のローカル実装サイクルで package rename と evidence 取得まで完了した。commit / push / PR / GitHub Issue close は未実行で、Phase 13 の user approval gate に残す。

## 11.2 evidence 配置

実体は `outputs/phase-11/` 配下に保存する。

```text
outputs/phase-11/
├── main.md
└── evidence/
    ├── find-test-ts.log
    ├── find-spec-ts.log
    ├── rg-test-references.log
    ├── typecheck.log
    ├── lint.log
    ├── test-shared.log
    ├── test-integrations.log
    ├── pnpm-r-test.log
    ├── git-log-follow-sample.log
    └── summary.md
```

## 11.3 Gate 結果

| Gate | 期待 | 実測 | 結果 |
| --- | --- | --- | --- |
| G-1: `find packages -name '*.test.ts' -o -name '*.test.tsx'` | 0 | 0 | PASS |
| G-2: `find packages -name '*.spec.ts' -o -name '*.spec.tsx'` | 28 | 28 | PASS |
| G-3: package ADR | 2 files Accepted | `packages/shared/ADR-test-suffix.md`, `packages/integrations/ADR-test-suffix.md` | PASS |
| G-4: focused package tests | exit 0 | shared 195, integrations 58, integrations-google 56 | PASS |
| G-5: typecheck | exit 0 | `outputs/phase-11/evidence/typecheck.log` | PASS |
| G-6: lint | exit 0 | `outputs/phase-11/evidence/lint.log` | PASS |
| G-7: root workspace test | exit 0 | `outputs/phase-11/evidence/pnpm-r-test.log`: apps/api `/me` hook timeout 1 failure, all packages PASS | KNOWN_FAIL_OUT_OF_SCOPE |
| G-8: rename履歴保全 | 28 rename detected | `git status --short` shows 28 `R` entries; old-path `git log --follow` resolves prior history | PASS |
| G-9: stale executable refs | no stale executable references | only intentional build exclude glob and ADR invariant text remain | PASS |

## 11.4 grep 例外の扱い

`rg-test-references.log` には以下の許容行が残る。

- `apps/api/tsconfig.build.json`: build artifact から tests を除外するため、`../../packages/**/*.test.ts` と `../../packages/**/*.spec.ts` を並走させる必要がある。
- `packages/*/ADR-test-suffix.md`: 「今後 `*.test.ts` を増やさない」ことを説明する historical / invariant text。

実行対象や import 参照としての stale `packages/**/*.test.ts` は 0 件。

## 11.5 既知境界

`mise exec -- pnpm -r test` は本レビューで追加取得した。結果は apps/api `apps/api/src/routes/me/index.contract.spec.ts > GET /me > AC-1` の `beforeEach` hook timeout 1 件で non-zero exit。rename 対象の packages は full workspace run 内でも PASS しており、focused package tests / typecheck / lint も PASS のため、本タスクの package rename 実装とは分離して扱う。
