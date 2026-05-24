# Phase 1: 要件定義

> workflow: mypage-prototype-alignment
> implementation_mode: `existing-ui-alignment`（既存 `/profile` 4 領域分割を土台に prototype へ視覚整備）
> taskType: `implementation` / VISUAL

## 1.1 タスク分類（[Feedback 1] / [Feedback 3]）

| 項目 | 値 |
|------|----|
| タスク種別 | **UI task（VISUAL）** |
| Phase 11 | VISUAL（screenshot 必須）。`screenshot-plan.json` の `mode` は `VISUAL` をデフォルトとする |
| docs-only か | No（コード変更を伴う実装仕様書） |

## 1.2 上位ゴール

`/profile`（会員マイページ）を prototype `MyProfilePage`（`claude-design-prototype/pages-member.jsx:219-371`）準拠の視覚構成へ整え、**編集導線（Google Form 再回答）・公開ページ確認・公開状態の可視化を発見しやすくする**。本人による本文編集 UI は描画しない（不変条件 #2: MVP では Form 再回答が更新経路）。`apps/api/src/routes/me/*` および `apps/web/app/api/me/*` の API surface は一切変更しない。

## 1.3 carry-over 確認（前タスク棚卸し）

`git log --oneline -5`:
```
3294a0cd1 feat(issue-520): Slack #ubm-hyogo-incidents channel + webhook ...
014f599a3 feat(serial-05): bind 09e/f/g blueprints to 19 routes (page.tsx layer)
318c8e117 feat(issue-277): Next.js proxy migration — middleware→proxy.ts rename
```

- 前タスク `task-14-w5-par-my-profile-and-requests`（completed）が `/profile` を 4 領域（PublicVisibilityBanner / StatusSummary / RequestActionPanel / DeleteRequestDialog）に分割済み。
- **今タスクとの差分**: 前タスクは「領域分割 + 申請 Dialog の primitive 化」まで。現状コンポーネントは `<dl>` / `<h2>` の bare semantic HTML で、prototype の **page-head / Card surface / Stat grid / Avatar preview / RevalidateModal / danger-zone styling / 動線ボタン群**が未実装。今タスクはこの視覚整備 + 動線整備を担う。
- serial-05（014f599a3）で 19 routes の page.tsx layer が blueprint bind 済み。`/profile` の page.tsx は本タスクで再構成する。

## 1.4 既存コードベース inventory

### 対象ルート構成

```
apps/web/app/profile/
├── page.tsx                       # Server Component（fetchAuthed × 2: /me, /me/profile）
├── error.tsx / not-found.tsx / loading.tsx
└── _components/
    ├── PublicVisibilityBanner.tsx # 公開状態 banner（bare）
    ├── StatusSummary.tsx          # アカウント状態 KVList（bare）
    ├── ProfileFields.tsx          # profile.sections を dl で表示（bare）
    ├── EditCta.tsx                # Google Form リンク（plain <a>）
    ├── RequestActionPanel.tsx     # visibility/delete 申請パネル
    ├── VisibilityRequest.client.tsx / VisibilityRequestDialog.tsx
    ├── DeleteRequest.client.tsx / DeleteRequestDialog.tsx
    ├── RequestPendingBanner.tsx / RequestErrorMessage.tsx
    └── AttendanceList.tsx
```

### 既存 API surface（不変・参照のみ）

| endpoint（apps/api） | method | web 消費 | 役割 |
|---------------------|--------|----------|------|
| `/me` | GET | `fetchAuthed<MeSessionResponse>("/me")` | SessionUser（memberId, authGateState） |
| `/me/profile` | GET | `fetchAuthed<MeProfileResponse>("/me/profile")` | profile.sections / statusSummary / editResponseUrl / fallbackResponderUrl / pendingRequests |
| `/me/attendance` | GET | AttendanceList | 出席履歴ページング |
| `/me/visibility-request` | POST | VisibilityRequest.client | 公開停止/再開 申請（admin queue） |
| `/me/delete-request` | POST | DeleteRequest.client | 退会申請（admin queue） |

> `apps/api/src/routes/me/index.ts:5` 明記: 「本人プロフィール本文を D1 で編集する route を一切 mount しない。PATCH 系は無し」。本タスクはこの制約を維持する。

### 型（`apps/web/src/lib/api/me-types.ts` / `@ubm-hyogo/shared`）

- `MeSessionResponse { user: MeSessionUser; authGateState: MeAuthGateState }`
- `MeProfileResponse { profile: MemberProfile; statusSummary: MeProfileStatusSummary; editResponseUrl: string | null; fallbackResponderUrl: string; pendingRequests: PendingRequests }`
- `MeProfileStatusSummary { publishState: "public"|"member_only"|"hidden"; publicConsent; rulesConsent; isDeleted }`
- `MemberProfileSection { key; title; fields: MemberProfileSectionField[] }`
- `MemberProfileSectionField { stableKey; label; value; visibility: "public"|"member"|"admin" }`
- `FieldVisibility = "public" | "member" | "admin"`（`packages/shared/src/types/common.ts:3`）

