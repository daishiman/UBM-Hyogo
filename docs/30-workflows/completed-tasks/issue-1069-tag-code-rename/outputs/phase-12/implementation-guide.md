# 実装ガイド — issue-1069 tag code rename

## Part 1: 初学者向け（中学生レベルの概念説明）

### なぜこれが必要なの？

学校の「名簿のあだ名一覧」を想像してください。先生が生徒につける「ラベル（タグ）」には、
人が読む表示名（例:「英語クラス」）と、コンピュータが使う短い合言葉（`code`、例: `english`）の2つがあります。

ある日、先生が合言葉を打ち間違えて `englsh`（l が抜けた）と登録してしまいました。
今のシステムでは、表示名は直せても、**この打ち間違えた合言葉だけは直せません**。
「直したかったら、新しいラベルを作って古いのを捨ててね」と言われるのですが、
そうすると、すでにそのラベルを貼られた生徒たちが「捨てられた古いラベル」を貼ったまま残ってしまい、
かえってぐちゃぐちゃになります。

そこで今回、**合言葉そのものを安全に書き換えられる**ようにします。

### 何をしたか

今回作ったものは、API で tag の `code` を安全に rename する仕組みです。画面は作らず、サーバー側の更新処理、エラー分離、記録、テスト、正本仕様を揃えました。

### 今回作ったもの

- `PATCH /admin/tags/:tagId` で `code` と `expectedCode` を受け付ける API 拡張
- UNIQUE 衝突と stale 衝突を分ける repository result
- `admin.tag.code_renamed` audit
- focused D1 tests と正本 API schema 更新

### どうやって安全にするの？

3つの工夫をします。

1. **生徒とラベルのつながりは壊れない**: 生徒に貼ったラベルは、合言葉ではなく「ラベルの背番号（`tag_id`）」で
   つながっています。合言葉を変えても背番号は変わらないので、誰のラベルも外れません。
2. **同じ合言葉がかぶらないようにする**: すでに `english` という合言葉が別のラベルにあるのに、
   そこへ書き換えようとしたら「それはもう使われてるよ（`tag_code_conflict`）」と教えてくれます。
3. **うっかり上書きを防ぐ**: 「私は今 `englsh` だと思っているので `english` に直して」と伝えると、
   もし誰かが先に別の値へ変えていたら「あれ、もう違う値になってるよ（`tag_stale_conflict`）」と止めてくれます。

そして、いつ・誰が・何から何へ書き換えたかを**記録（audit）に残す**ので、後から追跡できます。

## Part 2: 開発者向け（技術詳細）

### 変更サマリ

既存の admin endpoint **`PATCH /admin/tags/:tagId`** を後方互換に拡張し、tag master（`tag_definitions`）の
`code` を audit 付きで rename 可能にする。新 endpoint・D1 schema migration・apps/web 変更・`auditLog.ts` 型変更はいずれも不要。

### APIシグネチャ

```bash
PATCH /admin/tags/:tagId
Content-Type: application/json

{
  "code": "software_engineer",
  "expectedCode": "engineer"
}
```

### インターフェース / 型定義

```ts
// apps/api/src/repository/tagDefinitions.ts
export interface UpdateTagDefinitionInput {
  code?: string;          // rename 対象の新 code（CODE_RE: /^[a-z0-9][a-z0-9_]*$/）
  label?: string;
  category?: string;
  expectedCode?: string;  // optimistic compare-and-swap。現 code と不一致なら stale
}

export type UpdateTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "code_conflict" }  // UNIQUE(code) 衝突
  | { ok: false; reason: "missing_expected_code" }  // code 指定時 expectedCode 欠落（route で 400 invalid_body）
  | { ok: false; reason: "stale" };         // expectedCode mismatch

export async function updateTagDefinition(
  c: DbCtx,
  tagId: string,
  input: UpdateTagDefinitionInput,
): Promise<UpdateTagDefinitionResult>;
```

### API シグネチャと error マッピング

