# Implementation Guide: issue-1129-single-write-batchid-correlation

## 状態

`implemented_local_evidence_captured / implementation / NON_VISUAL`

## Part 1: Concept（中学生にもわかる説明）

一括でタグを付ける操作には、監査ログをあとでまとめて探すための `batchId` という目印が付いている。これまで 1 件だけタグを付ける/外す操作には目印が無かったため、同じ監査ログ検索で追跡しにくかった。

今回、1 件だけの操作にも同じ `batchId` を付けた。1 回の操作に 1 個の UUID を作るので、まとまりの大きさは 1 件だけだが、bulk と同じ検索キーで探せる。

## Part 2: Technical Contract

| 項目 | 契約 |
| --- | --- |
| 生成箇所 | route 層 `apps/api/src/routes/admin/members.ts` |
| 生成方法 | `crypto.randomUUID()` |
| 相関単位 | request-scoped correlation（単一 write は群サイズ 1） |
| assign payload | `after: { tagId, source: "manual", batchId }` |
| unassign payload | `before: { tagId, batchId }` |
| read side | `GET /admin/audit?batchId=` 既存実装を非改修で再利用 |
| 非変更 | endpoint / response shape / D1 schema / migration / apps/web |

## 実装要点

- `assignTagToMemberByAdmin(...)` が `true` を返した場合だけ `batchId` を生成し audit append する。
- `unassignTagFromMemberByAdmin(...)` が `true` を返した場合だけ `batchId` を生成し audit append する。
- noop では audit row を作らないため、batchId も残らない。
- payload key は意味論上 correlation id だが、既存 read filter を非改修にするため bulk と同じ `batchId` を使う。

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | PASS: 2 files / 31 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |

## 視覚証跡

N/A。`apps/api` の audit payload 変更のみで、UI / CSS / browser-visible surface は変更していない。
