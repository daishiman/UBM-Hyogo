# Phase 4: テスト作成

## 4.1 TDD RED の前提

本 Phase はテスト設計と実装後の focused evidence を記録する。C1/C2 の実装後に以下を実行した。

1. 本 Phase の T-01〜T-12 をテストコードとして先に書く（既存 spec の期待値更新 + 新規 spec 作成）。
2. 実装前に focused vitest を実行し、**変更系テストが RED であること**（旧文言アサートの更新分・新規 restore spec）を確認する（RED の確認をスキップしない）。
3. Phase 5 の実装（[phase-2.md](../phase-2/phase-2.md) の After）を適用して GREEN 化する。
4. 回帰系（T-03〜T-05・既存 spec 群）は実装前後ともに GREEN であることを確認する。

テストファイルは `*.spec.{ts,tsx}` のみ（不変条件 #8）。テスト名は日本語可（既存 spec に日本語 it 名の前例多数）。

## 4.2 テストケース一覧（T-01〜T-12）

### C1: `session-error-display.spec.ts`（編集）+ `page.spec.tsx`（編集）

| ID | 対象 | 操作 | 期待結果 | ファイル |
|----|------|------|---------|---------|
| T-01 | 410 新文言（title/detail） | `mapProfileSessionErrorToDisplay("MEMBER_SESSION_410")` | `title === "このアカウントは退会済みです"` / `detail` に「退会手続きが完了しているため」と「支部会の運営（管理者）にお問い合わせください」を含む | `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts` |
| T-02 | 410 の action と retry 不在 | 同上 | `actionHref === "/"` / `actionLabel === "公開サイトのトップへ戻る"` / `retryHref === undefined` / `dataCause === "session-410"` | 同上 |
| T-03 | 404 回帰 | `mapProfileSessionErrorToDisplay("MEMBER_SESSION_404")` | 既存挙動不変: `dataCause:"session-404"` / `actionHref:"/login?redirect=/profile"` / `actionLabel:"再ログイン"` / `retryHref` undefined | 同上 |
| T-04 | 5xx 回帰 | `mapProfileSessionErrorToDisplay("MEMBER_SESSION_503")`（境界 500/599 含む既存 CC-2〜CC-4 維持） | 既存挙動不変: `dataCause:"session-5xx"` / `retryHref:"/profile"` / detail「サーバー側でセッション確認に失敗しました。」 | 同上 |
| T-05 | FAILED 回帰 | `mapProfileSessionErrorToDisplay("MEMBER_SESSION_FAILED")`（未知 code 既定分岐 CC-6 維持） | 既存挙動不変: `dataCause:"session-failed"` / `retryHref:"/profile"` / detail「通信経路でセッション確認に失敗しました。」 | 同上 |
| T-06 | 410 時の SectionError 描画 | `fetchAuthed` mock を `FetchAuthedError(410, "deleted")` reject にして `ProfilePage` を render | `role="alert"` 要素に新 title/detail を含む / `data-cause="session-410"` / `[data-role="action"]` が `href="/"`・文言「公開サイトのトップへ戻る」/ `[data-role="retry"]` が**存在しない** | `apps/web/app/(member)/profile/page.spec.tsx` |

> **既存テストへの影響**:
> - `session-error-display.spec.ts` の **CC-1** が旧挙動（`retryHref:"/profile"` / `actionHref` undefined / 旧 detail）をアサートしている（2026-06-12 確認済み）→ T-01/T-02 は CC-1 の**更新**として実装する（重複ケースを併存させない）。CC-2〜CC-8 は無改変で回帰網として維持。
> - `page.spec.tsx` の既存ケース `it("distinguishes deleted-member /me failures")`（旧 detail「アカウントの利用状態を確認できませんでした。」をアサート）→ T-06 はこのケースの**更新**として実装する。既存の 5xx / transport / 401 ケースは無改変。

### C2: `MemberDrawer.restore.spec.tsx`（新規）

