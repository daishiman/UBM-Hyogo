# Phase 2: 設計

> workflow: mypage-prototype-alignment

## 2.1 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 必要 UI | 再利用 primitive | 新規実装 |
|---------|------------------|----------|
| ページ見出し | （素の markup + tokens class） | page-head は markup のみ |
| 状態 banner | `Banner`（tone=success/info/warning） | なし |
| 公開状態サマリ | `Stat`（grid-3 で 3 枚） | `VisibilitySummary.tsx`（合成のみ） |
| プロフィールプレビュー | `Avatar` + `Chip` + `Card` | `ProfilePreview.tsx`（合成のみ） |
| 回答内容 | `Card` + `KVList` | `ProfileFields.tsx` 再構成 |
| 編集モーダル | `Modal` + `Button` | `RevalidateModal.tsx`（合成のみ） |
| 申請パネル | `Card` + 既存 `VisibilityRequest.client` / `DeleteRequest.client` | `RequestActionPanel.tsx` 再構成 |

**新規 primitive はゼロ**（不変条件 #4）。新規ファイルはすべて既存 primitives の合成 component。

## 2.2 コンポーネント topology（page.tsx 構成）

```
ProfilePage (Server Component, force-dynamic)
├── MemberHeader (動線: マイページ / 公開ページ / ログアウト)
└── <main data-route="member">
    ├── ProfileHeader            ST-1  page-head: eyebrow/h1/muted + btn-row
    │     ├── "公開ページを見る"  → /members/[memberId]（publishState 連動）
    │     └── EditCta (情報を更新する) → RevalidateModal trigger（client）
    ├── StatusBanner             ST-2  Banner(success/info) 公開状態 + 最終更新/回答ID
    ├── VisibilitySummary        ST-2  Stat grid-3 (public/member/admin counts)
    ├── ProfilePreview           ST-3  Avatar hero-split + name/occupation + Chips
    ├── ProfileFields            ST-3  Card + section ごと KVList グループ
    ├── EditCtaInline            ST-4  fields 見出し横「フォームを開いて更新」
    ├── RequestActionPanel       ST-5  danger-zone Card（公開停止 / 退会申請）
    └── AttendanceList           （既存維持 / 最小 Card ラップ）
```

> RevalidateModal は `open` state を持つため client component。page.tsx（Server）からは `EditCta`（client wrapper）に `editResponseUrl` / `fallbackResponderUrl` を渡す。

## 2.3 データフロー & adapter 設計（API 変更なし）

### VisibilitySummary の件数導出（web 層 adapter）

`apps/web/app/profile/_lib/visibility-counts.ts`（new）:

```typescript
import type { MemberProfileSection } from "@ubm-hyogo/shared";

export interface VisibilityCounts {
  readonly public: number;
  readonly member: number;
  readonly admin: number;
}

/**
 * profile.sections の全 field を visibility 別に集計する純粋関数。
 * API を変更せず、既存 GET /me/profile レスポンスのみから導出する。
 * 防御戦略: 未知 visibility 値は無視（例外を投げない / [WEEKGRD-02]）。
 */
export function deriveVisibilityCounts(
  sections: readonly MemberProfileSection[],
): VisibilityCounts {
  const counts: { public: number; member: number; admin: number } = {
    public: 0,
    member: 0,
    admin: 0,
  };
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.visibility === "public") counts.public += 1;
      else if (field.visibility === "member") counts.member += 1;
      else if (field.visibility === "admin") counts.admin += 1;
      // 未知値は無視（防御的）
    }
  }
  return counts;
}
```

入力: `MeProfileResponse.profile.sections` / 出力: `VisibilityCounts` / 副作用: なし（純粋関数）。

### 「公開ページを見る」リンク解決

- 入力: `me.user.memberId`, `statusSummary.publishState`
- 出力: `publishState === "public"` のとき `/members/${memberId}` への有効リンク。`member_only` / `hidden` のときは `aria-disabled` ボタン（公開されていない旨の title）。
- 副作用: なし。memberId は session 由来（不変条件: path に :memberId を含めず session から取得）。

### 編集導線（RevalidateModal）

- 入力: `editResponseUrl: string | null`, `fallbackResponderUrl: string`
- 挙動: page-head「情報を更新する」押下 → Modal open。Modal 内「フォームを開く」は `editResponseUrl ?? fallbackResponderUrl` を `target="_blank" rel="noopener noreferrer"` で開く。
- prototype 文言: 「情報の更新は、Googleフォームから再回答する形で行います。新しい回答があった場合、古い回答はアーカイブされ、自動的に新しい回答に置き換わります。」+ stableKey 引き継ぎ注記。

## 2.4 各サブタスクの関数・型・I/O 定義

### ST-1 ProfileHeader（page.tsx 内 or `_components/ProfileHeader.tsx`）

```typescript
export interface ProfileHeaderProps {
  readonly memberId: string;
  readonly publishState: PublishState;
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
}
```
- markup: `<div className="page-head">` 相当（tokens class）。eyebrow「MY PROFILE」/ h1「マイページ」/ muted「公開情報と会員限定情報を確認・編集できます。」
- btn-row: `公開ページを見る`（ghost, icon=eye）+ `EditCta`（情報を更新する / primary, icon=edit）。

