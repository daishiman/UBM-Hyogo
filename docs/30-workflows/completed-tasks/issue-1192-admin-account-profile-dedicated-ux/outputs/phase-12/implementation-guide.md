# Implementation Guide — issue-1192-admin-account-profile-dedicated-ux

> **このファイルだけ読めば実装着手できる**ことを目的とした、後続実装者（03.実装.md の 1 サイクル）向けの正本ガイド。
> workflow_state = `implemented_local_evidence_captured`（実装・local Vitest 完了。staging/PR は user-gated）。
> Issue #1192 は **CLOSED のまま維持**。本ワークフローが canonical な実装仕様である。

---

## Part 1: 概念（中学生にもわかる説明）

マンションを想像してほしい。会員のマイページ（`/profile`）は「自分の部屋」、管理画面（`/admin`）は「管理人室」だ。

いまの建物では、管理人さんも住人として自分の部屋を持っている（**ログインできる管理者は、必ず会員としての身分も持っている**ことが、受付の仕組み上保証されている）。ところが、管理人さんが自分の部屋に入っても、そこから管理人室へ行く案内がどこにもない。毎回いったん廊下に出て、自力で管理人室を探さないといけない。

このタスクでやることは 1 つだけ:

> **マイページに「管理人さん専用の入口案内板」を 1 枚足す。**

大事なルールは「**入口で身分確認をやり直さない**」こと。管理人かどうかは、建物の受付（API = `/me`）がすでに確認して**名札（`isAdmin`）**を渡してくれている。部屋の側（web）はその名札を読んで、管理人なら案内板を見せる・住人なら何も変えない、それだけをする。部屋の側で改めて鍵や身分証をチェックする仕組みを作ってはいけない（チェックの仕組みが 2 か所にあると、片方の直し忘れが事故になるから）。

| 用語 | 平易な言い換え |
| --- | --- |
| `/me` | 「あなたは誰？」に答えてくれる受付の窓口（API） |
| `isAdmin` | 受付が渡してくれる「管理人です」名札（true / false） |
| `AdminAccessNotice` | 今回新しく作る入口案内板（カード 1 枚） |
| Server Component | サーバー側で組み立ててから届ける画面部品 |
| jsdom render テスト | 画面を仮想的に組み立てて「案内板が出る/出ない」を確かめる自動テスト |

---

## Part 2: 技術者向け実装ガイド

### 2-1. 前提（再スコープの確定事実）

- 元 Issue #1192 は「AC-2 結論待ち（管理者が member identity を持つか未確定）で着手不可」だったが、現行コード調査で `resolveSession`（`apps/api/src/use-cases/auth/resolve-session.ts`）が **member identity 必須＝ログイン済み管理者は構造的に必ず member identity を持つ**と確定し、**分岐 (b)（member プロフィール表示 + 管理者補助導線）**へ再スコープ済み。
- `/me` は既に `isAdmin: boolean` を返す（`apps/api/src/middleware/session-guard.ts` + web 側 mirror 型 `apps/web/src/lib/api/me-types.ts` の `MeSessionUser.isAdmin`）。**API・型の変更は一切不要**。

### 2-2. 変更ファイル（4 件・これ以外に差分を出さない）

