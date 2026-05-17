# Phase 3: 詳細設計（error class 統合 API + 変更マップ）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 目的 | Phase 4-10 がそのまま実装着手できる粒度で、変更対象ファイル・関数シグネチャ・型遷移を俯瞰する |
| 入力 | Phase 1 AC-1..AC-7, Phase 2 内部 DAG |
| 出力 | 変更ファイルマップ、関数シグネチャ表、type migration 表、挙動マトリクス |

## 目的

`AdminMutationHttpError` を `AuthRequiredError` / `FetchAuthedError` に統合する際の
**API surface（公開）/ 内部実装 / test の 3 層**それぞれで、何を変えて何を変えないかを
ファイル単位 + 行範囲レベルで固定する。Phase 4 (impl) / Phase 5 (test) / Phase 6 (export) が
そのまま着手できる粒度。

## 実行タスク

1. 変更対象 3 ファイルそれぞれの変更種別と理由を表で固定
2. 関数シグネチャ表（不変 / 変更）を確定
3. type migration（旧 class → 新 class）の影響範囲をケース別に俯瞰
4. 挙動マトリクス（401 / 403 / 5xx）を spec.md L102-106 から写経して確定

## 参照資料

- spec.md L31-89（変更対象 / 設計 1-4 / 破壊回避）
- Phase 2 内部 DAG
- `apps/web/src/lib/fetch/authed.ts`（`AuthRequiredError` / `FetchAuthedError` 正本）

## 実行手順

1. 各変更ファイルの diff スコープを「追加 / 削除 / 置換」で分類
2. 関数シグネチャ不変条件（`useAdminMutation` の return type）を明示
3. type migration 表を「ケース × 旧型 × 新型 × 観測動作」で固定
4. Phase 4 が直接着手できるよう「変更前 → 変更後」の最小 diff サンプルを引用

## 統合テスト連携

- focused test: `useAdminMutation.spec.ts` の 401 / 403 ケースが新 class で assertion 通過
- 隣接 regression: `authed.spec.ts` は変更なしで PASS 維持
- admin mutation 経由 redirect は本仕様書内で optional `redirector` / `currentPath` DI により unit test する

## 多角的チェック観点

- 公開型不変: `AdminMutationResult.error: Error | null` を維持するか
- 型 narrowing: `e instanceof FetchAuthedError` 後に `e.status` 参照可能か（class 側で `status` public フィールドが必要）
- import 削減: 旧 class への import / re-export がコードベースに残存しないか（V-5 grep ゼロ件）
- 命名整合: hook の error 命名が `@/lib/fetch/authed` の 2 class 名と一致しているか

## サブタスク管理

| ID | 内容 | 状態 |
| --- | --- | --- |
| 3-1 | 変更対象ファイルマップ | done |
| 3-2 | 関数シグネチャ表 | done |
| 3-3 | type migration 表 | done |
| 3-4 | 挙動マトリクス | done |

## 成果物

### 変更対象ファイルマップ

| Path | 種別 | 変更内容（概要） | 影響先 AC |
| --- | --- | --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | modify | (a) `import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed"` 追加 / (b) `AdminMutationHttpError` class 定義（L58 周辺）削除 / (c) 401 throw（L106 周辺）を `AuthRequiredError` 化 / (d) 非 2xx throw（L109 周辺）を `FetchAuthedError` 化 / (e) instanceof 判定（L144, L148）を新 class 化 | AC-2..AC-5 |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | modify | (a) `AdminMutationHttpError` の import 削除、`AuthRequiredError` / `FetchAuthedError` の import 追加 / (b) 401 assertion を `toBeInstanceOf(AuthRequiredError)` に切替 / (c) 403/5xx assertion を `toBeInstanceOf(FetchAuthedError)` + `.status` 検証に切替 | AC-6 |
| `apps/web/src/features/admin/hooks/index.ts` | modify | `AdminMutationHttpError` の re-export 行を削除（採用方針: 完全削除。`@deprecated` alias は採用しない） | AC-7 |

### 変更しないファイル（明示）

| Path | 理由 |
| --- | --- |
| `apps/web/src/lib/fetch/authed.ts` | `AuthRequiredError` / `FetchAuthedError` の signature を変更しない（spec L91-93） |
| `apps/web/src/lib/fetch/authed.spec.ts` | regression none（V-4 で PASS 確認のみ） |
| `apps/api/**` | API endpoint 側 response 不変 |
| D1 migrations / schema | UI 層のみの変更 |

