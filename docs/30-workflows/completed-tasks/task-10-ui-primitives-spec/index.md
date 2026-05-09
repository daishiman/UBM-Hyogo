# task-10-ui-primitives-spec

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-10-ui-primitives-spec |
| タスク種別 | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented-local-build-blocked |
| implementation_mode | existing-ui-integration |
| 作成日 | 2026-05-09 |
| スコープ | 既存 `apps/web/src/components/ui/` を破棄せず、task-10 契約へ統合するローカル実装 |
| coverage AC | `apps/web/src/components/ui/**` と `apps/web/src/lib/cn.ts` の task-local coverage を Phase 7/9/11 で確認 |

## 目的

既存の Wave 0 UI primitives（`Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills`）を正本として尊重しつつ、task-10 が後続 task-11..17 に渡す `Button / Card / Badge / Input / Select / Sidebar / Stat / EmptyState / Avatar / Field / Banner` 契約へ統合する。新規小文字ファイルへの全面置換は行わず、既存 PascalCase barrel export の後方互換を維持する。

## 実行タスク

- Task 0: `apps/web/src/components/ui/` の現行 inventory を Phase 1 で固定する。
- Task 1: task-10 契約との差分を C/M/R に分類する。
- Task 2: 既存 export 互換を保ったまま不足 primitive と不足 props を実装する。
- Task 3: test / typecheck / build / token gate / visual runtime evidence を同一 workflow で取得する。
- Task 4: Phase 12 strict 7 files と aiworkflow-requirements 正本同期を完了する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| task-10 source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-10-w4-par-ui-primitives.md` | task-10 props 契約 |
| scope | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | diff scope / archive rule |
| current UI baseline | `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` | Wave 0 primitive baseline |
| full primitive spec | `docs/00-getting-started-manual/specs/09c-primitives.md` | prototype 由来 primitive 正本 |
| Phase 1 | `phase-01.md` | current inventory |
| Phase 2 | `phase-02.md` | 統合設計 |
| Phase 3 | `phase-03.md` | review gate |
| Phase 4 | `phase-04.md` | contract RED |
| Phase 5 | `phase-05.md` | implementation |
| Phase 6 | `phase-06.md` | regression tests |
| Phase 7 | `phase-07.md` | coverage |
| Phase 8 | `phase-08.md` | refactor |
| Phase 9 | `phase-09.md` | quality gate |
| Phase 10 | `phase-10.md` | final review |
| Phase 11 | `phase-11.md` | visual evidence |
| Phase 12 | `phase-12.md` | documentation sync |
| Phase 13 | `phase-13.md` | user-gated PR |

## 成果物

| 成果物 | パス |
| --- | --- |
| phase ledger | `artifacts.json` / `outputs/artifacts.json` |
| Phase 11 runtime ledger | `outputs/phase-11/main.md` |
| Phase 12 strict outputs | `outputs/phase-12/*.md` |

## 完了条件

- [ ] Phase 1〜13 が task-specification-creator 必須セクションを満たす。
- [ ] `artifacts.json` と `outputs/artifacts.json` が一致する。
- [ ] 既存 UI primitives baseline と task-10 契約の矛盾が C/M/R 表で解消されている。
- [ ] Phase 12 strict 7 files が存在する。
- [ ] `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/task-10-ui-primitives-spec` が成功する。
- [ ] `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/task-10-ui-primitives-spec` が成功する。

## 現在の境界

`apps/web/src/components/ui/` に task-10 の 11 primitive 契約をローカル実装済み。`typecheck` / `lint` / focused `test` / `test:coverage` / `next build` は PASS。`build:cloudflare` は OpenNext 側の esbuild host/binary mismatch（host `0.25.4` / binary `0.21.5`）で失敗しているため、runtime visual evidence と Phase 13 は未解放。