### ST-2 StatusBanner + VisibilitySummary

```typescript
// StatusBanner — StatusSummary.tsx を Banner ベースへ再構成
export interface StatusBannerProps {
  readonly statusSummary: MeProfileStatusSummary;
  readonly authGateState: MeAuthGateState;
}
// Banner tone: publishState==="public" → success / "member_only" → info / "hidden" → warning

// VisibilitySummary — new
export interface VisibilitySummaryProps {
  readonly sections: readonly MemberProfileSection[];
}
// 内部で deriveVisibilityCounts(sections) を呼び、Stat × 3 を grid で描画
```

### ST-3 ProfilePreview + ProfileFields

```typescript
export interface ProfilePreviewProps {
  readonly memberId: string;
  readonly displayName: string;       // sections から stableKey 経由で取得（fullName 相当）
  readonly subtitle?: string;         // occupation 相当
  readonly chips?: readonly { label: string; tone?: ChipTone }[];
}
// Avatar(size="xl", memberId) + name + subtitle + Chip row

// ProfileFields — Card + section ごと KVList（既存 renderValue 流用）
export interface ProfileFieldsProps {
  readonly sections: readonly MemberProfileSection[];
}
```

> displayName / subtitle / chips は `sections` から `stableKey` 経由で抽出（不変条件 #6）。抽出は `_lib/profile-summary.ts`（new, 純粋関数 `pickProfileSummary(sections)`）に閉じる。chips は `nickname` / `location` / `ubmMembershipType` のうち値があるものだけを `{ label, tone: "neutral" }` として返し、stableKey が無い場合は安全に空配列で返す。

### ST-4 EditCta + RevalidateModal

```typescript
// EditCta.client.tsx — "情報を更新する" ボタン + RevalidateModal を内包（client）
export interface EditCtaProps {
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
  readonly variant?: "header" | "inline"; // header=primary大 / inline=ghost小
}

// RevalidateModal.tsx — Modal 合成（client）
export interface RevalidateModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
}
```

### ST-5 RequestActionPanel（danger-zone）

- 既存 `VisibilityRequest.client` / `DeleteRequest.client`（POST 経路）を **そのまま使用**し、外側を danger-zone Card（border tone=danger soft）でラップ。eyebrow「DANGER ZONE」/ h2「公開の停止・退会」/ 説明文。
- POST endpoint・body schema は不変。

### ST-6 MemberHeader 動線強化

```typescript
// MemberHeader.tsx
// 現状: <a href="/profile">マイページ</a> + SignOutButton
// 拡張: brand + nav(マイページ / 公開ページ) + SignOutButton。
// "公開ページ" は /members（一覧）への汎用リンク（memberId 不要）。
```
- `data-testid="member-header"` は維持（既存テスト互換）。

## 2.5 状態所有権テーブル（[Feedback W1-02b-2] 相当）

| 状態 | 所有者 | 備考 |
|------|--------|------|
| profile データ（sections / statusSummary / editResponseUrl） | Server Component（page.tsx の fetchAuthed） | props で子へ down |
| RevalidateModal open | `EditCta.client` の `useState` | client 境界はここに閉じる |
| 申請 Dialog open / pending / error | 既存 `VisibilityRequest.client` / `DeleteRequest.client` | 本タスクで変更しない |
| VisibilityCounts | 導出値（state ではない） | `deriveVisibilityCounts` の戻り値 |

## 2.6 ロック変数の解放経路（[Feedback STATE-DETAIL-01]）

RevalidateModal は単純 open/close のみ（生成ロック無し）。Escape / backdrop / キャンセル / 「フォームを開く」後の close、全経路で `onClose()` により `open=false`。`Modal` primitive 側で Escape ハンドリング済み。

## 2.7 アクセシビリティ

- 各領域に `<section aria-label="...">`。
- StatusBanner: `Banner` が tone により role=status/alert を自動付与。
- 「公開ページを見る」無効時は `aria-disabled="true"` + 理由を `title`。
- RevalidateModal: `Modal` が focus trap / Escape / `aria-modal` を担保（既存 primitive）。
- danger-zone のボタンは破壊的操作のため `ConfirmDialog` 経由（既存 Dialog 維持）。

## 2.8 検証パス設計

- 純粋関数（`deriveVisibilityCounts` / `pickProfileSummary`）→ unit test（`*.spec.ts`）。
- 各 component → component test（`*.component.spec.tsx`、`@testing-library/react`）。`window` 全置換は禁止、必要時 `Object.defineProperty`（[Feedback VSCPKR-02]）。
- 統合 → Playwright smoke（4 領域 + Modal open）。
- 回帰 → `verify-design-tokens`（HEX 直書き検出）。

## 2.9 SubAgent lane（仕様書生成時の並列設計 — 実装時の並列ではない）

| lane | サブタスク | 並列可否 |
|------|-----------|----------|
| A | ST-1 / ST-4（page-head + 編集導線） | 並列 |
| B | ST-2 / ST-3（状態可視化 + fields） | 並列 |
| C | ST-5 / ST-6（danger-zone + header） | 並列 |
| 締め | Phase 9 QA / verify | 直列 |

> 実装サイクルでは page.tsx が全 lane の合流点となるため、page.tsx 統合は最後に直列でまとめる。
