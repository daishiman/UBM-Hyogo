# parallel-i02b-admin-mutation-error-finalize: AdminMutationError クラスの完全削除と panel 統合

**[実装区分: 実装仕様書]** — コード変更を伴う（mechanical class 名置換 + 1 class 定義削除）

## 判定根拠（実装区分）

実コード grep / file read（2026-05-22 検証）で以下を確認:

- `apps/web/src/features/admin/hooks/useAdminMutation.ts:28-36` で `AdminMutationError` クラスが**現在も export 定義**されている
- `apps/web/src/components/admin/MeetingPanel.tsx:18,45-56,164,165` で import / local helper `unwrapAdminResult` 内 throw / instanceof 判定
- `apps/web/src/components/admin/SchemaDiffPanel.tsx:26,122,203,210` で import / throw / instanceof 判定
- `apps/web/src/components/admin/RequestQueuePanel.tsx:11,68,130` で import / throw / instanceof 判定

`parallel-i02-admin-error-type-unify/spec.md` の DoD 143（`AdminMutationError` クラスの削除）が未達。i02 の hook 内部 401/403 path は migration 済み（`useAdminMutation.ts:107-112` で `AuthRequiredError` / `FetchAuthedError` を throw）だが、panel 層の error class 統合が**完了していない**。本仕様書はその残作業を closing する。

## 目的

`apps/web/src/features/admin/hooks/useAdminMutation.ts` から `AdminMutationError` クラス定義と export を完全に削除し、3 つの consumer panel（および MeetingPanel 内 local helper `unwrapAdminResult`）を `FetchAuthedError`（`apps/web/src/lib/fetch/errors.ts`）に統合する。これにより admin mutation 層で error class が単一系統に揃い、i02 spec の DoD を完全に満たす。

## スコープ

### 含む

- `useAdminMutation.ts` から `AdminMutationError` クラス定義の削除
- `MeetingPanel.tsx`（**local helper `unwrapAdminResult` 内の throw を含む**）/ `SchemaDiffPanel.tsx` / `RequestQueuePanel.tsx` を `FetchAuthedError` に migration
- import 文の置換（`AdminMutationError` → `FetchAuthedError`）
- 既存テストの回帰確認（assertion 修正は基本不要 — toast メッセージで検証する設計のため）

### 含まない

- `FetchAuthedError` / `AuthRequiredError` の signature 変更（`apps/web/src/lib/fetch/errors.ts` は read-only）
- 新しい error class の追加
- `AdminMutationResult` / `AdminMutationOk` / `AdminMutationErr` 型（`apps/web/src/lib/admin/api.ts`）の変更（これらは `Admin*` 命名だが `AdminMutationError` クラスとは別概念で、削除対象ではない）
- API endpoint 側の error response 変更
- `unwrapAdminResult` を panel 外（共有 utility）に切り出すリファクタリング
- i02 spec で既に migration 済みの `useAdminMutation` hook 内部 401/403 path の再変更

## 変更対象ファイル

| Path | 種別 | 変更箇所 | 理由 |
|------|------|---------|------|
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | modify | line 28-36（class 定義） | `AdminMutationError` クラス削除 |
| `apps/web/src/components/admin/MeetingPanel.tsx` | modify | line 18（import）/ line 54（throw in `unwrapAdminResult`）/ line 164-165（instanceof） | `FetchAuthedError` へ置換 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | modify | line 26（import）/ line 122（throw）/ line 203, 210（instanceof） | 同上 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | modify | line 11（import）/ line 68（throw）/ line 130（instanceof） | 同上 |
| `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` | verify only | — | `AdminMutationError` 直接参照なし（grep 確認済）/ toast 文言で assert している設計のため回帰確認のみ |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | verify only | — | 同上 |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | verify only | — | 同上 |

## 設計

### 1. 既存 throw / catch ロジックの型情報

`apps/web/src/lib/admin/api.ts:11-22` で以下が定義済み:

```ts
export interface AdminMutationOk<T> { ok: true; status: number; data: T; }
export interface AdminMutationErr  { ok: false; status: number; error: string; data?: unknown; }
export type AdminMutationResult<T> = AdminMutationOk<T> | AdminMutationErr;
```

→ **`r.error` は `string` 非 nullable**。defensive な `?? ""` は不要。

