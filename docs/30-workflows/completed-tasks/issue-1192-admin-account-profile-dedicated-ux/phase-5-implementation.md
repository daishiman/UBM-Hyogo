---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 5
phase_name: 実装手順
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 5: 実装手順

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 実装順序 | Step 1（`AdminAccessNotice.tsx` 新規）→ Step 2（`page.tsx` 組み込み）→ Step 3（テスト追加 = Phase 6）→ Step 4（検証 = Phase 9 コマンド） |
| 副作用 | なし（`AdminAccessNotice` は props なし・静的・stateless の Server Component。client hook / fetch / state を持たない） |
| 入出力 | 入力 = なし（props 0）/ 出力 = `SectionCard`（accent）+ 案内文 + `/admin` への `ButtonLink` |
| wave 前提 | **implemented_local_evidence_captured（実装・local test 完了。staging/PR は user-gated）**。本書は実装者がそのまま実行できる手順の確定 |

> 変更は **4 ファイルのみ**（Phase 2 §変更対象ファイル一覧）。`apps/api` / `packages/` / CSS / トークン / D1 / Google Form 仕様への差分は **ゼロ**（AC-8）。新規 CSS クラス・新規 primitive も追加しない（AC-7 / UI prototype alignment 不変条件 #3）。

---

## 目的

Phase 2 で凍結した設計（D-1 シグネチャ・D-2 組み込み位置・D-3 文言）を、実装者が迷わない step-by-step 手順と完全なコードとして確定する（CONST_005 完全充足）。

## 実行タスク

1. `AdminAccessNotice.tsx` を新規作成する（Step 1・完全コード §2）。
2. `page.tsx` に import 1 行 + 条件描画 1 行を追加する（Step 2・before/after diff §3）。
3. Phase 6 のテスト 2 ファイル（新規 spec + page spec 編集）を実装する（Step 3）。
4. 検証コマンド正本（§6）を全 GREEN にする（Step 4）。

---

## 1. 変更対象ファイル一覧（CONST_005）

| # | パス | 種別 | 内容 |
|---|------|------|------|
| 1 | `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` | **新規** | 管理者補助導線カード（props なし・静的 Server Component。§2 の完全コード） |
| 2 | `apps/web/app/(member)/profile/page.tsx` | **編集** | import 1 行 + `ProfileHeader` 直後に条件描画 1 行（§3 の diff） |
| 3 | `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | **新規** | component focused spec（T-C1〜T-C3・Phase 6 §1） |
| 4 | `apps/web/app/(member)/profile/page.spec.tsx` | **編集** | 新 describe + fixture ヘルパー + mock 拡張（T-P1〜T-P3・Phase 6 §2） |

上記 4 ファイル以外に差分を発生させない。

## 2. Step 1: `AdminAccessNotice.tsx`（完全なコード・Phase 2 D-1 準拠）

`apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` を以下の内容で新規作成する:

```tsx
// issue-1192: 管理者アカウント向け /profile 補助導線（分岐 (b)）。
// 不変条件 #11: member データ（memberId / email 等）を一切受け取らず描画しない。
// 認証判定は api 側所有のため、本コンポーネントは isAdmin 判定済みの呼び出し側でのみ mount する。