| ID | 対象 | 操作 | 期待結果 | ファイル |
|----|------|------|---------|---------|
| T-07 | ボタン表示条件（isDeleted=1） | `detail.status.isDeleted: true` の fixture で drawer を render | 「この会員を復元する」ボタンが退会済みセクション内に表示される | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx`（新規） |
| T-08 | confirm true → POST 発火 + 成功反映 | confirm mock を `true` にしてボタン click。restore POST mock は 200 `{id, restoredAt}` | `/api/admin/members/<id>/restore` への POST が 1 回発火 / 成功後に退会済みセクションが**消滅**（`onUpdated` patch → 親 state `isDeleted:false` 反映）/ toast「会員を復元しました」 | 同上 |
| T-09 | confirm false → POST 不発 | confirm mock を `false` にしてボタン click | restore POST が**発火しない**（fetch mock の restore 呼び出し 0 回）/ セクション表示は不変 | 同上 |
| T-10 | 409 `member_not_deleted` エラー | confirm true・POST mock を 409 + body `member_not_deleted` で reject 相当に | エラー toast（`✗` prefix）が表示される / 退会済みセクションは**残存**（onUpdated 不発火）/ ボタンは再び enabled（UI 非破壊・再試行可能） | 同上 |
| T-11 | isLoading 中 disabled | POST mock を未解決 Promise（pending）にして click | 解決前にボタンが `disabled` になりラベルが「復元中…」/ 解決後に通常状態へ戻る | 同上 |
| T-12 | ボタン非表示条件（isDeleted=0） | `detail.status.isDeleted: false` の fixture で render | 退会済みセクション自体が描画されず、復元ボタンも存在しない | 同上 |

## 4.3 mock 設計

既存 MemberDrawer specs（`__tests__/MemberDrawer.tags.spec.tsx` 等）の mock パターンを踏襲する:

| 対象 | 方式 | 備考 |
|------|------|------|
| `fetch`（detail GET + restore POST） | 既存 MemberDrawer specs と同様に `globalThis.fetch` を `vi.fn()` で差し替え、URL/method で分岐するルーター型 mock（GET `/api/admin/members/:id` → detail fixture / POST `.../restore` → ケース別レスポンス） | restore 呼び出し回数・payload の検証は mock 呼び出し履歴（`mock.calls`）で行う |
| `globalThis.confirm` | `vi.spyOn(globalThis, "confirm").mockReturnValue(true/false)` | happy-dom/jsdom では未 stub の confirm が安定しないため**必須 stub**。`afterEach` で `vi.restoreAllMocks()` |
| Toast（AC-5） | `ToastProvider`（`@/components/ui/Toast`）でラップして render し、toast 文言「会員を復元しました」を DOM で検証する。ラップしない場合 `useAdminMutation` は noop fallback するため toast 検証が空振りする点に注意 | T-08 のみ必須。他ケースはラップ任意（T-10 のエラー toast 検証もラップ必要） |
| `next/navigation`（`useRouter`） | 既存 specs と同じ `vi.mock("next/navigation", ...)` で `refresh` を noop mock | `useAdminMutation` が `useRouter()` を呼ぶため必須 |
| detail fixture | `AdminMemberDetailView` 形（`status.isDeleted` を T-07/T-12 で切替）。既存 specs の fixture を流用して `status` のみ上書き | fixture に memberId 以外の新規 PII を増やさない（AC-8） |
| C1（T-01〜T-05） | mock 不要（純関数の入出力検証） | — |
| C1（T-06） | 既存 page.spec.tsx の `mockedFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(410, "deleted"))` パターンを継続使用 | 既存 mock 基盤に変更なし |

## 4.4 実行コマンド（repo root から）

```bash
# C1: 純関数 spec
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts"

# C1: page 描画 spec
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts "apps/web/app/(member)/profile/page.spec.tsx"

