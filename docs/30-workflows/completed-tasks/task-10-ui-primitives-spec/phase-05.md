# Phase 5: 実装

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 5 |
| 名称 | 実装 |
| 依存Phase | Phase 4 |
| 次Phase | Phase 6 |

## 目的

Phase 4 の contract RED を GREEN にし、既存 UI primitives を破壊せず task-10 契約を満たす。

## 実行タスク

- Task 5-1: `apps/web/src/lib/cn.ts` を追加する。
- Task 5-2: 既存 `Button / Avatar / Field / Input / Select` を後方互換で拡張する。
- Task 5-3: `Card / Badge / Sidebar / Stat / EmptyState / Banner` を PascalCase file として追加する。
- Task 5-4: `apps/web/src/components/ui/index.ts` に named export を追加する。
- Task 5-5: dependency 追加が必要な場合は `apps/web/package.json` と lockfile を更新する。
- Task 5-6: GREEN 結果を `outputs/phase-05/green-result.txt` に保存する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 4 | `phase-04.md` | RED tests |
| Phase 2 | `phase-02.md` | C/M/R |
| barrel | `apps/web/src/components/ui/index.ts` | export |
| Phase 6 | `phase-06.md` | test expansion |

## 実行手順

1. 既存 file を削除せず、追加 props は optional とする。
2. client component は `Sidebar` と既存 interactive primitive に限定する。
3. `cn()` で className merge を統一する。
4. `pnpm --filter @ubm-hyogo/web test` を実行し GREEN を確認する。

## 統合テスト連携

Phase 5 では Phase 4 contract test と既存 `primitives.test.tsx` を両方 GREEN にする。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% は Phase 7 の測定対象とする。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| トレードオン | 既存互換と task-10 契約を同時に満たす |
| プラスサム | downstream が新契約を使え、既存利用者も壊れない |
| 垂直思考 | token / aria / export の根本制約を守る |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| helper | `apps/web/src/lib/cn.ts` |
| components | `apps/web/src/components/ui/*.tsx` |
| GREEN log | `outputs/phase-05/green-result.txt` |

## 成果物

| 成果物 | パス |
| --- | --- |
| implementation | `apps/web/src/components/ui/` |
| helper | `apps/web/src/lib/cn.ts` |
| GREEN result | `outputs/phase-05/green-result.txt` |

## 完了条件

- [ ] Phase 4 contract test が GREEN である。
- [ ] 既存 export が削除されていない。
- [ ] task-10 11 primitive が `@/components/ui` から import できる。
- [ ] token grep gate の違反がない。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を Phase 7 に引き継いでいる。

## タスク100%実行確認【必須】

- [ ] Task 5-1 完了
- [ ] Task 5-2 完了
- [ ] Task 5-3 完了
- [ ] Task 5-4 完了
- [ ] Task 5-5 完了
- [ ] Task 5-6 完了

## 次Phase

Phase 6 で variant / edge case / regression test を拡充する。
