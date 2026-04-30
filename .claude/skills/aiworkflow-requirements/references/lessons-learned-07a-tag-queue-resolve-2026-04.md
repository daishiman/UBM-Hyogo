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
