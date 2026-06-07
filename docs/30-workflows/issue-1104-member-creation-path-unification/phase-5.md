# Phase 5: 実装（GREEN） — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

Phase 4 の RED を GREEN にする最小実装の仕様と、実装済みローカル差分の記録。`createMemberWithStatus` 新設、経路差し替え、focused D1 tests / typecheck / lint は本 wave で完了済み。commit / push / PR / staging smoke はユーザー承認後（Phase 13）にのみ行う。

---

## 1. [Feedback RT-03] 変更ファイル一覧（新規作成 / 修正）

| # | パス | 変更種別 | 変更内容 |
|---|------|---------|---------|
| 1 | `apps/api/src/repository/members.ts` | 編集 | `createMemberWithStatus` を新規 export 追加（F-1）。`ensureMemberStatusRow` を `./status` から import 追加 |
| 2 | `apps/api/src/repository/identities.ts` | 編集 | `backfillIdentityFromCandidate` 後に `findIdentityByEmail` で確定した identity へ `ensureMemberStatusRow` 連結（F-3・最重要）。既存 identity early return でも同じ補完を行う。`ensureMemberStatusRow` import + `asMemberId` import 追加 |
| 3 | `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | `:307-316` の `upsertMember` + 別呼び出し `ensureMemberStatusRow` を `createMemberWithStatus` 1 呼び出しへ統合（F-2）。import を `upsertMember`→`createMemberWithStatus` へ差し替え。`writeCount += 2` は不変 |
| 4 | `apps/api/src/routes/admin/member-status.ts` | 編集（コメント追記のみ） | `:60` の防御 `ensureMemberStatusRow` を **保持**（F-4）。新規生成経路でなく legacy orphan への mutation 防御 backstop である旨の意図コメントを追記。ロジック・呼び出しは変更しない |
| 5 | `apps/api/src/repository/__tests__/members.repository.spec.ts` | 新規 | TC-1/2/5（helper 単体・冪等・DEFAULT）real D1 spec |
| 6 | `apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts` | 編集 | TC-3（auto-link → `member_status`）it 追加 |
| 7 | sync-forms-responses 既存 contract spec（Phase 5 冒頭 `grep` で実所在確定） | 編集（必要時） | TC-4（ingest 経路の `member_status` 生成維持・`writeCount` 不変）回帰 it 追加 |

> `apps/web` は **無変更**（不変条件 #5 / AC-6）。`apps/api/migrations/` に新規ファイルなし（AC-7）。

---

## 2. 各変更の diff 方針（before / after・実コード即応）

### 2.1 `apps/api/src/repository/members.ts`（F-1・新規 helper）

import 追加（ファイル先頭の import 群へ）:

```ts
// before（現行 import）
import type { DbCtx } from "./_shared/db";
import { placeholders } from "./_shared/sql";
import type { MemberId, ResponseId, ResponseEmail } from "./_shared/brand";

// after（ensureMemberStatusRow を追加 import）
import type { DbCtx } from "./_shared/db";
import { placeholders } from "./_shared/sql";
import type { MemberId, ResponseId, ResponseEmail } from "./_shared/brand";
import { ensureMemberStatusRow } from "./status";
```

`upsertMember`（`:63-86`）の直後に新規 helper を追加:

```ts
/**
 * 会員を作成（upsert）し、member_status 既定行を必ず同期生成する単一 helper。
 * member 生成の唯一の正規経路（issue #1104）。どの呼び出し元から作っても
 * member_status orphan が構造的に発生しないことを保証する。
 *
 * - identity: upsertMember と同一の INSERT ... ON CONFLICT DO UPDATE
 * - status:   ensureMemberStatusRow（INSERT OR IGNORE・冪等・既定行生成）
 */
export async function createMemberWithStatus(
  c: DbCtx,
  row: UpsertMemberInput,
): Promise<void> {
  await upsertMember(c, row);
  await ensureMemberStatusRow(c, row.memberId);
}
```

> `row.memberId` は `UpsertMemberInput.memberId: MemberId`（`members.ts:19`）であり、`ensureMemberStatusRow(c, id: MemberId)` の型に一致する。追加 cast は不要。

### 2.2 `apps/api/src/repository/identities.ts`（F-3・auto-link status 連結・最重要）

import 追加:

```ts
// before
import type { DbCtx } from "./_shared/db";
import type { MemberId, ResponseEmail } from "./_shared/brand";
import type { MemberIdentityRow } from "./members";

