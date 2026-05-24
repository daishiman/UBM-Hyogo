# Phase 5: 実装（GREEN）

> workflow: mypage-prototype-alignment
> task 種別: UI task（VISUAL） / implementation_mode: "existing-ui-alignment"
> 正本: Phase 2 設計（topology §2.2 / props §2.4 / 状態所有権 §2.5）+ prototype MyProfilePage（L219-371）

Phase 4 で RED にした test を全て GREEN にする実装。**新規 primitive 禁止**（既存 `apps/web/src/components/ui/` の合成のみ）。色は OKLch tokens（`tokens.css` のクラス / token 変数）のみ。HEX 直書き・`bg-[#xxx]`・`text-[#xxx]` 禁止（[不変条件 2 / verify-design-tokens]）。

> canUseTool 系（SDK callback 配線）は本タスク非該当のため省略。

---

## 5.1 変更対象ファイル一覧（新規 / 修正）

### 新規作成

| パス | 責務 | client/server |
|------|------|---------------|
| `apps/web/app/profile/_lib/visibility-counts.ts` | `deriveVisibilityCounts`（純粋関数） | — |
| `apps/web/app/profile/_lib/profile-summary.ts` | `pickProfileSummary`（純粋関数） | — |
| `apps/web/app/profile/_components/ProfileHeader.tsx` | ST-1 page-head + btn-row | Server |
| `apps/web/app/profile/_components/VisibilitySummary.tsx` | ST-2 Stat grid-3 件数 | Server |
| `apps/web/app/profile/_components/ProfilePreview.tsx` | ST-3 Avatar hero-split + Chips | Server |
| `apps/web/app/profile/_components/EditCta.client.tsx` | ST-4 「情報を更新する」+ RevalidateModal 内包 | Client |
| `apps/web/app/profile/_components/RevalidateModal.tsx` | ST-4 Modal 合成 | Client |

### 修正

| パス | 変更内容 |
|------|---------|
| `apps/web/app/profile/_components/StatusSummary.tsx` | KVList ベース → `Banner` ベース `StatusBanner` へ再構成（公開状態 tone + 最終更新/同意要約）|
| `apps/web/app/profile/_components/ProfileFields.tsx` | `Card` でラップし section ごとに eyebrow + `KVList` 化（`renderValue` 流用）|
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | 外側を danger-zone `Card`（border tone=danger soft）でラップ。POST 経路（VisibilityRequest/DeleteRequest）不変 |
| `apps/web/app/profile/_components/EditCta.tsx` | 旧素リンク版を撤去し `EditCta.client.tsx` へ置換（page.tsx の import を差し替え）|
| `apps/web/src/components/layout/MemberHeader.tsx` | brand + nav（マイページ / 公開ページ→`/members`）+ SignOutButton。`data-testid="member-header"` 維持 |
| `apps/web/app/profile/page.tsx` | 全 component を Phase 2 §2.2 topology 順に統合（最後に直列合流）|

> 旧 `PublicVisibilityBanner.tsx` は `StatusBanner` に役割を統合する。page.tsx から import を外す（ファイル削除 or `export {}` stub 化のいずれか。live import ゼロを Phase 9 で確認）。

---

## 5.2 各ファイル実装方針

### `_lib/visibility-counts.ts`（新規 / 純粋関数）

Phase 2 §2.3 のコードをそのまま実装。`for...of` で section.fields を走査し `public/member/admin` のみカウント、未知値は無視（防御戦略: 例外なし / [WEEKGRD-02]）。export: `VisibilityCounts` interface + `deriveVisibilityCounts`。

### `_lib/profile-summary.ts`（新規 / 純粋関数）

