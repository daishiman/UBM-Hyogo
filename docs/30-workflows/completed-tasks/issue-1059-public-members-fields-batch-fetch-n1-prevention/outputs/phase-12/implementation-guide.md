# 実装ガイド: 公開 members list の fields N+1 防止 (issue-1059)

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か
公開メンバー一覧の画面では、一人ひとりの「名前・ニックネーム・職業・住んでいる地域・UBMゾーン・会員種別」を
データベースから取り出して表示します。今までのやり方は、まるで **クラス40人の連絡先を、1人分ずつ職員室まで
40回往復して取りに行く** ようなものでした。人数が増えるほど往復回数が増えて、表示が遅くなります。

### 何をするか
これを **「名簿を1枚もらって、全員分をまとめて受け取る」** やり方に変えます。データベースへの問い合わせを、
人数に関係なく **1回** にまとめます。表示される内容（見た目）はまったく同じで、取りに行く回数だけが減ります。

## Part 2: 技術詳細（開発者レベル）

### 追加する関数（repository）
```ts
// apps/api/src/repository/responseFields.ts
export async function listFieldsByResponseIds(
  c: DbCtx,
  rids: readonly ResponseId[],
): Promise<ResponseFieldRow[]> {
  if (rids.length === 0) return [];                  // 空配列は DB 非アクセス（IN () 構文エラー回避）
  const placeholders = rids.map((_, i) => `?${i + 1}`).join(", ");
  const result = await c.db
    .prepare(`SELECT * FROM response_fields WHERE response_id IN (${placeholders})`)
    .bind(...rids)
    .all<ResponseFieldRow>();
  return result.results;                            // フラット配列（複数 response_id 分）
}
```

### use-case の置換（before / after）
- before: `for (const m of memberRows) { await listFieldsByResponseId(ctx, m.current_response_id) }` = fields クエリ **N 回**。
- after: ループ外で `asResponseId(m.current_response_id)` により `responseIds` を作り、
  `listFieldsByResponseIds(ctx, responseIds)` を **1 回**呼ぶ。返却されたフラット配列を
  `Map<string, Map<string, string | null>>`（**key = `response_id`（= `current_response_id`）**）に groupBy。
  per-member は `fieldsByResponseId.get(m.current_response_id) ?? new Map()` で引き当てる。

| 指標 | before | after |
| --- | --- | --- |
| fields クエリ回数 | N（member 件数） | 1（空なら 0） |
| 出力形状 | PublicMemberListResponse | 同左（不変） |

### エラーハンドリング / エッジケース
- 空配列入力 → DB 非アクセスで `[]`。
- ある member の fields 0 件 → `?? []` で既定値（fullName 等は空文字、ubmZone/ubmMembershipType は null）。
- groupBy キーは **response_id**（tags の member_id とは異なる / F-2）。

### 不変条件
- #5: D1 アクセスは apps/api 内に閉じる（apps/web 非接触）。
- view converter `toPublicMemberListView` の fail-close（#2/#3/#11）は不変。
- tags / D1 schema / endpoint / Google Form 仕様は変更しない。

## 視覚証跡
UI/UX変更なしのため Phase 11 スクリーンショット不要。代替証跡は自動テスト（repository spec + use-case spec）と
fields クエリ回数 ≦ 1 の回帰 guard。
