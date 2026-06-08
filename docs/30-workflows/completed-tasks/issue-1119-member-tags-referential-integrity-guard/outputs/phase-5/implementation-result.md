# Phase 5 出力 — 実装手順詳細

タスク: `task-issue-1119-member-tags-referential-integrity-guard`
種別: 実装仕様書 / `implementation_mode: new` / NON_VISUAL（`apps/api` のみ・invariant #5）

## 1. 新規作成 / 修正ファイル一覧

| # | ファイル | 種別 | 内容 |
|---|----------|------|------|
| 1 | `apps/api/src/repository/memberTags.ts` | 修正 | `OrphanMemberTag` 型 + `detectOrphanMemberTags` + `countOrphanMemberTags` 追加。`assignTagsToMember` に未定義 tag_id skip を追加 |
| 2 | `apps/api/src/routes/admin/tags.ts` | 修正 | `GET /tags/orphans` + `detectOrphanMemberTags` import 追加 |
| 3 | `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts` | 新規 | TC-R01〜R08（孤児検出 + `assignTagsToMember` 未定義 tag skip） |
| 4 | `apps/api/src/routes/admin/tags.contract.spec.ts` | 修正 | TC-C01〜C04 追加 |
| 5 | `apps/api/src/routes/admin/members.contract.spec.ts` | 確認のみ | `tag_a`/`tag_b` は現状で tag_definitions 定義済み。fixture 差分は作らず、孤児 0 を確認する |

## 2. 関数シグネチャ（確定）

```typescript
// apps/api/src/repository/memberTags.ts
export type OrphanMemberTag = {
  memberId: string;
  tagId: string;
  source: string;
  assignedAt: string;
  assignedBy: string | null;
};

export async function detectOrphanMemberTags(c: DbCtx): Promise<OrphanMemberTag[]>;
export async function countOrphanMemberTags(c: DbCtx): Promise<number>;
```

```typescript
// apps/api/src/routes/admin/tags.ts
app.get("/tags/orphans", async (c) => {
  const orphans = await detectOrphanMemberTags(db(c));
  return c.json({ ok: true, count: orphans.length, orphans });
});
```

## 3. SQL（確定）

```sql
-- detectOrphanMemberTags
SELECT member_id   AS memberId,
       tag_id      AS tagId,
       source      AS source,
       assigned_at AS assignedAt,
       assigned_by AS assignedBy
  FROM member_tags
 WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions)
 ORDER BY member_id, tag_id;

-- countOrphanMemberTags
SELECT COUNT(*) AS n
  FROM member_tags
 WHERE tag_id NOT IN (SELECT tag_id FROM tag_definitions);
```

## 4. route 登録順序（実測ステップ）

```bash
grep -n 'app\.\(get\|post\|delete\|put\|patch\)(' apps/api/src/routes/admin/tags.ts
grep -n ':tagId' apps/api/src/routes/admin/tags.ts
```

- `:tagId` を含む最初の動的 GET（および `/tags/:tagId/physical`）の**前**に `/tags/orphans` を挿入する。
- Hono の登録順マッチにより、静的セグメントを先に登録しないと `orphans` が `:tagId` に capture される。

## 5. members.contract fixture 健全性確認の判定

```bash
grep -n 'INSERT INTO tag_definitions\|INSERT INTO member_tags' apps/api/src/routes/admin/members.contract.spec.ts
```

実測結果（2026-06-06 時点）:

```
104: INSERT INTO tag_definitions ... 'tag_a' ... 'tag_b' ...
109: INSERT INTO member_tags ... ('m1','tag_a','manual'), ('m1','tag_b','manual')
421: INSERT INTO tag_definitions ... 'tag_a' ... 'tag_b' ...
426: INSERT INTO member_tags ... ('m1','tag_a','manual'), ('m1','tag_b','manual')
```

→ 両 member_tags INSERT の直前に tag_definitions 定義あり。**孤立 INSERT は存在しない**。AC-5（テスト由来孤児 0）は既達状態。fixture 差分は発生しない見込み。万一他箇所で孤立 INSERT が見つかった場合のみ「直前に tag_definitions 定義を追加（既存値・assertion 不変）」する。

