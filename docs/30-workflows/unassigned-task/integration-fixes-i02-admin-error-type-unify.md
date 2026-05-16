# integration-fixes-i02 admin mutation error 型統一 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | integration-fixes-i02-admin-error-type-unify                                                    |
| タスク名     | useAdminMutation の独自 `AdminMutationHttpError` を `AuthRequiredError` / `FetchAuthedError` に統一 |
| 分類         | 改善 / wiring fix (integration gap)                                                             |
| 対象機能     | admin mutation hook の 401/403 error path 共有化（parallel-08 ↔ parallel-10 接続点）            |
| 優先度       | 中                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | spec_ready_implementation_pending                                                               |
| 発見元       | improvements 接続検証（integration-fixes index.md §2 検出 i02）                                 |
| 発見日       | 2026-05-16                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
- 親タスク状態: `spec_ready_implementation_pending`
- ソース spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md`
- 関連 sibling:
  - i01 (`parallel-i01-toastprovider-root-mount`): 実装済み・完了（本ブランチで `apps/web/app/layout.tsx` に `ToastProvider` mount 済み）
  - i03..i07: spec のみ存在・未実装
- 関連実装:
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts`（独自 `AdminMutationHttpError` を保持）
  - `apps/web/src/lib/fetch/authed.ts`（共有 `AuthRequiredError` / `FetchAuthedError`）
  - `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`
  - `apps/web/src/features/admin/hooks/index.ts`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`parallel-08`（shared foundation admin UI）で導入した `useAdminMutation` hook は、admin 系 mutation の 401/403 error 分岐を内製化するため hook ファイル内で独自 class `AdminMutationHttpError` を定義した（`useAdminMutation.ts:58`）。同時期に `apps/web/src/lib/fetch/authed.ts` には `AuthRequiredError` (401) / `FetchAuthedError(status, bodyText)` が既に存在し、`parallel-10`（admin mutation auth/session handling unified hook）は後者の `AuthRequiredError` を catch して `/login?next=...` redirect を発火する設計になっている。

結果として **同一概念（HTTP error）が hook 内独自 class と lib/fetch 共有 class の二系統で並立**し、`useAdminMutation` の 401/403 分岐（`useAdminMutation.ts:144,148`）が独自 class のみを参照しているため、p-10 redirect logic と相互運用できない状態が発生している。

### 1.2 問題点・課題

- `useAdminMutation` が throw する 401 error は `AuthRequiredError` ではないため、p-10 の `/login?next=...` redirect 経路が admin mutation 経由では自動発火しない
- 同一概念二重実装により型 narrowing が困難:
  - 利用側 `catch (e)` で `instanceof AdminMutationHttpError` と `instanceof AuthRequiredError` の両方を試す必要があり、分岐が冗長化
  - 401/403 分岐テストで「どちらの class を expect するか」がファイル横断で揺れる
- features 配下の hook が lib/fetch の error class を import せず独自定義したことで、後続 admin hook（list/delete/bulk 等）でも同じ複製が繰り返される横展開リスク
- `parallel-08` DoD は単体で達成しているが、`parallel-10` との接続点が DoD で検証されておらず、外部接続検証（improvements/integration-fixes 検証）で初めて検出された

### 1.3 放置した場合の影響

- 401 セッション切れ時、admin 画面 mutation 起点では `/login?next=...` への redirect が起きず、toast 表示のみで stranded する UX 劣化
- 後続の admin mutation hook が独自 class を踏襲し続け、リファクタコストが増大
- 401/403 path の int test が hook ごとに class を切替える必要があり保守性低下

---

## 2. 何を達成するか（What）

### 2.1 目的

`useAdminMutation` 内の独自 `AdminMutationHttpError` を撤廃し、401/403/非2xx の throw を共有 `AuthRequiredError` / `FetchAuthedError` に統一する。これにより p-10 redirect logic が admin mutation 経由でも自動発火し、admin 系 error path の型を単一化する。

### 2.2 最終ゴール

- `useAdminMutation.ts` から `AdminMutationHttpError` の class 定義が削除されている
- 401 throw が `AuthRequiredError`、それ以外の非 2xx throw が `FetchAuthedError(status, text)` に切替済み
- hook 内 instanceof 判定が共有 class を参照
- `useAdminMutation.spec.tsx` が新 class assertion で 0 fail
- `hooks/index.ts` から旧 export が削除（or `@deprecated` alias のみ）
- `pnpm typecheck` / `pnpm lint` ローカル PASS

### 2.3 スコープ

#### 含むもの

- `useAdminMutation.ts` の error throw path と instanceof 分岐の置き換え
- `useAdminMutation.spec.tsx` の expected error class 更新
- `hooks/index.ts` の旧 export 整理
- p-10 redirect logic test がある場合、admin mutation 経由でも redirect が trigger することを確認する int test 1 件追加

#### 含まないもの

- `authed.ts` の error class signature 変更
- 新規 redirect logic の実装（p-10 既存 logic を流用前提）
- API endpoint 側の error response 仕様変更
- 他の admin hook（list/delete 等）の error path リファクタ（横展開メモとして §3.3 に残す）