| 状況 | repository result | HTTP | body |
| --- | --- | --- | --- |
| rename 成功 | `{ok:true, row}` | 200 | `rowBody(row)`（新 code） |
| 不存在 tagId | `{ok:false, reason:"not_found"}` | 404 | `{ok:false, error:"tag_not_found"}` |
| UNIQUE(code) 衝突 | `{ok:false, reason:"code_conflict"}` | 409 | `{ok:false, error:"tag_code_conflict"}` |
| optimistic 衝突 | `{ok:false, reason:"stale"}` | 409 | `{ok:false, error:"tag_stale_conflict"}` |
| field なし | （route で 400） | 400 | `{ok:false, error:"no_update_fields"}` |

### 使用例

```bash
curl -X PATCH "$API_BASE/admin/tags/tag_eng" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"code":"software_engineer","expectedCode":"engineer"}'
```

### audit（AC-4）

| トリガ | action | before | after |
| --- | --- | --- | --- |
| `before.code !== after.code` | `admin.tag.code_renamed` | `{code: before.code}` | `{code: after.code}` |
| label/category 変更 | `admin.tag.updated`（既存） | `{label, category}` | `{label, category}` |

> code と label/category を同時更新すると 2 行とも append される（独立判定）。
> `AuditAction` は `RepoBrand<string>`（enum なし）のため新 action 文字列に型変更不要。
> `AuditTargetType` は `tag` が既存（`auditLog.ts:12`）のため変更不要。

### エラーハンドリング

- UNIQUE 衝突は D1 の error message を `isUniqueError`（既存の `/unique/i` 判定）で捕捉し `code_conflict` へ。
- code rename は `expectedCode` 必須。repository は `UPDATE ... WHERE tag_id = ? AND code = ?` で atomic compare-and-swap し、更新行数 0 なら stale / not_found を再判定する（version 列を増やさない）。
- field 検証由来エラー（CODE_RE 違反）は `invalid_body`(400)、refine 由来（全 field undefined）は `no_update_fields`(400) と分けて返す。
- 既存 contract test が PATCH body に `code:"ignored"` を含む箇所は、`ignored` が CODE_RE を通過し意図せず rename されるため、その body から `code` を除去して既存意図（label/category 更新）を保つ。

### エッジケース

- `expectedCode` が現 code と違う場合は stale として止める。
- `code` 指定時に `expectedCode` が無い場合は 400 `invalid_body` として止める。
- 既存 code へ rename する場合は UNIQUE conflict として止める。
- code と label/category を同時更新した場合、code rename audit と label/category update audit を分ける。
- field なし PATCH は no-op 成功にせず 400 `no_update_fields` とする。

### 設定項目と定数一覧

| 定数 | 値 | 役割 |
| --- | --- | --- |
| `CODE_RE` | `/^[a-z0-9][a-z0-9_]*$/` | code の形式検証（既存・流用） |
| `ERROR_TO_STATUS.tag_stale_conflict` | `409` | optimistic 衝突（新規） |
| `ERROR_TO_STATUS.tag_code_conflict` | `409` | UNIQUE 衝突（既存・流用） |

### データ整合性（AC-3）

`member_tags` は `PRIMARY KEY (member_id, tag_id)` で **tag_id 参照**（`migrations/0002_admin_managed.sql:43-51`）。
rename は tag_id を変えないため member_tags は無傷。seed（`0004_seed_tags.sql`）は `INSERT OR IGNORE`（tag_id PK）で
idempotent insert-only のため、renamed code を revert も conflict もさせない。

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要（NON_VISUAL）。
代替証跡として `outputs/phase-10/phase-10.md`（最終レビュー）と `outputs/phase-11/manual-test-result.md`
（focused D1 Vitest / typecheck / lint / static manifest の期待結果）を参照する。

### テスト構成

| ファイル | 役割 |
| --- | --- |
| `tagDefinitions.write.repository.spec.ts` | repository rename / conflict / stale / member_tags 保持 |
| `tags.contract.spec.ts` | HTTP PATCH success / 409 分離 / audit payload |
| `members.tags.contract.spec.ts` | rename 後も assigned tag が tag_id 経由で解決される regression |
| `auditLog.repository.spec.ts` | `admin.tag.code_renamed` action が型変更なしで round-trip すること |
</content>