| # | パス | 種別 | 内容 |
| --- | --- | --- | --- |
| 1 | `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` | 新規 | 管理者案内カード（props なし・純表示・server-renderable） |
| 2 | `apps/web/app/(member)/profile/page.tsx` | 編集 | import 1 行 + 条件描画 1 行 |
| 3 | `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | 新規 | T-C1〜T-C3 |
| 4 | `apps/web/app/(member)/profile/page.spec.tsx` | 編集 | T-P1〜T-P3 追加（既存 degrade guard は不変） |

`apps/api` / `packages/` / D1 schema / Google Form / CSS トークンの差分は**ゼロ**。

### 2-3. コード例（Phase 2 D-1 正本・逐語）

`apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx`:

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

- **入力**: なし（props なし・静的）。**副作用**: なし（client hook なし・`.client.tsx` suffix 不要）。
- fallback（Phase 2 D-1 記載）: `SectionCard` が rest props（`data-testid` / `aria-label`）を透過しない実装だった場合、`section` 要素への直付けではなく `getByRole("region", { name: "管理者向けのご案内" })` 系 query へテストを寄せる（**DOM 契約の正は accessible name**）。実装時に `apps/web/src/components/ui/layout/SectionCard.tsx` を Read して確定すること。

### 2-4. page.tsx への組み込み（Phase 2 D-2 正本）

認証成功描画（`data-testid="profile-authenticated-root"` ブロック）内、`<ProfileHeader ... />` の**直後**に 1 行追加する:

```tsx
<ProfileHeader ... />            {/* 既存・不変 */}
{me.user.isAdmin ? <AdminAccessNotice /> : null}
<SectionCard aria-label="プロフィール写真"> {/* 既存・不変 */}
```

- import 追加 1 行: `import { AdminAccessNotice } from "./_components/AdminAccessNotice";`
- `/me` エラー degrade 分岐・profile fetch 失敗分岐には**追加しない**（エラー状態では isAdmin の信頼できる値が無い + AC-4 不変）。

### 2-5. DOM 契約（テスト selector の正本）

| 要素 | 契約 |
| --- | --- |
| カード | `SectionCard(title="管理者メニュー", tone="accent", data-testid="profile-admin-access-notice", aria-label="管理者向けのご案内")` |
| 本文 | 「管理者アカウントでログインしています。会員情報の管理・開催と出席の記録・公開状態の確認は管理画面から行えます。」 |
| 導線 | `ButtonLink(href="/admin", variant="secondary", size="md")`・accessible name「管理画面を開く」 |

### 2-6. 確定テスト 6 件

| ID | 対象 spec | 検証内容 |
| --- | --- | --- |
| T-C1 | `AdminAccessNotice.component.spec.tsx` | カードが render され `data-testid="profile-admin-access-notice"`（または accessible name fallback）で取得できる |
| T-C2 | `AdminAccessNotice.component.spec.tsx` | `/admin` への導線リンク（accessible name「管理画面を開く」・`href="/admin"`）が含まれる（AC-2） |
| T-C3 | `AdminAccessNotice.component.spec.tsx` | props を受けず、`memberId`・email 等の member データ文字列を描画しない（AC-5・不変条件 #11） |
| T-P1 | `page.spec.tsx` | `me.user.isAdmin === true` で認証成功描画に管理者案内カードが表示される（AC-1） |
| T-P2 | `page.spec.tsx` | `me.user.isAdmin === false` でカードが描画されない（query 結果 null・AC-3） |
| T-P3 | `page.spec.tsx` | `/me` エラー degrade 分岐の表示が本変更前と不変（AC-4・既存 guard と併走） |

- fixture 注意（Phase 3 リスク表）: 成功パス page-level テストの `MeProfileResponse` fixture は `me-types.ts` / `@ubm-hyogo/shared` の実型から定義し、typecheck を通る最小 fixture とする。
- テストファイル命名は `*.spec.tsx` のみ（`*.test.*` 禁止・lefthook `block-test-suffix` 対象）。

### 2-7. 実装手順

1. `apps/web/src/components/ui/layout/SectionCard.tsx` / `apps/web/src/components/ui/ButtonLink.tsx` を Read し、rest props 透過と variant/size を確認する（2-3 の fallback 判定）。
2. `AdminAccessNotice.tsx` を新規作成する（2-3 逐語）。
3. `page.tsx` に import 1 行 + 条件描画 1 行を追加する（2-4）。
4. `AdminAccessNotice.component.spec.tsx`（T-C1〜T-C3）を新規作成、`page.spec.tsx` に T-P1〜T-P3 を追加する。
5. 検証コマンド正本（2-8）を全件 GREEN にする。
6. Phase 12 strict 7 を実測値へ更新する（同 wave で aiworkflow-requirements 登録）。

### 2-8. 検証コマンド正本

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages   # 出力なし = AC-8 PASS
```

### 2-9. DoD（Definition of Done）

