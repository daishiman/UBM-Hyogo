# Phase 4: テスト作成（TDD Red）

> workflow: mypage-prototype-alignment
> task 種別: UI task（VISUAL） / implementation_mode: "existing-ui-alignment"
> 正本: Phase 1-3（`outputs/phase-{1,2,3}/`）+ prototype `pages-member.jsx` MyProfilePage（L219-371）

このフェーズでは Phase 5 実装に先立ち、純粋関数 unit test と component test を **RED 状態**（実装前なので import 解決不能 or 期待値不一致で fail）で先に固定する。テストファイルは `*.spec.{ts,tsx}` のみ（不変条件 #8: `*.test` 禁止）。

---

## 4.1 変更対象ファイル一覧（変更種別）

| パス | 種別 | 対象 |
|------|------|------|
| `apps/web/app/profile/_lib/__tests__/visibility-counts.spec.ts` | 新規 | `deriveVisibilityCounts` unit |
| `apps/web/app/profile/_lib/__tests__/profile-summary.spec.ts` | 新規 | `pickProfileSummary` unit |
| `apps/web/app/profile/_components/__tests__/ProfileHeader.component.spec.tsx` | 新規 | ST-1 公開ページリンク 3 ケース |
| `apps/web/app/profile/_components/__tests__/StatusBanner.component.spec.tsx` | 新規 | ST-2 tone 3 値 |
| `apps/web/app/profile/_components/__tests__/VisibilitySummary.component.spec.tsx` | 新規 | ST-2 件数表示 |
| `apps/web/app/profile/_components/__tests__/EditCta.component.spec.tsx` | 新規 | ST-4 open/close + href |
| `apps/web/app/profile/_components/__tests__/RevalidateModal.component.spec.tsx` | 新規 | ST-4 href=editResponseUrl/fallback |
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 修正 | ST-6 動線追加（既存ケース非破壊） |

> 既存テスト（`RequestActionPanel.component.spec.tsx` 等）は本フェーズでは変更しない。ST-5 は POST 経路不変のため Phase 6（回帰 guard）で wrap 確認のみ行う。

---

## 4.2 関数・型シグネチャ（テスト対象の契約）

```typescript
// _lib/visibility-counts.ts（Phase 5 で実装 / Phase 2 §2.3 確定）
export interface VisibilityCounts {
  readonly public: number;
  readonly member: number;
  readonly admin: number;
}
export function deriveVisibilityCounts(
  sections: readonly MemberProfileSection[],
): VisibilityCounts;

// _lib/profile-summary.ts（Phase 5 で実装）
export interface ProfileSummary {
  readonly displayName: string; // STABLE_KEY.fullName 由来 / 欠損時 ""
  readonly subtitle: string;    // STABLE_KEY.occupation 由来 / 欠損時 ""
}
export function pickProfileSummary(
  sections: readonly MemberProfileSection[],
): ProfileSummary;
```

component props は Phase 2 §2.4 の定義に従う（`ProfileHeaderProps` / `StatusBannerProps` / `VisibilitySummaryProps` / `EditCtaProps` / `RevalidateModalProps`）。

---

## 4.3 テスト方針

### 共通ルール

- runner: vitest + `@testing-library/react`。
- `window` 全置換は禁止。Preload/global mock が必要な場合は `Object.defineProperty(window, ...)` を使う（[Feedback VSCPKR-02]）。`vi.stubGlobal("window", ...)` 使用禁止。
- 各テストファイル冒頭に `afterEach(() => cleanup())`。
- `next/navigation` を参照する component は `vi.hoisted` + `vi.mock("next/navigation", ...)` で mock（既存 `RequestActionPanel.component.spec.tsx` パターン踏襲）。
- **テスト操作対象が internal state か prop か**（[VSCPKR-03]）:
  - RevalidateModal の `open` は **EditCta 内部の `useState`**（internal state）。EditCta テストでは「情報を更新する」ボタン click → modal 出現 を検証する。
  - RevalidateModal 単体テストでは `open` を **external prop** として渡し、href 解決のみを検証する（internal state を持たない）。
  - StatusBanner の tone / VisibilitySummary の件数 / ProfileHeader のリンク状態は全て **external prop** 由来。

### テストデータ生成ヘルパー

各 component/unit テストは `MemberProfileSection[]` の最小 fixture を inline 生成する。`stableKey` は `@ubm-hyogo/shared` の `STABLE_KEY` 経由で参照（リテラル直書き禁止）。`visibility` 値は `"public" | "member" | "admin"`、未知値テストでは `as MemberProfileSectionField["visibility"]` キャストで `"secret"` 等を注入する。

