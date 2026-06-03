# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| タスク種別 | implementation / NON_VISUAL |

## 目的

Phase 1 で固定した要件を、変更対象ファイル・関数シグネチャ・データ構造・置換差分の具体設計へ
落とす。既存 `listTagsByMemberIds` の batch パターンを再利用し、新規概念を増やさない方針を確定する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用対象 | 可否 | 理由 |
| --- | --- | --- |
| `listTagsByMemberIds`（memberTags.ts）のパターン | ✅ 流用 | IN 句 batch + フラット配列返却 + Map groupBy の同型。新規設計不要 |
| `placeholders(n)`（_shared/sql.ts） | ✅ 流用 | IN 句プレースホルダ生成の正本 |
| `asResponseId`（_shared/brand.ts → @ubm-hyogo/shared） | ✅ 流用 | `current_response_id` の brand 変換正本 |
| `ResponseFieldRow` 型 | ✅ 再利用 | `response_id` 列を含むため groupBy キーに使える |

## 設計1: repository helper の追加

### 変更対象ファイル

`apps/api/src/repository/responseFields.ts`（**edit / 関数追加**）

### 関数シグネチャ

```ts
/**
 * 複数 response_id のフィールドをバッチ取得する（N+1 防止）。
 * `listTagsByMemberIds` と同型: 空配列ガード → IN 句 1 query → フラット配列返却。
 */
export async function listFieldsByResponseIds(
  c: DbCtx,
  rids: ResponseId[],
): Promise<ResponseFieldRow[]> {
  if (rids.length === 0) return [];
  const ph = placeholders(rids.length);
  const result = await c.db
    .prepare(`SELECT * FROM response_fields WHERE response_id IN (${ph})`)
    .bind(...rids)
    .all<ResponseFieldRow>();
  return result.results;
}
```

### 入力・出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `rids: ResponseId[]`（呼び出し側で重複除去済みが望ましいが、SQL 上は重複しても結果不変） |
| 出力 | `ResponseFieldRow[]`（複数 response_id 分のフラット配列。順序は SQL 既定） |
| 副作用 | なし（read-only / SELECT のみ） |
| エラー | 空配列入力時は DB アクセスせず `[]` を返す（IN () の構文エラーを回避） |

### import 追加

`responseFields.ts` 冒頭に `import { placeholders } from "./_shared/sql";` を追加する
（`ResponseId` は既存 import 済み）。

## 設計2: use-case のループ置換

### 変更対象ファイル

`apps/api/src/use-cases/public/list-public-members.ts`（**edit**）

### import 変更

```ts
// before
import { listFieldsByResponseId } from "../../repository/responseFields";
// after
import { listFieldsByResponseIds } from "../../repository/responseFields";
import type { ResponseFieldRow } from "../../repository/responseFields";
```

`asResponseId` は `@ubm-hyogo/shared` から既存の `asMemberId` と同じ import 行に追加する。

### 置換差分（L94-121 を以下へ置換）

```ts
// fields を 1 batch query で取得し、response_id でキー化した Map に groupBy（tags と対称）。
// groupBy キーは fields=current_response_id(=response_id)。tags の member_id とは異なる（F-2）。
const responseIds = memberRows.map((m) => asResponseId(m.current_response_id));
const fieldRows = await listFieldsByResponseIds(ctx, responseIds); // 1 query・フラット配列
const fieldsByResponseId = new Map<string, ResponseFieldRow[]>();
for (const f of fieldRows) {
  const arr = fieldsByResponseId.get(f.response_id) ?? [];
  arr.push(f);
  fieldsByResponseId.set(f.response_id, arr);
}

const items: PublicMemberListItemSource[] = [];
for (const m of memberRows) {
  const fields = fieldsByResponseId.get(m.current_response_id) ?? [];
  const byKey = new Map<string, string | null>();
  for (const f of fields) {
    if ((SUMMARY_KEYS as readonly string[]).includes(f.stable_key)) {
      byKey.set(f.stable_key, f.value_json);
    }
  }
  items.push({
    memberId: m.member_id,
    fullName: parseJsonString(byKey.get(STABLE_KEY.fullName) ?? null),
    nickname: parseJsonString(byKey.get(STABLE_KEY.nickname) ?? null),
    occupation: parseJsonString(byKey.get(STABLE_KEY.occupation) ?? null),
    location: parseJsonString(byKey.get(STABLE_KEY.location) ?? null),
    ubmZone: parseJsonNullable(byKey.get(STABLE_KEY.ubmZone) ?? null),
    ubmMembershipType: parseJsonNullable(byKey.get(STABLE_KEY.ubmMembershipType) ?? null),
    ...(wantTags ? { tags: tagsByMember?.get(m.member_id) ?? [] } : {}),
  });
}
```

