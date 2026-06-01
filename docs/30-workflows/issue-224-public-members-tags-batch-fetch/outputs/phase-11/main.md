# Phase 11 主証跡（NON_VISUAL / 実測証跡）

## 結論

本タスクは **NON_VISUAL（API 層のみ・UI 変更なし）** のためスクリーンショットは取得しない。
主証跡は **自動テスト** とし、実装済みコードに対するローカル実測を本ファイルへ記録する。

## スクリーンショット不要の理由

- 変更は HTTP JSON 応答の shape（`tags` の有無）と D1 query 回数にのみ及ぶ。
- 画面描画・レイアウト・配色に影響しない（`apps/web` 非対象）。
- よって視覚回帰の観点が存在せず、視覚証跡を取得する意味がない。

## 証跡の主ソース（自動テスト）

| ソース             | パス                                                                  | 役割                                       |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------ |
| contract spec      | `apps/api/src/routes/public/index.contract.spec.ts`                   | エンドポイント応答 shape / visibility 整合 |
| use-case unit test | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | query 回数（N+1 検知）/ groupBy 引き当て   |
| D1 mock helper     | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts`        | `member_id IN` batch の fixture / spy 基盤 |

## テストケース計画（TC 一覧）

> 件数は実装後の実テストと対応付けて確認済み。

### contract spec（`index.contract.spec.ts`）

| TC ID    | 内容                                                                                | 対応 AC |
| -------- | ----------------------------------------------------------------------------------- | ------- |
| TC-C-01  | `GET /public/members?expand=tags` で各 item に `tags`（code/label/category）が含まれる | AC-1    |
| TC-C-02  | `GET /public/members`（expand 未指定）で item に `tags` キーが存在しない             | AC-3    |
| TC-C-03  | `appliedQuery` に `expand` が含まれない（既存 `.strict()` 6 キー固定の回帰維持）     | AC-3    |
| TC-C-04  | 非公開 member（consent 未同意 / publish_state≠public / is_deleted=1 / alias）が結果・tags に出ない | AC-4    |
| TC-C-05  | `expand=tags,unknown&expand=tags` を route 境界で正規化し、未知値を黙って除外する | AC-1 / AC-3 |

### use-case unit test（`list-public-members.spec.ts`）

| TC ID    | 内容                                                                                       | 対応 AC |
| -------- | ------------------------------------------------------------------------------------------ | ------- |
| TC-U-01  | `expand=["tags"]` で member 件数を増やしても tags batch query（`member_tags ... member_id IN`）が **1 回固定** | AC-2 / AC-5 |
| TC-U-02  | `expand=[]` のとき tags batch query が **0 回**                                             | AC-3    |
| TC-U-03  | helper のフラット配列を memberId で groupBy し、複数 member × 複数 tag が正しく引き当たる    | AC-1    |
| TC-U-04  | tags を持たない member は `tags: []`（expand=tags 時）                                       | AC-1    |
| TC-U-05  | N+1 リグレッション検知: tags batch query が件数比例に戻ると fail する assert を持つ          | AC-5    |

> 実装件数: contract 4 + use-case 5 + parser 3 + repository/shared zod 2 = **14 TC**。
> N+1 検知は tags batch query のみを計数し、fields N+1（別 issue・スコープ外）は assert に含めない。

## 取得タイミングと更新方針

- 現状: `implemented_local_evidence_captured`。実コード変更済（`git diff --stat apps/ packages/` で apps/packages 実差分あり）。
- 実テスト実行結果を以下に記録する。

## 実テスト実行結果（2026-05-31 取得）

実装後に下記コマンドを実行した結果（全 green）。

```bash
pnpm --filter @ubm-hyogo/api test -- apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts apps/api/src/routes/public/index.contract.spec.ts
pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/public/index.contract.spec.ts
pnpm --filter @ubm-hyogo/shared test -- packages/shared/src/zod/viewmodel.spec.ts
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/shared typecheck
```

| コマンド | 結果 |
| --- | --- |
| `@ubm-hyogo/api` focused command | 実行済み。設定上 API suite も含まれ **Test Files 75 passed / Tests 473 passed**（0 failed） |
| D1 contract focused command | **Test Files 1 passed / Tests 13 passed** |
| `@ubm-hyogo/shared` focused command | 実行済み。設定上 shared suite も含まれ **Test Files 20 passed / Tests 236 passed** |
| `@ubm-hyogo/api typecheck` | exit 0 |
| `@ubm-hyogo/shared typecheck` | exit 0 |

### 本 issue の追加 TC（実体）

use-case unit（`list-public-members.spec.ts`）に追加した 5 件:

| 実 TC 名 | 対応 AC |
| --- | --- |
| `attaches tags to each member when expand includes 'tags'` | AC-1 |
| `groups tags by member_id without cross-contamination` | AC-1 |
| `calls listTagsByMemberIds exactly once with all member ids (no N+1)` | AC-2 / AC-5 |
| `does not fetch tags when expand is omitted` | AC-3 |
| `does not call listTagsByMemberIds when there are no members` | AC-2 |

contract（`index.contract.spec.ts`）に追加した 4 件:

| 実 TC 名 | 対応 AC |
| --- | --- |
| `GET /members?expand=tags は公開 member の tags(code/label/category) を返す` | AC-1 / AC-4 |
| `GET /members?expand=tags でも appliedQuery は 6 キー固定（expand を出さない）` | AC-3 |
| `GET /members は expand 未指定なら tags key を出さない` | AC-3 |
| `GET /members normalizes comma and repeated expand values at the route boundary` | AC-1 / AC-3 |

parser（`search-query-parser.spec.ts`）に追加した 3 件（既存 `preserves valid input` の `expand: []` 追従含む）:

| 実 TC 名 | 役割 |
| --- | --- |
| `parses expand=tags into ['tags']` | whitelist パース |
| `accepts comma-separated and repeated expand, dedups, drops unknown values` | 防御的正規化 |
| `defaults expand to [] when omitted` | 後方互換 |

> N+1 検知の第一証跡は `vi.spyOn(memberTagsModule, "listTagsByMemberIds")` の呼び出し回数。
> `expand=tags` で件数を増やしても 1 回固定（TC-3）、`expand` 未指定で 0 回（TC-4）を機械的に検証する。

repository / shared zod に追加した hardening:

| 実 TC 名 | 役割 |
| --- | --- |
| `batch SQL orders public tag responses deterministically` | `listTagsByMemberIds` の公開 tag 順序を SQL で固定 |
| `PublicMemberListView accepts optional item tags and rejects leaked tag fields` | tag nested extra field を fail-close |
