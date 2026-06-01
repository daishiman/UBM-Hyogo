# public members list の fields N+1 防止（batch fetch 化） - タスク指示書

## メタ情報

```yaml
issue_number: 1059
parent_issue: 224
```

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | issue-224-followup-001-public-members-fields-batch-fetch-n1-prevention        |
| タスク名     | public members list の fields N+1 防止（batch fetch 化）                      |
| 分類         | 改善（パフォーマンス）                                                        |
| 対象機能     | `GET /public/members` use-case の summary fields 取得                         |
| 優先度       | 低                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | issue-224 Phase 12 unassigned-task-detection U-2                              |
| 発見日       | 2026-05-31                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue #224（公開 members list の tags 一括取得 N+1 防止）では、`expand=tags` のときに
`listTagsByMemberIds(ctx, memberIds)` で `member_id IN (...)` の 1 query にまとめ、
member 数に比例した tags クエリ（N+1）を解消した。

しかしその実装スコープは **tags のみ** に限定されており、同じ use-case
`apps/api/src/use-cases/public/list-public-members.ts` の中には、もう一系統の N+1 が残っている。

各 member の summary 用 field（氏名 / ニックネーム / 職業 / 居住地 / UBM ゾーン / 会員種別）を
取得する以下のループである（実コード verbatim）:

```ts
const items: PublicMemberListItemSource[] = [];
for (const m of memberRows) {
  const fields = await listFieldsByResponseId(
    ctx,
    m.current_response_id as never,
  );
  const byKey = new Map<string, string | null>();
  for (const f of fields) {
    if ((SUMMARY_KEYS as readonly string[]).includes(f.stable_key)) {
      byKey.set(f.stable_key, f.value_json);
    }
  }
  items.push({ /* ... SUMMARY_KEYS のみ詰める ... */ });
}
```

`listFieldsByResponseId`（`apps/api/src/repository/responseFields.ts`）は
**単一 response_id 取得 helper**（`WHERE response_id = ?1`）であり、これを member 毎にループで
await しているため、member 数 N に対し fields クエリも N 回発行される（fields N+1）。

issue #224 ではこの fields ループは意図的にスコープ外とし、コメントで
「batch 化は MVP 数百規模で許容範囲（R-2: N+1 リスクは limit 100 で頭打ち）」と明記した。
contract / use-case test の N+1 計数も tags batch query のみを対象とし、fields は assert に
含めていない。本タスクはこの積み残しを解消する。

### 1.2 問題点・課題

- 公開一覧 1 ページ表示につき `members` 行数ぶんの fields クエリが直列に発行される。
- D1 は Workers binding 経由で 1 query ごとに RTT があり、limit=100 では最大 100 回の追加 query になる。
- tags は batch 化済み・fields は未対応という非対称な状態が残り、保守時の混乱要因になる。

### 1.3 放置した場合の影響

- 公開一覧のページ応答が member 件数に比例して悪化する（D1 query 数の線形増加）。
- 将来 limit 上限を引き上げた場合や、公開 member 数が増えた場合に表示遅延が顕在化する。
- tags 側だけ batch・fields 側は N+1 という不整合により、後続改修で誤って N+1 を再生産しやすい。

> ただし現状は limit 100 で頭打ちかつ MVP 数百規模のため即時性は低い。
> **公開一覧の表示遅延が顕在化した時点で着手する**（優先度: 低）。

---

## 2. 何を達成するか（What）

### 2.1 目的

`list-public-members.ts` の fields 取得を、member 毎ループから
**`response_id IN (...)` の 1 batch query** へ置き換え、fields N+1 を解消する。
issue #224 の tags batch 化と同じ「フラット配列 helper → use-case 層で Map に groupBy」
パターンに揃える。

### 2.2 最終ゴール

- `responseFields.ts` に複数 response_id 一括取得 helper（例 `listFieldsByResponseIds`）が追加されている。
- `list-public-members.ts` の `for (const m of memberRows) { await listFieldsByResponseId(...) }`
  ループが廃され、batch 取得 + groupBy に置き換わっている。
- fields クエリ数が member 件数に依存せず **定数（≦1 回）** になる回帰テストが追加されている。
- typecheck / lint / test 全グリーン。既存の view 出力（`PublicMemberListResponse`）は不変。

### 2.3 スコープ

#### 含むもの