> **不変ポイント**: `byKey` 構築以降のロジック（`SUMMARY_KEYS` フィルタ・`parseJsonString` /
> `parseJsonNullable`・`items.push` の各フィールド・tags 合流）は **一切変更しない**。fetch 経路のみ
> ループ外の 1 query に変える。これにより `PublicMemberListResponse` の値が不変であることが保証される。

## データフロー（before / after）

| 項目 | before | after |
| --- | --- | --- |
| fields クエリ発行回数 | N（member 件数分） | 1（空配列時 0） |
| tags クエリ | 1（既 batch / 不変） | 1（不変） |
| 引き当てキー | per-member の直接取得 | `response_id` キー Map lookup |
| 出力形状 | `PublicMemberListResponse` | 同左（不変） |

## state 所有権 / 責務境界

- repository（`responseFields.ts`）= D1 SELECT のみ（read-only / 不変条件 #5）。
- use-case（`list-public-members.ts`）= 組成と groupBy のみ。view 変換は `toPublicMemberListView` に委譲（不変）。
- 新規 write 経路・新規 endpoint・schema 変更は発生しない。

## エッジケース

| ケース | 挙動 |
| --- | --- |
| `memberRows` 空 | `responseIds=[]` → helper が `[]` を返し DB 非アクセス。items も空 |
| ある member の fields が 0 件 | `fieldsByResponseId.get(...)` が undefined → `?? []` で空配列。byKey 空 → 既定値（空文字 / null）。before と同値 |
| `current_response_id` 重複（理論上は一意） | SQL 結果は重複 row を返さず、Map groupBy は同 key へ集約。引き当て不変 |

## 実行タスク

1. `listFieldsByResponseIds` のシグネチャ・SQL・空配列ガードを確定する（完了条件: §設計1 と一致）。
2. use-case の置換差分を確定し、`byKey` 以降の不変範囲を明示する（完了条件: §設計2 と一致）。
3. groupBy キー = `response_id` を設計に固定する（完了条件: F-2 が設計差分に反映）。
4. エッジケース（空 / fields 0 件 / 重複）の挙動を before と同値で定義する（完了条件: §エッジケース表）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/repository/memberTags.ts | `listTagsByMemberIds` 流用元 |
| 必須 | apps/api/src/repository/responseFields.ts | helper 追加先 |
| 必須 | apps/api/src/use-cases/public/list-public-members.ts | 置換対象 |
| 必須 | apps/api/src/repository/_shared/sql.ts | `placeholders` |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計主成果物（helper シグネチャ / 置換差分 / データフロー / エッジケース） |
| メタ | artifacts.json | Phase 2 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計の 4 条件再評価と GO/NO-GO 判定へ渡す |
| Phase 4 | helper シグネチャ・置換差分・エッジケースをテスト設計に渡す |
| Phase 5 | 置換差分を実装ランブックの正本に渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] `listFieldsByResponseIds` のシグネチャ・SQL・ガードが確定している
- [x] use-case 置換差分と不変範囲（byKey 以降）が明示されている
- [x] groupBy キー = `response_id`(=`current_response_id`) が設計に固定されている
- [x] エッジケース（空 / 0 件 / 重複）が before と同値で定義されている
- [x] 既存部品（`placeholders` / `asResponseId` / `ResponseFieldRow`）の再利用が確定している

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が completed
- 成果物が `outputs/phase-02/` 配下に配置済み
- artifacts.json の `phases[1].status` が completed

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項: helper シグネチャ / 置換差分 / エッジケース表 / 不変範囲
- ブロック条件: 置換差分が出力形状を変える設計になっている場合は NO-GO