```typescript
import { STABLE_KEY, type MemberProfileSection } from "@ubm-hyogo/shared";
export interface ProfileSummary {
  readonly displayName: string;
  readonly subtitle: string;
  readonly chips: readonly { label: string; tone: "neutral" }[];
}
export function pickProfileSummary(sections: readonly MemberProfileSection[]): ProfileSummary;
```
- 全 section.fields を走査し `field.stableKey === STABLE_KEY.fullName` → displayName、`=== STABLE_KEY.occupation` → subtitle。
- `STABLE_KEY.nickname` / `STABLE_KEY.location` / `STABLE_KEY.ubmMembershipType` は値がある場合だけ `chips` に追加する。chips の tone は `"neutral"` 固定（視覚責務を増やさない）。
- 抽出値が `null`/`undefined`/非文字列 → `""`（防御的・例外なし）。string 化は `typeof v === "string" ? v : ""`。
- stableKey リテラル直書き禁止（必ず `STABLE_KEY` 経由）。

### `_components/ProfileHeader.tsx`（ST-1 / Server）

- props: `{ memberId, publishState, editResponseUrl, fallbackResponderUrl }`（Phase 2 §2.4）。
- markup: `<div className="page-head">` 相当。`<div className="eyebrow">MY PROFILE</div>`、`<h1 className="h-page">マイページ</h1>`、`<p className="muted">公開情報と会員限定情報を確認・編集できます。</p>`。
- btn-row（`<div className="btn-row">`）:
  - 「公開ページを見る」: `publishState==="public"` のとき `Button`（`variant="ghost"`, `leftIcon={<Icon name="eye"/>}`）を `next/link` or `<a href={/members/${memberId}}>` でラップした有効リンク。`member_only` / `hidden` のときは `aria-disabled="true"` + `title`（非公開の理由）で `href` を出さない。
  - 「情報を更新する」: `EditCta`（`variant="header"`）を配置（client island）。
- tokens class（`page-head` / `eyebrow` / `h-page` / `muted` / `btn-row`）は prototype と既存 tokens.css の語彙のみ使用。

### `_components/StatusBanner.tsx`（StatusSummary.tsx の再構成 / Server）

- export 名は page.tsx 統合に合わせ `StatusBanner`（ファイル名は `StatusSummary.tsx` を流用 or `StatusBanner.tsx` へ rename。本仕様では **`StatusSummary.tsx` 内で `StatusBanner` を export** し import 差し替えを最小化）。
- `Banner` の `tone`: `public→"success"` / `member_only→"info"` / `hidden→"warning"`。
- `title`: 「プロフィールは公開されています」/「会員限定で公開しています」/「現在は非公開です」相当。children に同意・認証要約（既存 `labelOfConsent`/`labelOfGate` を流用した小さな補足行）。
- `icon`: `<Icon name="checkCircle"/>` 等（tone に応じ）。Banner 仕様で warning/danger は `role="alert"`、それ以外 `role="status"`（primitive 任せ）。
- 色は Banner primitive 側の `data-tone` 経由（tokens 解決）。コンポーネントから HEX/inline 色を書かない。

### `_components/VisibilitySummary.tsx`（ST-2 / Server / 新規）

- props: `{ sections }`。内部で `deriveVisibilityCounts(sections)` を呼ぶ。
- `<div className="grid-3">` 内に `Stat` × 3:
  - PUBLIC（`label` 相当 eyebrow + `Icon name="eye"`）: `value={counts.public}`、helpText「公開中の項目」。
  - MEMBERS（`Icon name="users"`）: `value={counts.member}`、helpText「会員のみに公開」。
  - PRIVATE（`Icon name="shield"`）: `value={counts.admin}`、helpText「管理者のみ閲覧」。
- `Stat` の `label`/`value`/`helpText` props に配線（新規装飾は付けない）。

### `_components/ProfilePreview.tsx`（ST-3 / Server / 新規）

- props: `{ memberId, displayName, subtitle?, chips? }`（Phase 2 §2.4）。displayName/subtitle は page.tsx 側で `pickProfileSummary(sections)` から渡す。
- markup: `<div className="card card-pad-lg hero-split">` 相当。`Avatar`（`size="xl"`, `memberId={memberId}`, `name={displayName || "会員"}`）+ 右に eyebrow「PREVIEW」/ `<h2 className="h-page">{displayName}</h2>` / `subtitle` / `chip-row`。
- chips が空 or displayName 空のときも安全に描画（欠損 = 空表示、例外なし）。

