# Phase 2: 設計 — issue-1129 単一 tag write batchId 相関キー付与

## ステータス: completed

## 1. アーキテクチャ概要

```
管理者
  │  POST /admin/members/:memberId/tags { tagId }
  │  DELETE /admin/members/:memberId/tags/:tagId
  ▼
apps/api/src/routes/admin/members.ts（route 層・本タスクの唯一の変更点）
  │  1. mutation 実行（repository: assignTagToMemberByAdmin / unassignTagFromMemberByAdmin）
  │  2. changes>0 のときだけ:
  │       const batchId = crypto.randomUUID()   ← 新規（route 層で生成）
  │       auditLogProvider.append({ ..., after/before: { ..., batchId } })
  ▼
audit_log（schema 変更なし・JSON payload に batchId を埋める）
  ▲
  │  GET /admin/audit?batchId=<uuid>（#1079・非改修）
  │  auditLog.ts:200-205 json_extract(after_json,'$.batchId') OR json_extract(before_json,'$.batchId')
apps/web admin audit viewer（#1079・非改修で単一 write の batchId も表示・copy 可能）
```

## 2. 責務境界 / 状態所有権

| レイヤ | 責務 | 本タスクでの変更 |
| --- | --- | --- |
| route（`members.ts`） | 入力検証・mutation 呼び出し・**audit append（payload 構築）** | ✅ batchId 生成 + payload 埋め込み |
| repository（`memberTags.ts`） | D1 mutation 実行・`changes>0` 返却 | ❌ 非変更（`Promise<boolean>` シグネチャ維持） |
| repository（`auditLog.ts`） | audit append / batchId 検索 SQL | ❌ 非変更（既存 OR 検索が単一 write payload にもそのまま効く） |
| migration | schema | ❌ 非変更（新 migration なし） |
| apps/web | audit viewer 表示 | ❌ 非変更（#1079 が batchId 列を表示済み） |

> **設計決定（batchId 生成位置 = route 層）**: bulk は member×tag を跨ぐため `bulkApplyMemberTagsByAdmin` が
> 1 つの batchId を生成して全 item で共有する必要があった（repository が `{ batchId }` を返す）。
> 単一 write は 1 行のみなので、route 層で `crypto.randomUUID()` を生成すれば足りる。
> これにより repository の単一 write 関数の戻り値（`Promise<boolean>`）を壊さず、不変条件 #13 の
> allow-list test（`memberTags.readonly.test-d.ts`）や既存 contract への影響を最小化できる。
> correlation id 生成は「audit の関心」であり、audit append 責務を持つ route 層に置くのが責務一貫。

## 3. 実装差分設計（Before / After）

### 3.1 単一 assign（`members.ts:833-843`）

Before:
```typescript
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

After:
```typescript
const applied = await assignTagToMemberByAdmin(db, mid, tagId, authUser.email);
if (applied) {
  // request-scoped correlation key（bulk #1036 と同一 payload 形・JSON path）。
  // 単一 write は 1 行のため相関グループサイズ=1。
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

### 3.2 単一 unassign（`members.ts:872-883`）

Before:
```typescript
const removed = await unassignTagFromMemberByAdmin(db, mid, tagId);
if (removed) {
  const authUser = c.get("authUser");
  await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
    ...
    before: { tagId },
    after: null,
  });
}
```

After:
```typescript
const removed = await unassignTagFromMemberByAdmin(db, mid, tagId);
if (removed) {
  const authUser = c.get("authUser");
  // request-scoped correlation key。unassign は before_json 側へ（bulk と非対称配置一致）。
  const batchId = crypto.randomUUID();
  await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
    ...
    before: { tagId, batchId },
    after: null,
  });
}
```

## 4. データ構造（audit payload 契約）

| 操作 | payload 位置 | 形 | JSON path（検索キー） |
| --- | --- | --- | --- |
| 単一 assign | `after_json` | `{ tagId, source: "manual", batchId }` | `$.batchId` |
| 単一 unassign | `before_json` | `{ tagId, batchId }` | `$.batchId` |
| bulk assign（既存・参照） | `after_json` | `{ tagId, source: "manual", batchId }` | `$.batchId` |
| bulk unassign（既存・参照） | `before_json` | `{ tagId, batchId }` | `$.batchId` |

→ 単一 write の payload 形は bulk と**完全一致**（AC-4）。`batchId` は UUID v4 文字列。

## 5. 入力・出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | （変更なし）assign: `{ tagId }` body / unassign: path param `tagId` |
| 出力（HTTP） | （変更なし）assign: 200 `{ assigned, available }` / unassign: 204 |
| 副作用 | 実 mutation 成功時のみ `audit_log` に 1 行 append。**新たに payload へ `batchId` を含める** |
| noop 時 | `changes=0` → append を呼ばない（batchId 生成もしない）。AC-5 維持 |

## 6. SubAgent lane（spec 作成時の並列設計）

| lane | 担当 Phase / 成果物 | 並列 |
| --- | --- | --- |
| backbone | index / phase-1 / phase-2 / phase-3 / artifacts / phase-12 compliance | 直列（owner） |
| A | phase-4 / phase-5 / phase-6 | 並列 |
| B | phase-7 / phase-8 / phase-9 / phase-10 | 並列 |
| C | phase-11 / phase-13 / outputs/phase-11/manual-test-result.md | 並列 |
| D | outputs/phase-12（6 artifacts）/ phase-12-documentation.md | 並列 |
| validation | gate-metadata / verify:phase12-compliance / indexes | 直列で締め（owner） |

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 相関「まとまり」定義の曖昧さで payload 設計が振れる | 中 | AC-1 で「リクエスト単位（群サイズ1）」を Phase 1-3 で確定済 |
| payload キー名 / JSON path が bulk とずれて filter に乗らない | 中 | `batchId` / `$.batchId` / 非対称配置を bulk と逐語一致。contract test で固定 |
| bulk の batchId 意味論と衝突 | 低 | bulk=群サイズN、単一=群サイズ1 の同一 request-scoped 意味論。混在検索は単に行数差。AC-6 検証 |
| 不変条件 #13 の 3 経路分離を崩す | 中 | route 層のみ変更。repository シグネチャ・経路は不変。第2経路の payload 拡張に限定 |
| 既存 contract test の audit payload 期待値が固定的で壊れる | 低 | Phase 4 で既存 assertion を `expect.objectContaining` + batchId 検証へ更新（Phase 4 で精査） |

## 完了条件
- [x] route 層 batchId 生成の責務配置を確定
- [x] Before/After 差分を 2 箇所分明記
- [x] payload 契約（bulk 一致）を表で固定
- [x] noop 非退化の維持方針を明記
