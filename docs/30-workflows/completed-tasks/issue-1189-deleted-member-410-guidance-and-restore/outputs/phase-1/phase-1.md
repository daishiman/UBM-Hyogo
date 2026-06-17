# Phase 1: 要件定義

## タスク分類

| 項目 | 値 |
|------|-----|
| タスク種別 | UI task（`apps/web` 表現層 2 系統: 会員 `/profile` 410 分岐 + 管理 `MemberDrawer` 復元ボタン配線） |
| taskType | implementation |
| visualEvidence | **VISUAL**（/profile エラーバナーの文言/CTA 変更・admin drawer のボタン追加で見た目が変わる） |
| implementation_mode | `new`（current branch に実装なし → 通常実装フロー。下記 P50 参照） |
| 実装区分 | 実装仕様書（CONST_004 デフォルト。コード変更を伴う） |
| 対応パターン | A+B 両対応（ユーザー合意済み 2026-06-12） |

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

起点 issue #1189「退会済み会員（`member_status.is_deleted=1`）が `/profile` で 410 を受けた後の行き止まり UX」。
原 issue は「staging /profile 失敗の真因が H3（410）と確定するまで着手不可」を前提としていたが、
[index.md](../../index.md) の issue 最適化（2026-06-12 コード調査）により前提を current facts へ再定義した:

- staging 事象は H5（transport）路線として後続 WF（PR #1194 / #1214 = `profile-session-transport-observability-fail-closed`）が観測性向上 + fail-closed を実装済み。**本タスクは staging 事象の真因と独立**した「退会済み会員の行き止まり UX」としてコード読解のみで成立する。
- 復帰の技術要件は調査済み: **復元 API は実装・テスト済みの既存資産**（`apps/api/src/routes/admin/member-delete.ts:121-168`）であり、本タスクは配線のみを行う。
- プロダクト判断は **A+B 両対応で合意済み**（AskUser 2026-06-12）: 会員向けは明示誘導（自己復帰なし）、復元操作は管理者専権。

### 1.2 放置した場合の影響

退会済み会員が `/profile` を開くと「アカウントの利用状態を確認できませんでした。管理者に確認してください。」＋
無意味な「再読み込み」リンクのみが表示され、何が起きたのか・次に何をすべきかが分からない。
さらに案内先の管理者にも UI 上の復元手段がなく（drawer は静的文言のみ）、**両側が行き止まり**のまま運用に乗る。

## 2. 現状分析（コード根拠・2026-06-12 検証済み）

### 2.1 会員側の行き止まり（C1 対象）

| # | 事実 | コード根拠 |
|---|------|-----------|
| 1 | API は退会済み会員の `/me` アクセスに 410 を返す（不変・本タスク非接触） | `apps/api/src/middleware/session-guard.ts:95-100`（`is_deleted=1` → 410） |
| 2 | web 側の 410 分岐は「利用状態を確認できませんでした」という曖昧文言 + `retryHref: "/profile"`（再読み込みしても 410 のまま＝無意味）を返す | `apps/web/app/(member)/profile/_lib/session-error-display.ts:34-42` |
| 3 | 現状の 410 戻り値: title「セッション情報を取得できませんでした」/ detail「アカウントの利用状態を確認できませんでした。管理者に確認してください。」/ `retryHref:"/profile"` / `dataCause:"session-410"`。`actionHref` / `actionLabel` なし | 同上 |
| 4 | 表示器 `SectionError` は `actionHref && actionLabel` 両方あるときのみ action リンク、`retryHref` あるときのみ「再読み込み」リンクを描画し、`data-cause` 属性を出力する。**410 向けの表示能力は既に揃っており SectionError 自体は変更不要** | `apps/web/src/components/member/SectionError.tsx`（props: title/detail/retryHref/actionHref/actionLabel/dataCause） |
| 5 | 呼出元 `page.tsx` は `!meResult.ok` → `mapProfileSessionErrorToDisplay` → `SectionError` の流れで、401 のみ `AuthRequiredError` rethrow で `/login?redirect=/profile` へ redirect。**page.tsx 本体は変更不要** | `apps/web/app/(member)/profile/page.tsx:57-73` |

