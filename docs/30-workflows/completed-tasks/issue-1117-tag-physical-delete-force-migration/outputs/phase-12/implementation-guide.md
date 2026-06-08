# 実装ガイド — tag physical delete force-migration（参照付き tag の強制移行）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

## Part 1: 概念説明（はじめての人向け）

### なぜ必要か（先に理由）

このサイトには「タグ」という仕組みがあります。会員さんに「エンジニア」「経営者」「飲食業」といった札（ふだ）を貼って、あとから探しやすくするためのものです。どんな種類の札があるかをまとめた一覧表を「タグ台帳（だいちょう）」と呼びます。

いまのプログラムには、台帳から札を **完全に捨てる（破って捨てる）窓口** がすでにあります。ただし、ひとつ大事な約束があります。**誰か 1 人でもその札を使っている（貼ってある）うちは、捨てさせてくれません**。理由は、札を捨ててしまうと「誰に貼った札なのか分からない貼り跡」だけが残ってしまうからです（これを「孤児（こじ）になる」と言います）。だから、使っている札を捨てようとすると「この札はまだ N 人に使われています」と理由を添えて断られます。

ところが、運用していると **こういう困りごと** が起きます。たとえば、打ち間違えて「エンジニア」のつもりが「エンジニヤ」という札を作ってしまい、すでに何人かに貼ってしまった。本当は正しい「エンジニア」の札に貼り替えて、間違った「エンジニヤ」の札は完全に捨てたい。でも「使っているうちは捨てられない」ので、いまのままだと **手作業で一人ずつ貼り替えてからでないと捨てられません**。これは大変です。

### 何をするか

そこで、**「貼り替えてから捨てる」を 1 回でまとめてやる窓口**（ボタンの裏側の仕組み）を用意します。これを「強制移行（force-migration）」と呼びます。

たとえば、間違った札「エンジニヤ」を捨てたいとき、「移行先として正しい札『エンジニア』を指定する」と、次の順番でまとめて作業してくれます。

1. 「エンジニヤ」が貼ってある会員さん全員に、代わりに「エンジニア」を貼る。
2. 「エンジニヤ」の貼り跡を全部はがす。
3. もう誰も「エンジニヤ」を使っていないことを **もう一度確認** してから、「エンジニヤ」の札を台帳から完全に捨てる。

このとき、すでに「エンジニア」も「エンジニヤ」も両方貼ってあった会員さんがいても大丈夫です。**同じ札を二重に貼ることはしません**（重複しないように吸収します）。

### 大事な約束（こわさない）

1. **移行先を指定しないときは、今までどおり**: 移行先（「どの札に貼り替えるか」）を指定しないで「捨てて」と言われたら、これまでどおり「使っているうちは捨てさせない（断る）」ふるまいのままです。今回の変更で、この安全なふるまいは **一切壊しません**。

2. **貼り替えてからでないと捨てない**: 強制移行は、必ず「貼り替え → 貼り跡が 0 になったことを確認 → 捨てる」の順番です。万一、貼り替えがうまくいかず貼り跡が残っていたら、捨てる作業には進みません。

3. **完全に捨てるのは取り消せない**: 捨てる操作は **元に戻せません**（破って捨てた紙は戻らないのと同じ）。だから本番の台帳で実行するときは、必ず人が承認してから、決められた手順書（runbook）に沿って実行します。プログラムが勝手に捨てることはしません。さらに、もし「移行先を間違えて指定してしまった」ときのために、**逆向きに貼り戻す手順（逆移行ロールバック）** も手順書に用意しておきます。

4. **やった操作は必ず記録する**: 「何件を、どの札から、どの札へ貼り替えたか」「誰がいつやったか」を **作業日誌（audit）** に書き残します。貼り替えの記録と、捨てた記録の 2 行を残します。

5. **間違った移行先は事前に断る**: 移行先の札が「そもそも台帳に無い」「もう使わない設定になっている（非 active）」「移行元と移行先が同じ札」のときは、作業を始める前に理由を添えて断ります。

### 今回やらないこと

- 管理画面の「ボタンそのもの（見た目）」は今回は作りません。裏側の窓口だけを用意します（別 Issue）。
- タグの台帳に「使っていない札は作れないようにする」といったデータベース側の強い縛り（DB-FK）を足すことも、今回は範囲外です（別 Issue）。

## Part 2: 技術詳細（開発者向け）

> 本ガイドは実装契約（SSOT・Phase 2/3）。本サイクルは **implemented_local_evidence_captured**。実コードの適用・focused D1 Vitest・正本 spec 書き込みは完了。commit/PR・staging runtime・production 強制移行/物理削除は user-gated。

### 対象ファイル（Phase 1 §1.5 inventory 準拠）

