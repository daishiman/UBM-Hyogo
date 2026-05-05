# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |
| Source Issue | #297 |

---

## 目的

Phase 3 採用案 A（shared zod schema）と Phase 4 verify suite を、
具体的なファイル変更マニフェスト・実装手順 runbook・sanity check・rollback 手順として固定する。
本 Phase は「コード自体は書かない（実装は wave 7 owner が runbook を読んで実装する）」前提で、
file path / export 構造 / 関数シグネチャ / 検証コマンドを placeholder レベルまで具体化する。

---

## 実行タスク

1. Phase 5 冒頭で `packages/shared` の admin schema 配置慣習を確認し、ブロッカー B-1 を解消する
2. ファイル変更マニフェスト表を作成（path / 変更種別 / 概要 / 想定行数 / wave 7 owner）
3. shared zod schema の export 構造を placeholder で固定
4. apps/api route の body parse 経路を placeholder で固定
5. apps/web client の `resolveTagQueue` 関数シグネチャ / 型を placeholder で固定
6. 08a contract test ファイルの skeleton を placeholder で固定
7. 実装ランブック（手順番号 + 各手順の sanity check）を確定
8. rollback 手順を作成

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | Module 設計 / dependency matrix |
| 必須 | phase-03.md | 採用案 A 確定 |
| 必須 | phase-04.md | verify suite 4 軸ケース |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | 正本契約 |
| 参考 | packages/shared/src/ | 既存 admin schema 配置慣習（B-1 解消用） |
| 参考 | apps/api/src/routes/admin/ | 既存 route 配置慣習 |
| 参考 | apps/web/src/lib/api/ | 既存 admin client 配置慣習 |

---

## ブロッカー B-1 解消手順（Phase 5 冒頭）

```bash
# packages/shared 配下の既存 admin schema を確認
rg -l "admin" packages/shared/src/schemas/ 2>/dev/null || echo "no admin schema dir"

# 既存があればその慣習に追従、無ければ本タスクで先例を作る
ls packages/shared/src/schemas/ 2>/dev/null
```

| ケース | 対応 |
| --- | --- |
| `packages/shared/src/schemas/admin/` が既存 | 配下に `tag-queue-resolve.ts` を新設 |
| `packages/shared/src/schemas/` のみ存在 | `admin/` ディレクトリを新設 |
| `packages/shared/src/schemas/` 自体が無い | Phase 3 の案 D（API zod 物理移動）を経由してから本タスクへ戻す（Phase 3 戻り） |

---

## ファイル変更マニフェスト

| # | path | 変更種別 | 概要 | 想定行数 | wave 7 owner |
| --- | --- | --- | --- | --- | --- |
| F-1 | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` | **新規** | discriminated union zod schema 定義 | ~30 | api/web 両側担当 |
| F-2 | `packages/shared/src/schemas/admin/index.ts` | **更新** or 新規 | re-export 集約 | ~5 | 同上 |
| F-3 | `packages/shared/src/index.ts` | **更新** | admin schemas を public export | ~2 | 同上 |
| F-4 | `apps/api/src/routes/admin/tags/queue/resolve.ts`（既存パス想定）| **更新** | shared schema を import して zod parse に置換 | ~10 diff | api 担当 |
| F-5 | `apps/web/src/lib/api/admin.ts`（既存パス想定）| **更新** | `resolveTagQueue(queueId, body: TagQueueResolveBody)` の型を import | ~10 diff | web 担当 |
| F-6 | `apps/api/test/contract/admin-tags-queue-resolve.test.ts` | **新規** or 拡張 | TC-01〜TC-06 canonical contract test | ~180 | api 担当 |
| F-7 | `apps/api/test/contract/admin-tags-queue-resolve-auth.test.ts` | **新規** | A-01〜A-03 auth gate | ~80 | api 担当 |
| F-8 | `packages/shared/src/schemas/admin/__tests__/tag-queue-resolve.test.ts` | **新規** | U-01〜U-09 unit test | ~80 | shared 担当 |
| F-9 | `docs/30-workflows/unassigned-task/UT-07A-03` | **参照のみ** | E-01〜E-04 Playwright / staging smoke は後続委譲 | 0 | 後続 |

> 既存 path（F-4 / F-5）は Phase 5 冒頭の `rg "resolveTagQueue"` で正確な path を確定する（Phase 1 drift inventory を参照）。

---

## Placeholder: shared zod schema 構造

```ts
// packages/shared/src/schemas/admin/tag-queue-resolve.ts
import { z } from "zod";

const confirmedSchema = z.object({
  action: z.literal("confirmed"),
  tagCodes: z.array(z.string().min(1)).min(1),
});

const rejectedSchema = z.object({
  action: z.literal("rejected"),
  reason: z.string().min(1),
});

