# Lessons Learned: 07a tag queue resolve

## L-07A-001: spec 語と DB/API 語は alias 表で固定する

`candidate/confirmed/rejected` と `queued/resolved/rejected` が混在すると、AC と実装の期待 status がずれる。既存 DB 語を継続する場合は、Phase 1 と正本仕様に alias 表を置く。

## L-07A-002: D1 batch 後の changes 判定で race を扱わない

`batch` 実行後に最初の UPDATE `changes=0` を見ても、後続 INSERT が実行済みになり得る。race 防御が必要な workflow は guarded UPDATE を先に実行し、成功後に後続副作用を流す。

## L-07A-003: Phase 12 の follow-up は unassigned-task 実体まで作る

`unassigned-task-detection.md` の表だけでは backlog 検索に乗らない。blocking でない課題も、後続で拾うものは `docs/30-workflows/unassigned-task/` に個別ファイル化する。

## L-07A-004: API-only / NON_VISUAL でも Phase 11 evidence を明示する

スクリーンショットが N/A の場合でも、curl / SQL / Vitest などの代替 evidence を Phase 11 と Phase 12 implementation-guide に明示する。

## L-07A-005: admin client 契約は UI 実装タスクの stale 記述を同 wave で直す

06c で空 body として書かれた `resolveTagQueue(queueId)` は、07a 実装後に discriminated union body へ更新する必要がある。API contract の変更は `api-endpoints.md` と `architecture-admin-api-client.md` を同時に確認する。

## L-07A-006: API / web の body drift は shared schema SSOT へ寄せる

UT-07A-02 では `TagQueueResolveBody` を `packages/shared/src/schemas/admin/tag-queue-resolve.ts`
の `tagQueueResolveBodySchema` に集約し、API route と apps/web admin client が同じ body 型を参照する形にした。
同じ discriminated union を各層に複製すると `confirmed` / `rejected` / mixed body reject の差分が再発するため、
既に shared package が依存可能な契約は shared zod + exported type を優先する。

## L-07A-007: package script の test 引数は対象ファイル選択を保証しない

`pnpm --filter @ubm-hyogo/api test -- tags-queue tagQueueResolve` は package script 側の固定引数により
`apps/api` 全体を選択し、ローカル Miniflare/D1 の `EADDRNOTAVAIL` に巻き込まれた。
Phase evidence では実行コマンドが対象ファイルを確実に絞るかを確認し、必要なら
`pnpm exec vitest run --root=. --config=vitest.config.ts <test files...>` を記録する。

## L-07A-008: stale 起票前提と current topology が乖離したら「削除」ではなく「境界明確化」へ再解釈する

UT-07A-FU-01 (`memberTags.assignTagsToMember` cleanup) は当初 `unassigned-task` で「production caller がなくなった helper を削除する」前提で起票された。
2026-05-15 の current topology 再検証で `apps/api/src/workflows/tagQueueResolve.ts` が唯一の production caller として実存することが判明し、削除実行は invariant #13 の queue resolve 経路自体を壊す。
このような stale 前提タスクは Phase 1 受入条件を `superseded` として明示的に撤回し、現実 topology に合わせて「helper として残し JSDoc / コメントで直接利用禁止を明示し、type-level gate (`Exclude<AssignExports, "assignTagsToMember">`) と caller boundary gate で派生経路の再増殖を遮断する」境界明確化タスクへ再解釈する。
**適用ルール**: unassigned-task 由来タスクの Phase 1 では、起票時前提と current production caller を `rg` で必ず照合する。乖離があれば受入条件を `superseded` / `completed` の 2 種に分けて記録し、source は `completed-tasks/COMPLETED-*.md` に consumed trace として残す。`task-specification-creator` skill の `references/workflow-state-vocabulary.md` および `phase12-skill-feedback-promotion.md` が正本ルールを定義済み。
