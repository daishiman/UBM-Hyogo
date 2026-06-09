# Phase 8: リファクタリング — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

## 0. 方針

本タスクは「リファクタリング」そのものが主目的（生成責務の散在 → 単一点集約）であるため、Phase 5（GREEN）で導入する構造変更を、ここでは **`対象 / Before / After / 理由` のテーブル形式**（[Feedback RT-03]）で確定記録する。リファクタは挙動を変えない（writeCount・レスポンス・endpoint surface 不変）ことを前提に、既存 spec 全 PASS を維持する。

---

## 1. リファクタリング記録（[Feedback RT-03]）

| # | 対象（ファイル:箇所） | Before | After | 理由 |
|---|----------------------|--------|-------|------|
| RT-1 | `apps/api/src/jobs/sync-forms-responses.ts:307-316`（新規 member の `else` 分岐） | `await upsertMember(dbCtx, {...})` と `await ensureMemberStatusRow(dbCtx, memberId)` の **2 つの別呼び出し**が連続。間にコメント `// upsertMember + ensureMemberStatusRow の 2 write` | `await createMemberWithStatus(dbCtx, {...})` の **1 呼び出し**へ集約。`writeCount += 2` は不変 | 生成責務の navigation drift（identity 生成と status 生成が物理的に離れて書かれ、片方の追加漏れが起きうる構造）を削減。1 呼び出し = identity + status のペア生成を helper が所有 |
| RT-2 | `apps/api/src/jobs/sync-forms-responses.ts:45`（import） | `import { upsertMember } from "../repository/members";` | `import { createMemberWithStatus } from "../repository/members";`（`upsertMember` が同 job の他箇所で未使用なら除去。**他用途で残る場合は残す** = 後述「実コード確認方針」） | 差し替え後 ingest 経路は `createMemberWithStatus` のみ参照。未使用 import を残さない（lint 整合） |
| RT-3 | `apps/api/src/jobs/sync-forms-responses.ts:51-55`（import） | `import { ensureMemberStatusRow, getStatus, setConsentSnapshot } from "../repository/status";` | `getStatus` / `setConsentSnapshot` は同 job の同意スナップショット処理（`:391` 付近 `setConsentSnapshot`）で**引き続き使用**するため import は残す。`ensureMemberStatusRow` は ingest の新規 member 経路でしか使っていなければ **import から除去**（helper 内部委譲へ移管） | 不要 import の整理。ただし `status` モジュールからの他 named import（`getStatus` / `setConsentSnapshot`）は残るため、import 文自体は維持し `ensureMemberStatusRow` のみ外す | `ensureMemberStatusRow` の責務は `createMemberWithStatus` 内へ移管済み。ingest 側に独立呼び出しが残ると AC-3 の grep gate（新規生成経路に散在しないこと）に抵触する |
| RT-4 | `apps/api/src/jobs/sync-forms-responses.ts:315`（コメント） | `// upsertMember + ensureMemberStatusRow の 2 write` | `// createMemberWithStatus = member_identities + member_status の 2 write（生成責務は helper が所有）` | コメントが旧 2 呼び出し構造を説明したまま陳腐化するのを防ぐ。集約後の意味（helper が 2 write を内包）へ更新 |
| RT-5 | `apps/api/src/repository/members.ts`（`createMemberWithStatus` 新設） | （存在しない。ingest 側が 2 呼び出しで生成責務を負っていた） | `upsertMember`（identity）+ `ensureMemberStatusRow`（status・`./status` から import）を内部委譲する薄い helper を新設。member 生成の唯一の正規経路 | 生成責務の単一点所有（state ownership を repository helper へ移管）。将来の経路追加時に helper 経由を強制でき orphan を構造的に封じる |
| RT-6 | `apps/api/src/repository/identities.ts:86-88`（`backfillIdentityFromCandidate`） | identity の `INSERT OR IGNORE` 後、即 `return findIdentityByEmail(...)`。`member_status` 生成なし（P-2 orphan 源） | INSERT OR IGNORE 後に `findIdentityByEmail(...)` で実際の identity を確定し、存在時のみ `ensureMemberStatusRow(c, asMemberId(identity.member_id))` を連結。`asMemberId` import と `./status` からの `ensureMemberStatusRow` import を追加。戻り値契約は不変（`Promise<MemberIdentityRow \| null>`） | auto-link 経路（P-2）でも identity と status を同期生成し、issue が見落としていた現役 orphan 源を構造的に解消。競合時に losing candidate の member_id へ status を誤生成しない |
| RT-7 | `apps/api/src/routes/admin/member-status.ts:60`（P-3 防御） | `await ensureMemberStatusRow(db, mid);`（mutation 前の防御呼び出し・コメントなし） | **保持**（F-4 判定）。意図を明示するコメント `// legacy orphan（backfill 0025 未適用で status 行を欠く既存 member）への mutation 前防御 backstop。新規 member の status 生成は createMemberWithStatus が保証する` を付与 | 責務境界の明確化: 生成責務（helper 所有）と mutation 防御（route 所有）を混在させない。除去すると legacy orphan への PATCH 再 404 リスクが残るため意図的保持（AC-3 の集約対象外であることをコメントで宣言） |