### `_components/ProfileFields.tsx`（ST-3 / 修正）

- 既存 `renderValue` を流用。全体を `Card`（`card-pad-lg`）でラップ。
- section ごとに `<div className="eyebrow">{section.title}</div>` + `KVList`（`items={section.fields.map(f => ({ key: f.label, value: renderValue(f.value) }))}`）。
- `ProfileFieldsProps` は `sections` のみを維持する。fields 近傍の inline 編集導線は `page.tsx` 側で `ProfileFields` 直後に `EditCta variant="inline"` を置く（props drift 防止）。

### `_components/EditCta.client.tsx`（ST-4 / Client / 新規）

```typescript
"use client";
export interface EditCtaProps {
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
  readonly variant?: "header" | "inline";
}
```
- `const [open, setOpen] = useState(false)`（**internal state**: RevalidateModal の open はここが所有 / Phase 2 §2.5）。
- `variant==="header"`: `Button variant="primary" leftIcon={<Icon name="edit"/>}` 「情報を更新する」。`variant==="inline"`: `Button variant="ghost" size="sm" leftIcon={<Icon name="external"/>}` 「フォームを開いて更新」。
- click → `setOpen(true)`。`<RevalidateModal open={open} onClose={() => setOpen(false)} editResponseUrl=... fallbackResponderUrl=... />` を内包。
- 解放経路: Escape / キャンセル / フォームを開く後の close は全て `onClose` 経由（ロック変数なし / Phase 2 §2.6）。

### `_components/RevalidateModal.tsx`（ST-4 / Client / 新規）

```typescript
"use client";
export interface RevalidateModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
}
```
- `Modal`（`open`, `onClose`, `title="情報を最新化しますか？"`）を合成。internal state を持たない（open は prop）。
- body: prototype 文言「情報の更新は、Googleフォームから再回答する形で行います。新しい回答があった場合、古い回答はアーカイブされ、自動的に新しい回答に置き換わります。」+ info note「フォームの設問が変更されている場合、過去の回答内容は項目ごとに引き継がれます（stableKey による紐付け）。」（`<Icon name="info"/>` 付き）。
- foot: 「キャンセル」（`Button variant="ghost"` → `onClose`）+ 「フォームを開く」。
- 「フォームを開く」: `const href = editResponseUrl ?? fallbackResponderUrl;` を `<a href={href} target="_blank" rel="noopener noreferrer">`（`Button` を `<a>` でラップ or リンク化）。click 後 `onClose()`。
- 色・装飾は tokens class のみ（prototype の inline style は OKLch token 変数経由のクラスに置き換える。HEX 禁止）。

### `_components/RequestActionPanel.tsx`（ST-5 / 修正）

- 既存ロジック（rulesConsent gate / pending banner / VisibilityRequestDialog / DeleteRequestDialog / POST 経路）は **完全不変**。
- 外側 `<section>` を `Card`（danger-zone: border tone=danger soft / tokens class）でラップし、eyebrow「DANGER ZONE」（danger tone class）/ h2「公開の停止・退会」/ 説明文を追加。
- `data-testid="request-action-panel"` / `"request-action-panel-disabled"` は維持（既存テスト互換）。

### `src/components/layout/MemberHeader.tsx`（ST-6 / 修正）

- brand（サイト名 or ロゴ markup）+ `<nav>`（「マイページ」→`/profile` 維持 / 「公開ページ」→`/members`）+ `SignOutButton`。
- `data-testid="member-header"` 維持。既存テストの「マイページ」リンク href=`/profile` を壊さない。

### `app/profile/page.tsx`（統合 / 修正・最後に直列合流）

