# step-02-identity-conflicts-merge 実装仕様書

**[実装区分: 実装仕様書 (modal + mutation)]**
**[直列順序: 2/5 | 前提: step-01 useAdminMutation hook]**

## 1. 目的

admin/identity-conflicts 画面に merge 確認モーダルを追加し、二段階確認 UI で member 統合を安全に実行する。useAdminMutation を再利用。

## 2. スコープ

- **変更対象**: `apps/web/app/(admin)/admin/identity-conflicts/` 配下
- **新規実装**: IdentityConflictsMergeModal component
- **API**: `POST /api/admin/identity-conflicts/:conflictId/merge` (実装済)
- **UI パターン**: 一覧表示 → merge button → modal確認 → mutation

## 3. 変更対象ファイル一覧

```
apps/web/app/(admin)/admin/identity-conflicts/
  ├── page.tsx (client component 化、modal toggle state 추가)
  └── _components/ (新規 dir)
      ├── IdentityConflictsList.tsx (一覧 component)
      ├── IdentityConflictsMergeModal.tsx (新規)
      └── index.ts

apps/web/src/features/admin/components/ (既存 組織)
  (또는 _identity-conflicts/ 新規 dir)
```

## 4. 設計

### 4.1 IdentityConflictsMergeModal component

**役割**: 二段階確認モーダル → merge mutation

**Props**:
```typescript
interface IdentityConflictsMergeModalProps {
  readonly conflictId: string;
  readonly sourceEmail: string;
  readonly targetEmail: string;
  readonly open: boolean;
  readonly onClose: () => void;
}
```

**UI フロー**:
1. "Merge" button → modal open
2. modal 表示
   - conflict info (source ↔ target email, masked)
   - warning: "この操作は取り消せません"
   - 2 input fields: targetMemberId (read-only), reason (text)
   - "Cancel" / "Confirm Merge" buttons
3. "Confirm Merge" → mutation
4. 成功 → modal close + list refetch

**API Contract**:
```
POST /api/admin/identity-conflicts/:conflictId/merge
{ "targetMemberId": "m_target", "reason": "duplicate account" }

Response (200):
{ "ok": true, "mergedAt": "2026-05-15T10:00:00Z" }

Error (400):
{ "error": "TARGET_MEMBER_MISMATCH" }

Error (409):
{ "error": "ALREADY_MERGED" }
```

### 4.2 IdentityConflictsList component (改名/新規)

**役割**: conflict 一覧 + merge button

**Props**:
```typescript
interface IdentityConflictsListProps {
  readonly items: readonly AdminIdentityConflict[];
}
```

**state 管理**:
- `selectedConflictId`: merge modal 対象
- `isModalOpen`: modal open/close

## 5. 関数・型シグネチャ

### IdentityConflictsMergeModal
```typescript
export function IdentityConflictsMergeModal({
  conflictId,
  sourceEmail,
  targetEmail,
  open,
  onClose,
}: IdentityConflictsMergeModalProps): ReactNode;
```

### IdentityConflictsList
```typescript
export function IdentityConflictsList({
  items,
}: IdentityConflictsListProps): ReactNode;
```

## 6. 入出力・副作用

### IdentityConflictsMergeModal
- **入力**: conflictId, sourceEmail, targetEmail, open, onClose
- **出力**: modal HTML + form
- **副作用**: useAdminMutation trigger, router.refresh(), modal close

### IdentityConflictsList
- **入力**: items (API fetch 済)
- **出力**: table + merge button per row
- **副作用**: state (selectedConflictId, isModalOpen)

## 7. テスト方針

### IdentityConflictsMergeModal.spec.tsx
- [✓] open={true} → modal render
- [✓] reason textarea change
- [✓] "Confirm Merge" button → mutation trigger
- [✓] 200 response → modal close + onClose callback
- [✓] 409 response (ALREADY_MERGED) → error toast
- [✓] targetMemberId read-only validation

### IdentityConflictsList.spec.tsx
- [✓] items render as table rows
- [✓] merge button per row
- [✓] button click → modal open
- [✓] modal close → list state reset

## 8. ローカル実行コマンド

```bash
# unit test
pnpm test apps/web --run -- IdentityConflictsMergeModal.spec.tsx
pnpm test apps/web --run -- IdentityConflictsList.spec.tsx

# dev server
pnpm dev
# → http://localhost:3000/admin/identity-conflicts
# → "Merge" button → modal appear
# → reason 入力 → "Confirm" → toast

# e2e
pnpm e2e:smoke
```

## 9. DoD

### 実装完了
- [✓] IdentityConflictsMergeModal 実装
- [✓] IdentityConflictsList refactor
- [✓] page.tsx client component 化
- [✓] unit test green

### 品質
- [✓] modal a11y (role, aria-label)
- [✓] form validation (reason 最小1文字)
- [✓] design token 色 使用

### 動作確認
- [✓] modal open/close
- [✓] mutation 後 list 自動 refetch
- [✓] error handling (409, 400)
- [✓] smoke test PASS

## 10. リスク

1. **targetMemberId extraction**: conflictId から自動 extract するか、API response で return されるか確認
2. **already merged**: 重複 merge 試行時の UX （409 toast で OK?）

## 11. 前提

**step-01 完了**: useAdminMutation hook 確立済

## 12. 変更統計

- 新規: 2 components + 2 spec files
- 変更: 1 page.tsx (client marker 追加)

---

**Updated**: 2026-05-15
**Status**: Ready for implementation
