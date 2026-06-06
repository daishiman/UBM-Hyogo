# 実装ガイド — tag master reactivate + physical delete

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

## Part 1: 概念説明（はじめての人向け）

### なぜ必要か（先に理由）

このサイトには「タグ」という仕組みがあります。会員さんに「エンジニア」「経営者」「飲食業」といった札（ふだ）を貼って、あとから探しやすくするためのものです。どんな札の種類があるかをまとめた一覧表を、ここでは「タグ台帳（だいちょう）」と呼びます。

いまのプログラムでは、台帳から札を **「棚の奥にしまう」ことはできます**（これを「論理削除」と呼びます。札の種類自体は台帳に残っていて、ただ「もう新しく貼らない」という印がついた状態です）。でも、いったん棚の奥にしまった札を **もう一度棚に戻す（また使えるようにする）窓口がありません**。間違ってしまった場合に取り消せないのです。

もうひとつ困りごとがあります。テストのつもりで作った札や、打ち間違えて作ってしまった札を、台帳から **完全に消す（破って捨てる）窓口もありません**。論理削除だと札は台帳に残り続けるので、その札の「合言葉（code）」も占有されたまま。同じ合言葉でちゃんとした札を作り直したいのに作れない、という状態が起こります。

### 何をするか

そこで、管理者さん向けに 2 つの新しい窓口（ボタンの裏側の仕組み）を用意します。

- **棚に戻す（reactivate）**: 棚の奥にしまった札を、もう一度使えるように棚へ戻します。すでに棚に出ている札に「戻して」と言われても、何も変わらないので静かにそのままにします（二重に作業しません）。
- **完全に捨てる（physical delete）**: 台帳から札の行そのものを破って捨てます。捨てたあとは、その合言葉が空くので、同じ合言葉で新しい札を作り直せます。

### 大事な約束（こわさない）

1. **誰かが使っている札は捨てられない（参照ガード）**: ある札を、すでに何人かの会員さんに貼ってある場合、その札を完全に捨ててしまうと「誰に貼った札なのか分からない貼り跡」だけが残ってしまいます（これを「孤児（こじ）になる」と言います）。それは混乱のもとなので、**使っている人が 1 人でもいる札は捨てさせません**。「この札はまだ N 人に使われています」と理由を添えて断ります。本当に捨てたいなら、先に貼り跡を片づける作業（別の手続き）が必要です。

2. **完全に捨てるのは取り消せない**: 棚に戻す操作はやり直しがききますが、完全に捨てる操作は **元に戻せません**（破って捨てた紙は元に戻らないのと同じ）。だから、本番の台帳で札を完全に捨てるときは、必ず人が承認してから、決められた手順書（runbook）に沿って実行します。プログラムが勝手に捨てることはしません。

3. **やった操作は必ず記録する**: 棚に戻した・完全に捨てた、という操作は、誰がいつやったかを **作業日誌（audit）** に 1 行ずつ書き残します。ただし「すでに棚に出ている札をもう一度棚に戻して」のように、何も変わらなかったときは日誌に書きません（同じことを二重に書かない）。

4. **いまの「棚の奥にしまう（論理削除）」は変えない**: これまでどおり、論理削除はそのまま使えます。今回はその上に「棚に戻す」「完全に捨てる」を足すだけで、既存のふるまいは壊しません。

### 今回やらないこと

- 管理画面の「ボタンそのもの（見た目）」は今回は作りません。裏側の窓口だけを用意します（別 Issue）。
- 使われている札を「無理やり捨てて貼り跡を別の札に付け替える」強制移行も、今回は範囲外です。安全のため、いまは「使っているなら断る」に留めます。

## Part 2: 技術詳細（開発者向け）

> 本ガイドは実装済み契約（SSOT）。実コードの適用・テスト実行・正本 spec 書き込みは本サイクルで完了した。commit/PR・staging runtime・production 物理削除は user-gated。

### 対象ファイル（Phase 1 inventory 準拠）

