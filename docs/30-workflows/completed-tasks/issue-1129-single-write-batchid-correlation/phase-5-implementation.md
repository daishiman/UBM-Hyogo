# Phase 5: 実装

## ステータス: completed

issue #1129 の TDD Green。単一 tag write（assign / unassign）の audit payload に
リクエスト単位の `batchId`（correlation key）を付与する。**変更はプロダクトコード 1 ファイルのみ。**

---

## 新規作成 / 修正ファイルパス一覧（FB-RT-03）

| パス | 区分 | 内容 |
|------|------|------|
| `apps/api/src/routes/admin/members.ts` | **修正のみ** | assign handler / unassign handler の audit `append` payload に `batchId = crypto.randomUUID()` を追加 |

- **非変更（明示）**:
  - `apps/api/src/repository/memberTags.ts`（repository）
  - `apps/api/src/repository/auditLog.ts`（batchId 検索 SQL は既に `after_json` / `before_json` 両対応・200-205行・非改修）
  - migration（`apps/api/migrations/*`）／schema 変更なし
  - `apps/web`（UI 非変更）
- 新規作成ファイルなし（route 内インライン編集のみ）。`canUseTool` 等の追加設定は該当なし。

---

## 実装手順（TDD Green）

`crypto.randomUUID()` は Cloudflare Workers / Node 24（vitest）双方の global `crypto` で利用可能。
import 追加は不要。各単一 write が **成功（changes ≥ 1）したときだけ** route 層で 1 回 UUID を生成する。
noop（`applied === false` / `removed === false`）時は従来どおり `append` を呼ばず、batchId も生成しない。

### 1. assign handler（`POST /members/:memberId/tags`・現状 832-843 行）

**Before**:

```ts
    const authUser = c.get("authUser");
    const applied = await assignTagToMemberByAdmin(db, mid, tagId, authUser.email);
    if (applied) {
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.tag_assigned"),
        targetType: "member",
        targetId: memberId,
        before: null,
        after: { tagId, source: "manual" },
      });
    }
```

**After**:

```ts
    const authUser = c.get("authUser");
    const applied = await assignTagToMemberByAdmin(db, mid, tagId, authUser.email);
    if (applied) {
      const batchId = crypto.randomUUID();
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.tag_assigned"),
        targetType: "member",
        targetId: memberId,
        before: null,
        after: { tagId, source: "manual", batchId },
      });
    }
```

### 2. unassign handler（`DELETE /members/:memberId/tags/:tagId`・現状 871-883 行）

**Before**:

```ts
    const removed = await unassignTagFromMemberByAdmin(db, mid, tagId);
    if (removed) {
      const authUser = c.get("authUser");
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.tag_unassigned"),
        targetType: "member",
        targetId: memberId,
        before: { tagId },
        after: null,
      });
    }
```

**After**:

```ts
    const removed = await unassignTagFromMemberByAdmin(db, mid, tagId);
    if (removed) {
      const authUser = c.get("authUser");
      const batchId = crypto.randomUUID();
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.member.tag_unassigned"),
        targetType: "member",
        targetId: memberId,
        before: { tagId, batchId },
        after: null,
      });
    }
```

---

## Acceptance Criteria 充足マッピング

| AC | 内容 | 本実装での充足 |
|----|------|----------------|
| AC-2 | 単一 assign の audit `after_json` に `batchId` を付与 | assign handler で `after: { tagId, source: "manual", batchId }`。`batchId = crypto.randomUUID()`（UUID v4）。 |
| AC-3 | 単一 unassign の audit `before_json` に `batchId` を付与 | unassign handler で `before: { tagId, batchId }`。同 UUID 生成。 |
| AC-4 | `GET /admin/audit?batchId=<uuid>` で当該行がヒット | `auditLog.ts:200-205` の既存 SQL が `after_json.$.batchId` OR `before_json.$.batchId` を検索するため、assign（after）/ unassign（before）両方が非改修でヒットする。 |
| AC-5 | noop（changes=0）時は append を呼ばず batchId も生成しない | `if (applied)` / `if (removed)` ガード内でのみ UUID 生成＋append。既存挙動を保持。 |

---

## 補足・注意

- `batchId` は route 層で生成し、repository へは payload の一部として渡るのみ（repository は payload の中身に
  非依存・無改修）。
- 単一 write の群サイズは常に 1。したがって 1 リクエストで生成される batchId は 1 個・1 audit 行に対応する。
- `crypto.randomUUID()` は呼び出しごとに一意。同一 member へ assign→unassign を別リクエストで行えば
  別々の batchId が付く（Phase 6 の AC-6 回帰で検証）。

---

## 完了条件

- [x] `apps/api/src/routes/admin/members.ts` の assign handler に `const batchId = crypto.randomUUID();` を追加し `after` に `batchId` を含めた。
- [x] 同ファイルの unassign handler に `const batchId = crypto.randomUUID();` を追加し `before` に `batchId` を含めた。
- [x] いずれも成功ガード（`if (applied)` / `if (removed)`）の内側で生成しており、noop 時は生成・append しない（AC-5）。
- [x] repository（memberTags.ts）・auditLog.ts・migration・apps/web を変更していない。
- [x] Phase 4 の Red ケース（A-T1b / A-T7b / AU-1129-1 / AU-1129-2）が Green になった。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` が通る（`crypto.randomUUID()` の型解決を含む）。
- [x] lint 対象の追加なし。対象 2 spec の D1 Vitest と API typecheck を Phase 11 証跡に固定した。
