# Phase 5 — 実装

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。Phase 4 の Red を Green にする。`apps/api` のみ変更（invariant #5）。

## 0. 新規作成 / 修正ファイルパス一覧（必須・Feedback RT-03）

| # | ファイル | 種別 | 概要 |
|---|----------|------|------|
| 1 | `apps/api/src/repository/memberTags.ts` | 修正 | `OrphanMemberTag` 型 + `detectOrphanMemberTags` + `countOrphanMemberTags` を追加 |
| 2 | `apps/api/src/routes/admin/tags.ts` | 修正 | `GET /tags/orphans` endpoint + import 追加（`:tagId` 系より前に登録） |
| 3 | `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts` | 新規 | TC-R01〜R07（Phase 4） |
| 4 | `apps/api/src/routes/admin/tags.contract.spec.ts` | 修正 | TC-C01〜C04 追加 |
| 5 | `apps/api/src/routes/admin/members.contract.spec.ts` | 確認のみ | `tag_a`/`tag_b` は現コードで既に `tag_definitions` 定義済（`:104`/`:421`）。fixture 差分は作らず、「孤児 0 を維持」を確認する |

> `*.spec.ts` のみ（invariant #8）。`memberTags.readonly.test-d.ts` は編集せず typecheck 確認のみ。

## 1. `memberTags.ts` への型 + 2 関数追加手順

### 1.1 型 `OrphanMemberTag` を追加

`MemberTagWithDefinition` 等の既存型定義群（ファイル前半・`:26` 周辺の型ブロック）の近傍に追加する。

```typescript
/** member_tags のうち tag_definitions に対応 tag_id が存在しない孤児行（参照整合性破れ） */
export type OrphanMemberTag = {
  memberId: string;
  tagId: string;
  source: string;
  assignedAt: string;
  assignedBy: string | null;
};
```

### 1.2 `detectOrphanMemberTags`（read）を追加

既存 read 関数（`listTagsByMemberId` 等・`:54` 以降）と同じく `c: DbCtx` を受け、`.all<T>()` で取得する。`assign*` 経路の write 群とは別ブロック（read セクション）に配置する。

```typescript
/**
 * member_tags のうち tag_definitions に対応 tag_id が存在しない孤児行を検出する（read-only）。
 * 防止は各 write 経路の tag_id 先在検証が担い、本関数は既存孤児の検出・監査を担う。
 * `countMemberTagReferences`（tag → 被参照数・削除時防壁）とは逆方向の関心事である。
 */
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

### 1.3 `countOrphanMemberTags`（read）を追加

`detectOrphanMemberTags` の直後に配置し、同一 WHERE 句で COUNT を返す（TC-R07 の一致不変条件を担保）。

```typescript
/** 孤児 member_tags 行の件数（不変条件テストで == 0 を検証する用途）。`detect` と同一 WHERE 句。 */
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

### 1.4 invariant #13 適合確認

- 追加 export は `detectOrphanMemberTags` / `countOrphanMemberTags` の read 2 関数 + 型 `OrphanMemberTag` のみ。
- `detect` / `count` prefix は `memberTags.readonly.test-d.ts` の `WriteKeyword`（insert/update/delete/upsert）にも `AssignKeyword`（assign）にも該当しない → typecheck 非破壊。

## 2. `tags.ts` への endpoint 追加手順（route 登録順序の実測ステップ含む）

### 2.1 import 追加

`tags.ts` 冒頭の repository import に `detectOrphanMemberTags` を追加する。

```typescript
import { detectOrphanMemberTags } from "../../repository/memberTags";
```

> import 元が `tagDefinitions` ではなく `memberTags` である点に注意（orphan 検出は member_tags 起点）。

### 2.2 route 登録順序の実測ステップ（落とし穴回避）

Hono は登録順マッチのため、静的 `/tags/orphans` を動的 `/tags/:tagId` 系より**前**に登録する必要がある。

```bash
# 1. tags.ts 内の app.get / app.delete 登録位置を実測する
grep -n 'app\.\(get\|post\|delete\|put\|patch\)(' apps/api/src/routes/admin/tags.ts

# 2. ":tagId" を含む動的ルート（例: app.get("/tags/:tagId", ...) / app.delete("/tags/:tagId/physical", ...)）の
#    登録行番号を特定し、その「前」に /tags/orphans を挿入する位置を決める
grep -n ':tagId' apps/api/src/routes/admin/tags.ts
```

実測結果に基づき、`:tagId` を含む最初の GET より前に以下を挿入する。

```typescript
// 静的セグメント /tags/orphans は /tags/:tagId 系より前に登録し、capture を防ぐ。
app.get("/tags/orphans", async (c) => {
  const orphans = await detectOrphanMemberTags(db(c));
  return c.json({ ok: true, count: orphans.length, orphans });
});
```

- 認証は既存の admin route ミドルウェアが担保（追加 wiring 不要）。
- read-only ゆえ audit log なし（既存 read endpoint に倣う）。
- D1 エラーは既存共通ハンドラに委譲。

### 2.3 登録順検証

```bash
# orphans が :tagId に capture されていないことを contract test（TC-C03）で確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

## 3. `members.contract.spec.ts` fixture 健全性確認手順（編集なし）

### 3.1 現状確認（差分要否の判定）

```bash
grep -n 'INSERT INTO tag_definitions\|INSERT INTO member_tags' apps/api/src/routes/admin/members.contract.spec.ts
```

- **現コードでは `:109` / `:426` の member_tags INSERT 直前に `:104` / `:421` の tag_definitions 定義が存在する** → `tag_a`/`tag_b` は孤児ではない。
- **fixture 編集の差分は発生しない**。「孤立 INSERT は残存しない」事実を `outputs/phase-5/implementation-result.md` に記録する（AC-5 は既達状態として確認）。

### 3.2 万一孤立 INSERT が残存していた場合の修正方針

仮に `member_tags` へ `tag_X` を INSERT する直前に対応する `tag_definitions (tag_id='tag_X', ...)` 定義が無い箇所が見つかった場合のみ:

- 当該 `member_tags` INSERT の**直前**に `INSERT INTO tag_definitions (tag_id, code, label, category) VALUES ('tag_X','code-x','Code X','interest')` を追加する。
- 既存の member_tags INSERT 値・assertion は**一切変更しない**（追加のみ）。回帰を防ぐ。

## 4. Green 検証コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

## 5. DoD（Phase 5 完了の定義）

- [ ] `OrphanMemberTag` 型 + `detectOrphanMemberTags` + `countOrphanMemberTags` が `memberTags.ts` に追加され export されている
- [ ] `GET /admin/tags/orphans` が `tags.ts` に追加され `:tagId` 系より前に登録されている
- [ ] orphan repository spec / tags.contract（orphans）が Green（TC-R01〜R07 / TC-C01〜C04）
- [ ] members.contract が Green（fixture 編集なし・既存 assertion 不変）
- [ ] `typecheck` / `lint` PASS・`memberTags.readonly.test-d.ts` 非破壊
- [ ] 新規 / 修正ファイル一覧（§0）が `outputs/phase-5/implementation-result.md` に転記されている

## 完了条件（Phase 5）

- [ ] §0 ファイル一覧を記載した
- [ ] memberTags.ts への型 + 2 関数追加手順を具体化した
- [ ] tags.ts endpoint 追加と route 登録順序の実測ステップを記載した
- [ ] members.contract fixture 健全性確認手順（編集なし）を記載した
- [ ] Green 検証コマンドと DoD を記載した
- [ ] 出力: [outputs/phase-5/implementation-result.md](outputs/phase-5/implementation-result.md)
