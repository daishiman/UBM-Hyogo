# Phase 1 — 要件定義

**[実装区分: 実装仕様書]** / **task_classification: NON_VISUAL**

## 1. 目的

ログイン済みユーザーが `/login` に到達した場合、即座に `/profile`（または `searchParams.next` が安全なら `next`）へリダイレクトする。

## 2. P50チェック（既実装確認）

| 確認項目                            | 結果                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| current branch に実装が存在する     | No → `implementation_mode: "new"`                                      |
| upstream（dev/main）にマージ済み    | No                                                                     |
| 前提タスク完了済み                  | 親 workflow `public-header-logged-in-nav-cleanup` Task A 非依存（並列可） |

## 3. タスク分類

- **UI task / docs-only task**: NON_VISUAL（server-side redirect + 純関数）
- **理由**: 視覚レンダリング変更なし。`redirect()` 副作用と純関数 `safeNext` の挙動が主成果。
- **Phase 11 evidence**: `manual-test-result.md`（Vitest unit 結果集約）。スクリーンショット不要。

## 4. 受入条件

1. `safeNext` 純関数が 16 ケースのホワイトリストフィルタを満たす
2. `/login` でセッションあり + `next` 無し → `/profile` redirect
3. `/login` でセッションあり + 安全な `next` → `next` redirect
4. `/login` でセッションあり + 不正な `next` → `/profile` fallback
5. `/login` 未ログイン → 既存 LoginCard 描画（regression なし）
6. `pnpm typecheck` / `pnpm lint` green

## 5. inventory（変更対象ファイル）

| # | パス                                                            | 種別     |
| - | --------------------------------------------------------------- | -------- |
| 1 | `apps/web/src/lib/url/safe-next.ts`                             | 新規     |
| 2 | `apps/web/src/lib/url/__tests__/safe-next.spec.ts`              | 新規     |
| 3 | `apps/web/app/login/page.tsx`                                   | 編集     |
| 4 | `apps/web/app/login/__tests__/page.spec.tsx`                    | 編集 or 新規（既存 spec 確認） |

## 6. 既存命名規則

- 純関数ユーティリティ: kebab-case path + camelCase export（例: `login-query.ts` / `parseLoginQuery`）。
- ただし、元タスク仕様で **`safeNext.ts`** が指定されている（camelCase file name）。`apps/web/src/lib/url/` 配下を grep した結果、kebab-case が多数派（`login-query.ts` / `login-redirect.ts` / `safe-redirect.ts`）。
- → Phase 2 で命名統一を判断する（候補: `safe-next.ts` に揃える）。

## 7. 既存類似実装の調査

- `apps/web/src/lib/url/safe-redirect.ts` が存在し、`isSafeInternalRedirect` / `normalizeRedirectPath` を提供している。
- `safe-redirect.ts` の検証条件:
  - `/` で始まる / `//` で始まらない / `\` を含まない / 制御文字を含まない / `/login` 自身を除外
- 元タスクの `safeNext` 要求条件との差分:
  - `safeNext` は加えて **`:` を含まない**（`javascript:` 防止）/ **長さ 256 以下** を要求
  - `safe-redirect` は `/login` を fallback 対象とする（自己ループ防止）
- **重複を避けるため、Phase 2 で「`safe-redirect.ts` を拡張するか / 新規 `safeNext` を独立追加するか」を決定する**。

## 8. 制約

- CONST_004: 実装仕様書（コード変更あり）
- CONST_005: 必須項目すべて含む（Phase 4-5 で詳述）
- CONST_007: 1サイクル内完了スコープ

## 9. リスク

- `safe-redirect.ts` 既存実装との重複/分裂が現実化すると保守コストが上昇 → Phase 2 で既存 predicate 再利用に決定
- Next.js 16 の `searchParams` が Promise であるため、async 解決を忘れない（既存 `page.tsx` で対応済み）