---

## 4.4 テストケース（ファイル別・ケース名・期待値・RED 理由）

### A. `_lib/__tests__/visibility-counts.spec.ts`（unit / deriveVisibilityCounts）

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `空配列のとき全件 0 を返す` | `[]` | `{ public: 0, member: 0, admin: 0 }` |
| `混在 visibility を正しく集計する` | public×2 / member×1 / admin×1 を 2 section に分散 | `{ public: 2, member: 1, admin: 1 }` |
| `未知 visibility 値は無視し例外を投げない` | `"secret"` を 1 件混入 + public×1 | `{ public: 1, member: 0, admin: 0 }`（throw しない / [WEEKGRD-02]） |
| `section.fields が空でも 0 を返す` | fields: [] の section ×1 | `{ public: 0, member: 0, admin: 0 }` |

RED 理由: `_lib/visibility-counts.ts` 未作成のため import 解決不能。

### B. `_lib/__tests__/profile-summary.spec.ts`（unit / pickProfileSummary）

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `fullName / occupation を stableKey 経由で抽出する` | fullName="山田太郎" / occupation="デザイナー" を含む section | `{ displayName: "山田太郎", subtitle: "デザイナー" }` |
| `fullName 欠損時は displayName を空文字で返す` | occupation のみ | `{ displayName: "", subtitle: "デザイナー" }` |
| `occupation 欠損時は subtitle を空文字で返す` | fullName のみ | `{ displayName: "山田太郎", subtitle: "" }` |
| `両方欠損時は両方空文字で返す（例外なし）` | 無関係 stableKey のみ | `{ displayName: "", subtitle: "" }` |
| `value が null の field は空文字に丸める` | fullName: value=null | `{ displayName: "", subtitle: "" }` |

RED 理由: `_lib/profile-summary.ts` 未作成。

### C. `_components/__tests__/ProfileHeader.component.spec.tsx`（ST-1）

操作対象: 全 external prop。

| ケース名 | props | 期待値 |
|---------|-------|--------|
| `publishState=public のとき公開ページリンクが有効` | `publishState="public", memberId="m-001"` | `getByRole("link", { name: /公開ページを見る/ })` の `href` が `/members/m-001`、`aria-disabled` を持たない |
| `publishState=member_only のとき公開ページが aria-disabled` | `publishState="member_only"` | 「公開ページを見る」要素が `aria-disabled="true"` を持ち、`href` を持たない（or click 無効）|
| `publishState=hidden のとき公開ページが aria-disabled` | `publishState="hidden"` | 同上（`aria-disabled="true"`）|
| `eyebrow / h1 / muted を描画する` | 任意 | "MY PROFILE" / "マイページ" / muted 説明文が存在 |

RED 理由: `ProfileHeader` 未実装（現状 page.tsx に素の `<h1>マイページ</h1>` のみ）。

### D. `_components/__tests__/StatusBanner.component.spec.tsx`（ST-2）

操作対象: 全 external prop。`Banner` が tone により `data-tone` を出すことを利用して検証。

| ケース名 | props.publishState | 期待値 |
|---------|--------------------|--------|
| `public のとき success tone の Banner を描画する` | `"public"` | Banner ルートに `data-tone="success"`、文言「公開されています」相当 |
| `member_only のとき info tone の Banner を描画する` | `"member_only"` | `data-tone="info"` |
| `hidden のとき warning tone の Banner を描画する` | `"hidden"` | `data-tone="warning"`、`role="alert"`（Banner 仕様で warning→alert）|

RED 理由: `StatusBanner`（`StatusSummary.tsx` の Banner 化）未実装。現状 `StatusSummary` は KVList ベースで `data-tone` を持たない。

### E. `_components/__tests__/VisibilitySummary.component.spec.tsx`（ST-2）

操作対象: external prop（`sections`）。

| ケース名 | 入力 sections | 期待値 |
|---------|---------------|--------|
| `public/member/admin の件数を 3 枚の Stat で表示する` | public×3 / member×2 / admin×1 | "3" / "2" / "1" が各 Stat に表示。eyebrow "PUBLIC" / "MEMBERS" / "PRIVATE" 相当ラベルが存在 |
| `空 sections のとき全件 0 を表示する` | `[]` | "0" が 3 枚表示され throw しない |

RED 理由: `VisibilitySummary` 未実装（新規）。

### F. `_components/__tests__/EditCta.component.spec.tsx`（ST-4）