`FetchAuthedError` シグネチャ（`apps/web/src/lib/fetch/errors.ts:8-16`）:

```ts
export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  constructor(status: number, bodyText: string);
}
```

→ `AdminMutationError(status, message)` と引数順は等価。ただし `FetchAuthedError.message` は固定文言で、API error body は `bodyText` に保持されるため、ユーザー向け fallback 表示は `bodyText` を読む。

### 2. `useAdminMutation.ts` の class 定義削除

**Before** (line 28-36):
```ts
export class AdminMutationError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminMutationError";
    this.status = status;
  }
}
```

**After**: 該当ブロック全体（line 28-36）を削除。前後の `export { FetchAuthedError };`（line 26）と `const extractErrorMessage`（line 38）が直接隣接する形になる。

`apps/web/src/features/admin/hooks/index.ts` は既に `FetchAuthedError` のみを re-export 済み（`AdminMutationError` は元から非 export）→ index.ts は変更不要。

### 3. `MeetingPanel.tsx` の置換

#### 3-1. import (line 18)

**Before**:
```ts
import { AdminMutationError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
```

**After**:
```ts
import { FetchAuthedError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
```

`useAdminMutation.ts:26` で `export { FetchAuthedError }` 済みのため import path はそのまま流用可能。

#### 3-2. local helper `unwrapAdminResult` (line 45-56)

**Before** (line 54):
```ts
const unwrapAdminResult = async <T,>(result: Promise<{
  ok: true;
  data: unknown;
} | {
  ok: false;
  status: number;
  error: string;
}>): Promise<T> => {
  const r = await result;
  if (!r.ok) throw new AdminMutationError(r.status, r.error);
  return r.data as T;
};
```

**After**: throw 行のみ置換（`r.error` は string 非 null のため defensive 不要）:
```ts
  if (!r.ok) throw new FetchAuthedError(r.status, r.error);
```

#### 3-3. instanceof 判定 (line 164-165)

**Before**:
```ts
if (e instanceof AdminMutationError && e.status === 422) setToast("削除済み会員は登録できません");
else if (e instanceof AdminMutationError && e.status === 409) setToast("この会員は既に出席登録されています");
```

**After**: クラス名のみ置換:
```ts
if (e instanceof FetchAuthedError && e.status === 422) setToast("削除済み会員は登録できません");
else if (e instanceof FetchAuthedError && e.status === 409) setToast("この会員は既に出席登録されています");
```

### 4. `SchemaDiffPanel.tsx` の置換

| Line | Before | After |
|------|--------|-------|
| 26 | `import { AdminMutationError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";` | `import { FetchAuthedError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";` |
| 122 | `throw new AdminMutationError(r.status, message);` | `throw new FetchAuthedError(r.status, message);` |
| 203 | `if (e instanceof AdminMutationError && e.status === 422) {` | `if (e instanceof FetchAuthedError && e.status === 422) {` |
| 210 | `if (e instanceof AdminMutationError && e.status === 409) {` | `if (e instanceof FetchAuthedError && e.status === 409) {` |

### 5. `RequestQueuePanel.tsx` の置換

| Line | Before | After |
|------|--------|-------|
| 11 | `import { AdminMutationError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";` | `import { FetchAuthedError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";` |
| 68 | `if (!r.ok) throw new AdminMutationError(r.status, r.error);` | `if (!r.ok) throw new FetchAuthedError(r.status, r.error);` |
| 130 | `if (e instanceof AdminMutationError && e.status === 409) {` | `if (e instanceof FetchAuthedError && e.status === 409) {` |

### 6. 実装順序（重要）

**hook 側 class 削除を最後に行う**こと。順序を守らないと panel が import error で一時的に壊れる:

1. `MeetingPanel.tsx` を `FetchAuthedError` に置換（import + helper + instanceof）
2. `SchemaDiffPanel.tsx` を `FetchAuthedError` に置換
3. `RequestQueuePanel.tsx` を `FetchAuthedError` に置換
4. `mise exec -- pnpm typecheck` で 3 panel が `FetchAuthedError` で型チェック通ることを確認
5. `useAdminMutation.ts:28-36` の `AdminMutationError` class 定義を削除
6. `mise exec -- pnpm typecheck` で全体が通ることを確認
7. `grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx'` が **0 件**を返すことを確認