export const tagQueueResolveBodySchema = z.discriminatedUnion("action", [
  confirmedSchema,
  rejectedSchema,
]);

export type TagQueueResolveBody = z.infer<typeof tagQueueResolveBodySchema>;
```

> 上記は **形だけ**。実装時に zod version / 既存 schema 命名規則に合わせて調整する。

---

## Placeholder: apps/api route の body parse

```ts
// apps/api/src/routes/admin/tags/queue/resolve.ts （抜粋・形だけ）
import { tagQueueResolveBodySchema } from "@repo/shared/schemas/admin/tag-queue-resolve";

route.post("/admin/tags/queue/:queueId/resolve", async (c) => {
  // 1. admin gate（既存）
  // 2. body parse
  const parsed = tagQueueResolveBodySchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "validation_error" }, 400);

  // 3. service 呼び出し（既存ロジック維持）
  //    - confirmed → member_tags 追加 + queue.status='resolved' + audit
  //    - rejected → reject_reason 保存 + queue.status='rejected' + audit
  //    - idempotent / 409 / 422 は既存 service に委譲
});
```

---

## Placeholder: apps/web client 関数シグネチャ

```ts
// apps/web/src/lib/api/admin.ts （抜粋・形だけ）
import type { TagQueueResolveBody } from "@repo/shared/schemas/admin/tag-queue-resolve";

