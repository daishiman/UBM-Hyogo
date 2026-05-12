# Lessons Learned — task-spec-2d-contract-stage-2 (2026-05-11)

> 親 workflow: `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/`
> 元仕様: `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md`
> 実装対象: `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`

## L-2D-001: shared schema が response shape の SSOT で、parent workflow の記述は派生

`MergeIdentityResponseZ` の正本は `packages/shared/src/schemas/identity-conflict.ts:34-39` 側であり、
`{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` 形。一方、親 workflow
`e2e-quality-uplift-stage-2/phase-4.md` §1 Q2 / `phase-5.md` §4 では `{ targetMemberId, sourceMemberId, mergedAt }`
と省略形で記載されていた。**コードの shared schema が正本**で、parent docs はそこから派生する。

contract test を書くときに doc を信用して fixture を作ると、shared schema が拒否してテストが赤になる。
新たな contract test を起票するときは:

1. `packages/shared/src/schemas/**` を最初に確認する
2. parent workflow doc は補助として参照する
3. doc と code が乖離していたら、code を SSOT として doc 側を訂正する PR を別途用意する

## L-2D-002: route の inline `z.object` は contract test 起票と同 wave で named export に昇格させる

CONST_007（schema 重複定義禁止）を満たすには、contract test 内で `z.object(` を 0 件にする必要がある。
そのために route 側 inline schema を named export に切り替える。今回は以下 3 ファイルが対象で、各 +1 行で済んだ:

- `apps/api/src/routes/admin/member-delete.ts:10` の `DeleteBodyZ` → `export const`
- `apps/api/src/routes/admin/requests.ts` の `ListQueryZ` → `export const ListRequestsQueryZ` として再 export
- `apps/api/src/routes/admin/audit.ts` の `QueryZ` → `export const ListAuditQueryZ` として再 export

shared 昇格（`packages/shared/src/schemas/` への移動）は別 PR とし、本 wave では route から named export
するだけに留める。これは route 限定 schema（HTTP body / query 形）と shared schema（domain response 形）の
責務分離を保つため。

## L-2D-003: contract test は pure unit に固定し、D1 / Cloudflare binding に触れない

CLAUDE.md 重要不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を `apps/api` 内 test でも遵守する。
contract test の責務は「UI fixture object と admin route の zod schema が同型であることの機械検証」のみ。
DB / Network / FS / binding に触れないことで、Vitest single-thread / CI runner 最小依存で安定する。

drift 検出は contract test の `parse()` 失敗で行う設計にし、E2E green に依存させない。

## L-2D-004: fixture object は test 内 inline、別ファイル化は別 phase の責務

phase-5 §4 の標準形に従い 2d test 内で fixture object を inline 定義する。
`fixtures/admin-stage-2.ts` 等への外出しは Phase 8 リファクタの責務として分離する。

2a/2b/2c の Playwright spec も同 shape を inline で持っているため、CI 上 2d が green であれば
4 spec の fixture 整合が担保される設計。drift 発生時、最初に失敗するのは 2d の zod parse。
これにより drift 検出の起点が一箇所に集約される。

## L-2D-005: zod 未エクスポート response の同型確認は type-level に逃がす

response 型が zod export されていない場合は、`expectTypeOf<typeof fixture>().toMatchTypeOf<...>()`
による type-level 同型で代替する。fixture object は inline literal を `as const` 固定。
runtime `parse()` と type-level `expectTypeOf` の二段で boundary を保つ。

## L-2D-006: workflow root が `completed-tasks/` に移動した直後は skill 全 path を一括更新

Phase 13 完了に伴い workflow root を `docs/30-workflows/task-spec-X/` から
`docs/30-workflows/completed-tasks/task-spec-X/` へ move したら、同一 wave で以下を一括更新する:

- `indexes/resource-map.md` の最初に読む / 必要に応じて読む 両カラム
- `indexes/quick-reference.md` の workflow root / strict outputs
- `references/task-workflow-active.md` の成果物 / evidence
- `references/workflow-X-artifact-inventory.md` の workflow / canonical set / consumed trace
- `LOGS/_legacy.md` のヘッドライン

unassigned-task の consumed trace も `unassigned-task/` から `completed-tasks/` へ move される点に注意。
path 一括更新を忘れると、後段の検索や引用がすべて 404 になる。
