# Phase 1: 要件定義

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 1 |
| 名称 | 要件定義 |
| タスク種別 | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 前Phase | index.md |
| 次Phase | Phase 2 |

## 目的

task-10 を「新規 UI ディレクトリ作成」ではなく「既存 UI primitives の統合強化」として固定し、現行コードと aiworkflow 正本の矛盾を Phase 2 へ渡す。

## 実行タスク

- Task 1-1: `apps/web/src/components/ui/` の現行 export を inventory として記録する。
- Task 1-2: task-10 の 11 primitive 契約と既存 15 primitive baseline を照合する。
- Task 1-3: Acceptance Criteria を AC-1 から AC-10 まで本文に固定する。
- Task 1-4: task-08 / task-09 / task-19 / task-22 の依存を確認し、未完了なら Phase 2 に進めない。
- Task 1-5: unrelated な削除差分が task-10 scope に混入していないか `git diff --name-only` で分離確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| index | `index.md` | workflow metadata |
| source task | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-10-w4-par-ui-primitives.md` | task-10 契約 |
| aiworkflow baseline | `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` | 既存 15 primitive baseline |
| current barrel | `apps/web/src/components/ui/index.ts` | 現行 export |
| Phase 2 | `phase-02.md` | 設計へ引き継ぎ |

## 実行手順

1. `rg --files apps/web/src/components/ui apps/web/src/lib | sort` を実行する。
2. `sed -n '1,120p' apps/web/src/components/ui/index.ts` で barrel export を確認する。
3. `jq '.scripts, .dependencies, .devDependencies' apps/web/package.json` で test / build / dependency baseline を確認する。
4. `rg -n "task-10|primitive|components/ui" .claude/skills/aiworkflow-requirements docs/30-workflows/ui-prototype-alignment-mvp-recovery -S` で正本参照を確認する。

## 統合テスト連携

Phase 1 では実装テストを実行しない。Phase 4 以降で `pnpm --filter @ubm-hyogo/web test`、Phase 7/9/11 で coverage / typecheck / build / visual evidence を取得する。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を最低線とし、UI primitive 対象では Phase 7 の上振れ閾値を使う。

## 多角的チェック観点（AIが判断）

| 観点 | 判定 |
| --- | --- |
| 矛盾なし | `new` 前提を撤回し既存 UI 統合へ変更 |
| 漏れなし | AC と inventory を本文に展開 |
| 整合性あり | PascalCase barrel export を正本として扱う |
| 依存関係整合 | task-10 完了が task-11..17 の gating であることを維持 |

## サブタスク管理

| サブタスク | owner | 成果物 |
| --- | --- | --- |
| inventory | task-10 | `outputs/phase-01/main.md` |
| AC 固定 | task-10 | `outputs/phase-01/main.md` |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 1 main | `outputs/phase-01/main.md` |
| inventory grep | `outputs/phase-01/current-ui-inventory.txt` |

## Acceptance Criteria

- AC-1: 既存 `apps/web/src/components/ui/index.ts` の export を破壊しない。
- AC-2: task-10 の 11 primitive 契約は barrel `@/components/ui` から import 可能にする。
- AC-3: 既存 primitive 名と重なる `Button / Avatar / Field / Input / Select` は後方互換 props を維持して拡張する。
- AC-4: `Card / Badge / Sidebar / Stat / EmptyState / Banner` は不足分として追加または alias する。
- AC-5: `Drawer / Modal / Toast / KVList / LinkPills / Switch / Segmented / Search / Textarea / Chip` は本 task で削除しない。
- AC-6: OKLch token 由来 utility のみを UI primitive class に使う。
- AC-7: `lucide-react` 採用、自前 Icon 実装の増殖を禁止する。
- AC-8: smoke + accessibility test を primitive 契約単位で実装する。
- AC-9: `typecheck`, `test`, `build:cloudflare`, token grep gate を Phase 9 で通す。
- AC-10: Phase 12 strict 7 files と aiworkflow-requirements 正本同期を完了する。

## 完了条件

- [ ] 現行 UI inventory を `outputs/phase-01/current-ui-inventory.txt` に保存している。
- [ ] AC-1 から AC-10 が本文に列挙されている。
- [ ] 既存 UI 破棄ではなく統合強化として Phase 2 へ渡している。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% の最低線を Phase 4 以降に引き継いでいる。

## タスク100%実行確認【必須】

- [ ] Task 1-1 完了
- [ ] Task 1-2 完了
- [ ] Task 1-3 完了
- [ ] Task 1-4 完了
- [ ] Task 1-5 完了

## 次Phase

Phase 2 で C/M/R 分類と owner / co-owner を固定する。
