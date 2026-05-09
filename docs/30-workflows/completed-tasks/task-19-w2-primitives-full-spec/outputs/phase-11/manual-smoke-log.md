# Phase 11 manual smoke log (NON_VISUAL)

- task: task-19-w2-primitives-full-spec
- task classification: NON_VISUAL / docs-only
- date: 2026-05-07
- operator: solo dev
- status: PASS
- screenshots: N/A（NON_VISUAL タスクのため未取得）

## smoke 実行サマリ

本タスクは `docs/00-getting-started-manual/specs/09c-primitives.md` の新規作成のみを対象とする pure-docs タスクであり、ランタイム挙動 / UI 表示の確認対象が存在しない。
代替として以下の deterministic gate を smoke の正本として実行している。

## 1. `scripts/verify-09c-no-visual-values.sh` 実行ログ

- コマンド: `bash scripts/verify-09c-no-visual-values.sh`
- 実測結果（2026-05-07）:

```
HEX: 0
oklch: 0
px: 0
bgBracket: 0
placeholder-token-sized: 0
placeholder-09b-token-value: 0
placeholder-token-mix: 0
numbered_headings: 21
section99: 1
jsx_blocks: 17
OK
```

- exit code: 0
- 一次保存: `outputs/phase-11/evidence/grep-gate.log`

## 2. 09c-primitives.md の markdown レンダリング確認

- 確認方法: GitHub markdown preview 相当の構造的 lint（`outputs/phase-11/evidence/markdown-lint.log`）
- numbered headings: 21（AC-2 一致）
- §99 headings: 1（AC-7 一致）
- fenced jsx blocks: 17（AC-17 一致）
- fenced-code imbalance: 0（PASS）
- 結果: PASS
- 備考: `markdownlint-cli` はリポジトリで未導入のため、構造的 gate（heading-count + grep gate）で代替。実測不能な lint ルールは N/A。

## 3. 差分 / 隣接コード確認

- 09c-primitives.md の差分は task-19 primary deliverable に閉じている。
- 隣接差分: `apps/api/src/repository/identity-conflict.ts`（task-19 とは独立した STABLE_KEY 改善）。
  - 関連テスト: `pnpm exec vitest run apps/api/src/repository/__tests__/identity-conflict.test.ts apps/api/src/routes/admin/identity-conflicts.test.ts`
  - 結果: 2 files / 10 tests PASS（`outputs/phase-11/evidence/adjacent-code-test.log`）
  - スコープ判断: task-19 evidence の範囲外として記録のみ。docs-only 境界は破られていない。

## 4. 参照リンク到達性

- 09c-primitives.md → 09a / 09b / 09e / 09f / 09g / SKILL.md / changelog の各 link を `outputs/phase-11/link-checklist.md` で個別確認。

## 結論

- 全 deterministic gate exit code: 0
- AC-1〜AC-17 のうち Phase 11 で確認可能な構造的 AC は全て PASS
- screenshots / runtime smoke は task 性質上 N/A
- PASS state: PASS