> **重要**: `MemberProfileSectionField.visibility` が存在するため、prototype の VisibilitySummary（grid-3: PUBLIC / MEMBERS / PRIVATE）は **`profile.sections[].fields[].visibility` を集計する web 層 adapter** で導出できる。新規 API 不要。

### 既存 primitives（`apps/web/src/components/ui/` — 新規追加禁止・これらのみ使用）

`Avatar`, `Badge`, `Banner`, `Button`, `Card`, `Chip`, `ConfirmDialog`, `Drawer`, `EmptyState`, `Field`, `FormField`, `Icon`, `KVList`, `LinkPills`, `Modal`, `Pagination`, `Search`, `Segmented`, `Select`, `Sidebar`, `Stat`, `Switch`, `Textarea`, `Toast`

主要シグネチャ:
- `Avatar { memberId?; name; hue?; size?: "sm"|"md"|"lg"|"xl"; className? }`（`editable` prop は無し → prototype の editable は MVP 非対応、省略）
- `Modal { open: boolean; onClose: () => void; title?; children }`
- `Banner { tone?: "info"|"success"|"warning"|"danger"; icon?; title?; action?; children }`
- `Stat { label; value; delta?; tone?: "neutral"|"up"|"down"; helpText? }`
- `KVList { items: { key: string; value: ReactNode }[] }`
- `Card`, `Chip`, `Button`（variant / size / icon）

### tokens（`apps/web/src/styles/tokens.css` — OKLch 正本）

OKLch トークン 106 行。`--accent` / `--ok` / `--danger` / `--text` / `--border` / `--panel` 等。HEX 直書き禁止（verify-design-tokens gate）。

## 1.5 命名規則分析（既存コードベース整合）

| 種別 | 規則 | 例 |
|------|------|----|
| コンポーネントファイル | PascalCase `.tsx` | `StatusSummary.tsx`, `EditCta.tsx` |
| client component | `*.client.tsx` | `VisibilityRequest.client.tsx` |
| component test | `*.component.spec.tsx` | `PublicVisibilityBanner.component.spec.tsx` |
| 純粋関数 / adapter | `_lib/` 配下 kebab-case `.ts` | `_lib/visibility-counts.ts`（new） |
| adapter 関数 | camelCase 動詞始まり | `deriveVisibilityCounts()` |
| props interface | `<Component>Props` | `StatusSummaryProps` |
| 新規 test | `*.spec.{ts,tsx}` のみ（`*.test` 禁止） | `visibility-counts.spec.ts` |

> 新規コンポーネントは既存命名（`ProfilePreview.tsx` / `VisibilitySummary.tsx` / `RevalidateModal.tsx`）に揃える。client 化が必要なものは `*.client.tsx`。

## 1.6 targeted test 範囲（[FB-UI-02-2]）

全件 `pnpm test` は重いため、本タスクの targeted run 対象を事前列挙:

```
apps/web/app/profile/_components/__tests__/
apps/web/app/profile/_components/*.component.spec.tsx
apps/web/app/profile/_lib/*.spec.ts
apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx
```

実行例:
```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/profile
```

## 1.7 受入条件（DoD ベースライン）

1. `/profile` が prototype `MyProfilePage` の領域構成（page-head / status banner / visibility summary / profile preview / fields / danger zone / revalidate modal）を持つ。
2. 編集導線が3経路で到達可能: page-head「情報を更新する」→ RevalidateModal →「フォームを開く」/ fields「フォームを開いて更新」/ status banner 近傍の更新導線。すべて既存 `editResponseUrl` / `fallbackResponderUrl` を使用。
3. VisibilitySummary が `profile.sections` の field visibility から public/member/admin 件数を表示。
4. 「公開ページを見る」が `/members/[memberId]` へ遷移（`me.user.memberId` 使用、publishState が hidden の場合は無効化 or 非表示）。
5. `MemberHeader` から マイページ / 公開ページ / ログアウト に到達できる。
6. 配色は OKLch tokens のみ（HEX 直書き 0 件、`verify-design-tokens` PASS）。
7. 既存 `/me/*` API surface 変更 0 件（diff に `apps/api/src/routes/me/` 変更を含まない）。
8. `pnpm typecheck` / `pnpm lint` PASS、targeted test GREEN。
9. Playwright smoke で 4 領域表示 + RevalidateModal open が確認できる。

## 1.8 スコープ外（未タスク化候補の検出元）

- アバター画像アップロード（prototype の `editable` Avatar）→ MVP 非対応（API 無し）。
- AttendanceList の視覚整備 → 別 scope（本タスクは既存のまま残置 or 最小 Card 化に留める。Phase 2 で決定）。
- インライン本文編集 → 不変条件 #2 により恒久的にスコープ外。