| # | パス | 変更種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 編集 | `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` + 型 `ForceMigrateAndPhysicalDeleteTagResult` 追加 |
| 2 | `apps/api/src/routes/admin/tags.ts` | 編集 | `DELETE /tags/:tagId/physical` への `?migrateTo` 分岐、`ERROR_TO_STATUS` に 3 error code、audit action `admin.tag.references_migrated` |
| 3 | `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | `?migrateTo` endpoint + error code 3 種 + audit action + 不変条件 |
| T1 | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | 編集 | force-migration repository write contract（D1） |
| T2 | `apps/api/src/routes/admin/tags.contract.spec.ts` | 編集 | force-migration endpoint contract + audit + AC-7 regression 固定 |

> `apps/api/src/index.ts` の mount は不変（強制移行は既存 `DELETE /tags/:tagId/physical` の query 分岐ゆえ新 path を増やさない）。新 migration 不要。`apps/web` 非接触。

### repository 層に追加する型（`tagDefinitions.ts`）

```ts
// 強制移行 + 物理削除の二段オーケストレーションの判別共用体。
// 移行後 COUNT が 0 にならない異常時は has_references で削除に進まない（防御）。
export type ForceMigrateAndPhysicalDeleteTagResult =
  | { ok: true; row: TagDefinitionRow; sourceReferenceCount: number; migratedCount: number }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "target_not_found" }
  | { ok: false; reason: "target_inactive" }
  | { ok: false; reason: "same_as_source" }
  | { ok: false; reason: "has_references"; referenceCount: number };
```

### repository 層に追加する関数シグネチャ（`tagDefinitions.ts`）

```ts
// migrateMemberTagReferences: member_tags の src 参照を dest へ全件付け替える（衝突吸収込み）。
//   src/dest は呼び出し側で存在検証済みであることを前提とする。
//   sourceReferenceCount/migratedCount は移行前 source 参照数（衝突で INSERT されない分も集約済みとして含む）。
export async function migrateMemberTagReferences(
  c: DbCtx,
  srcTagId: string,
  destTagId: string,
): Promise<{ sourceReferenceCount: number; migratedCount: number }>;

// forceMigrateAndPhysicalDeleteTagDefinition: 検証 → 移行 → COUNT=0 再検証 → 物理削除の二段オーケストレーション。
//   既存 getTagDefinitionByIdRaw / countMemberTagReferences / physicalDeleteTagDefinition を再利用。
export async function forceMigrateAndPhysicalDeleteTagDefinition(
  c: DbCtx,
  srcTagId: string,
  destTagId: string,
): Promise<ForceMigrateAndPhysicalDeleteTagResult>;
```

### SQL 実装方針（DB-FK 不在前提・application-level・Phase 2 §2.3 準拠）

`member_tags` は `PRIMARY KEY (member_id, tag_id)` のみで FK 無し。`UPDATE ... SET tag_id=dest` を素朴に全件実行すると、同一 member が src と dest の両方を持つ場合に PK 衝突する。よって 2 ステップに分け、`c.db.batch([...])` で **原子実行** する（部分移行を残さない）。

```sql
-- Step 1: src を持つ全 member に dest 行を冪等に確保（既に dest を持つ衝突 member は OR IGNORE でスキップ）
INSERT OR IGNORE INTO member_tags
  (member_id, tag_id, source, confidence, assigned_at, assigned_by)
SELECT member_id, ?dest, source, confidence, assigned_at, assigned_by
FROM member_tags
WHERE tag_id = ?src;

