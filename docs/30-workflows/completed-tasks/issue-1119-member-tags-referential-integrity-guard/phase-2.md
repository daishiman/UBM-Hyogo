# Phase 2 — 設計（ADR: no-FK 確定 + application 層ガード設計）

> **[実装区分: 実装仕様書]**。topology / 関数シグネチャ / データ構造 / SQL / route / 責務分離を確定する。

## 0. ADR-1119: DB-level FOREIGN KEY を採用しない決定（AC-1）

### 決定

**`member_tags.tag_id` への DB-level FOREIGN KEY は採用しない。** 代替として application 層の孤児行検出ガード（detection 関数 + admin 監査 endpoint + 不変条件テスト）で参照整合性を担保する。

### 根拠（比較）

| 観点 | DB-level FK 追加 | application 層ガード（採用） |
|------|------------------|------------------------------|
| 既存架構との整合 | `0022_member_photos.sql:4` の documented no-FK invariant を**反転**する | invariant を**維持・強化**する |
| D1 での実効性 | D1（SQLite）は接続ごとに `PRAGMA foreign_keys` の ON/OFF が決まり、enforcement が不確実。「FK を足したのに効かない」リスク | application 層クエリは D1 で確実に動作。enforcement 不確実性が無い |
| migration コスト | SQLite は `ALTER TABLE ADD CONSTRAINT` 非対応 → テーブル再作成（rename→新table→INSERT SELECT→drop）。既存孤児行があると移行失敗 | migration 不要・テーブル再作成リスクなし |
| seed/fixture 影響 | FK 追加で挿入順序が壊れ、孤立 INSERT する fixture が一斉に失敗しうる | current fixture は実測で健全（`tag_a`/`tag_b` 定義済み）。本タスクでは孤児 0 の回帰確認に留める |
| 検出 vs 防止 | 防止（挿入時拒否）だが既存孤児は検出できない | 検出（既存孤児も含めて可視化・監査）。INSERT 防止は tag_id 先在検証（route/workflow/repository helper 側）が担う |
| 可逆性 | テーブル再作成は不可逆寄り・高リスク | read 関数 + endpoint 追加は低リスク・容易に拡張可能 |

### 帰結

- 孤児行の **検出・監査** を application 層で実装する（防止は tag_id 先在検証が担う二段構え）。
- issue-1070 の count guard（削除時の参照防壁）は撤去せず維持。orphan detection と**責務を分離**して共存させる。
- D1 PRAGMA foreign_keys の挙動確認（元 AC-4）は「FK を採用しないため判断に不要」として N/A 記録（FK 非依存）。

## 1. topology（責務境界）

```
┌─────────────────────────────────────────────────────────────┐
│ apps/api（D1 直接アクセスはここに閉じる・invariant #5）          │
│                                                               │
│  routes/admin/tags.ts                                         │
│    GET /admin/tags/orphans  (read-only / 監査 surface)  ← 新規 │
│        │ requireAdmin → db(c) → repository                    │
│        ▼                                                       │
│  repository/memberTags.ts                                     │
│    detectOrphanMemberTags(c): Promise<OrphanMemberTag[]> ← 新規│
│    countOrphanMemberTags(c): Promise<number>            ← 新規 │
│        │ SELECT ... WHERE tag_id NOT IN (tag_definitions)     │
│        ▼                                                       │
│  D1: member_tags ⟕ tag_definitions（論理 FK・no DB FK）        │
│                                                               │
│  repository/tagDefinitions.ts（既存・非破壊）                  │
│    countMemberTagReferences(c, tagId)  ← 削除時 count guard    │
└─────────────────────────────────────────────────────────────┘
```

**状態所有権**: 孤児検出は read-only（member_tags / tag_definitions の所有権を変更しない）。mutation は一切持たない。

## 2. repository 関数設計（`apps/api/src/repository/memberTags.ts` を EDIT）

### 2.1 型定義（新規）

```typescript
/** member_tags のうち tag_definitions に対応 tag_id が存在しない孤児行 */
export type OrphanMemberTag = {
  memberId: string;
  tagId: string;
  source: string;
  assignedAt: string;
  assignedBy: string | null;
};
```

### 2.2 `detectOrphanMemberTags`（新規・read）

```typescript
export async function detectOrphanMemberTags(c: DbCtx): Promise<OrphanMemberTag[]> {
  const { results } = await c.db
    .prepare(
      `SELECT member_id   AS memberId,
              tag_id      AS tagId,
              source      AS source,
              assigned_at AS assignedAt,
              assigned_by AS assignedBy
         FROM member_tags
        WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)
        ORDER BY member_id, tag_id`,
    )
    .all<OrphanMemberTag>();
  return results ?? [];
}
```

- **入力**: `c: DbCtx`（既存 read 関数と同型）
- **出力**: 孤児行配列（0 件なら空配列）
- **副作用**: なし（read-only）

### 2.3 `countOrphanMemberTags`（新規・read）