## 関数シグネチャ

公開 API シグネチャに変更なし。`useAdminMutation` の `UseAdminMutationReturn<T>.error` は `Error | null` のまま、panel の onError は `(error: Error) => void` のまま。内部実装で投げられる具象クラスのみが `AdminMutationError` → `FetchAuthedError` に変わる。

## 入出力・副作用

| ケース | 旧 throw | 新 throw | 観測される動作 | 検証 test |
|--------|---------|---------|--------------|-----------|
| Meeting addAttendance 422 | `AdminMutationError(422, "deleted")` | `FetchAuthedError(422, "deleted")` | `setToast("削除済み会員は登録できません")` 発火 | `MeetingPanel.component.spec.tsx:185-200` |
| Meeting addAttendance 409 | `AdminMutationError(409, "conflict")` | `FetchAuthedError(409, "conflict")` | `setToast("この会員は既に出席登録されています")` 発火 | `MeetingPanel.component.spec.tsx:202-217` |
| Meeting addAttendance 500 | `AdminMutationError(500, "boom")` | `FetchAuthedError(500, "boom")` | hook 内 generic toast（変更なし） | `MeetingPanel.component.spec.tsx:219-` |
| Schema alias 422 | `AdminMutationError(422, ...)` | `FetchAuthedError(422, ...)` | `data-feedback-kind="validation_error"` alert | `SchemaDiffPanel.component.spec.tsx:201-235` |
| Schema alias 409 | `AdminMutationError(409, ...)` | `FetchAuthedError(409, ...)` | `data-feedback-kind="conflict_error"` alert | `SchemaDiffPanel.component.spec.tsx:236-266` |
| Request resolve 409 | `AdminMutationError(409, "already_resolved")` | `FetchAuthedError(409, "already_resolved")` | 他 admin 処理済 toast | `RequestQueuePanel.component.spec.tsx:82-` |

副作用上の変化: **なし**（クラス名と `bodyText` field 名のみ変更。既存 UI fallback は `FetchAuthedError.bodyText` を読むことで維持）。

## テスト方針

### 既存テストの回帰確認

grep 結果より、3 panel の component spec は `AdminMutationError` を**直接 import / assert していない**。toast メッセージ・`role="status"` テキスト・`data-feedback-kind` 属性で UI を検証する設計のため、内部 throw クラス変更は test に影響しない。

回帰確認対象（既存 test ファイル）:

| Spec | 対象テストケース数（error path） |
|------|--------------------------------|
| `MeetingPanel.component.spec.tsx` | 422/409/500 で 3 ケース以上 |
| `SchemaDiffPanel.component.spec.tsx` | 403/422/409/UI-02..UI-06 |
| `RequestQueuePanel.component.spec.tsx` | TC-25 (409) |
| `useAdminMutation.spec.ts`（既存・i02 で更新済） | `FetchAuthedError` / `AuthRequiredError` assert |

### 追加テスト

新規 spec ファイルは作成しない。既存 panel spec が toast / alert UI で検証している前提を維持し、内部実装変更で回帰しないことを既存 test で担保する。

### Codex 委譲

既存コード参照・grep 確認のために Codex に委譲してよい。**実装そのものは委譲しない**（本仕様書は spec 作成までが責務）。

## ローカル実行・検証コマンド

```bash
# 0. 事前 baseline
grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx' | wc -l   # → 11 を期待（hook 2 + Meeting 4 + Schema 4 + Request 3 = 11、name=""AdminMutationError"" の line 33 含む）

# 1-3. panel 3 ファイルを置換（実装順序 §6 の 1-3）

# 4. panel 修正後 typecheck
mise exec -- pnpm typecheck

# 5. hook の class 定義削除（実装順序 §6 の 5）

# 6-7. 最終確認
mise exec -- pnpm typecheck
mise exec -- pnpm lint
grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx'   # → 0 件であること

# 8. 影響範囲のテスト
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run "(MeetingPanel|SchemaDiffPanel|RequestQueuePanel|useAdminMutation)"
```

## DoD（Definition of Done）