| # | パス | 変更種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 編集 | `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` + 型 `PhysicalDeleteTagDefinitionResult` 追加 |
| 2 | `apps/api/src/routes/admin/tags.ts` | 編集 | reactivate POST / physical DELETE route、audit action union 拡張、`ERROR_TO_STATUS` に `tag_has_references:409` |
| 3 | `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | reactivate / physical delete endpoint + 参照ガード不変条件 + logical/physical の code 占有差 |
| T1 | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | 編集 | repository lifecycle write contract（D1） |
| T2 | `apps/api/src/routes/admin/tags.contract.spec.ts` | 編集 | reactivate / physical endpoint contract + audit + 既存・logical DELETE regression 固定（AC-6） |

> `apps/api/src/index.ts` の mount は不変（reactivate / physical はいずれも既存 `adminTagsRoute` 配下の新パス）。新 migration 不要。`apps/web` 非接触。

### repository 層に追加する型（`tagDefinitions.ts`）

```ts
// physical delete の判別共用体（孤児化禁止のため has_references を明示）
export type PhysicalDeleteTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }                              // 参照0 → 削除成功（削除前 row を audit before 用に返す）
  | { ok: false; reason: "not_found" }                              // tag_id 不在
  | { ok: false; reason: "has_references"; referenceCount: number }; // member_tags 参照あり → 拒否
```

### repository 層に追加する関数シグネチャ（`tagDefinitions.ts`）

```ts
// reactivate: deactivateTagDefinition の対称形。不在=null / 既に active=1={row, changed:false} / active=0→1={row, changed:true}。
//   UNIQUE code 列には触れないため reactivate 時の code conflict は構造的に発生しない。
export async function reactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null>;

// countMemberTagReferences: member_tags WHERE tag_id の件数。DB-FK 不在ゆえこの application-level count が唯一の参照防壁。
export async function countMemberTagReferences(c: DbCtx, tagId: string): Promise<number>;

// physicalDeleteTagDefinition: 参照0でのみ DELETE FROM tag_definitions。参照>0 は削除前に has_references で拒否（孤児化禁止）。
//   成功時は削除前 snapshot row を返す（audit before 用）。
export async function physicalDeleteTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<PhysicalDeleteTagDefinitionResult>;
```

### SQL 実装方針（決定論的・Phase 2 §2.1 準拠）

| 関数 | SQL / 方針 |
| --- | --- |
| `reactivateTagDefinition` | まず `getTagDefinitionByIdRaw`（active 問わず取得）。不在→`null`。`active===true`→`{row, changed:false}`（UPDATE 発行せず）。それ以外→`UPDATE tag_definitions SET active = 1 WHERE tag_id = ?1 AND active = 0`、再取得した row と `meta.changes>0` を `changed` で返す |
| `countMemberTagReferences` | `SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = ?1`、`first<{ n:number }>()`、`?.n ?? 0` |
| `physicalDeleteTagDefinition` | `getTagDefinitionByIdRaw` 不在→`{ok:false,reason:"not_found"}`。`countMemberTagReferences>0`→`{ok:false,reason:"has_references",referenceCount}`（DELETE しない）。0→`DELETE FROM tag_definitions WHERE tag_id = ?1`、`{ok:true,row:current}`（current=削除前 snapshot） |

### route 層の拡張（`apps/api/src/routes/admin/tags.ts`）

audit action union と `ERROR_TO_STATUS` を拡張する。

```ts
// appendTagAudit の action union に追加
action: "admin.tag.created" | "admin.tag.updated" | "admin.tag.deactivated"
       | "admin.tag.reactivated" | "admin.tag.physically_deleted";

// ERROR_TO_STATUS に追加
tag_has_references: 409,
```

- `AuditAction` は `RepoBrand<string>`（enum 無し）のため brand 型変更不要。`AuditTargetType` も `"tag"` 既存。route の literal union のみ拡張。

```ts
// POST /tags/:tagId/reactivate（新規）
app.post("/tags/:tagId/reactivate", async (c) => {
  const tagId = c.req.param("tagId");
  const result = await reactivateTagDefinition(db(c), tagId);
  if (!result) return fail(c, "tag_not_found");                 // 404
  if (result.changed) {
    await appendTagAudit(c, {
      action: "admin.tag.reactivated",
      targetId: tagId,
      before: { active: false },
      after: { active: true },
    });
  }
  return c.json(rowBody(result.row), 200);                       // idempotent でも 200 + 現 row
});