-- Step 2: src 行を全削除（dest 側に集約済み）。移行前 source 参照数 が migratedCount。
DELETE FROM member_tags WHERE tag_id = ?src;
```

| 関数 | SQL / 方針 |
| --- | --- |
| `migrateMemberTagReferences` | `INSERT OR IGNORE ... SELECT` + source delete を `c.db.batch`（型上 unavailable 時は sequential fallback）で実行。`migratedCount` = 移行前 source 参照数。`member_tags` の `source` / `confidence` / `assigned_at` / `assigned_by` は SELECT 句で明示的に保持する |
| `forceMigrateAndPhysicalDeleteTagDefinition` | ① `srcTagId===destTagId`→`{ok:false,reason:"same_as_source"}`。② `getTagDefinitionByIdRaw(src)` 不在→`not_found`。③ `getTagDefinitionByIdRaw(dest)` 不在→`target_not_found`、`active===false`→`target_inactive`。④ `migrateMemberTagReferences(src,dest)`→`{sourceReferenceCount,migratedCount}`。⑤ `countMemberTagReferences(src)!==0`→`{ok:false,reason:"has_references",referenceCount}`（DELETE しない・防御）。⑥ `physicalDeleteTagDefinition(src)`→`ok:true` のとき `{ok:true,row,sourceReferenceCount,migratedCount}` |

> 検証順序の確定: `same_as_source` を最初に判定すると、src 不在でも `dest` 検証前に弾けて副作用ゼロを保証できる。`not_found` → `target_not_found` → `target_inactive` の順は Phase 2 §2.8 の変換表に一致させる。

### route 層の拡張（`apps/api/src/routes/admin/tags.ts`）

既存 `app.delete("/tags/:tagId/physical", ...)`（issue-1070）に `?migrateTo` 分岐を足す。`migrateTo` 未指定は **既存経路を完全保持**（AC-7）。

```ts
app.delete("/tags/:tagId/physical", async (c) => {
  const tagId = c.req.param("tagId");
  const rawMigrateTo = c.req.query("migrateTo");
  const migrateTo = rawMigrateTo?.trim();

  if (rawMigrateTo !== undefined && migrateTo?.length === 0) {
    return fail(c, "migration_target_not_found");
  }
  if (migrateTo === undefined) {
    // ===== issue-1070 既存経路（不変・AC-7）=====
    const result = await physicalDeleteTagDefinition(db(c), tagId);
    if (!result.ok && result.reason === "not_found") return fail(c, "tag_not_found");
    if (!result.ok && result.reason === "has_references")
      return failWithBody(c, "tag_has_references", { referenceCount: result.referenceCount });
    await appendTagAudit(c, { action: "admin.tag.physically_deleted", targetId: tagId, before: rowBody(result.row), after: null });
    return c.body(null, 204);
  }

  // ===== 強制移行経路（新規）=====
  const result = await forceMigrateAndPhysicalDeleteTagDefinition(db(c), tagId, migrateTo);
  if (!result.ok) {
    switch (result.reason) {
      case "not_found": return fail(c, "tag_not_found");
      case "target_not_found": return fail(c, "migration_target_not_found");
      case "target_inactive": return failWithBody(c, "migration_target_inactive", { migrateTo });
      case "same_as_source": return fail(c, "migration_target_same_as_source");
      case "has_references": return failWithBody(c, "tag_has_references", { referenceCount: result.referenceCount });
    }
  }
  await appendTagAudit(c, {
    action: "admin.tag.references_migrated",
    targetId: tagId,
    before: { tag_id: tagId, dest: migrateTo, referenceCount: result.sourceReferenceCount },
    after: { migratedCount: result.migratedCount, deleted: true },
  });
  await appendTagAudit(c, {
    action: "admin.tag.physically_deleted",
    targetId: tagId,
    before: rowBody(result.row),
    after: null,
  });
  return c.body(null, 204);
});
```

### error code 追加（`ERROR_TO_STATUS`・`tags.ts:52-59` 付近）

```ts
migration_target_not_found: 404,
migration_target_inactive: 409,
migration_target_same_as_source: 400,
```

### audit action union 追加（`appendTagAudit`・`tags.ts:106-114` 付近）

```ts
action: "admin.tag.created" | "admin.tag.updated" | "admin.tag.deactivated"
       | "admin.tag.reactivated" | "admin.tag.physically_deleted"
       | "admin.tag.references_migrated";