export async function resolveTagQueue(
  queueId: string,
  body: TagQueueResolveBody,
): Promise<{ ok: true; result: { queueId: string; status: "resolved" | "rejected"; idempotent: boolean; tagCodes?: string[]; reason?: string } }> {
  const res = await fetch(`/api/admin/tags/queue/${queueId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res);
  return res.json();
}
```

---

## Placeholder: 08a contract test skeleton

```ts
// apps/api/test/contract/admin-tags-queue-resolve.test.ts （抜粋・形だけ）
import { describe, it, expect, beforeEach } from "vitest";
import { tagQueueResolveBodySchema } from "@repo/shared/schemas/admin/tag-queue-resolve";

describe("POST /admin/tags/queue/:queueId/resolve", () => {
  beforeEach(async () => {
    // D1 seed: tag_definitions / tag_assignment_queue / member_tags / audit_logs
  });

  it("C-01: confirmed 200 + idempotent:false", async () => { /* ... */ });
  it("C-02: rejected 200 + idempotent:false", async () => { /* ... */ });
  it("C-03: confirmed 同 payload 再投入 → idempotent:true", async () => { /* ... */ });
  it("C-04: rejected 同 payload 再投入 → idempotent:true", async () => { /* ... */ });
  it("C-05: confirmed → rejected 逆走 → 409", async () => { /* ... */ });
  it("C-06: unknown tagCode → 422", async () => { /* ... */ });
  it("C-07: rejected reason 欠落 → 400", async () => { /* ... */ });
  it("C-08: discriminator 欠落 → 400", async () => { /* ... */ });
  it("C-09: tagCodes 空配列 → 400", async () => { /* ... */ });
  it("C-10: member_deleted queue → 422", async () => { /* ... */ });
});
```

---

## 実装ランブック（手順）

| 手順 | 内容 | sanity check |
| --- | --- | --- |
| S-1 | B-1 解消（`packages/shared` admin 配置確認） | `ls packages/shared/src/schemas/` |
| S-2 | F-1 を新規作成（discriminated union zod schema）| `mise exec -- pnpm --filter @repo/shared typecheck` |
| S-3 | F-2 / F-3 で re-export 整備 | `mise exec -- pnpm --filter @repo/shared build` |
| S-4 | F-8 で unit test U-01〜U-09 を実装 | `mise exec -- pnpm --filter @repo/shared test -- tag-queue-resolve` |
| S-5 | F-4 で apps/api route を shared schema 経由に置換 | `mise exec -- pnpm --filter @repo/api typecheck` |
| S-6 | F-6 / F-7 で contract / auth test 実装 | `mise exec -- pnpm --filter @repo/api test -- tags-queue` |
| S-7 | F-5 で apps/web client 型を shared 経由に置換 | `mise exec -- pnpm --filter @repo/web typecheck` |
| S-8 | F-9 で Playwright spec を skeleton レベルで配置（Phase 11 実走） | `mise exec -- pnpm --filter @repo/web lint` |
| S-9 | 全体 typecheck / lint | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| S-10 | 全体テスト | `mise exec -- pnpm test` |

---

## Sanity Check コマンド集

```bash
# 1. apps/web 側で旧契約呼び出しが残っていないか
rg "resolveTagQueue\(\s*[a-zA-Z_]+\s*\)" apps/ packages/   # 引数 1 個の旧呼び出しゼロ件であること

# 2. 06c 由来の空 body 記述が docs に残っていないか
rg "resolve.*空.*body|empty body" docs/

# 3. shared schema が両側から参照されているか
rg "@repo/shared/schemas/admin/tag-queue-resolve" apps/

# 4. 型チェック
mise exec -- pnpm typecheck

# 5. contract test
mise exec -- pnpm --filter @repo/api test -- tags-queue

# 6. unit test
mise exec -- pnpm --filter @repo/shared test -- tag-queue-resolve

# 7. lint
mise exec -- pnpm lint
```

---

## Rollback 手順

| トリガ | 手順 |
| --- | --- |
| F-4 適用後に既存 07a contract test が複数 fail | F-4 を `git restore` し、shared schema を `apps/api` 内 local 定義に戻す（案 D へフォールバック） |
| F-5 適用後に apps/web ビルド失敗 | F-5 のみ `git restore`、F-4 / F-1 は維持し apps/web は次イテレーションで対応 |
| shared schema export が他パッケージと衝突 | F-2 / F-3 を `git restore`、`packages/shared/src/admin/` 等別 path に逃がす |
| Phase 9 で typecheck が解消不能 | Phase 3 へ戻り案 B / 案 D に切替検討 |

> Rollback は git レベルの `restore` を基本とし、D1 側のスキーマ変更は本タスクで触らないため不要。

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | F-6 contract test の異常系（C-05 / C-06 / C-07〜C-09 / C-10）を深堀 |
| Phase 7 | ファイル変更マニフェスト F-1〜F-9 を AC マトリクスに紐付け |
| Phase 9 | sanity check コマンド集を品質保証ゲートで実走 |
| Phase 11 | F-9 Playwright spec を実走 |
| Phase 12 | Module 設計 + ファイル変更マニフェストを doc 同期に反映 |

---

## 多角的チェック観点（不変条件）

- 不変条件 #11（**主検証**）: F-4 route 改修で `members` テーブル / 本人本文への write が増えていないこと（既存 service 委譲のみ）を S-5 sanity check で確認
- 不変条件 #5（**副検証**）: F-5 apps/web client 改修で D1 binding を import していないことを S-7 typecheck で機械検出
- 不変条件 #6（GAS prototype 昇格禁止）: F-1 shared schema は GAS prototype を参照しない
- DRY: F-1 shared schema が SSOT。route / client / test の 3 箇所が同 schema を import する構造を強制

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | B-1 解消（packages/shared admin 配置確認） | 5 | pending | S-1 |
| 2 | F-1 新規 zod schema 作成 | 5 | pending | discriminated union |
| 3 | F-2 / F-3 re-export 整備 | 5 | pending | barrel export |
| 4 | F-4 apps/api route 改修 | 5 | pending | shared schema 経由に置換 |
| 5 | F-5 apps/web client 改修 | 5 | pending | TS 型を shared 経由に置換 |
| 6 | F-6 / F-7 contract / auth test 実装 | 5 | pending | C-01〜C-10 / A-01〜A-03 |
| 7 | F-8 unit test 実装 | 5 | pending | U-01〜U-09 |
| 8 | F-9 Playwright 委譲確認 | 5 | pending | UT-07A-03 で実走 |
| 9 | sanity check 全件 green | 5 | pending | S-1〜S-10 |
| 10 | rollback 手順の git レベル動作確認 | 5 | pending | dry-run のみ |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | ファイル変更マニフェスト / 実装ランブック / placeholder 集 / sanity check / rollback |
| メタ | artifacts.json | Phase 5 を completed に更新 |

---

## 完了条件

- [ ] ブロッカー B-1（packages/shared admin 配置）が解消され、F-1 配置先が確定
- [ ] ファイル変更マニフェスト F-1〜F-9 が path / 種別 / 概要 / 行数 / owner で網羅されている
- [ ] shared zod schema の export 構造が placeholder で固定されている
- [ ] apps/api route / apps/web client / contract test の placeholder 3 種が固定されている
- [ ] 実装ランブック S-1〜S-10 が sanity check コマンド付きで確定
- [ ] rollback 手順が 4 トリガ以上で記述されている
- [ ] sanity check コマンド集が `rg` / `typecheck` / `test` / `lint` を網羅

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-05/main.md` が指定パスに配置済み
- 完了条件 7 件すべてにチェック
- 不変条件 #11 主検証 / #5 副検証の sanity check が runbook に組み込まれている
- artifacts.json の phase 5 を completed に更新

---

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: ファイル変更マニフェスト / 実装ランブック / placeholder / sanity check / rollback 手順
- ブロック条件: B-1 が未解消、または F-1〜F-9 のいずれかが path / 種別未確定の場合は Phase 6 に進まない