// DELETE /tags/:tagId/physical（新規・既存 logical DELETE と分離）
app.delete("/tags/:tagId/physical", async (c) => {
  const tagId = c.req.param("tagId");
  const result = await physicalDeleteTagDefinition(db(c), tagId);
  if (!result.ok && result.reason === "not_found") return fail(c, "tag_not_found");  // 404
  if (!result.ok && result.reason === "has_references")
    return c.json({ ok: false, error: "tag_has_references", referenceCount: result.referenceCount }, 409);
  await appendTagAudit(c, {
    action: "admin.tag.physically_deleted",
    targetId: tagId,
    before: { code: result.row.code, label: result.row.label, category: result.row.category, active: result.row.active },
    after: null,
  });
  return c.body(null, 204);
});
```

- 既存 `app.delete("/tags/:tagId", ...)`（論理削除 active=0）は **不変**。Hono は静的セグメント `/physical` を `:tagId` パラメータより優先解決するため prefix 衝突なし。

### endpoint contract サマリ

| Method | Path | 成功 | 異常 | audit |
| --- | --- | --- | --- | --- |
| POST | `/admin/tags/:tagId/reactivate` | 200 row | 404 `tag_not_found` | `admin.tag.reactivated`（`changed===true` 時のみ） |
| DELETE | `/admin/tags/:tagId/physical` | 204 | 404 `tag_not_found` / 409 `tag_has_references`(+`referenceCount`) | `admin.tag.physically_deleted`（成功時のみ） |
| DELETE | `/admin/tags/:tagId`（既存・論理） | 204 | 404 `tag_not_found` | `admin.tag.deactivated`（変更時のみ・**不変**） |

### audit 記録パターン（AC-5）

state 変化時のみ 1 件 append（reactivate は `changed===true` のとき / physical delete は削除成功時）。

| action | 発火条件 | before | after |
| --- | --- | --- | --- |
| `admin.tag.reactivated` | reactivate で `changed===true` のみ | `{ active: false }` | `{ active: true }` |
| `admin.tag.physically_deleted` | physical delete 成功時のみ | 削除前 full row `{ code, label, category, active }` | `null` |

### テスト

| ファイル | カバレッジ |
| --- | --- |
| `tagDefinitions.write.repository.spec.ts`（D1） | reactivate（不在/no-op/復帰 + changed フラグ）/ `countMemberTagReferences` / physical delete（参照0 削除成功 + 削除前 row 返却 / 参照>0 拒否 + 行残存 / 不在） |
| `tags.contract.spec.ts` | reactivate（200 / idempotent no-op で audit 不発火 / 404）/ physical（204 + audit / 409 + referenceCount + 行残存 / 404）/ 既存 logical `DELETE /tags/:tagId`（204 + active=0 + member_tags 保持）固定（AC-6） |

### 検証コマンド（実行済み）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
rg -n "admin\.tag\.(reactivated|physically_deleted)|tag_has_references|member_tags" apps/api docs/00-getting-started-manual/specs/01-api-schema.md
```

### Definition of Done

- [x] `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` + `PhysicalDeleteTagDefinitionResult` 実装（`tagDefinitions.ts`）
- [x] reactivate POST / physical DELETE route + audit union + `tag_has_references:409`（`tags.ts`）
- [x] focused D1 Vitest 2 files / 15 tests PASS、logical DELETE regression 緑
- [x] typecheck error 0 / lint exit 0
- [x] `specs/01-api-schema.md` に reactivate / physical + 参照ガード不変条件 + logical/physical code 占有差を同期
- [x] `apps/web` 非接触・新 migration 0 を確認
- [x] production 物理削除は runbook + user approval marker に従う（不可逆 user-gated）
- [x] Issue #1070 CLOSED 維持（`Refs #1070`）

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（NON_VISUAL）。代替証跡は `outputs/phase-11/manual-test-result.md`（focused D1 Vitest / typecheck / lint の実測結果）。
