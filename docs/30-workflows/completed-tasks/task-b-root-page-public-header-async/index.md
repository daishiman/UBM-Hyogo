# task-b-root-page-public-header-async

[実装区分: 実装仕様書]

> 判定根拠: Task A で `PublicHeader` が async server component 化したため、`apps/web/app/page.tsx`（route `/`）でも `getAuthView()` を取得して `<PublicHeader authView={authView} />` 配信に整合する必要がある。コード変更（`page.tsx` 編集 + page spec の `vi.mock` 拡張）が必須であり、CONST_004 のデフォルト（実装仕様書）に該当する。

## メタ情報

| 項目                  | 値                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------- |
| Task ID               | TASK-PUBHDR-LOGGED-IN-NAV-CLEANUP-B-001                                             |
| Feature 名            | task-b-root-page-public-header-async                                                |
| Task type             | implementation                                                                      |
| visualEvidence        | NON_VISUAL（DOM 出し分けは `data-auth-state` 属性 grep + vitest で代替）            |
| implementation_mode   | `new`                                                                               |
| workflow_state        | `implemented_local_evidence_captured`                                               |
| 影響 surface          | `apps/web/app/page.tsx`（root `/`）+ `apps/web/app/__tests__/page.spec.tsx`         |
| 親 workflow           | `docs/30-workflows/public-header-logged-in-nav-cleanup/`                            |
| 依存 task             | Task A（`getAuthView` / `PublicHeader` async 化）                                   |
| 想定 1 cycle 完了     | はい（root page 編集 + page spec mock 拡張 + typecheck/lint/build を 1 PR）         |

## 真の論点（task-specification-creator 思考法）

1. **真の論点**: Task A で `PublicHeader` が `async function PublicHeader({ authView }: { authView: AuthView })` に変わるため、`(public)` route group 外で `<PublicHeader />` を直接 mount している root page (`apps/web/app/page.tsx`) は型・実行両面で破綻する。route 移動ではなく root page 内で `await getAuthView()` を取得し props として渡す方針が最小差分。
2. **依存関係・責務境界**: `getAuthView()` は server-only helper。root page は既に async server component で `getStats` / `listMembersRaw` を fetch しているため、同 server cycle 内で 1 回追加するだけで済む。`connection()` / `revalidate = 60` / `generateMetadata` は責務外。
3. **価値とコストの不均衡**: 1 await 追加と 1 prop 配線のみで Task A の async 化と整合する。先送りすると root page が build エラーまたは runtime SCR を起こす。
4. **改善優先順位**: ① `getAuthView` import 追加 → ② `await getAuthView()` 実行 → ③ `<PublicHeader authView={authView} />` 配線 → ④ page spec に `getAuthView` mock（guest / member 2 ケース）追加 → ⑤ typecheck/lint/build。
5. **4条件評価**:
   - 価値性: Task A async 化と整合し、root page の session-aware 動線を確立
   - 実現性: 編集 2 ファイル・差分 ~10 行
   - 整合性: 既存 `getStats` / `listMembersRaw` mock パターンを踏襲、CLAUDE.md `apps/web` env 不変条件と矛盾なし
   - 運用性: vitest focused spec + `data-auth-state` grep gate で回帰検出

## Phase 構成

| Phase | 名称                 | 状態         | 出力先                                |
| ----- | -------------------- | ------------ | ------------------------------------- |
| 1     | 要件定義             | completed | outputs/phase-1/phase-1.md            |
| 2     | 設計                 | completed | outputs/phase-2/phase-2.md            |
| 3     | 設計レビュー         | completed | outputs/phase-3/phase-3.md            |
| 4     | テスト作成           | completed | outputs/phase-4/phase-4.md            |
| 5     | 実装                 | completed | outputs/phase-5/phase-5.md            |
| 6     | テスト拡充           | completed | outputs/phase-6/phase-6.md            |
| 7     | カバレッジ確認       | completed | outputs/phase-7/phase-7.md            |
| 8     | リファクタリング     | completed | outputs/phase-8/phase-8.md            |
| 9     | 品質保証             | completed | outputs/phase-9/phase-9.md            |
| 10    | 最終レビュー         | completed | outputs/phase-10/phase-10.md          |
| 11    | 手動テスト           | completed | outputs/phase-11/phase-11.md          |
| 12    | ドキュメント更新     | completed | outputs/phase-12/phase-12.md          |
| 13    | PR作成               | pending_user_approval | outputs/phase-13/phase-13.md |

> local 実装・focused tests・typecheck・lint・web build 完了により `implemented_local_evidence_captured` へ昇格済。staging runtime / commit / push / PR は user-gated。

## 不変条件（CLAUDE.md / 親 workflow より）

- `apps/web` ランタイムの env 参照は `getEnv()` / `getApiBaseEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()` 経由のみ
- 既存 `connection()` / `revalidate = 60` / `generateMetadata` は変更しない
- route 移動（`app/page.tsx` → `app/(public)/page.tsx`）は採用しない
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ
- `apps/web` production build は `next build --webpack`（OpenNext Workers 互換）

## DoD（Definition of Done）

- `app/page.tsx` で `await getAuthView()` 後 `<PublicHeader authView={authView} />` を mount している
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` green
- `apps/web/app/__tests__/page.spec.tsx` で guest / member 2 ケース pass
- `mise exec -- pnpm --filter @ubm-hyogo/web build` が green（OpenNext build 互換）
- staging `/` を踏み、session 状態と DOM `data-auth-state` 属性が整合（user-gated）
