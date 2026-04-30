# Implementation Guide: issue-191 schema aliases

## Part 1: 初学者向け

### なぜ必要か

同じ質問に別名を付ける場所が決まっていないと、あとから「どの質問が本当の名前なのか」が分からなくなる。たとえば教室の名簿で、同じ生徒に「山田さん」「出席番号12番」「係の山田」と別々の呼び方を直接書き足すと、どれを使えばよいか混乱する。

### 何をするか

今回の仕様では、元の名簿を直接書き換えず、別名だけをまとめる専用の表を作る。これにより、元の質問表はそのまま残し、管理者が決めた対応だけを `schema_aliases` に記録できる。

### 今回作ったもの

- `schema_aliases` という新しい表の設計。
- 07b の `POST /admin/schema/aliases` はそのまま使い、保存先だけを変える方針。
- 03a が先に別名表を見て、見つからない時だけ古い値を見る順番。
- 実装・廃止・品質ガードの 3 つの未タスク。

## Part 2: 技術者向け

### 型定義

```ts
export interface SchemaAliasRow {
  id: string;
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string;
  source: "manual" | "migration";
  createdAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface SchemaAliasesRepository {
  lookup(aliasQuestionId: string): Promise<SchemaAliasRow | null>;
  insert(row: SchemaAliasRow): Promise<void>;
  update(id: string, patch: Partial<SchemaAliasRow>): Promise<void>;
}
```

### APIシグネチャ

```ts
POST /admin/schema/aliases
Content-Type: application/json

{
  "questionId": "forms-question-id",
  "stableKey": "memberName",
  "dryRun": false
}
```

HTTP path は既存 07b 契約を維持する。issue-191 の変更点は route 名ではなく、内部 write target を `schema_questions.stable_key` direct update から `schema_aliases` INSERT へ変えることである。

### 使用例

```bash
curl -X POST "$API_BASE/admin/schema/aliases" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"q_123","stableKey":"memberName","dryRun":false}'
```

期待結果: `schema_aliases` に 1 行が追加され、対応する `schema_diff_queue` が `resolved` へ進む。`schema_questions` は更新しない。

### エラーハンドリング

- alias lookup の D1 transient error は alias miss と扱わず、sync を failed にして retry へ回す。
- duplicate `alias_question_id` は 409 として扱う。
- 管理者権限がない場合は既存 admin gate に従って 401 / 403 を返す。
- request body の `questionId` / `aliasQuestionId` 命名差は route 境界で正規化する。

### エッジケース

- `schema_aliases` と `schema_questions.stable_key` の両方に値がある場合は `schema_aliases` を優先する。
- alias miss の場合だけ移行期間 fallback として `schema_questions.stable_key` を読む。
- 両方 miss の場合は unresolved として `schema_diff_queue` へ enqueue する。
- fallback retirement は運用統計が安定してから別タスクで扱う。

### 設定項目と定数一覧

| Item | Value |
| --- | --- |
| canonical endpoint | `POST /admin/schema/aliases` |
| canonical table | `schema_aliases` |
| lookup order | `schema_aliases` -> `schema_questions.stable_key` fallback -> unresolved queue |
| forbidden write | `UPDATE schema_questions SET stable_key` |
| visual evidence | `NON_VISUAL` |

### テスト構成

- D1 migration test: `PRAGMA table_info(schema_aliases)` と index を確認する。
- Repository contract test: lookup / insert / update / duplicate alias を検証する。
- 07b route test: alias insert + queue resolved + no `schema_questions` update を検証する。
- 03a sync test: alias hit / fallback hit / both miss / transient lookup failure を検証する。
- Static guard: direct `schema_questions.stable_key` update が CI で失敗することを確認する。