- `apps/api/src/repository/responseFields.ts` に batch helper を追加（`response_id IN (...)`）。
- `apps/api/src/use-cases/public/list-public-members.ts` の fields 取得ロジックの batch 化。
- fields N+1 回帰テスト（query 計数 assert）の追加。public-d1 helper / contract spec の既存パターン踏襲。

#### 含まないもの

- D1 schema 変更・新規 endpoint 追加・Google Form 仕様変更（不変条件に反するため禁止）。
- tags 側ロジックの変更（issue #224 で完了済み・再触不要）。
- summary 以外の field の追加取得や view 形状の変更（`SUMMARY_KEYS` の範囲は据え置き）。
- `apps/web` 側の変更（D1 直接アクセスは apps/api に閉じる: 不変条件 #5）。

### 2.4 成果物

- `apps/api/src/repository/responseFields.ts` 差分（batch helper 追加）。
- `apps/api/src/use-cases/public/list-public-members.ts` 差分（batch + groupBy）。
- N+1 回帰テスト（query 計数 spec）の追加 / 更新差分。

---

## 3. どのように実装するか（How）

### 3.1 前提条件

- issue #224（tags batch 化）がマージ済みであること。
- `apps/api/src/repository/_shared/sql.ts` の `placeholders(n, start)` が利用可能であること。

### 3.2 必要な知識

- D1 prepared statement の `IN (${placeholders(n)})` バインドパターン。
- フラット配列を use-case 層で `key → 値[]` の `Map` に groupBy する設計。
- issue #224 の `EXPAND_WHITELIST` 防御（未知値は黙って除外・常に配列を返す）。

### 3.3 推奨アプローチ（手順）

1. **現行シグネチャの verbatim 確認（最重要）**:
   `responseFields.ts` の `listFieldsByResponseId` の現行シグネチャ・返り値型・引き当てキーを
   実ファイルから引用する。現状（verbatim）は以下の通り:
   - 返り値型は **フラット配列** `Promise<ResponseFieldRow[]>`（Map ではない）。
   - `ResponseFieldRow = { response_id: string; stable_key: string; value_json: string | null; raw_value_json: string | null }`。
   - 引き当てキーは use-case 側で `m.current_response_id`（= `response_id`。**member_id ではない**）。
2. **batch helper を追加**:
   `responseFields.ts` に `listFieldsByResponseIds(c, rids: ResponseId[]): Promise<ResponseFieldRow[]>`
   を追加する。`listResponsesByIds`（`responses.ts:56-67`）と同形で実装する:
   - `if (rids.length === 0) return [];`
   - `const ph = placeholders(rids.length);`
   - `SELECT * FROM response_fields WHERE response_id IN (${ph})`
   - `.bind(...rids).all<ResponseFieldRow>()` → `result.results` を返す。
   - groupBy 順序を安定させたい場合は `ORDER BY response_id ASC, stable_key ASC` を付ける
     （`listTagsByMemberIds` が `ORDER BY` を付けているのと同じ流儀）。
3. **use-case 側の置き換え**:
   `list-public-members.ts` の fields ループを廃止し、
   - `memberRows` から `current_response_id` 配列を集める（`asResponseId` 相当の brand 変換が必要なら適用）。
   - `listFieldsByResponseIds(ctx, responseIds)` で 1 query 取得。
   - フラット配列を `Map<response_id, ResponseFieldRow[]>`（または `Map<response_id, Map<stable_key, value_json>>`）に
     **`response_id` でキー化して** groupBy する。
   - 各 member について `byResponse.get(m.current_response_id)` から `SUMMARY_KEYS` のみを `items` に詰める。
   - 重複 `current_response_id`（複数 member が同一 response を参照するケース）に備え、Map なので
     同一キーは集約されることを前提にする。
4. **回帰テスト**:
   tags 同様の query 計数 spec を追加する。member 件数を 2 以上にし、fields クエリ呼び出しが
   **件数に依存せず ≦1 回** であることを assert する。
   public-d1 helper（in-memory / spy 系）と既存 contract spec のカウント方法を踏襲する。
5. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / 関連 vitest を緑にする。

---

## 4. 受け入れ条件

### 機能要件

- [ ] `listFieldsByResponseIds`（または同等の batch helper）が `responseFields.ts` に追加されている。
- [ ] `list-public-members.ts` の `for ... await listFieldsByResponseId` ループが除去されている。
- [ ] fields は `response_id`（= `current_response_id`）でキー化した Map に groupBy されている
      （member_id でキー化していないこと）。