import { SectionCard } from "@/components/ui/layout";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function AdminAccessNotice() {
  return (
    <SectionCard
      title="管理者メニュー"
      tone="accent"
      data-testid="profile-admin-access-notice"
      aria-label="管理者向けのご案内"
    >
      <p>
        管理者アカウントでログインしています。会員情報の管理・開催と出席の記録・
        公開状態の確認は管理画面から行えます。
      </p>
      <ButtonLink href="/admin" variant="secondary" size="md">
        管理画面を開く
      </ButtonLink>
    </SectionCard>
  );
}
```

### 実装根拠（現行コード Read 済みの確定事項）

| 確認点 | 結果 |
|--------|------|
| `SectionCard` の `data-testid` / `aria-label` 透過 | **成立**（`apps/web/src/components/ui/layout/SectionCard.tsx:23,31` に props 型定義 + `:56-57` の `{...rest}` spread）。Phase 2 D-1 の fallback（accessible name query へ寄せる）は**不要** |
| `ButtonLink` の `variant="secondary"` | **存在**（`apps/web/src/components/ui/ButtonLink.tsx:5`。`visualVariant` で ghost へ map・`data-variant="secondary"` を出力・`:27-29`） |
| barrel import | `SectionCard` は `@/components/ui/layout`、`ButtonLink` は `@/components/ui/ButtonLink`（`page.tsx:35` の既存 import と同経路） |
| client suffix | 不要（hook なし・純表示。`.client.tsx` を付けない・Phase 1 §命名規則） |

## 3. Step 2: `page.tsx` の編集（before/after）

### 3-1. import 追加（編集後の import 群・1 行追加）

`apps/web/app/(member)/profile/page.tsx` の既存 `_components` import 群（`page.tsx:17` 付近・`ProfileHeader` の import 直後）に 1 行追加する:

```diff
 import { ProfileHeader } from "./_components/ProfileHeader";
+import { AdminAccessNotice } from "./_components/AdminAccessNotice";
 import { PhotoUpload } from "./_components/PhotoUpload.client";