# C2: 新規 restore spec
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"
```

> focused vitest は repo root から `--root=. --config=vitest.config.ts <対象ファイルパス>` 形式が正
> （include glob が monorepo root 基準のため、`apps/web` 内からの直接実行や `--filter web exec` では "No test files found" になる既知の罠）。

## 4.5 既存テスト互換（壊さない確認）

以下を実行し、本タスクで**編集しない**既存 spec が全 GREEN のままであることを確認する:

```bash
# MemberDrawer 系既存 specs（MemberDrawer.identityLabels / MemberDrawer.tags /
# MemberDrawer.tagInlineCreate / MemberAvatar / MemberDiagnosticsPanel / memberSystemFieldGlossary）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/src/features/admin/components/_members/__tests__"

# profile _lib 既存 specs（profile-summary / visibility-counts を含むディレクトリ一括）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__"
```

互換性の根拠: C2 は DELETED セクションへの追加 + ローカルコンポーネント追加のみで、既存 specs がアサートする
identity ラベル・tags 編集・avatar・diagnostics の DOM に触れない。C1 は 410 分岐の戻り値のみで、
CC-2〜CC-8（5xx 境界・404・FAILED・未知 code）の入力経路に変更がない。

## 4.6 AC との対応（再掲・正本は [phase-1.md](../phase-1/phase-1.md) §7）

- AC-1 ← T-01, T-06 / AC-2 ← T-02, T-06 / AC-3 ← T-03〜T-05 + §4.5 回帰
- AC-4 ← T-07〜T-09 / AC-5 ← T-08 / AC-6 ← T-10, T-11（境界: T-12）
- AC-7〜AC-9 は静的検証（`git diff --stat -- apps/api/` 空 / 新規ログ出力なしレビュー / `verify:tokens`）、AC-10 は §4.4 + typecheck/lint。

## 参照資料

- [phase-1.md](../phase-1/phase-1.md) §7 — 受入条件とテストの対応表（正本）
- [phase-2.md](../phase-2/phase-2.md) — テスト期待値の根拠（After 文言・endpoint・エラーパス）
- [phase-3.md](../phase-3/phase-3.md) §3.5 — confirm stub / ToastProvider のリスク受容判断
- 既存 spec（mock パターン正本）: `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx`
- 既存 spec（更新対象）: `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts`（CC-1）/ `apps/web/app/(member)/profile/page.spec.tsx`（`distinguishes deleted-member /me failures`）
- `vitest.config.ts`（repo root）— focused 実行の config 正本

## 実行タスク

- [x] T-01〜T-12 を ID / 対象 / 操作 / 期待結果 / ファイルの表として確定した（§4.2）
- [x] focused Vitest 3 files / 24 tests PASS を確認した
- [x] 既存テストのうち更新が必要なケース（CC-1・page.spec の 410 ケース）を特定し、更新 / 新規 / 回帰維持を区別した（§4.2）
- [x] mock 設計（fetch ルーター型 / `vi.spyOn(globalThis, "confirm")` / ToastProvider ラップ / next/navigation）を確定した（§4.3）
- [x] focused vitest 実行コマンド（`--root=. --config=vitest.config.ts` 形式）を固定した（§4.4）
- [x] 既存 spec を壊さない確認コマンド（`__tests__` ディレクトリ一括実行）を設計した（§4.5）

## 完了条件

- [x] 全 AC（AC-1〜AC-6）に対応するテストケースが T-01〜T-12 に割り当てられている
- [x] 各テストの期待結果が Phase 2 の確定文言・確定 endpoint と一字一句整合している
- [x] mock 設計が既存 spec パターンの踏襲であり、新規テスト基盤を導入しない
- [x] テストファイルが index.md の変更対象ファイル表（spec 編集 2 + 新規 1）と一致している

## 成果物

- 本ドキュメント（`outputs/phase-4/phase-4.md`)。テストケース表 T-01〜T-12 / TDD RED 前提 / mock 設計 / 実行コマンド / 既存テスト互換確認
- `session-error-display.spec.ts` 更新・`page.spec.tsx` 更新・`MemberDrawer.restore.spec.tsx` 新規