// after（ensureMemberStatusRow と asMemberId を追加）
import type { DbCtx } from "./_shared/db";
import { asMemberId, type MemberId, type ResponseEmail } from "./_shared/brand";
import type { MemberIdentityRow } from "./members";
import { ensureMemberStatusRow } from "./status";
```

`backfillIdentityFromCandidate`（`:69-89`）の `INSERT OR IGNORE` `.run()` 後、`findIdentityByEmail(...)` で実際に返る identity を確定してから status を連結:

```ts
// before（:86-88）
    .run();

  return findIdentityByEmail(c, candidate.response_email as ResponseEmail);

// after
    .run();

  const identity = await findIdentityByEmail(
    c,
    candidate.response_email as ResponseEmail,
  );
  if (identity) {
    await ensureMemberStatusRow(c, asMemberId(identity.member_id));
  }

  return identity;
```

> `INSERT OR IGNORE` が競合で no-op になった場合でも、status は「実際に email に紐づいた identity」にだけ作る。これにより losing candidate の member_id に status を誤生成しない。戻り値契約 `Promise<MemberIdentityRow | null>` は不変（副作用追加のみ）。

### 2.3 `apps/api/src/jobs/sync-forms-responses.ts`（F-2・ingest 統合）

import 差し替え（`:45` / `:52-55`）:

```ts
// before
import { upsertMember } from "../repository/members";
...
import {
  ensureMemberStatusRow,
  ...
  setConsentSnapshot,
} from "../repository/status";

// after（upsertMember → createMemberWithStatus。ensureMemberStatusRow の直接 import は
//        ingest 新規生成経路から不要になるが、同 job 内の他用途が無ければ除去する）
import { createMemberWithStatus } from "../repository/members";
...
import {
  ...
  setConsentSnapshot,
} from "../repository/status";
```

> **重要・実コード確認の手順**: `ensureMemberStatusRow` の直接 import を除去してよいかは、`:314` 以外で同 job が `ensureMemberStatusRow` を呼んでいないか `grep -n "ensureMemberStatusRow" apps/api/src/jobs/sync-forms-responses.ts` で確認する。現状 `:314` のみ（`:391` は `setConsentSnapshot`）なので、`:314` を helper へ統合すれば `ensureMemberStatusRow` の import は除去できる。`setConsentSnapshot` の import は維持する。

呼び出し統合（`:307-316`）:

```ts
// before
    await upsertMember(dbCtx, {
      memberId,
      responseEmail,
      currentResponseId: responseId,
      firstResponseId: responseId,
      lastSubmittedAt: resp.submittedAt,
    });
    await ensureMemberStatusRow(dbCtx, memberId);
    // upsertMember + ensureMemberStatusRow の 2 write
    writeCount += 2;

// after
    await createMemberWithStatus(dbCtx, {
      memberId,
      responseEmail,
      currentResponseId: responseId,
      firstResponseId: responseId,
      lastSubmittedAt: resp.submittedAt,
    });
    // createMemberWithStatus = member_identities + member_status の 2 write
    writeCount += 2;
```

> `writeCount += 2` のセマンティクス不変（helper 内部で 2 write のまま）。AC-5 の回帰非発生を保証。

### 2.4 `apps/api/src/routes/admin/member-status.ts`（F-4・防御保持＋意図コメント）

`:60` の `ensureMemberStatusRow` 呼び出しは **保持**（削除しない）。直前に意図コメントを追記するのみ:

```ts
// before（:58-61）
    const identity = await findMemberById(db, mid);
    if (!identity) return c.json({ ok: false, error: "not found" }, 404);
    await ensureMemberStatusRow(db, mid);
    const before = (await getStatus(db, mid)) ?? defaultMemberStatusRow(mid);

// after
    const identity = await findMemberById(db, mid);
    if (!identity) return c.json({ ok: false, error: "not found" }, 404);
    // issue #1104 F-4: ここは新規 member 生成経路ではない。新規生成は
    // createMemberWithStatus / auto-link の status 連結が保証する。本呼び出しは
    // backfill 0025 適用前に作られ未修復の legacy orphan へ PATCH した際の
    // mutation 防御 backstop として意図的に保持する（集約 helper へ寄せない）。
    await ensureMemberStatusRow(db, mid);
    const before = (await getStatus(db, mid)) ?? defaultMemberStatusRow(mid);