## 6. invariant 適合

| invariant | 適合確認 |
|-----------|----------|
| #5（D1 直接アクセスは apps/api） | repository / route のみ・apps/web 非接触 |
| #8（`*.spec.ts` のみ） | 新規/編集テストは全て `.spec.ts` |
| #13（member_tags write は assign 4 関数限定） | 追加は read 2 関数のみ・readonly type guard 非破壊 |
| no-FK 架構（0022:4） | migration / schema 変更なし |
| issue-1070 ガード | count guard / 409 非撤去（責務分離共存） |

## 7. Green 検証コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

## 8. DoD

- [x] 型 + 2 read 関数が export されている
- [x] `GET /admin/tags/orphans` が `:tagId` 系より前に登録されている
- [x] orphan repository spec / tags.contract（orphans）Green
- [x] members.contract Green（fixture 差分ゼロ or 追加のみ）
- [x] typecheck / lint PASS / readonly type guard 非破壊

## 9. 実行結果（2026-06-06・実装サイクル実行）

### 9.1 実コード変更（`git diff --stat -- apps/`）

```
 apps/api/src/repository/memberTags.ts           | 60 ++++++++++++++++++
 apps/api/src/routes/admin/tags.contract.spec.ts | 60 +++++++++++++++++++++++++
 apps/api/src/routes/admin/tags.ts               |  8 ++++
 + apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts（新規・untracked）
```

- `memberTags.ts`: `OrphanMemberTag` 型 + `detectOrphanMemberTags` + `countOrphanMemberTags` を read セクションに追加。`assignTagsToMember` は active tag master set で未定義 tag_id を skip する。
- `tags.ts`: `detectOrphanMemberTags` import + `GET /tags/orphans`（`app.get("/tags")` 直後・全 `:tagId` 系より前）を追加。
- `tags.contract.spec.ts`: TC-C01〜C04 を `queue` ルートテストの前に追加。
- `memberTags.orphan.repository.spec.ts`: 新規・TC-R01〜R08 を網羅実装。
- `members.contract.spec.ts`: 実測通り `tag_a`/`tag_b` は定義済 → **差分なし**（AC-5 既達を確認）。

### 9.2 route 登録順実測

`/tags/orphans`（静的 GET）を `app.get("/tags", ...)` 直後に配置。現コードに `GET /tags/:tagId` は存在しないため method レベルでの capture は元々起きないが、仕様の安全策どおり全 `:tagId` 系より前に登録。TC-C03 で `count` キー存在を assert し capture 回避を保証。

### 9.3 Green 検証結果

```
✓ memberTags.orphan.repository.spec.ts (8 tests)   — TC-R01〜R08 PASS
✓ tags.contract.spec.ts (15 tests)                 — TC-C01〜C04 含め PASS
✓ members.contract.spec.ts (28 tests)              — 既存 assertion 不変で PASS
✓ tagDefinitions.write.repository.spec.ts (8 tests) — issue-1070 count guard 非破壊 PASS
 Test Files  4 passed (4)
      Tests  59 passed (59)
```

- `pnpm --filter @ubm-hyogo/api typecheck`: PASS（tsc --noEmit エラーなし）。
- `pnpm lint`: PASS（全 workspace・no dependency violations / no-inline-style OK）。
- `memberTags.readonly.test-d.ts`: `detect*` / `count*` prefix は write/assign keyword gate に非該当。api typecheck PASS で型エラーなし。

### 9.4 invariant 最終確認

- invariant #5: apps/web 非接触（apps/api のみ変更）。
- invariant #8: 追加テストは全て `*.spec.ts`。
- invariant #13: 新規 export は read 2 関数 + 型のみ。既存 `assignTagsToMember` は helper 内で未定義 tag_id を skip するが、新規 write 経路は追加しない。
- no-FK 架構: migration / D1 schema 変更ゼロ。
- issue-1070 ガード: `countMemberTagReferences` + 409 `tag_has_references` 非撤去（責務分離で共存）。