### 2.2 管理者側の行き止まり（C2 対象）

| # | 事実 | コード根拠 |
|---|------|-----------|
| 1 | drawer の DELETED セクションは静的文言「この会員は論理削除されています。復元する場合は管理者にお問い合わせください。」のみで**ボタンなし**＝管理者自身が見ても復元手段がない | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:273-289` |
| 2 | 復元 API は実装・テスト済み（不変・配線するのみ）: `POST /admin/members/:memberId/restore` → 200 `{id, restoredAt}` / 404 not found / 409 `member_not_deleted`。D1 batch で `member_status.is_deleted=0` + `deleted_members` 行削除 + audit `admin.member.restored` | `apps/api/src/routes/admin/member-delete.ts:121-168`（contract test `member-delete.contract.spec.ts` 済み） |
| 3 | web→API 経路は catch-all proxy（GET/POST/PATCH/DELETE 対応済み）で追加配線不要 | `apps/web/app/api/admin/[...path]/route.ts` |
| 4 | admin mutation の正規経路 `useAdminMutation<T>(endpoint, "POST", { successMessage, onSuccess, onError })` → `{ trigger, isLoading }` は MemberDrawer に **import 済み**（`NotificationOptOutToggle` が使用中） | `apps/web/src/features/admin/hooks/useAdminMutation.ts` / `MemberDrawer.tsx:14,649` |
| 5 | 確認ダイアログの前例は `globalThis.confirm(...)` | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx:53` |
| 6 | `MemberDrawerBody` props は `{ memberId, detail: AdminMemberDetailView, onUpdated(patch) }`。成功時 `onUpdated({ status: { ...detail.status, isDeleted: false } })` で `MemberStateChipRow`・退会済みセクションが即時更新される | `MemberDrawer.tsx:107-113` |
| 7 | **現状記録**: web 側 `restoreMember`（`apps/web/src/lib/admin/api.ts:85`）は定義済みだが live 使用 0 件（`BulkActionBar.spec` のモジュール mock のみ）。本タスクでは使用せず非接触（Phase 3 で決定記録） | `apps/web/src/lib/admin/api.ts:85` |

## 3. 既存命名規則の確認

| 慣行 | 根拠 | 本タスクでの適用 |
|------|------|----------------|
| 変数/関数は camelCase、コンポーネントは PascalCase | `mapProfileSessionErrorToDisplay` / `NotificationOptOutToggle` 等 | 新規ローカルコンポーネントは `MemberRestoreButton`（MemberDrawer.tsx 内ローカル）等 PascalCase |
| テストファイルは `*.spec.{ts,tsx}` のみ（不変条件 #8。`*.test.*` は lefthook / CI が reject） | 既存 `__tests__/MemberDrawer.tags.spec.tsx` 等 | 新規は `MemberDrawer.restore.spec.tsx` |
| DOM 検証フックは `data-cause` / `data-role` / `data-component` 属性 | `SectionError.tsx`（`data-role="title"` / `data-role="retry"` / `data-cause`） | 410 検証は `data-cause="session-410"` 維持を必須アサーション化 |
| admin endpoint 文字列は `` `/api/admin/members/${encodeURIComponent(memberId)}/...` `` 形式 | `MemberDrawer.tsx:653`（notification-pref）/ `:542`（photo） | 復元は `` `/api/admin/members/${encodeURIComponent(memberId)}/restore` `` |
| 色は `var(--ubm-*)` トークンのみ（HEX 直書き禁止・CI gate `verify-design-tokens`） | DELETED セクション既存スタイル（`--ubm-color-danger` 系） | 復元ボタンも既存トークンのみで構成 |

## 4. スコープ