```

> AC-3 の「散在予防呼び出しの集約」対象は新規生成経路（P-1/P-2）であり、P-3（本箇所）は mutation 防御で性質が異なるため対象外（Phase 2 §3 / Phase 3 リスク表に整合）。grep gate（後述）も P-3 を例外として扱う。

---

## 3. 循環 import 非発生の確認手順

| 検証 | コマンド / 観点 | 期待 |
|------|----------------|------|
| `members.ts` → `status.ts` の単方向 | `status.ts` の import に `./members` が無いことを確認（現行: `_shared/db` / `_shared/brand` / `@ubm-hyogo/shared` / `_shared/sql` のみ） | 循環なし |
| `identities.ts` → `status.ts` の単方向 | `status.ts` が `./identities` を import しないことを確認 | 循環なし |
| 機械検証 | `mise exec -- pnpm typecheck`（循環は型解決では落ちないが、`madge --circular apps/api/src` があれば併用） | typecheck PASS |

> Phase 2 §2.2 / Phase 3 §2 で事前確認済み。`status.ts` は repository の末端（他 repo を import しない）ため、`members.ts` / `identities.ts` から `status.ts` への単方向参照で循環は発生しない。

---

## 4. ローカル実行・検証コマンド（focused）

```bash
# 0. 依存・runtime 整合（FB-MSO-002）
mise exec -- pnpm install
# 必要時: mise exec -- pnpm verify:vitest-runtime

# 1. 型チェック
mise exec -- pnpm typecheck

# 2. focused D1 test（real D1: helper 単体 + auto-link）
mise exec -- pnpm vitest run \
  apps/api/src/repository/__tests__/members.repository.spec.ts \
  apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts

# 3. focused 非回帰（MockStore: 既存 members / status）
mise exec -- pnpm vitest run --config vitest.d1.config.ts \
  apps/api/src/repository/__tests__/members.repository.spec.ts \
  apps/api/src/repository/__tests__/status.repository.spec.ts

# 4. ingest 回帰（sync-forms-responses 既存 spec を grep で確定してから focused 実行）
grep -rln "runResponseSync\|processResponse" apps/api/src --include="*.spec.ts"

# 5. lint
mise exec -- pnpm lint
```

---

## 5. DoD（Definition of Done）

- [ ] `mise exec -- pnpm typecheck` PASS（循環 import なし・型不整合なし）
- [ ] focused real D1 test（TC-1/2/3/5）全 PASS（RED→GREEN）
- [ ] focused MockStore 非回帰（TC-6 = `members.repository.spec.ts` / `status.repository.spec.ts`）全 PASS
- [ ] ingest 回帰（TC-4）PASS・`writeCount` セマンティクス不変
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `apps/web` diff 0（`git diff --name-only` に `apps/web/` を含めない・AC-6）
- [ ] `apps/api/migrations/` に新規ファイルなし（AC-7）
- [ ] grep gate: 新規生成経路（P-1 ingest / P-2 auto-link）に独立した `ensureMemberStatusRow` 直接呼び出しが残らない。`grep -rn "ensureMemberStatusRow" apps/api/src --include="*.ts" | grep -v ".spec.ts"` の結果が **`repository/status.ts`（定義）/ `repository/members.ts`（helper 内部）/ `repository/identities.ts`（F-3 連結）/ `routes/admin/member-status.ts`（F-4 防御 backstop・意図的保持）のみ**で、`jobs/sync-forms-responses.ts` に独立呼び出しが残っていない

## 6. 完了条件チェックリスト（本 Phase 仕様書として）

- [x] 変更ファイル一覧（新規/編集・変更内容）を表で固定した（RT-03）
- [x] 各変更を before/after で実コードに即して具体化した（F-1/F-2/F-3/F-4）
- [x] 循環 import 非発生の確認手順を記載した
- [x] focused 実行・検証コマンドを提示した
- [x] DoD と grep gate（AC-3 集約検証・P-3 例外）を定義した
