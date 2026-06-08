# 実装ガイド（issue-1119-member-tags-referential-integrity-guard）

> **status: implemented_local** / NON_VISUAL / implementation_mode=new
> Part 1（中学生レベルの概念説明）+ Part 2（技術者向け実装仕様）の二部構成。

---

## Part 1 — 中学生でもわかる説明（専門用語なし）

### なぜこれが必要なの？

学校に「名札（タグ）」を配る係がいると想像してください。

- 名札の「種類リスト」があります。例: 「サッカー部」「吹奏楽部」「英語クラブ」。これが **タグの一覧表**です。
- 生徒一人ひとりに「あなたはこの名札ね」と割り当てた**割り当てメモ**があります。例: 「たろう → サッカー部」「はなこ → 英語クラブ」。

ふつうは、割り当てメモに書く名札は、必ず種類リストに載っている名札のはずです。
ところが、もし「英語クラブ」という名札を**種類リストから消してしまった**のに、
「はなこ → 英語クラブ」という割り当てメモが**残ったまま**だったら、どうなるでしょう？

これが「**孤児タグ（orphan）**」です。
**種類リストにもう存在しない名札を、まだ誰かに割り当てたままになっている状態**のことです。
迷子（孤児）の割り当てメモ、というイメージです。

### 今までの仕組みの弱点

今のシステムには「名札を消そうとしたとき、まだ誰かに割り当てられていたら消させない」という見張り番がいます
（これが issue-1070 で作った「count guard」）。
でもこの見張り番は「これから消そうとする瞬間」しか見ていません。
**昔のうっかりで、すでに迷子になってしまった割り当てメモ**を見つける目を持っていないのです。

### このタスクで作るもの

「迷子の割り当てメモが残っていないか、いつでも数えて見つけられる**点検ツール**」を作ります。

- **見つける機能**: 種類リストに無い名札を割り当てているメモを全部リストアップする。
- **数える機能**: 迷子の割り当てメモが何件あるか数える（0 件なら健全）。
- **点検窓口**: 管理者が「迷子のメモを見せて」とお願いできる窓口（`GET /admin/tags/orphans`）。

### 大事なお約束

- **種類リストの作り方（テーブル設計）は変えません**。データベースに「FK（外部キー）」という強制ルールを足すこともしません。
  これは、このシステムが昔から「強制ルールはデータベースに置かず、プログラム側でちゃんと確認する」方針だからです（`0022_member_photos.sql` のルール）。
- 既存の見張り番（count guard）はそのまま残します。**「消すときに止める見張り番」と「すでに迷子になったメモを見つける点検ツール」は役割が違う**ので、両方いっしょに働きます。
- この点検ツールは**見るだけ**で、データを書き換えたり消したりはしません。安全です。

### 今回つくるものの対応表

| 日本語 | 英語 | 役割 |
|--------|------|------|
| 名札の種類リスト | `tag_definitions` | 使えるタグの一覧（正本） |
| 割り当てメモ | `member_tags` | 「だれに・どのタグ」の記録 |
| 迷子の割り当てメモ | 孤児行 / `OrphanMemberTag` | 種類リストに無いタグを割り当てている行 |
| 迷子を全部見つける | `detectOrphanMemberTags` | 孤児行を一覧で返す |
| 迷子を数える | `countOrphanMemberTags` | 孤児行の件数を返す |
| 点検窓口 | `GET /admin/tags/orphans` | 管理者が孤児行を確認する API |

---

## Part 2 — 技術者向け実装仕様

### 2.1 型定義（`apps/api/src/repository/memberTags.ts` に追加）

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

- `member_tags` 実列は `member_id` / `tag_id` / `source` / `confidence` / `assigned_at` / `assigned_by`。
  孤児監査には `confidence` は不要のため型に含めない（最小公開フィールド）。
- `assignedBy` のみ `string | null`（admin 由来は値、システム由来は NULL のケースを許容）。

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

- **入力**: `c: DbCtx`（既存 read 関数と同型）。
- **出力**: 孤児行配列（0 件なら空配列）。
- **副作用**: なし（read-only）。
- 列 alias で snake_case → camelCase へ写像し、`OrphanMemberTag` と shape を一致させる。

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

- 不変条件テスト（孤児 0 件・AC-7）の判定に使用。
- `null` 安全化（`row?.n ?? 0`）で空テーブル / NULL を 0 に正規化。