操作対象: **internal state**（RevalidateModal open は EditCta の `useState`）。`Modal` は実物を使用（happy-dom）。

| ケース名 | props | 操作 | 期待値 |
|---------|-------|------|--------|
| `初期状態では Modal が閉じている` | `editResponseUrl="https://e", fallbackResponderUrl="https://f"` | なし | `queryByRole("dialog")` が null |
| `情報を更新するボタン click で Modal が開く` | 同上 | 「情報を更新する」click | `getByRole("dialog")` が出現、modal 文言が存在 |
| `Modal のキャンセルで閉じる` | 同上 | open → 「キャンセル」click | `queryByRole("dialog")` が null に戻る |
| `variant=inline でも開閉できる` | `variant="inline"` | 「フォームを開いて更新」click | dialog 出現 |

RED 理由: `EditCta.client.tsx`（RevalidateModal 内包・client）未実装。現状 `EditCta.tsx` は素の `<a>` リンクで modal を持たない。

### G. `_components/__tests__/RevalidateModal.component.spec.tsx`（ST-4）

操作対象: **external prop**（`open` を prop で渡す。RevalidateModal は internal state を持たない）。

| ケース名 | props | 期待値 |
|---------|-------|--------|
| `open=false のとき何も描画しない` | `open={false}` | `queryByRole("dialog")` が null |
| `open=true で再回答の説明文を描画する` | `open={true}, editResponseUrl="https://edit", fallbackResponderUrl="https://fb"` | dialog 出現。「Googleフォームから再回答」「stableKey」相当文言が存在 |
| `editResponseUrl があるとき フォームを開くは editResponseUrl を指す` | `editResponseUrl="https://edit", fallbackResponderUrl="https://fb"` | 「フォームを開く」リンク/ボタンの `href` が `https://edit`、`target="_blank"`、`rel="noopener noreferrer"` |
| `editResponseUrl=null のとき フォームを開くは fallbackResponderUrl を指す` | `editResponseUrl={null}, fallbackResponderUrl="https://fb"` | `href` が `https://fb`、`target="_blank"`、`rel="noopener noreferrer"` |

RED 理由: `RevalidateModal.tsx` 未実装（新規）。

### H. `src/components/layout/__tests__/MemberHeader.spec.tsx`（ST-6 / 修正）

既存ケース（`data-testid="member-header"` / マイページリンク href / sign-out-button）は **そのまま残す**（非破壊）。以下を追記:

| ケース名 | 期待値 |
|---------|--------|
| `公開ページ（一覧）への nav リンクを描画する` | `getByRole("link", { name: "公開ページ" })` の `href` が `/members` |
| `マイページリンクは /profile を維持する` | 既存維持（回帰固定）|

RED 理由: 現 `MemberHeader` に「公開ページ」リンクが無い。`getByRole("link", { name: "公開ページ" })` が見つからず fail。

---

## 4.5 ローカル実行コマンド

```bash
# worktree 直後の依存整合（[FB-MSO-002]）
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared build

# targeted RED 確認（全件 run はメモリ制約回避のため避ける / [FB-UI-02-2]）
mise exec -- pnpm --filter web exec vitest run \
  app/profile/_lib/__tests__/visibility-counts.spec.ts \
  app/profile/_lib/__tests__/profile-summary.spec.ts \
  app/profile/_components/__tests__/ProfileHeader.component.spec.tsx \
  app/profile/_components/__tests__/StatusBanner.component.spec.tsx \
  app/profile/_components/__tests__/VisibilitySummary.component.spec.tsx \
  app/profile/_components/__tests__/EditCta.component.spec.tsx \
  app/profile/_components/__tests__/RevalidateModal.component.spec.tsx \
  src/components/layout/__tests__/MemberHeader.spec.tsx
```

> 上記は **全て RED（fail）になることが Phase 4 の DoD**。MemberHeader 既存ケースのみ GREEN を維持する。

---

## 4.6 DoD（Phase 4 完了条件）

1. 上記 8 ファイルが作成/修正され、`*.spec.{ts,tsx}` 命名（`*.test` 不在）である。
2. 純粋関数テスト（A/B）が import 解決不能で RED。
3. component テスト（C〜G）が未実装により RED。
4. MemberHeader 追記ケース（H）が RED、既存ケースは GREEN。
5. テスト内で `vi.stubGlobal("window", ...)` を使用していない（grep でゼロ確認）。
6. 新規テストの visibility/stableKey 参照が `STABLE_KEY` 経由でリテラル直書きが無い。
7. 各テストで internal state / external prop の区別が明記されている（4.3 参照）。
