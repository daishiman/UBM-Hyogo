# Phase 2 — API 仕様詳細

> **[実装区分: 実装仕様書]** / `implementation_mode: new` / **NON_VISUAL**
> `GET /admin/tags/orphans` の I/O・route 登録順序の落とし穴・repository 関数シグネチャ / SQL を確定する。

## 1. endpoint: `GET /admin/tags/orphans`（新規・read-only）

### 1.1 概要

| 項目 | 内容 |
|------|------|
| メソッド / パス | `GET /admin/tags/orphans` |
| 認証 | admin（既存 `routes/admin/*` 共通 middleware が担保） |
| 副作用 | なし（read-only / audit log は既定なし＝既存 read endpoint に倣う） |
| 用途 | admin が member_tags の孤児行を検出・監査する actionable surface |

### 1.2 リクエスト

| 要素 | 仕様 |
|------|------|
| パスパラメータ | なし |
| クエリパラメータ | なし |
| リクエストボディ | なし |
| ヘッダ | 既存 admin 認証ヘッダ（middleware 委譲） |

### 1.3 レスポンス（200 OK）

```jsonc
{
  "ok": true,
  "count": 2,
  "orphans": [
    {
      "memberId": "mbr_001",
      "tagId": "tag_a",
      "source": "admin",
      "assignedAt": "2026-06-06T00:00:00Z",
      "assignedBy": "adm_001"
    },
    {
      "memberId": "mbr_002",
      "tagId": "tag_b",
      "source": "form",
      "assignedAt": "2026-06-06T00:00:00Z",
      "assignedBy": null
    }
  ]
}
```

| フィールド | 型 | 説明 |
|------------|----|------|
| `ok` | `boolean` | 常に `true`（成功） |
| `count` | `number` | 孤児行件数（`orphans.length` と一致） |
| `orphans` | `OrphanMemberTag[]` | 孤児行配列（0 件なら `[]`） |

### 1.4 レスポンス（孤児 0 件・正常時の不変条件）

```jsonc
{ "ok": true, "count": 0, "orphans": [] }
```

→ 整合性が保たれた状態（AC-7 の `countOrphanMemberTags() == 0` と対応）。

### 1.5 エラー

| 状況 | 扱い |
|------|------|
| 未認証 / 非 admin | 既存 admin middleware が 401/403 を返す（本 endpoint で追加処理なし） |
| D1 クエリエラー | 既存共通エラーハンドラへ委譲 |

### 1.6 実装スケッチ（route）

```typescript
// 注意: 静的セグメント /tags/orphans を /tags/:tagId 系より「前」に登録し、
//       :tagId へ "orphans" が capture されるのを防ぐ。
app.get("/tags/orphans", async (c) => {
  const orphans = await detectOrphanMemberTags(db(c));
  return c.json({ ok: true, count: orphans.length, orphans });
});
```

## 2. route 登録順序の落とし穴（重要）

Hono は**登録順マッチ**のため、動的セグメント `:tagId` を含む既存 route より**前**に静的 `/tags/orphans` を登録しないと、`"orphans"` が `:tagId` に capture され endpoint が動作しない。

### 2.1 既存 route の登録位置（実測対象）

| 既存 route | 行（参照） | capture リスク |
|------------|------------|----------------|
| `POST /tags/:tagId/reactivate` | `routes/admin/tags.ts:251-265` | `:tagId` 動的 |
| `DELETE /tags/:tagId/physical` | `routes/admin/tags.ts:267-284` | `:tagId` 動的 |
| `GET /tags/:tagId`（存在する場合） | Phase 5 で実測 | `GET` かつ `:tagId` → **最も衝突リスク高** |

### 2.2 登録ルール

```
[正] app.get("/tags/orphans", ...)   ← 静的・先に登録
     app.get("/tags/:tagId", ...)    ← 動的・後

[誤] app.get("/tags/:tagId", ...)    ← 先に登録すると
     app.get("/tags/orphans", ...)   ← "orphans" が :tagId="orphans" に吸われ到達不能
```

- Phase 5 で `tags.ts` の既存 `app.get` / `app.delete` 群の登録位置を実測し、`:tagId` を含む **GET** より前に `/tags/orphans` を挿入する。
- contract test（`tags.contract.spec.ts`）で `GET /admin/tags/orphans` のレスポンスに `count` キーが存在することを検証し、capture されていないことを保証する（AC-6）。

## 3. repository 関数シグネチャと SQL

### 3.1 型定義 `OrphanMemberTag`（新規）

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

### 3.2 `detectOrphanMemberTags`（新規・read）

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

| 項目 | 仕様 |
|------|------|
| 入力 | `c: DbCtx`（既存 read 関数と同型） |
| 出力 | `OrphanMemberTag[]`（0 件なら空配列） |
| 副作用 | なし（read-only） |
| 並び | `ORDER BY member_id, tag_id`（決定的順序でテスト安定化） |

### 3.3 `countOrphanMemberTags`（新規・read）

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

| 項目 | 仕様 |
|------|------|
| 入力 | `c: DbCtx` |
| 出力 | `number`（孤児件数） |
| 副作用 | なし（read-only） |
| 用途 | 不変条件テスト（孤児 0 件）の判定 |

### 3.4 `countMemberTagReferences`（既存）との違い（docstring に明記）

| 関数 | クエリ | 方向 |
|------|--------|------|
| `countOrphanMemberTags`（新規） | `WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)` | member_tags → 不在 tag（孤児） |
| `countMemberTagReferences`（既存） | `WHERE tag_id = ?1`（特定 tag の被参照数） | tag → 被参照 member_tags 数 |

→ 両者は**逆方向**で責務が異なる。`countOrphanMemberTags` の docstring に「これは特定 tag の被参照数ではなく、定義不在 tag を参照する行の総数である」旨を明記して混同を防ぐ。

## 4. invariant #13 適合（prefix 検証）

| 追加 export | prefix | 禁止 prefix（`insert`/`update`/`delete`/`upsert`/`assign`/`bulk`）該当 |
|-------------|--------|----------------------------------------------------------------------|
| `detectOrphanMemberTags` | `detect` | **非該当**（read） |
| `countOrphanMemberTags` | `count` | **非該当**（read） |
| `OrphanMemberTag`（型） | — | 型 export・対象外 |

→ `memberTags.readonly.test-d.ts` の禁止 prefix typecheck を破らない（Phase 4 で green 確認）。

## 5. データフロー / 入出力まとめ

| # | 入口 | 処理 | 出力 | 副作用 |
|---|------|------|------|--------|
| 1 | `GET /admin/tags/orphans` | `detectOrphanMemberTags(db(c))` | `{ok, count, orphans[]}` JSON | なし |
| 2 | テスト / 監査 | `countOrphanMemberTags(db(c))` | `number` | なし |

## 完了条件（Phase 2 — API 仕様）

- [x] `GET /admin/tags/orphans` の I/O を確定
- [x] route 登録順序の落とし穴（`:tagId` capture）と回避策を明記
- [x] `detectOrphanMemberTags` / `countOrphanMemberTags` のシグネチャ・SQL を固定
- [x] `countMemberTagReferences`（既存）との方向差を明記
- [x] invariant #13 prefix 適合を確認