### 2.3.1 `assignTagsToMember` の先在検証（AC-3）

`assignTagsToMember` は tagQueueResolve workflow 専用 helper だが、helper 単体でも active tag master set に存在しない
`tag_id` は `member_tags` に書かない。workflow 側の `unknown_tag_code` 防壁を維持しつつ、repository helper 誤用時にも
孤児行を増やさない二段防壁とする。

### 2.4 `GET /admin/tags/orphans` API 仕様（`apps/api/src/routes/admin/tags.ts` に追加）

```typescript
// 注意: 静的セグメント /tags/orphans を /tags/:tagId 系より「前」に登録し、
//       :tagId へ "orphans" が capture されるのを防ぐ。
app.get("/tags/orphans", async (c) => {
  const orphans = await detectOrphanMemberTags(db(c));
  return c.json({ ok: true, count: orphans.length, orphans });
});
```

| 項目 | 内容 |
|------|------|
| method / path | `GET /admin/tags/orphans` |
| 認証 | 既存 admin 認証ミドルウェアが担保（追加実装なし） |
| 入力 | なし |
| 出力 | `{ ok: true, count: number, orphans: OrphanMemberTag[] }` |
| 副作用 | なし（read-only・audit log は既存 read endpoint に倣い既定なし） |

#### route 登録順序（落とし穴）

Hono は登録順マッチのため、`/tags/orphans`（静的）を `/tags/:tagId` や `/tags/:tagId/physical`（動的）の
**前**に登録する。Phase 5 で `tags.ts` の既存 `app.get` / `app.delete` 群の位置を実測し、`:tagId` を含む
動的 GET より前に挿入すること。順序を誤ると `"orphans"` が `:tagId` に capture され 404 / 誤動作になる。

### 2.5 エラーハンドリング

- D1 クエリエラーは既存の共通エラーハンドラに委譲する（個別 try/catch を追加しない）。
- `detectOrphanMemberTags` / `countOrphanMemberTags` は read-only かつ副作用ゼロのため、ロールバック対象なし。
- endpoint は read-only のため 4xx/5xx は共通ハンドラ任せ（孤児 0 件は `count: 0` / `orphans: []` を 200 で返す正常応答）。

### 2.6 count guard との責務分離（AC-4）

| ガード | 関数 / endpoint | 方向 | タイミング | 役割 |
|--------|-----------------|------|------------|------|
| count guard（issue-1070・既存・非破壊） | `countMemberTagReferences(c, tagId)` | tag → 被参照 member_tags 数 | tag physical delete **直前** | 参照あり tag の削除を 409 で拒否（孤児の**発生防止**） |
| orphan detection（本タスク・新規） | `detectOrphanMemberTags(c)` / `countOrphanMemberTags(c)` | member_tags → 不在 tag_definitions | 任意（監査・テスト） | すでに存在する孤児行の**検出・可視化** |

- 両者は**逆方向**のクエリで責務が異なる（防止 vs 検出）。撤去・代替ではなく**二段防壁**として共存する。
- docstring に「`countMemberTagReferences` は特定 tag の被参照数、`countOrphanMemberTags` は参照先 tag が不在の孤児件数」と明記する。

### 2.7 invariant #13 適合

- 追加 export は read 2 関数（`detect*` / `count*` prefix）のみ。
- 禁止 prefix（`insert`/`update`/`delete`/`upsert`/`assign`/`bulk`）に非該当 →
  `memberTags.readonly.test-d.ts` の typecheck を破らない（Phase 4 で確認）。

### 2.8 検証コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.contract.spec.ts
pnpm --filter @ubm-hyogo/api typecheck
pnpm lint
```

---

## 視覚証跡

**UI/UX 変更なしのため Phase 11 スクリーンショットは不要（NON_VISUAL）。**

本タスクの追加物は D1 read 関数 2 つ・read-only JSON endpoint 1 つ・テスト・fixture 健全性確認のみで、
レンダリングされる UI 画面は一切変更しない。代替証跡として以下を参照する（実装着地後に物理作成）。

- `outputs/phase-10/final-review-result.md` — 最終レビュー結果（AC-1〜AC-7 充足・不変条件非破壊の確認）
- `outputs/phase-11/manual-test-result.md` — 自動テスト結果サマリ（上記 vitest 実行ログ・`countOrphanMemberTags() == 0` 不変条件の検証）