### 4.1 含むもの（IN）

- **C1（会員・パターン A）**: `session-error-display.ts` の 410 分岐を「退会済みである旨の明示 + 運営問い合わせ案内 + トップへ戻る導線」へ変更し、無意味な再読み込みリンクを廃止する。
- **C2（管理者・パターン B）**: `MemberDrawer.tsx` の DELETED セクションに復元ボタンを追加し、既存 `POST /admin/members/:memberId/restore` を `useAdminMutation` 経由で配線する（confirm → POST → 成功時 drawer 即時更新 + toast）。
- 上記のテスト（既存 spec 2 本の期待値更新 + 新規 spec 1 本。Phase 4 参照）。

### 4.2 含まないもの（OUT）

| 対象外 | 根拠 |
|--------|------|
| 一般会員の**自己復帰フロー**（会員自身が復元を実行する API/UI） | **合意済みプロダクト判断による対象外**（先送りではない）。退会の取り消しは本人確認を伴う運営判断であり管理者専権とする。新 endpoint 追加＝UI WF 不変条件 #1 違反でもある（index.md 不変条件 8 / CONST_007 宣言） |
| `apps/api` のコード・`session-guard.ts` の 410 返却体系・restore endpoint の契約変更 | 既存資産の配線のみ（index.md 不変条件 2） |
| D1 schema・Google Form 仕様の変更 | index.md 不変条件 3 |
| issue #1189 の GitHub 状態（OPEN/CLOSED・ラベル）変更 | ユーザー指示（index.md 不変条件 1） |
| `restoreMember`（`apps/web/src/lib/admin/api.ts:85`）の改修・削除 | live 使用 0 件の現状を記録するに留め非接触（Phase 3 MINOR-1 決定） |
| `SectionError.tsx` / `page.tsx` / catch-all proxy の変更 | 既存能力で充足（§2.1-4,5 / §2.2-3） |

## 5. 受入条件（AC）

| ID | 受入条件 |
|----|---------|
| AC-1 | `/profile` の 410 分岐が「このアカウントは退会済みです」と退会済みであることを明示する |
| AC-2 | 410 表示に運営問い合わせ案内 + 「公開サイトのトップへ戻る」導線（`actionHref:"/"`）があり、「再読み込み」リンクが存在せず、`data-cause="session-410"` が維持される |
| AC-3 | 404 / 5xx / FAILED / 401 の既存挙動に回帰がない（404=再ログイン CTA、5xx/FAILED=再読み込み、401=login redirect） |
| AC-4 | 復元ボタンが confirm 確認後に `POST /api/admin/members/:memberId/restore` を `useAdminMutation` 経由で呼ぶ（不変条件 #10 準拠） |
| AC-5 | 復元成功時に drawer 表示が即時更新（`onUpdated` patch で退会済みセクション消滅・`isDeleted=false` 反映）され、toast「会員を復元しました」が出る |
| AC-6 | 復元失敗時（409 / 404 / 5xx / network）にエラーが表示され、実行中はボタンが disabled になり、UI が破壊されない |
| AC-7 | `apps/api`・D1・Google Form の変更ゼロ（`git diff` で `apps/api/` 差分 0 を確認） |
| AC-8 | 不変条件 #11 維持: memberId をログ/レスポンスへ新規露出しない（admin 画面内の既存表示範囲は維持） |
| AC-9 | 追加/変更スタイルは `var(--ubm-*)` トークンのみ（HEX 直書きなし・`verify:tokens` PASS 維持） |
| AC-10 | `pnpm typecheck` / `pnpm lint` / focused vitest（対象 spec 全件）が全 PASS |