```typescript
export async function countOrphanMemberTags(c: DbCtx): Promise<number> {
  const row = await c.db
    .prepare(
      `SELECT COUNT(*) AS n
         FROM member_tags
        WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)`,
    )
    .first<{ n: number }>();
  return row?.n ?? 0;
}
```

- 不変条件テスト（孤児 0 件）の判定に使用。`countMemberTagReferences`（既存・特定 tag の被参照数）とは**逆方向**（孤児 = 参照先 tag が不在）であり責務が異なる点を docstring に明記する。

### 2.4 invariant #13 適合確認

- 追加 export は `detectOrphanMemberTags` / `countOrphanMemberTags` の **read** 2 関数のみ。
- 禁止 prefix（`insert`/`update`/`delete`/`upsert`/`assign`/`bulk`）に非該当 → `memberTags.readonly.test-d.ts` の typecheck を破らない（Phase 4 で確認）。

## 3. route 設計（`apps/api/src/routes/admin/tags.ts` を EDIT）

### 3.1 `GET /admin/tags/orphans`（新規・read-only）

```typescript
// 注意: 静的セグメント /tags/orphans を /tags/:tagId 系より「前」に登録し、
//       :tagId へ "orphans" が capture されるのを防ぐ。
app.get("/tags/orphans", async (c) => {
  const orphans = await detectOrphanMemberTags(db(c));
  return c.json({ ok: true, count: orphans.length, orphans });
});
```

- **入力**: なし（admin 認証は既存ミドルウェアが担保）
- **出力**: `{ ok: true, count: number, orphans: OrphanMemberTag[] }`
- **副作用**: なし（read-only・audit log 任意。既存 read endpoint に倣い audit なしを既定とする）
- **エラー**: D1 エラーは既存の共通エラーハンドラに委譲

### 3.2 route 登録順序（重要・落とし穴）

Hono は登録順マッチのため、`/tags/orphans` を `/tags/:tagId`（存在する場合）や `/tags/:tagId/physical` の **前**に配置する。Phase 5 で `tags.ts` の既存 `app.get`/`app.delete` 群の登録位置を実測し、`:tagId` を含む動的 GET より前に挿入する。

## 4. 責務分離テーブル（AC-4）

| ガード | 関数 / endpoint | 方向 | タイミング | 役割 |
|--------|-----------------|------|------------|------|
| count guard（issue-1070・既存） | `countMemberTagReferences(c, tagId)` | tag → 被参照 member_tags 数 | tag physical delete **直前** | 参照あり tag の削除を 409 で拒否（孤児の**発生防止**） |
| orphan detection（本タスク・新規） | `detectOrphanMemberTags(c)` / `countOrphanMemberTags(c)` | member_tags → 不在 tag_definitions | 任意（監査・テスト） | 既に存在する孤児行の**検出・可視化** |

→ 防止（count guard）と検出（orphan detection）は補完関係。撤去・代替ではなく**二段防壁**として共存。

## 5. データフロー / 入出力まとめ

| # | 入口 | 処理 | 出力 | 副作用 |
|---|------|------|------|--------|
| 1 | `GET /admin/tags/orphans` | `detectOrphanMemberTags(db(c))` | `{ok, count, orphans[]}` JSON | なし |
| 2 | テスト / 監査 | `countOrphanMemberTags(db(c))` | `number` | なし |

## 6. 変更対象ファイル一覧（確定）

| ファイル | 変更種別 | 内容 |
|----------|----------|------|
| `apps/api/src/repository/memberTags.ts` | 編集 | `OrphanMemberTag` 型 + `detectOrphanMemberTags` + `countOrphanMemberTags` 追加 |
| `apps/api/src/routes/admin/tags.ts` | 編集 | `GET /tags/orphans` endpoint + import 追加 |
| `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts` | 新規 | orphan detection repository spec |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | 編集 | `GET /admin/tags/orphans` contract test 追加 |
| `apps/api/src/routes/admin/members.contract.spec.ts` | 確認のみ | member_tags INSERT fixture が事前 tag_definitions 定義済（:104,:421）で孤児を生まないことを確認（AC-5・回帰 guard）。実測で健全のため fixture 差分は作らない |

> `*.spec.ts` のみ使用（invariant #8: `*.test.{ts,tsx}` 禁止）。`memberTags.readonly.test-d.ts` は型 typecheck で `.test-d.ts` 拡張のため対象外（既存規約踏襲・編集なし／確認のみ）。

## 完了条件（Phase 2）

- [x] ADR-1119（DB-level FK 不採用）を根拠付きで確定
- [x] `detectOrphanMemberTags` / `countOrphanMemberTags` / `OrphanMemberTag` のシグネチャ・SQL を固定
- [x] `GET /admin/tags/orphans` の I/O と route 登録順序を確定
- [x] count guard との責務分離テーブルを明記
- [x] 変更対象ファイル一覧を確定
- [x] 出力: [outputs/phase-2/architecture-design.md](outputs/phase-2/architecture-design.md) / [outputs/phase-2/api-specification.md](outputs/phase-2/api-specification.md) / [outputs/phase-2/database-schema.md](outputs/phase-2/database-schema.md)