統合順序（Phase 2 §2.2）:
```
<MemberHeader />
<main data-route="member" data-section-rhythm="comfortable">
  <ProfileHeader memberId={me.user.memberId} publishState={statusSummary.publishState}
                 editResponseUrl={editResponseUrl} fallbackResponderUrl={fallbackResponderUrl} />
  <StatusBanner statusSummary={statusSummary} authGateState={me.authGateState} />
  <VisibilitySummary sections={profile.sections} />
  <ProfilePreview memberId={me.user.memberId} {...pickProfileSummary(profile.sections)} />
  <ProfileFields sections={profile.sections} />
  <EditCta editResponseUrl={editResponseUrl} fallbackResponderUrl={fallbackResponderUrl} variant="inline" />
  <RequestActionPanel publishState={statusSummary.publishState}
                      rulesConsent={statusSummary.rulesConsent}
                      pendingRequests={profileRes.pendingRequests} />
  <AttendanceList attendance={profile.attendance} attendanceMeta={profile.attendanceMeta} />
</main>
```
- `me.user.memberId` を使用（session 由来 / path に :memberId を含めない / 不変条件 #7）。
- 旧 `PublicVisibilityBanner` / 旧 `StatusSummary`（KVList 版）/ 旧 `EditCta`（素リンク版）の import を撤去。
- `fetchAuthed` 経由のデータ取得・redirect/notFound 分岐は不変（D1 直接禁止 / 不変条件 #5）。

---

## 5.3 入出力・副作用

| 対象 | 入力 | 出力 | 副作用 |
|------|------|------|--------|
| `deriveVisibilityCounts` | `sections` | `VisibilityCounts` | なし（純粋）|
| `pickProfileSummary` | `sections` | `ProfileSummary` | なし（純粋）|
| ProfileHeader/StatusBanner/VisibilitySummary/ProfilePreview/ProfileFields | props | JSX | なし（Server, read-only）|
| EditCta.client | props | JSX | open state（client / 自身に閉じる）|
| RevalidateModal | props | JSX | 「フォームを開く」で外部 URL を別タブ起動 |
| RequestActionPanel | props | JSX | POST（既存 /me 系・不変）|

API surface 変更ゼロ / D1 直接アクセスなし / Google Form 仕様変更なし（不変条件 1/4/5）。

---

## 5.4 テスト方針（GREEN 化）

- Phase 4 の RED テストを全て GREEN にする。実装後、4.5 の targeted run コマンドで再実行。
- MemberHeader 既存ケース + 新規「公開ページ」ケースの双方 GREEN を確認。
- EditCta は internal state（open）、RevalidateModal は external prop（open）として実装し、それぞれのテスト前提に一致させる（[VSCPKR-03]）。

---

## 5.5 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared build

# GREEN 確認（Phase 4 の targeted リスト）
mise exec -- pnpm --filter web exec vitest run \
  app/profile/_lib/__tests__/visibility-counts.spec.ts \
  app/profile/_lib/__tests__/profile-summary.spec.ts \
  app/profile/_components/__tests__/ProfileHeader.component.spec.tsx \
  app/profile/_components/__tests__/StatusBanner.component.spec.tsx \
  app/profile/_components/__tests__/VisibilitySummary.component.spec.tsx \
  app/profile/_components/__tests__/EditCta.component.spec.tsx \
  app/profile/_components/__tests__/RevalidateModal.component.spec.tsx \
  src/components/layout/__tests__/MemberHeader.spec.tsx

mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 色トークン回帰
mise exec -- pnpm exec verify-design-tokens   # CI gate と同等（task-18）。HEX/bg-[#]/text-[#] 検出で fail
```

---

## 5.6 DoD（Phase 5 完了条件）

1. 5.1 の新規 7 ファイル + 修正 6 ファイルが実装され、page.tsx へ統合済み。
2. Phase 4 の全 RED テストが GREEN（targeted run で fail 0）。
3. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が pass。
4. HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` ゼロ（verify-design-tokens pass）。
5. 新規 primitive ゼロ（既存 `ui/` 合成のみ）。
6. ST-5 の POST 経路（VisibilityRequest/DeleteRequest dialog・endpoint・body）が完全不変。
7. `me.user.memberId`（session 由来）以外から memberId を取得していない。
8. 旧 `PublicVisibilityBanner` / 旧 KVList版 StatusSummary / 旧素リンク EditCta の live import がゼロ。