```

- `AuditAction` は `RepoBrand<string>`（enum なし）のため brand 型変更不要。`AuditTargetType` も `"tag"` 既存。route の literal union のみ拡張する。

### 内部 reason → 公開 error code 変換表（Phase 2 §2.8）

| 内部 `ForceMigrateAndPhysicalDeleteTagResult.reason` | 公開 error code | HTTP |
| --- | --- | --- |
| `not_found` | `tag_not_found` | 404 |
| `target_not_found` | `migration_target_not_found` | 404 |
| `target_inactive` | `migration_target_inactive` | 409 |
| `same_as_source` | `migration_target_same_as_source` | 400 |
| `has_references` | `tag_has_references` | 409 |

### endpoint contract サマリ

| Method | Path | 成功 | 異常 | audit |
| --- | --- | --- | --- | --- |
| DELETE | `/admin/tags/:tagId/physical?migrateTo=<dest>` | 204 | 404 `tag_not_found` / 404 `migration_target_not_found` / 409 `migration_target_inactive` / 400 `migration_target_same_as_source` / 409 `tag_has_references`(+`referenceCount`) | `admin.tag.references_migrated` + `admin.tag.physically_deleted`（成功時 2 件） |
| DELETE | `/admin/tags/:tagId/physical`（`migrateTo` 未指定・**不変**） | 204 | 404 `tag_not_found` / 409 `tag_has_references`(+`referenceCount`) | `admin.tag.physically_deleted`（成功時のみ） |

### audit shape（AC-4）

| action | before | after | target_type/id |
| --- | --- | --- | --- |
| `admin.tag.references_migrated` | `{ tag_id: src, dest, referenceCount }` | `{ migratedCount, deleted: true }` | `tag` / src |
| `admin.tag.physically_deleted` | 削除前 full row | `null` | `tag` / src |

- actor は既存 `appendTagAudit` → `auditLog.ts` の actor 記録経路で残る（AC-4 の「実行者」充足）。

### エッジケース / 冪等性

| ケース | 振る舞い |
| --- | --- |
| 同一 member が src/dest 両方を保有（PK 衝突） | Step 1 `INSERT OR IGNORE` で dest を二重生成せず、Step 2 で src 行を除去。dest 側に集約・孤児 0 |
| src 参照 0 で `migrateTo` 指定 | 移行 0 件（`migratedCount=0`）→ COUNT=0 → 物理削除成功。204 |
| 移行先誤指定（不在 / 非 active / src===dest） | 移行・削除を **一切実行せず** 明示エラー（副作用ゼロ） |
| 同一 (src,dest) を再実行 | 2 回目は src が物理削除済みで不在 → `not_found` → 404 `tag_not_found`（移行は再実行されない） |
| 移行後に COUNT が 0 にならない異常 | `has_references` で削除に進まず 409 `tag_has_references` を返す（孤児化防止の最終防壁） |

### 設定 / 定数一覧

| 項目 | 値 | 所在 |
| --- | --- | --- |
| query param 名 | `migrateTo`（camelCase。raw query を取得し、値ありの場合は trim 済み tag id で処理。trim 後空文字は 404 `migration_target_not_found`） | route |
| error code | `migration_target_not_found` / `migration_target_inactive` / `migration_target_same_as_source` | `ERROR_TO_STATUS` |
| HTTP status | 404 / 409 / 400 | `ERROR_TO_STATUS` |
| audit action | `admin.tag.references_migrated` | `appendTagAudit` union |
| 移行 SQL | `INSERT OR IGNORE` + `DELETE`（`c.db.batch` 原子実行） | `migrateMemberTagReferences` |
| migratedCount 源 | 移行前 source 参照数 | `migrateMemberTagReferences` |

### テスト

| ファイル | カバレッジ |
| --- | --- |
| `tagDefinitions.write.repository.spec.ts`（D1） | `migrateMemberTagReferences`（移行件数 = 元 src 参照数 / PK 衝突を孤児なしで dest 集約 / src 参照 0 化）/ `forceMigrateAndPhysicalDeleteTagDefinition`（移行 → COUNT=0 → 削除成功 + row / target not_found / inactive / same_as_source / has_references 防御） |
| `tags.contract.spec.ts` | `?migrateTo` 指定（204 + audit 2 件 references_migrated/physically_deleted）/ 移行先 404 / 409 inactive / 400 same / **`migrateTo` 未指定 + 参照あり → 409 `tag_has_references`（AC-7 regression）** / `migrateTo` 未指定 + 参照なし → 204（既存挙動） |

### 検証コマンド（実装サイクルで実行・user-gated）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
rg -n "migrateMemberTagReferences|forceMigrateAndPhysicalDeleteTagDefinition|admin\.tag\.references_migrated|migration_target_(not_found|inactive|same_as_source)" apps/api docs/00-getting-started-manual/specs/01-api-schema.md
```

### Definition of Done

- [ ] `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` + `ForceMigrateAndPhysicalDeleteTagResult` 実装（`tagDefinitions.ts`）
- [ ] `DELETE /tags/:tagId/physical` への `?migrateTo` 分岐 + error code 3 種 + audit `references_migrated`（`tags.ts`）
- [ ] 移行 SQL を `c.db.batch` で原子実行・PK 衝突を `INSERT OR IGNORE`+`DELETE` で吸収・孤児 0
- [ ] 移行後 `countMemberTagReferences(src)===0` 再検証後のみ物理削除（`has_references` 防御）
- [ ] `migrateTo` 未指定経路が issue-1070 既存挙動を保持（AC-7 regression test green）
- [ ] focused D1 Vitest（force-migration + AC-7 regression）PASS / typecheck 0 / lint 0
- [ ] `specs/01-api-schema.md` に `?migrateTo` endpoint + error code 3 種 + audit action + 不変条件を同期
- [ ] `apps/web` 非接触・新 migration 0 を確認
- [ ] production 強制移行・物理削除は `force-migration-runbook.md` + user approval marker に従う（不可逆・逆移行ロールバックあり・user-gated）
- [ ] Issue #1117 CLOSED 維持（`Refs #1117`）

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（NON_VISUAL）。代替証跡は `outputs/phase-11/manual-test-result.md`（NON_VISUAL 宣言 + focused D1 Vitest 2 files / 25 tests PASS、TC-FM-1..6 / trim contract / TC-AC7-1..2 / TC-AUDIT-1）。