> **実コード確認方針（RT-2 / RT-3）**: PASS済みローカル実装は差し替え後に必ず以下を実行し、`upsertMember` / `ensureMemberStatusRow` が同 job 内に他用途で残存するか確認してから import を整理する（思い込みで一律削除しない）。
> ```bash
> grep -n "upsertMember\b" apps/api/src/jobs/sync-forms-responses.ts
> grep -n "ensureMemberStatusRow\b" apps/api/src/jobs/sync-forms-responses.ts
> grep -n "getStatus\b\|setConsentSnapshot\b" apps/api/src/jobs/sync-forms-responses.ts
> ```
> 残存が 0 件になった named import のみ除去し、残る named import がある import 文は文ごと残す。`pnpm lint` の no-unused-vars で最終裏取りする。

---

## 2. 構造的改善（責務集約による生成経路の単一化）

| 改善観点 | Before（散在） | After（集約） |
|---------|----------------|----------------|
| 生成責務の所有者 | 各呼び出し側（ingest が 2 呼び出し / auto-link が status を生成せず） | `createMemberWithStatus`（repository helper）が identity + status のペア生成を単一所有。auto-link は `backfillIdentityFromCandidate` 内で status を連結し局所的に完結 |
| 新経路追加時の安全性 | 開発者が `member_status` 生成を手で覚えて追加する必要があり、忘れると orphan 発生 | identity を生成する正規経路は helper 経由。helper を通す限り status 既定行が必ず付く（構造的に orphan 発生不能） |
| 生成箇所の物理的距離 | identity 生成行と status 生成行が分離（navigation drift・片方追加漏れの温床） | 1 呼び出しに集約。ペア生成が 1 行で表現され、片方欠落が物理的に起きない |
| コメントの整合 | 「upsertMember + ensureMemberStatusRow の 2 write」（旧構造前提） | helper 集約後の意味へ更新（RT-4）。陳腐化コメント除去 |

> 因果ループ（phase-2 §1 と整合）: 本リファクタは「経路追加 → 各自 status 実装 → 漏れ → orphan → 個別止血」という強化ループを、「正規経路 = helper 経由」のバランスループへ置換する。helper を経由しない identity INSERT が新規に書かれない限り再発しない構造になる。

---

## 3. リファクタ後の非回帰維持方針

リファクタは挙動を変えないことが前提。PASS済みローカル実装は以下で「既存 spec 全 PASS 維持」を確認する。

| 確認 | 方法 |
|------|------|
| writeCount 不変 | `sync-forms-responses.contract.spec.ts` の既存 write 数アサーションが PASS（新規 member 経路で +2 のまま） |
| auto-link 戻り値契約不変 | `identities.autolink.repository.spec.ts` / `identities.autolink.repository.spec.ts` で `backfillIdentityFromCandidate` の戻り値（`MemberIdentityRow \| null`）が従来どおり |
| route 防御の挙動不変 | `member-status.contract.spec.ts` の既存ケース（PATCH 成功・404 判定）が PASS |
| status 既存 helper 不変 | `status.repository.spec.ts` の既存ケースが PASS（`ensureMemberStatusRow` は再利用・実装不変） |
| 全体 typecheck / lint | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint`（import 整理後の未使用検出含む） |

> 実行コマンド（focused・Phase 7 §3 と同じ spec 集合）:
> ```bash
> mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
>   apps/api/src/repository/__tests__/members.repository.spec.ts \
>   apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts \
>   apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts \
>   apps/api/src/repository/__tests__/status.repository.spec.ts \
>   apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
>   apps/api/src/routes/admin/member-status.contract.spec.ts
> ```

---

## 4. 完了条件

- [ ] リファクタ内容を `対象 / Before / After / 理由` テーブルで記録した（[Feedback RT-03]・RT-1〜RT-7）
- [ ] ingest の 2 呼び出し → `createMemberWithStatus` 1 呼び出し集約（RT-1）を記録した
- [ ] 不要 import 整理（RT-2/RT-3）に「実コード確認方針」（grep で他用途残存を確認してから除去）を明記した
- [ ] 陳腐化コメント更新（RT-4）を記録した
- [ ] P-3 防御の意図保持コメント（RT-7）を記録した
- [ ] 責務集約による生成経路の単一化（構造的改善）を表で説明した
- [ ] リファクタ後の既存 spec 全 PASS 維持方針を確定した
