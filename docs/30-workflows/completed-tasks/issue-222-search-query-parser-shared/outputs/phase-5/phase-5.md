# Phase 5: 実装手順（概要）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> 本フェーズは spec ドキュメント。コード（apps/ / packages/ の .ts）は実装者が後続で着手する。

## 5.0 概要

公開検索 query 正規化の共通プリミティブを `packages/shared/src/public-search/` に新規 SSOT 化し（Lane A）、`apps/api`（Lane B）と `apps/web`（Lane C）をその import へ切替える。各 app の公開 contract は完全不変。

実装は 3 レーンに分割し、各 task ファイルに CONST_005 必須項目（変更対象・シグネチャ・I/O・テスト・コマンド・DoD）を完備する。

---

## 5.1 新規作成 / 修正ファイル一覧（Feedback RT-03 必須）

| パス | 変更種別 | レーン | 内容 |
| --- | --- | --- | --- |
| `packages/shared/src/public-search/search-query-primitives.ts` | **新規** | A | 値集合 tuple / zod enum / 制限値 / 正規化純関数の SSOT（SSOT §3.1） |
| `packages/shared/src/public-search/index.ts` | **新規** | A | barrel（`export * from "./search-query-primitives"`。SSOT §3.2） |
| `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` | **新規** | A | SP-01〜SP-12（Phase 4 で定義。本体完成で GREEN） |
| `packages/shared/package.json` | **編集** | A | `exports` に `"./public-search": "./src/public-search/index.ts"` 追加（SSOT §3.3） |
| `apps/api/src/_shared/search-query-parser.ts` | **編集** | B | ローカル値集合・制限・正規化を shared import へ置換。`SortZ`/`DensityZ` は re-export で維持（SSOT §3.4） |
| `apps/web/src/lib/url/members-search.ts` | **編集** | C | ローカル値集合・制限を shared import へ置換。`transform` を shared 関数呼び出しへ（SSOT §3.5） |

> **既存だが本タスクでは無変更（編集禁止）のファイル**:
> - `apps/api/src/_shared/__tests__/search-query-parser.spec.ts`（回帰）
> - `apps/web/src/lib/url/__tests__/members-search.spec.ts`（回帰）
> - `packages/shared/src/index.ts`（root barrel。FB-W0-01 で非接触）

---

## 5.2 実装順序（A → B/C）

```
Lane A（shared SSOT 新規）
  └─ search-query-primitives.ts + index.ts + package.json exports + spec
        │ A 完成が B/C の前提（import 先が存在しないと typecheck 不能）
        ▼
Lane B（apps/api 切替）    Lane C（apps/web 切替）
  ├─ B と C は A 完成後は相互独立（並列可）
  └─ 各レーンとも既存 spec を無変更で回帰緑にする
```

1. **Lane A 先行（必須）**: `search-query-primitives.ts` / `index.ts` / `package.json` exports を実装 → shared typecheck + 新規 spec（SP-01〜SP-12）を GREEN にする。
2. **Lane B / Lane C（A 完成後は並列可）**: それぞれ shared import へ置換し、各 app の typecheck と既存 spec 回帰を緑にする。

> B と C は import 元（shared）が同一だが互いに依存しない。ただし A が未完成だと両方 typecheck エラーになるため、A → (B, C) の依存順は厳守。

---

## 5.3 各 task ファイルへのリンク

| Lane | task ファイル | 主担当 |
| --- | --- | --- |
| A | [`task-01-shared-primitives-and-exports.md`](./task-01-shared-primitives-and-exports.md) | shared SSOT 新規作成 + exports |
| B | [`task-02-apps-api-rewire.md`](./task-02-apps-api-rewire.md) | apps/api 切替（動作不変・後方互換 re-export） |
| C | [`task-03-apps-web-rewire.md`](./task-03-apps-web-rewire.md) | apps/web 切替（動作不変・公開 API 不変） |

---

## 5.4 共通検証コマンド（SSOT §5.3）

```bash
# shared 新規テスト
mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts
# apps/api 回帰
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
# apps/web 回帰
mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts
# 型・lint
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
# 重複定義消滅確認（AC-7）
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts apps/web/src/lib/url/members-search.ts
```

---

## 5.5 完了条件（Phase 5 DoD）

- [ ] 新規 3 ファイル（primitives / barrel / spec）が存在し shared typecheck が通る（SSOT §6 DoD 1）。
- [ ] `packages/shared/package.json` の `exports` に `./public-search` がある（DoD 2）。
- [ ] api / web 両方が shared import に切替わり、ローカル重複定義が消えている（DoD 3 / AC-7）。
- [ ] 既存 2 spec が無変更で pass（DoD 4 / AC-2 / AC-6）。
- [ ] shared 新規 spec（SP-01〜SP-12）が pass（DoD 5 / AC-4）。
- [ ] api / web / shared typecheck と root lint が緑（DoD 6）。
- [ ] `parsePublicMemberQuery` / `parseSearchParams` / `toApiQuery` の挙動が変更前と完全一致（DoD 7）。
- [ ] D1 schema / API endpoint / Google Form に変更がない（DoD 8）。