### 関数 / 型シグネチャ

#### 不変（公開 API）

```ts
// apps/web/src/features/admin/hooks/useAdminMutation.ts
export type AdminMutationResult<TData> = {
  data: TData | null;
  error: Error | null;       // ← 外形不変（AC-1）
  isPending: boolean;
  // ...（他フィールド維持）
};

export function useAdminMutation<TInput, TData>(
  /* args 不変 */
): AdminMutationResult<TData>;
```

#### 変更（内部 throw / instanceof）

```ts
// Before（L106-110, L144, L148 相当）
if (res.status === 401) throw new AdminMutationHttpError(401, "");
if (!res.ok) throw new AdminMutationHttpError(res.status, text);
// catch
if (e instanceof AdminMutationHttpError && e.status === 401) { /* ... */ }
if (e instanceof AdminMutationHttpError && e.status === 403) { /* ... */ }

// After
import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";

if (res.status === 401) throw new AuthRequiredError();
if (!res.ok) throw new FetchAuthedError(res.status, text);
// catch
if (e instanceof AuthRequiredError) { /* ... */ }
if (e instanceof FetchAuthedError && e.status === 403) { /* ... */ }
```

### type migration 影響マトリクス

| ケース | 旧 throw 型 | 新 throw 型 | 旧 catch | 新 catch | 観測動作（変化の有無） |
| --- | --- | --- | --- | --- | --- |
| 401 | `AdminMutationHttpError(401, "")` | `AuthRequiredError` | hook 内 401 分岐 | hook 内 `AuthRequiredError` 分岐 + `toLoginRedirect(currentPath)` | **interop 改善**: `/login?redirect=...` が発火可能に |
| 403 | `AdminMutationHttpError(403, body)` | `FetchAuthedError(403, body)` | hook 内 403 分岐 | hook 内 `FetchAuthedError && status===403` 分岐 | 変化なし（toast 表示維持） |
| 5xx | `AdminMutationHttpError(5xx, body)` | `FetchAuthedError(5xx, body)` | ErrorBoundary 経由 | ErrorBoundary 経由 | 変化なし |
| 2xx | （throw なし） | （throw なし） | n/a | n/a | 変化なし |

### 破壊回避方針

spec.md L80-89 の選択肢のうち **「完全削除」を採用**。
理由: `rg "AdminMutationHttpError" apps/web/src` 結果が hook 本体 + `useAdminMutation.spec.ts` の 2 箇所のみで、
`hooks/index.ts` 経由の外部利用はゼロ件確認済（Phase 1 サブタスク 1-3 で再確認）。
`@deprecated` alias は混乱回避のため採用しない。

### 後続 Phase 着手用 minimal diff サンプル

Phase 4 が編集着手する際のテンプレ:

```diff
-// AdminMutationHttpError class 定義（旧 L58 付近）
-export class AdminMutationHttpError extends Error {
-  constructor(public status: number, public bodyText: string) { super(`HTTP ${status}`); }
-}
+import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";

 // ...
-      if (res.status === 401) throw new AdminMutationHttpError(401, "");
-      if (!res.ok) throw new AdminMutationHttpError(res.status, text);
+      if (res.status === 401) throw new AuthRequiredError();
+      if (!res.ok) throw new FetchAuthedError(res.status, text);
 // ...
-      if (e instanceof AdminMutationHttpError && e.status === 401) { /* ... */ }
-      if (e instanceof AdminMutationHttpError && e.status === 403) { /* ... */ }
+      if (e instanceof AuthRequiredError) { /* ... */ }
+      if (e instanceof FetchAuthedError && e.status === 403) { /* ... */ }
```

## 完了条件

- 変更対象 3 ファイルそれぞれに「種別 / 変更内容 / 対応 AC」が明記されている
- 関数シグネチャの不変条件と変更箇所が分離して記述されている
- type migration マトリクスが 401/403/5xx/2xx の 4 ケースを網羅
- Phase 4 着手用の minimal diff サンプルが提示されている

## タスク100%実行確認【必須】

- [x] 変更ファイルマップ完成（3 ファイル × 種別 × AC 対応）
- [x] 関数シグネチャ不変 / 変更の分離記述
- [x] type migration マトリクス 4 ケース網羅
- [x] minimal diff サンプル提示

## 次Phase

Phase 4: 実装（`useAdminMutation.ts` の throw / instanceof / class 定義削除）。本 Phase の
「変更対象ファイルマップ」と「minimal diff サンプル」を直接の作業指示として消費する。