### 2.4 成果物

- 修正 PR（変更ファイル 3 ファイル想定: hook 本体 / test / index）
- 401 path で `AuthRequiredError` が throw され、p-10 redirect path に到達することを示す test evidence
- 横展開メモ「features 配下の hook が lib/fetch の error class を import するルール」を本ドキュメント §3.3 に確定

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 独自 `AdminMutationHttpError` を生やしてしまった経緯

`parallel-08` 実装時、shared admin UI foundation の責務分離を優先するあまり、`useAdminMutation` hook ファイル内に閉じた error class を作る方が「hook の self-contained 性が高い」と判断され、`useAdminMutation.ts:58` で `class AdminMutationHttpError extends Error` が定義された。当時の review 範囲は p-08 DoD（hook の戻り値 contract + toast 連携）に限定されており、`apps/web/src/lib/fetch/authed.ts` に既存する `AuthRequiredError` / `FetchAuthedError` との同一概念性は検出されなかった。

### 3.2 同一概念二重実装による型 narrowing 困難 / 401・403 分岐テスト複雑化

- 利用側 `catch (e)` で `e` を narrow するには `instanceof AdminMutationHttpError` と `instanceof AuthRequiredError` / `FetchAuthedError` の **両系統**を順に試さねばならず、TypeScript の union narrowing が崩れる
- `useAdminMutation.spec.tsx` の 401 case は `AdminMutationHttpError(401, "")`、`authed.spec.ts` の 401 case は `AuthRequiredError` を expect しており、テスト全体で「401 とは何の class か」が一意でない
- 403 path も同様に hook 単位で expect class が分岐し、admin 系 mutation を増やすたびに「どちらに合わせるか」を都度判断する必要があった
- p-10 redirect test が `instanceof AuthRequiredError` を gate にしているため、admin mutation 経由の 401 は redirect path のテスト fixture に乗らない

### 3.3 学んだこと / 横展開メモ

- **ルール**: `apps/web/src/features/**` 配下の hook が HTTP error を throw する場合、独自 Error class を hook ファイルや features 配下で定義してはならない。`@/lib/fetch/authed` から `AuthRequiredError` / `FetchAuthedError` を import し、それのみを throw する
- 既存 `useAdminMutation` 以外の admin hook（今後 list/delete/bulk 等を追加する場合）も上記ルールを継承し、error class 複製を行わない
- shared foundation 系タスクの DoD には「同一概念の既存 class を lib/fetch から探索済みであること」を必ず含める（DoD checklist 化候補）
- 接続検証（integration-fixes 系）は parallel タスク単体の DoD では検出できないため、improvements サイクル末に grep ベースで「外部接続点が実際に他タスクから参照されているか」を一次検証する運用を恒久化する候補

---

## 4. 受入条件 (AC)

ソース spec の DoD を踏襲する。

- **AC-1**: `apps/web/src/features/admin/hooks/useAdminMutation.ts` から `AdminMutationHttpError` の class 定義が削除されている
- **AC-2**: hook 内の 401 throw が `AuthRequiredError`、非 2xx throw が `FetchAuthedError(res.status, text)` に切替済み
- **AC-3**: hook 内 `instanceof` 判定が `AuthRequiredError` / `FetchAuthedError` ベースに切替済み（`e instanceof AuthRequiredError` / `e instanceof FetchAuthedError && e.status === 403`）
- **AC-4**: `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` の 401/403 assertion が新 class（`AuthRequiredError` / `FetchAuthedError`）で PASS
- **AC-5**: `apps/web/src/features/admin/hooks/index.ts` から旧 `AdminMutationHttpError` の export が削除されている（または `@deprecated` 経由の `FetchAuthedError` re-export alias のみ。spec は完全削除を採用）
- **AC-6**: `mise exec -- pnpm typecheck` がローカル PASS（type narrowing が新型で成立）
- **AC-7**: `mise exec -- pnpm lint` がローカル PASS
- **AC-8**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation` および `--run authed` が 0 fail で完走
- **AC-9**: p-10 redirect logic test が存在する場合、admin mutation 経由の 401 でも `/login?next=...` redirect path が trigger することを確認する int test が 1 件追加されている
- **AC-10**: §3.3 の横展開メモ（features 配下 hook の error class 取り扱いルール）が本ドキュメントに確定状態で記録されている

---

## 5. 参照資料

- ソース spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02-admin-error-type-unify/spec.md`
- 親 index: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`（§2 検出 i02 行）
- 親 workflow root: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/index.md`
- 関連実装:
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts`（`AdminMutationHttpError` 定義箇所: L58 / 分岐: L144,148）
  - `apps/web/src/lib/fetch/authed.ts`（`AuthRequiredError`: L17 / `FetchAuthedError`: L24）
  - `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx`
  - `apps/web/src/features/admin/hooks/index.ts`
- 関連 PR: #745 (parallel-08), #744 (parallel-10)
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション - 不変条件1「既存 API のみ接続」
