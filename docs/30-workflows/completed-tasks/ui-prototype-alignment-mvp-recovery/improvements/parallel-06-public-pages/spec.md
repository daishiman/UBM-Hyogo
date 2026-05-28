# Spec: Public Pages Audit & Enhancement (parallel-06-public-pages)

## 概要

`/`, `/register`, `/privacy`, `/terms` の 4 つの public routes を再監査。
prototype (`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`) との準拠度、API 連携、
動線の完成度を確認し、改善仕様を定める。

---

## 1. 監査結果

### 1.1 `/` (HomePage) — **改善必要**

**ファイル**: `apps/web/app/page.tsx`

#### 現状
- ✓ API 連携: getStats / listMembersRaw 呼び出し
- ✓ Component: Hero / Stats / ZoneIntro / Timeline / MemberGrid
- ✓ Header / Footer: Navigation 完備
- ✗ **FOR MEMBERS セクション欠落**

#### 改善対象
Prototype 136-149 行の「FOR MEMBERS」セクション（ダークバリアント + accent CTA）が未実装。

**変更内容**:
1. HomePage に最後に `<section data-component="call-to-action-cta">` 追加
2. ダークスタイル（背景: text / テキスト: panel）
3. "メンバー情報の掲載をお願いします" h2 + body text
4. "回答フォームを開く" 外部 CTA (href=Google Form responderUrl, target="_blank")
5. Component 化検討（RegisterCallout と共通化可能か確認）

---

### 1.2 `/(public)/register` (RegisterPage) — **OK**

**ファイル**: `apps/web/app/(public)/register/page.tsx`

- ✓ API 連携: fetchPublic("/public/form-preview")
- ✓ Component: RegisterCallout / FormPreviewSections
- ✓ Metadata, fallback 対応
- ✓ Prototype task-12 仕様準拠

**改善不要**。

---

### 1.3 `/privacy` (PrivacyPage) — **OK**

**ファイル**: `apps/web/app/privacy/page.tsx`

- ✓ Component: LegalProse wrapper
- ✓ Metadata: title / description 設定
- ✓ 法務確認待ちの暫定版（コメント記載）
- ✓ Prototype: 法務確認後のセクション扱い

**改善不要**。

---

### 1.4 `/terms` (TermsPage) — **OK**

**ファイル**: `apps/web/app/terms/page.tsx`

- ✓ Component: LegalProse wrapper
- ✓ Metadata: title / description 設定
- ✓ 法務確認待ちの暫定版（コメント記載）
- ✓ Prototype: 法務確認後のセクション扱い

**改善不要**。

---

## 2. 実装仕様 (改善対象)

### 改善 2.1: `/` に FOR MEMBERS セクション追加

**対象ファイル**:
- `apps/web/app/page.tsx` (HomePage)

**変更概要**:
MemberGrid セクション（"新しく参加したメンバー"）の後に、ダーク背景の FOR MEMBERS CTA セクションを追加。

**実装フロー**:

1. **Component 作成**: `apps/web/src/components/public/CallToActionCTA.tsx`
   ```tsx
   export interface CallToActionCTAProps {
     responderUrl: string;
   }
   
   export function CallToActionCTA({ responderUrl }: CallToActionCTAProps) {
     // Prototype 136-149 のダーク variant 実装
   }
   ```

2. **HomePage への統合**:
   ```tsx
   // page.tsx 内で MemberGrid セクション後に追加
   <CallToActionCTA responderUrl={preview.responderUrl ?? FALLBACK_RESPONDER_URL} />
   ```
   
3. **responderUrl の取得**:
   - RegisterPage の `fetchPublic("/public/form-preview")` から responderUrl 取得
   - HomePage でも同じ API 呼び出しするか、revalidate キャッシュを活用
   - OR: 環境変数 / 設定から fallback URL を持つ

**Styling**: 
- `data-component="call-to-action-cta"` selector
- bg=var(--text), color=var(--panel)
- grid-2 / row-between レイアウト
- CTA button: variant="accent", target="_blank"

**Test Coverage**:
- Snapshot: Hero / Stats / ZoneIntro / Timeline / MemberGrid / CallToActionCTA 順序確認
- A11y: button accessibility, external link rel attribute
- Responsive: desktop / mobile レイアウト

---

## 3. Constraints & Rules

- **API 呼び出し**: responderUrl は RegisterPage と共有（revalidate=600 で fetch）
- **불변条件 #7**: target="_blank" + rel="noopener noreferrer"
- **Token styling**: HEX 直書き禁止、CSS variable 経由 (AC-8)
- **Semantic**: `<section>` + h2 + anchor + meaningful data-* attributes
- **Revalidate**: getStats/listMembers と同期（60s 推奨）

---

## 4. DoD (Definition of Done)

- [ ] CallToActionCTA component 実装 & test
- [ ] HomePage に CTA 統合
- [ ] responderUrl fetch 方式決定 (RegisterPage との共有化)
- [ ] Style: ダークバリアント確認（background, color）
- [ ] Snapshot / a11y test 通過
- [ ] Prototype との UI 比較確認完了

---

## 5. 実行コマンド

```bash
# Component test
npm run test -- CallToActionCTA.spec.tsx

# Full page test
npm run test -- apps/web/app/__tests__/page.spec.tsx

# Build & serve
npm run build
npm run dev
```

---

## 6. 範囲外: 監査結果 OK

### `/register` OK の根拠
- FormPreviewView 動的取得 (revalidate=600)
- RegisterCallout の外部リンク & 不変条件準拠
- Fallback responderUrl 対応

### `/privacy` OK の根拠
- LegalProse typography wrapper 一貫性
- Metadata 完備
- 法務確認待ちの暫定版（comment で明記）

### `/terms` OK の根拠
- LegalProse typography wrapper 一貫性
- Metadata 完備
- 法務確認待ちの暫定版（comment で明記）

---

## 付記

**responderUrl 取得方針** — **採用: 案 B (static fallback)**（2026-05-15 確定）

- 採用案: HomePage は新規 API 呼び出しを行わず、static fallback URL を CallToActionCTA に渡す
- 実装:
  ```tsx
  // apps/web/src/app/page.tsx
  const FALLBACK_RESPONDER_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";
  <CallToActionCTA responderUrl={FALLBACK_RESPONDER_URL} />
  ```
- 定数の置き場所: `apps/web/src/lib/constants.ts` に `FORM_RESPONDER_URL` として集約。RegisterPage は引き続き `fetchPublic("/public/form-preview")` を利用するが、その response が空の場合は同じ定数を fallback として使う。
- 不採用案:
  - 案 A: HomePage に API 呼び出しを追加するとレイテンシ増・SSR cache 戦略が複雑化
  - 案 C: 環境変数化は CLAUDE.md の「`NEXT_PUBLIC_*` envは secrets ではないが var 管理コスト発生」と整合性低

責務分離: URL は CLAUDE.md `フォーム固定値` セクションの正本。変更時は constants.ts と CLAUDE.md を同時更新する。