- [ ] 変更 4 ファイルのみ差分が存在し、2-8 の 5 コマンドが全件 GREEN / 出力なし。
- [ ] T-C1〜T-C3 / T-P1〜T-P3 + 既存 `page.spec.tsx` degrade guard 全件 PASS。
- [ ] 新規 CSS クラス・globals.css 追記・トークン追加ゼロ（既存 `SectionCard` / `ButtonLink` のみ）。
- [ ] jsdom render を一次 VISUAL 証跡として記録（runtime screenshot は user-gated pending のまま可）。
- [ ] commit / push / PR は未実行のまま停止し、ユーザー承認を待つ（CONST_002）。

---

## Part 3: Acceptance Criteria（Phase 1 正本・逐語）

| AC | 内容 | 検証方法 |
| --- | --- | --- |
| AC-1 | `me.user.isAdmin === true` のとき `/profile` 認証成功描画に管理者案内カード（`data-testid="profile-admin-access-notice"`）が表示される | jsdom render（`page.spec.tsx`） |
| AC-2 | 管理者案内カードに `/admin` への導線リンク（accessible name「管理画面を開く」・`href="/admin"`）が含まれる | jsdom render（`AdminAccessNotice.component.spec.tsx`） |
| AC-3 | `me.user.isAdmin === false` のとき管理者案内カードが描画されない（query 結果 null） | jsdom render（`page.spec.tsx`） |
| AC-4 | `/me` エラー degrade 分岐（404/410/5xx/transport）の表示は本変更前と不変（既存テスト全 PASS） | 既存 `page.spec.tsx` 全件 PASS |
| AC-5 | `AdminAccessNotice` は props を受け取らず、`memberId`・email 等の member データを描画しない（不変条件 #11） | コンポーネント実装 + spec のテキスト非含有 assertion |
| AC-6 | web 側に新規の認証判定ロジック（cookie 解析・role 解決等）を追加しない。差分は `me.user.isAdmin` の参照のみ | `git diff` レビュー + grep（Phase 9） |
| AC-7 | 色は既存トークン / 既存 primitives（`SectionCard` / `ButtonLink`）経由のみ。HEX 直書き・新規 CSS クラス追加なし | `pnpm verify:tokens` + grep |
| AC-8 | `apps/api` / `packages/` / D1 schema / Google Form 仕様に差分ゼロ | `git diff --name-only -- apps/api packages` が空 |
| AC-9 | typecheck / lint / focused Vitest（`/profile` 配下）全 PASS | Phase 9 検証コマンド |

---

## Part 4: やってはいけないこと

| 禁止事項 | 理由 |
| --- | --- |
| web 側に認証判定ロジック（cookie 解析・role 解決・admin_users 照合等）を持ち込む | 認証判定の所有権は `apps/api`（session-guard / resolveSession）に閉じる（AC-6・fail-closed 維持）。web は `/me` の `isAdmin` を読むのみ |
| `memberId`・email 等の member データを `AdminAccessNotice` に渡す・描画する・ログ出力する | 不変条件 #11（AC-5）。`AdminAccessNotice` は props なしの静的コンポーネント |
| 新規 CSS クラス・globals.css 追記・新規トークン・HEX 直書き・新規 primitive の追加 | UI prototype alignment 不変条件 #2/#3（AC-7）。既存 `SectionCard` / `ButtonLink` で完結する |
| `apps/api` / `packages/` / D1 schema / Google Form 仕様への接触 | AC-8。本タスクは `apps/web` 表現層のみ |
| `/me` エラー degrade 分岐へのカード追加 | エラー状態では isAdmin の信頼できる値が無い + AC-4 不変 |
| `*.test.{ts,tsx}` 命名のテスト追加 | プロジェクト不変条件 #8（lefthook / CI が reject） |
| Issue #1192 の再オープン・PR での close キーワード参照 | Issue は CLOSED のまま維持し、本ワークフローを canonical とする |

---

## Part 5: user-gated 境界（CONST_002）

| 操作 | ゲート |
| --- | --- |
| コード実装・テスト実行（本ガイドの実装サイクル） | ユーザーが実装を明示指示したとき |
| 認証 runtime screenshot（staging / local 実機） | user-gated pending（jsdom render が一次証跡） |
| `git commit` / `git push` / `gh pr create --base dev` | G-1 / G-2 / G-3 の独立承認（`phase-13-pr.md` 参照） |
| staging デプロイ | user-gated |

本ガイドは planned contract であり、上記操作のいずれも本仕様書作成タスクでは実行していない。
