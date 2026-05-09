# Phase 2: 設計

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 2 |
| 名称 | 設計 |
| 依存Phase | Phase 1 |
| 次Phase | Phase 3 |

## 目的

既存 PascalCase UI primitives と task-10 契約を同じ barrel export に統合する設計を固定する。

## 実行タスク

- Task 2-1: C/M/R 分類表を確定する。
- Task 2-2: 既存 export の owner / co-owner を固定する。
- Task 2-3: `Button / Avatar / Field / Input / Select` の後方互換 props 方針を定義する。
- Task 2-4: 不足 primitive `Card / Badge / Sidebar / Stat / EmptyState / Banner` の追加方針を定義する。
- Task 2-5: dependency / validation matrix を Phase 4〜11 へ接続する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | inventory と AC |
| source task | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-10-w4-par-ui-primitives.md` | task-10 props |
| current barrel | `apps/web/src/components/ui/index.ts` | export 正本 |
| package scripts | `apps/web/package.json` | test / build scripts |
| Phase 3 | `phase-03.md` | review gate |

## 実行手順

### C/M/R 分類

| path | 種別 | 方針 | owner | co-owner |
| --- | --- | --- | --- | --- |
| `apps/web/src/components/ui/Button.tsx` | M | `variant/size/block/leftIcon/rightIcon/type=button` を後方互換で追加 | task-10 | task-11..17 |
| `apps/web/src/components/ui/Avatar.tsx` | M | `memberId` 既存契約を維持し、`hue` / `xl` / token class を追加 | task-10 | task-11..17 |
| `apps/web/src/components/ui/Field.tsx` | M | 既存 `id/hint` を維持し、render-prop と error aria を追加 | task-10 | task-13..14 |
| `apps/web/src/components/ui/Input.tsx` | M | `describedBy` を維持し、`inputSize/invalid` を追加 | task-10 | task-11..17 |
| `apps/web/src/components/ui/Select.tsx` | M | `options` props を維持し、children option も許可する | task-10 | task-11..17 |
| `apps/web/src/components/ui/Card.tsx` | C | Card compound component を追加 | task-10 | task-11..17 |
| `apps/web/src/components/ui/Badge.tsx` | C | `Chip` と併存する Badge を追加し、Badge→Chip alias は Phase 3 review で採否を決定 | task-10 | task-11..17 |
| `apps/web/src/components/ui/Sidebar.tsx` | C | `usePathname` を使う client component として追加 | task-10 | task-15..17 |
| `apps/web/src/components/ui/Stat.tsx` | C | dashboard KPI 用 primitive を追加 | task-10 | task-15 |
| `apps/web/src/components/ui/EmptyState.tsx` | C | `role=status` 付き primitive を追加 | task-10 | task-11..17 |
| `apps/web/src/components/ui/Banner.tsx` | C | tone based role を保証する primitive を追加 | task-10 | task-13..17 |
| `apps/web/src/components/ui/{Chip,Switch,Segmented,Textarea,Search,Drawer,Modal,Toast,KVList,LinkPills}.tsx` | R | 削除せず現行 export を維持 | current baseline | task-10 |
| `apps/web/src/components/ui/index.ts` | M | 既存 export に task-10 export を追加 | task-10 | all downstream |
| `apps/web/src/lib/cn.ts` | C | `clsx + tailwind-merge` helper を追加 | task-10 | all downstream |

### validation matrix

| gate | command | evidence |
| --- | --- | --- |
| contract RED/GREEN | `pnpm --filter @ubm-hyogo/web test` | `outputs/phase-04/red-result.txt`, `outputs/phase-06/test-result.txt` |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | `outputs/phase-09/typecheck.txt` |
| coverage | `pnpm --filter @ubm-hyogo/web test:coverage` | `outputs/phase-07/coverage.txt` |
| build | `pnpm --filter @ubm-hyogo/web build:cloudflare` | `outputs/phase-09/build.txt` |
| token gate | `rg '#[0-9a-fA-F]{3,8}|\\b(bg|text|border)-\\[#' apps/web/src/components/ui apps/web/src/lib/cn.ts` | `outputs/phase-09/token-gate.txt` |

## 統合テスト連携

Phase 4 では import error ではなく「task-10 契約を表す contract test が現行実装で fail すること」を RED とする。Phase 7/9/11 で coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% と task-local UI threshold を確認する。

## 多角的チェック観点（AIが判断）

| 思考法カテゴリ | 設計反映 |
| --- | --- |
| 論理分析 | `new` 前提を撤回し、既存 export と task-10 契約を両立 |
| 構造分解 | C/M/R 分類で重複実装を回避 |
| システム | downstream task-11..17 の import graph を壊さない |
| 戦略価値 | 後続画面実装を止めない最小変更 |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| C/M/R 設計 | `outputs/phase-02/main.md` |
| validation matrix | `outputs/phase-02/validation-matrix.md` |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 2 main | `outputs/phase-02/main.md` |
| validation matrix | `outputs/phase-02/validation-matrix.md` |

## 完了条件

- [ ] C/M/R 分類が Phase 2 本文に存在する。
- [ ] owner / co-owner が空欄なしで定義されている。
- [ ] 既存 PascalCase export 維持が明記されている。
- [ ] Phase 4〜11 の validation matrix が定義されている。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% の最低線を Phase 7/9/11 に接続している。

## タスク100%実行確認【必須】

- [ ] Task 2-1 完了
- [ ] Task 2-2 完了
- [ ] Task 2-3 完了
- [ ] Task 2-4 完了
- [ ] Task 2-5 完了

## 次Phase

Phase 3 で設計を PASS / MINOR / MAJOR 判定する。
