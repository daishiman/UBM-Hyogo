---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 2
phase_name: 設計
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 前提 | Phase 1 完了（分岐 (b) 確定・AC-1〜AC-9 確定） |
| 対象層 | `apps/web` 表現層のみ |

## 目的

Phase 1 で確定した要件（管理者補助導線 = 分岐 (b)）を、変更対象ファイル・コンポーネントシグネチャ・DOM 契約・文言・配置として確定し、Phase 5 実装が迷わない粒度に落とす。

## 既存コンポーネント再利用可否

| 必要要素 | 再利用する既存正本 | 新規作成 |
| --- | --- | --- |
| カード枠 | `SectionCard`（`@/components/ui/layout`・PR #1213 正本） | 不要 |
| 導線ボタン | `ButtonLink`（`@/components/ui/ButtonLink`・variant/size 既存） | 不要 |
| 管理者判定値 | `me.user.isAdmin`（`/me` レスポンス・取得済み） | 不要（新規 fetch なし） |
| 案内表示そのもの | なし（管理者文脈の表示は既存に存在しない） | **`AdminAccessNotice`（唯一の新規）** |

新規 primitive は作らない（UI prototype alignment 不変条件 #3）。新規 CSS クラスも追加しない（既存 `SectionCard` / `ButtonLink` の className/data 属性のみで構成）。

## 状態所有権 / 責務境界

| 責務 | 所有者 | 本タスクでの扱い |
| --- | --- | --- |
| 管理者か否かの判定 | `apps/api/src/middleware/session-guard.ts`（`admin_users` 照合） | **不変**。web は `/me` レスポンスの `isAdmin` を読むのみ |
| session 発行可否（member identity 必須） | `apps/api/src/use-cases/auth/resolve-session.ts` | **不変** |
| `/profile` の表示分岐 | `apps/web/app/(member)/profile/page.tsx`（Server Component） | `isAdmin` による条件描画 1 箇所を追加 |
| 管理者案内の表示内容 | `AdminAccessNotice`（新規・純表示・props なし） | 新設 |

## コンポーネント設計（シグネチャ・DOM 契約・文言）

### D-1. `AdminAccessNotice`（新規: `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx`）

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

- **入力**: なし（props なし・静的）。
- **出力**: `SectionCard`（`data-component="section-card"` / `data-tone="accent"`）+ 案内文 + `/admin` への `ButtonLink`。
- **副作用**: なし（純表示・client hook なし・`.client.tsx` suffix 不要）。
- **エラーハンドリング**: 不要（入力なし・分岐なし）。
- `SectionCard` の rest props 透過（`data-testid` / `aria-label`）は既存実装（`{...rest}` 展開）で成立する。Phase 5 実装時に `SectionCardProps` が `data-testid` を透過しない場合は、`section` 要素への `data-testid` 直付けではなく `SectionCard` の `id`/`aria-label` + `getByRole("region", { name: "管理者向けのご案内" })` 系 query へテストを寄せる（DOM 契約の正は accessible name とする）。

### D-2. `page.tsx` への組み込み（編集: `apps/web/app/(member)/profile/page.tsx`）

認証成功描画（`data-testid="profile-authenticated-root"` ブロック）内、`<ProfileHeader ... />` の直後に 1 行追加する:

```tsx
<ProfileHeader ... />            {/* 既存・不変 */}
{me.user.isAdmin ? <AdminAccessNotice /> : null}
<SectionCard aria-label="プロフィール写真"> {/* 既存・不変 */}
```

- 配置根拠: 管理者がページを開いた直後に視認でき、member プロフィール本体（写真以下）の構造を変えない先頭位置。
- `/me` エラー degrade 分岐・profile fetch 失敗分岐には**追加しない**（エラー状態では isAdmin の信頼できる値が無い + AC-4 不変）。
- import 追加 1 行: `import { AdminAccessNotice } from "./_components/AdminAccessNotice";`

### D-3. 文言（確定）

| 要素 | 文言 |
| --- | --- |
| カード見出し（`title`） | 管理者メニュー |
| 本文 | 管理者アカウントでログインしています。会員情報の管理・開催と出席の記録・公開状態の確認は管理画面から行えます。 |
| 導線ボタン | 管理画面を開く（`href="/admin"`） |

- 用語整合: 「開催・出席管理」系の管理画面命名（admin sidebar 正本）と矛盾しない平易な日本語とし、英語テクニカル語を使わない（既存の日本語化ワークフロー群の方針に整合）。

## 変更対象ファイル一覧（CONST_005）

| # | パス | 種別 | 内容 |
| --- | --- | --- | --- |
| 1 | `apps/web/app/(member)/profile/_components/AdminAccessNotice.tsx` | 新規 | D-1 のコンポーネント |
| 2 | `apps/web/app/(member)/profile/page.tsx` | 編集 | import 1 行 + 条件描画 1 行（D-2） |
| 3 | `apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` | 新規 | コンポーネント focused spec（Phase 4/6 で定義） |
| 4 | `apps/web/app/(member)/profile/page.spec.tsx` | 編集 | isAdmin true/false の page-level spec 追加（Phase 4/6 で定義） |

上記 4 ファイル以外に差分を発生させない（`apps/api` / `packages/` / CSS / トークン非接触）。

## CSS 設計

- 新規 CSS クラス・globals.css 追記・トークン追加は**ゼロ**。`SectionCard`（`ui-section-card` + `data-tone="accent"`）と `ButtonLink`（`buttonVariants` 既存）が既に保有する視覚契約のみを使う。
- AC-7 検証: `pnpm verify:tokens` と `git diff --name-only -- apps/web/src/styles` が空であること。

## ステップ間 state 引き渡し

- 該当なし（Server Component の同期描画のみ。client state・URL state・cookie いずれも不使用）。

## 実行タスク

1. D-1 シグネチャ・DOM 契約・文言の確定（本書）。
2. D-2 組み込み位置の確定（本書）。
3. Phase 3 で 4 条件評価・命名衝突検査・リスク評価を行い設計を凍結する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-1-requirements.md` | 要件・AC の正本 |
| `apps/web/src/components/ui/layout/SectionCard.tsx` | カード正本のシグネチャ（title/tone/rest 透過） |
| `apps/web/src/components/ui/ButtonLink.tsx` | 導線ボタン正本のシグネチャ（variant/size） |
| `apps/web/app/(member)/profile/page.tsx` | 組み込み点の現行構造 |
| `docs/00-getting-started-manual/claude-design-prototype/` | デザイン言語正本（primitives + tokens + rhythm） |
| `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本（新規色なしの根拠） |

## 成果物

- 本ファイル（Phase 2 設計）。

## 統合テスト連携

- DOM 契約（`data-testid="profile-admin-access-notice"` / accessible name「管理画面を開く」）を Phase 4 テスト計画の selector 正本とする。

## 完了条件

- [x] 新規/編集ファイルが 4 件に確定し、シグネチャ・DOM 契約・文言が逐語で記述されている
- [x] 既存 primitives 再利用と新規 CSS ゼロが明記されている
- [x] 認証境界の所有権（api 側）が設計上維持されている
- [x] member（非管理者）描画への影響ゼロが設計上保証されている（条件描画 1 箇所のみ）