- [x] `apps/web/src/features/admin/hooks/useAdminMutation.ts:28-36` の `AdminMutationError` class 定義が削除されている
- [x] `apps/web/src/components/admin/MeetingPanel.tsx` の 4 箇所（line 18, 54, 164, 165）が `FetchAuthedError` に置換されている
- [x] `apps/web/src/components/admin/SchemaDiffPanel.tsx` の 4 箇所（line 26, 122, 203, 210）が `FetchAuthedError` に置換されている
- [x] `apps/web/src/components/admin/RequestQueuePanel.tsx` の 3 箇所（line 11, 68, 130）が `FetchAuthedError` に置換されている
- [x] `grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx'` が **0 件**を返す
- [x] `mise exec -- pnpm typecheck` が PASS
- [x] `mise exec -- pnpm lint` が PASS
- [x] `MeetingPanel` / `SchemaDiffPanel` / `RequestQueuePanel` / `useAdminMutation` の既存 spec が回帰なく PASS
- [x] `integration-fixes/index.md` の検出表 / 残タスク追跡表で i02b を `completed locally` に更新、i02 状態を `completed locally`（DoD 143 達成）に更新

## リスク

| リスク | 確度 | 対策 |
|--------|------|------|
| panel 内 fallback が `FetchAuthedError.message` 固定文言を表示する | 解消済み | `MeetingPanel` / `SchemaDiffPanel` の fallback 表示を `FetchAuthedError.bodyText` に補正済み |
| 実装順序を誤り hook を先に削除して panel が import error | 中（順序ミス時のみ） | §6 の順序を厳守。panel 3 件移行後の typecheck を gate にする |
| `MeetingPanel.tsx` 内 local `unwrapAdminResult` の throw を見落とす | 中（spec 化前は実際に未指摘） | §3-2 で明示。grep `grep -n "AdminMutationError" apps/web/src/components/admin/MeetingPanel.tsx` で 4 箇所すべて検出可能 |
| `FetchAuthedError.message` が `"fetchAuthed failed: {status}"` 固定となり、ユーザー向け fallback 表示が劣化 | 解消済み | panel の fallback 表示は `FetchAuthedError.bodyText` を読むよう補正済み |
| 他 worktree で `AdminMutationError` を新規に使う branch が存在 | 低（solo 開発） | merge 時に再 grep し残存があれば同パターンで再置換 |

## 並列性

- 独立: i01 / i03 / i04 / i05 / i06 / i07 と編集対象重複なし（hook 1 ファイル + panel 3 ファイルのみ）
- 依存: i02（hook 内部 401/403 migration）が完了済みであることが前提（実コード確認済 — `useAdminMutation.ts:107-112` で `AuthRequiredError` / `FetchAuthedError` を throw）
- 本タスクは単独 spec で完結し、他 active spec との作業競合なし

## 単一実装サイクル完了の根拠（CONST_007 準拠）

- 編集対象 4 ファイル、置換箇所合計 12 箇所（hook 1 削除 + panel 11 置換）、すべて mechanical
- 新規 test 追加不要、既存 test の assertion 修正不要（toast 文言で検証する設計のため）
- 外部依存・合意未済の仕様分岐なし
- 「将来 PR」「バックログ送り」要素なし — i02 spec の完全 closeout として本サイクル内で完了する

## スコープ確定ノート

- **status**: completed
- **canonical_workflow**: `docs/30-workflows/completed-tasks/parallel-i02b-admin-mutation-error-finalize/`
- **判断**: 4 ファイルの class 統一 + 1 class 定義削除に加え、`FetchAuthedError.bodyText` fallback を補正して既存 UI 表示を維持した。
- **i02 への接続**: 本 spec の PASS により `parallel-i02-admin-error-type-unify/spec.md` の DoD 143 / 147 / 148 / 149 は達成され、i02 全体が `completed locally` 状態に到達した。

## 参照

- 上位: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`
- 関連 spec: `../parallel-i02-admin-error-type-unify/spec.md`（本 spec の前提）
- 共有 error class: `apps/web/src/lib/fetch/errors.ts:1-17`
- 型定義: `apps/web/src/lib/admin/api.ts:11-22`（`AdminMutationResult` — 本 spec で**削除しない**型）
- 検証日: 2026-05-22（実コード grep / file read / 型情報確認で残存 4 ファイル・11 箇所を特定）
