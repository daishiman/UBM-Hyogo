# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装 |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 4 (テスト作成) |
| 次 Phase | 6 (テスト拡充) |
| タスク種別 | implementation / NON_VISUAL / implementation_mode: new |

## 目的

Phase 4 で RED にしたテストを GREEN にするため、`listFieldsByResponseIds` の追加と
`list-public-members.ts` のループ置換を実装する。`byKey` 構築以降は不変とし、出力
`PublicMemberListResponse` の形状・値を維持する。

## 変更ファイル一覧（必須 / RT-03）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/repository/responseFields.ts` | 編集（関数追加 + import 追加） | `listFieldsByResponseIds` を追加。`import { placeholders } from "./_shared/sql";` |
| `apps/api/src/use-cases/public/list-public-members.ts` | 編集 | per-member fields ループ → ループ外 1 query + `response_id` キー Map groupBy |
| `apps/api/src/repository/__tests__/responseFields.repository.spec.ts` | 編集 | Phase 4 で追加した RED テスト（GREEN 化対象） |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 編集 | Phase 4 で追加した回帰テスト（GREEN 化対象） |

> 新規作成ファイルなし。`listFieldsByResponseId`（単数）は **削除しない**（後方互換 / 他 caller 温存）。

## 実装ランブック

### Step 1: repository helper 追加（`responseFields.ts`）

import 行に追加:

```ts
import { placeholders } from "./_shared/sql";
```

`listFieldsByResponseId`（単数）の直後に追加:

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

### Step 2: use-case のループ置換（`list-public-members.ts`）

import を変更:

```ts
import {
  listFieldsByResponseIds,
  type ResponseFieldRow,
} from "../../repository/responseFields";
```

`asResponseId` を `@ubm-hyogo/shared` の既存 import（`STABLE_KEY, asMemberId`）へ追加:

```ts
import { STABLE_KEY, asMemberId, asResponseId } from "@ubm-hyogo/shared";
```

L94-121（`const items ...` の per-member fields ループ）を以下へ置換:

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

## 責務境界（実装制約）

- repository（`responseFields.ts`）= D1 SELECT のみ。groupBy/組成を持ち込まない（不変条件 #5）。
- use-case（`list-public-members.ts`）= groupBy と組成のみ。view 変換は `toPublicMemberListView` に委譲（不変）。
- 既存の `parseJsonString` / `parseJsonNullable` / `SUMMARY_KEYS` / tags 合流は一切変更しない。

## 実行タスク

1. `responseFields.ts` に helper と import を追加する（完了条件: §Step 1 と一致 / typecheck 緑）。
2. `list-public-members.ts` の import を変更しループを置換する（完了条件: §Step 2 と一致）。
3. Phase 4 の RED テストを GREEN にする（完了条件: 対象 vitest 全 PASS）。
4. 単数 `listFieldsByResponseId` を削除していないことを確認する（完了条件: grep で残存確認）。
5. `apps/web` に差分が出ていないことを確認する（完了条件: `git diff --name-only` に apps/web を含まない）。

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/repository/__tests__/responseFields.repository.spec.ts \
  apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
grep -rn "listFieldsByResponseId\b" apps/api/src   # 単数 helper の残存確認
git diff --name-only | grep -c '^apps/web/'         # 期待値: 0
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | 置換差分の正本 |
| 必須 | apps/api/src/repository/memberTags.ts | `listTagsByMemberIds` 流用元 |
| 必須 | apps/api/src/repository/_shared/sql.ts | `placeholders` |
| 必須 | phase-04.md | GREEN 化対象テスト |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| コード | apps/api/src/repository/responseFields.ts | `listFieldsByResponseIds` 追加 |
| コード | apps/api/src/use-cases/public/list-public-members.ts | ループ → Map groupBy 置換 |
| ドキュメント | outputs/phase-05/main.md | 実装ランブックの実行記録 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | エッジケーステスト追加の前提（実装完了コード）を渡す |
| Phase 7 | 変更ブロックの coverage 測定対象を渡す |
| Phase 9 | QA チェック（apps/web 非接触 / 単数 helper 温存）の対象を渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] `listFieldsByResponseIds` が `responseFields.ts` に追加され typecheck が緑
- [ ] `list-public-members.ts` のループが Map groupBy（key=`response_id`）へ置換されている
- [ ] Phase 4 の対象 vitest が全 GREEN
- [ ] 単数 `listFieldsByResponseId` が削除されていない
- [ ] `apps/web` に差分がない
- [ ] 出力 `PublicMemberListResponse` の形状・値が不変

## タスク100%実行確認【必須】

- 全実行タスク（5 件）が完了
- 成果物（2 コードファイル + outputs/phase-05/main.md）が配置済み
- artifacts.json の `phases[4].status` が実装完了時に `completed` へ更新される

## 次 Phase への引き渡し

- 次 Phase: 6 (テスト拡充)
- 引き継ぎ事項: 実装済みコード / 検証コマンド結果 / 不変範囲
- ブロック条件: 対象 vitest が GREEN にならない / apps/web に差分が出る / 出力値が変化する
