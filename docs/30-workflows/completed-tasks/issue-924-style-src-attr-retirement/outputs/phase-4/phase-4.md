# Phase 4: issue-924 style-src-attr retirement

## メタ情報

- workflow: issue-924-style-src-attr-retirement
- canonical: test-plan.md
- status: completed

## 目的

Canonical file test-plan.md を Phase 4 の正本として参照する。

## 実行タスク

- Canonical file の内容を実行・検証する。
- 本ファイルは validate-phase-output 互換の Phase 入口として維持する。

## 参照資料

- [test-plan.md](test-plan.md)
- [workflow index](../../index.md)

## 成果物/実行手順

- 成果物は [test-plan.md](test-plan.md) に記録する。

## 完了条件

- Phase 4 の canonical file が存在し、artifacts.json と整合している。

## 統合テスト連携

- Local static gates: typecheck / focused Vitest / verify-no-inline-style.
- Browser visual and staging runtime evidence remain user-gated where applicable.
