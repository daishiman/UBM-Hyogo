# Phase 13: issue-924 style-src-attr retirement

## メタ情報

- workflow: issue-924-style-src-attr-retirement
- canonical: pr-gate.md
- status: pending_user_approval boundary included

## 目的

Canonical file pr-gate.md を Phase 13 の正本として参照する。

## 実行タスク

- Canonical file の内容を実行・検証する。
- 本ファイルは validate-phase-output 互換の Phase 入口として維持する。

## 参照資料

- [pr-gate.md](pr-gate.md)
- [workflow index](../../index.md)

## 成果物/実行手順

- 成果物は [pr-gate.md](pr-gate.md) に記録する。

## 完了条件

- Phase 13 の canonical file が存在し、artifacts.json と整合している。

## 統合テスト連携

- Local static gates: typecheck / focused Vitest / verify-no-inline-style.
- Browser visual and staging runtime evidence remain user-gated where applicable.