```

### 3-2. 認証成功描画への条件描画追加（`page.tsx:130-144` 付近）

`data-testid="profile-authenticated-root"` ブロック内、`<ProfileHeader ... />` の直後・`<SectionCard aria-label="プロフィール写真">` の直前に 1 行追加する:

```diff
   return (
     <div data-testid="profile-authenticated-root">
       <PageShell>
         <ProfileHeader
           memberId={me.user.memberId}
           publishState={statusSummary.publishState}
           editResponseUrl={editResponseUrl}
           fallbackResponderUrl={fallbackResponderUrl}
         />
+        {me.user.isAdmin ? <AdminAccessNotice /> : null}
         <SectionCard aria-label="プロフィール写真">
           <PhotoUpload
```

### 3-3. 追加してはいけない場所（AC-4 / Phase 2 D-2）

| 分岐 | 追加可否 | 根拠 |
|------|---------|------|
| `/me` 失敗 degrade 分岐（`!meResult.ok`・`page.tsx:58-76`） | **追加しない** | エラー状態では `isAdmin` の信頼できる値が無い |
| profile fetch 失敗分岐（`!profileResult.ok`・`page.tsx:100-122`） | **追加しない** | 同上 + AC-4（degrade 表示不変）。T-P3 が guard |
| 認証成功描画（`page.tsx:129-187`） | **ここのみ**（ProfileHeader 直後） | 管理者が開いた直後に視認でき、member 本体構造を変えない先頭位置（Phase 2 D-2） |

## 4. 入出力・副作用・エラーハンドリング

| 項目 | 内容 |
|------|------|
| 入力 | `AdminAccessNotice`: なし（props 0）。`page.tsx` 分岐: `me.user.isAdmin: boolean`（`/me` レスポンス・取得済み値の参照のみ。新規 fetch なし） |
| 出力 | `SectionCard`（`data-component="section-card"` / `data-tone="accent"` / `data-testid="profile-admin-access-notice"`）+ 本文 `<p>` + `ButtonLink`（`href="/admin"` / `data-variant="secondary"`） |
| 副作用 | なし（純表示・client hook なし・状態なし） |
| エラーハンドリング | 不要（入力なし・分岐なし）。`isAdmin === false` / エラー分岐では mount 自体が発生しない（条件描画の null 側は DOM 出力ゼロ） |
| 認証境界 | web に新規認証ロジックを追加しない（AC-6）。判定所有権は `apps/api/src/middleware/session-guard.ts` のまま（fail-closed 維持・不変条件 R-3） |

## 5. 実装手順（step by step）

1. **Step 1**: `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` を §2 のコードで新規作成する（逐語。文言・属性値を変えない）。
2. **Step 2**: `apps/web/app/(member)/profile/page.tsx` に §3-1 の import 1 行と §3-2 の条件描画 1 行を追加する（差分は計 2 行のみ。他の行に触れない）。
3. **Step 3**: Phase 6 のテスト実装例コードに従い、`AdminAccessNotice.component.spec.tsx`（新規）と `page.spec.tsx`（編集: mock 拡張 + ヘルパー + 新 describe）を実装する。
4. **Step 4**: §6 のローカル実行コマンドを順に実行し、全 GREEN を確認する。FAIL 時は Phase 9 の修復方針（最大 3 回・最小差分）に従う。
5. **Step 5**: Phase 9 の grep gate（isAdmin 閉域 / HEX / test suffix / memberId 露出）を実行し、Phase 10 のレビューへ進む。

## 6. ローカル実行コマンド（検証コマンド正本）

```
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages
```

| コマンド | 期待結果 |
|---------|---------|
| typecheck | exit 0（`AdminAccessNotice` import 解決・fixture 型整合を含む） |
| lint | exit 0 |
| focused Vitest | 新規 6 件（T-C1〜T-C3 / T-P1〜T-P3）+ 既存 `page.spec.tsx` 全件 + `/profile` 配下既存 spec 全件 GREEN |
| verify:tokens | exit 0（HEX 直書き 0・新規 CSS 0） |
| api/packages diff | 出力 0 行 |

## 7. DoD（Definition of Done）

- [ ] AC-1〜AC-9 全充足（Phase 1 の検証方法に従う。AC-1/2/3/5 = 新規テスト GREEN、AC-4 = 既存テスト全件無修正 GREEN + T-P3、AC-6〜9 = Phase 9 検証コマンド / grep gate 全 PASS）。
- [ ] §6 の検証コマンド正本 5 種が全 GREEN。
- [ ] 差分が §1 の 4 ファイルに閉じている（`git status` / `git diff --name-only` で確認）。
- [ ] **コミット・PR 作成・push はユーザー指示まで行わない**（実装完了後はローカル差分 + 検証結果の報告で停止し、commit / PR はユーザーの明示承認後のみ実行する）。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 設計正本 | `phase-2-design.md` §D-1〜D-3 | シグネチャ・配置・文言の逐語元 |
| 組み込み点 | `apps/web/app/(member)/profile/page.tsx` | §3 diff の現行構造（行番号は本書作成時点） |
| カード正本 | `apps/web/src/components/ui/layout/SectionCard.tsx` | `data-testid` / `aria-label` 透過の根拠 |
| ボタン正本 | `apps/web/src/components/ui/ButtonLink.tsx` | `variant="secondary"` の根拠 |
| 型契約 | `apps/web/src/lib/api/me-types.ts`（`MeSessionUser.isAdmin`） | 分岐参照値の型 |
| テスト計画 | `phase-4-test-plan.md` | Step 3 のテスト ID・fixture 設計 |
| QA | `phase-9-qa.md` | Step 4/5 の検証コマンド・grep gate 正本 |

## 成果物

- `phase-5-implementation.md`（変更対象ファイル一覧 / `AdminAccessNotice` 完全コード / `page.tsx` before-after diff / 実装手順 / 入出力・副作用 / 実行コマンド / DoD）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は focused Vitest（`/profile` 配下）と Phase 11 の視覚証跡計画で行う。apps/api との統合 contract は変更しない（AC-8・V-5 で機械保証）。本 Phase の実装は Phase 6 テスト追加 → Phase 9 QA へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [x] 変更対象 4 ファイルが種別（新規/編集）付きで確定している。
- [x] `AdminAccessNotice` の完全なコードと `page.tsx` の before/after diff が逐語で記述されている。
- [x] 入出力・副作用・エラーハンドリング・認証境界の扱いが明記されている。
- [x] 実装手順（step by step）・ローカル実行コマンド・DoD（コミット/PR/push のユーザーゲート含む）が確定している。