- [ ] view 出力 `PublicMemberListResponse` の形状・値が batch 化前後で不変である。
- [ ] `expand=tags` の有無いずれでも summary fields が正しく引き当たる。

### 品質要件

- [ ] fields クエリ数が member 件数に依存しない（≦1 回）ことを assert する回帰テストが緑。
- [ ] `mise exec -- pnpm typecheck` 成功。
- [ ] `mise exec -- pnpm lint` 成功。
- [ ] 既存の public-members contract / use-case spec が緑。

### 不変条件

- [ ] D1 直接アクセスは `apps/api` 内に閉じている（不変条件 #5）。
- [ ] view converter の fail-close 挙動を維持している（不変条件 #2 / #3 / #11）。
- [ ] D1 schema 変更・新規 endpoint 追加・Google Form 仕様変更をしていない。

---

## 5. 苦戦箇所 / 参考知見【記入必須】

### F-1: 実コードと初回調査の食い違い（最重要）

issue #224 実装では、初回 SubAgent 調査が helper の返り値型を **Map と誤認**（実際はフラット配列）、
query parser のフィールド名不一致、contract spec パスの不正確、という食い違いが発生した。

→ **対策**: 本 fields タスクでも Phase 1 段階で `listFieldsByResponseId` の現行シグネチャ・
返り値型（配列 / Map / null 許容）・引き当てキー（`current_response_id`）を
**実ファイルから verbatim 引用してから設計する**。SubAgent 要約に依存しない。
本指示書では §3.3 手順 1 に verbatim 確認結果を転記済み（返り値は `Promise<ResponseFieldRow[]>` のフラット配列）。

### F-2: groupBy のキー取り違え注意

tags は `member_id` でキー化したが、fields は **`current_response_id`（= `response_id`）** でキー化する。
member_id と response_id を混同すると引き当てが破綻する。

→ helper はフラット配列を返し、use-case 層で `response_id → fields[]` の Map に groupBy する設計に揃える。
受け入れ条件にもキー取り違え防止のチェック項目を含めた。

### F-3: 既存 batch パターンの再利用

- `apps/api/src/repository/responses.ts:56-67` の `listResponsesByIds`:
  `if (ids.length === 0) return []` → `placeholders(ids.length)` → `... IN (${ph})` → `.bind(...ids).all()`。
- `apps/api/src/repository/memberTags.ts:48-65` の `listTagsByMemberIds`:
  同形 + `ORDER BY` で groupBy 順序を安定化。
- issue #224 の `EXPAND_WHITELIST` 防御（未知値は黙って除外・常に配列を返す）。

→ これらを流用すると、フラット配列を Map と誤認する F-1 / F-2 の事故を構造的に予防できる。

---

## 6. 参照情報

### 関連ファイル

- `apps/api/src/use-cases/public/list-public-members.ts`（改修対象。fields ループは 96-121 行）
- `apps/api/src/repository/responseFields.ts`（batch helper 追加先。現行 `listFieldsByResponseId` は 17-28 行）
- `apps/api/src/repository/responses.ts`（batch パターン手本: `listResponsesByIds` 56-67 行）
- `apps/api/src/repository/memberTags.ts`（batch + groupBy 手本: `listTagsByMemberIds` 48-65 行）
- `apps/api/src/repository/_shared/sql.ts`（`placeholders`）

### システム仕様（aiworkflow-requirements）

- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる（この helper も apps/api 内）。
- 不変条件 #2 / #3 / #11: view converter で fail-close を維持する。
- batch helper 再利用パターン（フラット配列 → use-case 層 groupBy）は
  `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` に
  登録済みパターン。実装時に同 references を参照すること。

### 発見元

- issue #224 Phase 12 unassigned-task-detection の U-2
  （現行 list-public-members.ts の fields N+1・別系統・要対応候補）。

---

## 7. 備考

issue #224 は **tags** N+1 のみを受け入れ条件としており、fields は意図的にスコープ外とした
（use-case のコメント「batch 化は MVP 数百規模で許容範囲」が該当）。本タスクはその明示的な
積み残しを別 issue として formalize したものである。優先度は低く、公開一覧の表示遅延が
顕在化した時点で着手する。
