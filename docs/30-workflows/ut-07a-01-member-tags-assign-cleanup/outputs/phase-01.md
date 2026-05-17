# Phase 1 — 要件定義 / current topology 確認

## 目的

issue #294 の主張と最新コードベースの乖離を確定し、本タスクで解決する根本問題を 1 文で固定する。

## current topology（実測）

`rg "assignTagsToMember" apps/api/src packages/shared/src -n` 実測値（2026-05-15）:

| ファイル | 行 | 種別 |
| --- | --- | --- |
| `apps/api/src/repository/memberTags.ts` | 63 | 関数定義（INSERT/ON CONFLICT UPDATE） |
| `apps/api/src/repository/memberTags.ts` | 94 | `MemberTagsProvider` interface 宣言 |
| `apps/api/src/repository/memberTags.ts` | 100-101 | provider factory での束縛 |
| `apps/api/src/workflows/tagQueueResolve.ts` | 178 | **唯一の production caller**（`memberTagsProvider.assignTagsToMember(...)`） |
| `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` | 189-190 | mock provider と call 検知 |
| `apps/api/src/middleware/repository-providers.spec.ts` | 122 | provider 形状検査 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | 4, 40, 42, 43 | allow list type-level test + コメント |

## 確定する不変条件

- **不変条件 #13**: tag の書き込みは `tagQueueResolve` workflow 経由のみ（`memberTagsProvider.assignTagsToMember` は workflow 専用 helper）
- `apps/api/src/repository/memberTags.ts` 冒頭コメント「書き込み API は提供しない」と `assignTagsToMember` 存在の整合は、JSDoc により「helper の例外」として明示する

## issue 再解釈の結論

issue の二択（削除 / helper 限定）のうち **「helper 限定化（名称・コメントで直接利用禁止を明示）」を採用**する。削除選択肢は production caller 存在のため取り得ない。

## 完了条件

- 上記 topology が `outputs/phase-11/grep-assignTagsToMember.txt` で再現可能
- 不変条件 #13 が Phase 4 JSDoc 文面に引用される