## 6. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No（`session-error-display.ts` 410 分岐は旧文言のまま・`MemberDrawer.tsx` DELETED セクションにボタンなし、を 2026-06-12 に Read で確認） | 通常実装フロー（implementation_mode=`new`） |
| upstream にマージ済みの先行実装がある | No（restore **API** は landed 済みだが web 側配線は未実装。`restoreMember` live 使用 0 件） | API を所与（不変）として web 側のみ実装 |
| 前提タスクが完了済み | Yes（親 WF `profile-session-fetch-failure-investigation` 完了・transport 路線 PR #1194/#1214 landed。本タスクはそれらと独立） | 依存ブロッカーなし |

## 7. 受入条件とテストの対応表

テスト ID 詳細は [phase-4.md](../phase-4/phase-4.md) 参照。

| AC | 対応テスト | 検証手段 |
|----|-----------|---------|
| AC-1 | T-01, T-06 | unit（純関数）+ page 描画 |
| AC-2 | T-02, T-06 | unit + page 描画（action/retry/data-cause） |
| AC-3 | T-03, T-04, T-05（+ 既存 page.spec の 404/5xx/FAILED/401 ケース無改変 PASS） | unit + 既存回帰 |
| AC-4 | T-07, T-08, T-09 | component（confirm 分岐 + POST 発火） |
| AC-5 | T-08 | component（セクション消滅 + toast） |
| AC-6 | T-10, T-11 | component（409 エラー + disabled） |
| AC-7 | 検証コマンド（`git diff --stat -- apps/api/` が空） | 静的検証 |
| AC-8 | T-07〜T-12 のアサーション範囲 + コードレビュー（新規ログ出力なし） | レビュー + 静的検証 |
| AC-9 | `pnpm verify:tokens` PASS + HEX grep 0 件 | 静的検証 |
| AC-10 | typecheck / lint / focused vitest 実行 | コマンド検証 |

（T-12: `isDeleted=0` でボタン非表示は AC-4/AC-6 の境界条件として表に含む）

## 参照資料

- [index.md](../../index.md) — 本 WF の SSOT（メタ情報・issue 最適化・DoD・不変条件・変更対象ファイル）
- 起点 issue: https://github.com/daishiman/UBM-Hyogo/issues/1189
- 親 WF 未タスク指示書: `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/unassigned-task/task-410-deleted-member-recovery-or-guidance.md`
- 編集対象: `apps/web/app/(member)/profile/_lib/session-error-display.ts` / `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`
- 不変（参照のみ）: `apps/api/src/middleware/session-guard.ts:95-100` / `apps/api/src/routes/admin/member-delete.ts:121-168` / `apps/web/src/components/member/SectionError.tsx` / `apps/web/app/(member)/profile/page.tsx:57-73`
- `CLAUDE.md` 不変条件 #8（spec suffix）/ #10（useAdminMutation）/ #11（memberId 非露出）

## 実行タスク

- [x] issue #1189 と current facts 最適化の背景を整理した（§1）
- [x] 会員側・管理者側の両行き止まりを file:line 付きで現状分析した（§2）
- [x] タスク分類（UI task / implementation / VISUAL / `new`）を確定した
- [x] 既存命名規則（camelCase / `*.spec.tsx` / data 属性慣行 / endpoint 形式 / トークン）を確認した（§3）
- [x] スコープ IN/OUT を確定し、自己復帰フロー OUT の根拠を明記した（§4）
- [x] AC-1〜AC-10 を index.md の DoD と整合する形で固定した（§5）
- [x] P50 前提確認チェックを実施した（§6）
- [x] 受入条件とテストの対応表を作成した（§7）

## 完了条件

- [x] タスク分類・実装区分・visualEvidence が index.md のメタ情報と一致している
- [x] 現状分析の全主張に file:line のコード根拠が付いている
- [x] AC-1〜AC-10 が固定され、全 AC に検証手段が割り当てられている
- [x] スコープ外項目（自己復帰フロー等）が根拠付きで宣言されている

## 成果物

- 本ドキュメント（`outputs/phase-1/phase-1.md`）: 要件定義（背景 / 現状分析 / 分類 / 命名規則 / スコープ / AC / P50 / AC×テスト対応表）
