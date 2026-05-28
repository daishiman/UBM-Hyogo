# serial-05-admin-mutation-ui 全体仕様

**[実装区分: 実装仕様書群 (直列8step)]**

## 1. 目的

admin ダッシュボードの mutation/可視化 UI を直列で整備し、**useAdminMutation** hook を共通基盤として確立する。

- step-01..05: members note / identity-conflicts merge / schema diff resolve / tags assignment / dashboard chart
- step-06..08: meetings attendance / requests approve-reject / audit filter-paging（後続再監査で追加）

## 2. 直列実装理由

step-01 で `useAdminMutation` hook（POST/PATCH 呼び出し + 成功時 `router.refresh()` + toast通知）を実装し、step-02..05 で再利用することで、mutation ロジックの統一・保守性向上を達成。

## 3. 共通設計: useAdminMutation hook (step-01 で確立)

### 配置
```
apps/web/src/features/admin/hooks/useAdminMutation.ts
```

### シグネチャ
```typescript
/**
 * 汎用 admin mutation hook
 * @param endpoint - 対象 endpoint (例: "/api/admin/members/m1/notes")
 * @param method - HTTP method ("POST" | "PATCH" | "PUT")
 * @param onSuccess - 成功時コールバック (省略時は router.refresh() のみ)
 */
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: {
    onSuccess?: (data: T) => void | Promise<void>;
    onError?: (error: Error) => void;
  }
): {
  trigger: (payload: unknown) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
};
```

### 動作
1. `trigger(payload)` 呼び出し → `fetch(endpoint, { method, body: JSON.stringify(payload) })`
2. 成功時 (2xx)
   - JSON parse → `onSuccess?.(data)` 実行
   - `router.refresh()` 実行（server re-fetch）
   - toast: "✓ 保存しました"
3. 失敗時 (4xx/5xx)
   - エラーオブジェクト parse（API 応答の `error` フィールド優先）
   - `onError?.(error)` 実行
   - toast: "✗ エラー: {メッセージ}"

### 再利用パターン（step-02..05）
各 step では以下の形式で呼び出す:
```typescript
const { trigger, isLoading } = useAdminMutation(
  `/api/admin/{resource}/{id}/{action}`,
  "POST",
  { onSuccess: () => { /* 画面固有の後処理 */ } }
);
```

## 4. 各 step の依存関係と順序

```
step-01 (members note)
    ↓
step-02 (identity-conflicts merge)
    ↓
step-03 (schema diff resolve)
    ↓
step-04 (tags assignment)
    ↓
step-05 (dashboard chart)
    ↓
step-06 (meetings attendance)
    ↓
step-07 (requests approve/reject)
    ↓
step-08 (audit filter paging) — read-only, useAdminMutation 非依存
```

各 step は **前提 step の完了条件** で useAdminMutation hook の確立を要件とする。

## 5. 実装対象 API endpoint 一覧

| Step | endpoint | method | 状態 |
|------|----------|--------|------|
| 1 | `POST /api/admin/members/:memberId/notes` | POST | ✓ 実装済 |
| 2 | `POST /api/admin/identity-conflicts/:conflictId/merge` | POST | ✓ 実装済 |
| 3 | `POST /api/admin/schema/aliases` | POST | ✓ 実装済 |
| 4 | `POST /api/admin/tags/queue/:queueId/resolve` | POST | ✓ 実装済 |
| 5 | `GET /api/admin/dashboard` | GET | ✓ 実装済（chart 追加処理なし） |

## 6. 共通 DoD (Definition of Done)

### 実装側
- [ ] `apps/web/src/features/admin/hooks/useAdminMutation.ts` 実装
- [ ] useAdminMutation hook の unit test (vitest)
- [ ] 5 step 全て useAdminMutation を再利用
- [ ] 各 step の mutation 成功で server re-fetch → UI 自動更新
- [ ] toast 通知システム (成功/失敗) 動作確認

### 品質
- [ ] HEX color 直書きなし（design token 使用）
- [ ] 既存 admin smoke test PASS
- [ ] 各 UI component の accessibility (a11y) 確認

### ドキュメント
- [ ] 各 step の spec.md 完成
- [ ] 関数シグネチャ、型定義の JSDoc 記載

## 7. 各 step 概要

### step-01: members note mutation UI (G4-2)
- MembersClientShell → MemberDrawer → NoteForm component 追加
- note 作成/編集 form を drawer内に統合
- useAdminMutation 初回実装

### step-02: identity-conflicts merge 二段階確認 UI (G4-3)
- identity-conflicts 画面に merge button + 確認モーダル
- targetMemberId / reason フィールド入力
- useAdminMutation 再利用

### step-03: schema diff resolve UI (G4-4)
- schema 画面に diff 一覧 → field-by-field resolve フォーム
- 既存 API `POST /api/admin/schema/aliases` を利用
- 縮退仕様: read-only 表示に留める可能性あり

### step-04: tags assignment drawer (G4-5)
- members 画面から tags assignment queue へのリンク
- queue item を drawer で表示 → confirmed/rejected resolve
- useAdminMutation 再利用

### step-05: admin dashboard StatusDistribution chart (G4-6)
- 既存 StatusDistribution component の改善
- `toAdminDashboardUi()` に `byStatus` データが存在する場合、chart 描画
- dependencies に SVG/chart library なければ SVG 直書きで簡易実装

### step-06: meetings attendance mutation UI (G4-7)
- AdminMeetingsPage / 詳細ページの出席 toggle・bulk 編集 UI
- useAdminMutation 再利用

### step-07: requests approve/reject 二段階確認 (G4-8)
- AdminRequestsPage に approve/reject + `<dialog>` element ベース確認モーダル
- 409 conflict 特別表示
- useAdminMutation 再利用

### step-08: audit filter / cursor paging (G4-9)
- read-only。filter form + cursor paging UI 整備
- mutation なし → useAdminMutation 非依存

## 8. リスク & 制約

### リスク
1. **新規 API 追加が必要な場合** → scope 外、別タスク化
2. **chart library dependencies** → dependencies に無ければ SVG 直書き
3. **router.refresh() 遅延** → next.js 側の動作に依存

### 制約
1. 各 spec は **250行以内**
2. 推測で endpoint 名を記載しない（Read で確認必須）
3. 既存 API surface のみで実装可能か判定 → 不可なら縮退仕様

## 9. 共有リソース

### 既存 UI component（再利用）
- `Drawer`: drawer フレーム
- `KpiCard`, `KpiGrid`: KPI 表示
- `ZoneDistribution`, `StatusDistribution`: 分布表示
- `RecentActionsTable`: 監査ログテーブル

### 既存 utility
- `fetchAdmin()`: server-side fetch (admin endpoint)
- `adminEmail()`, `asAdminId()`: brand 型変換
- `toAdminDashboardUi()`: API → UI 変換
- `formatJstDateTime()`: 日付フォーマット

### 既存 hook
- `useRouter()`: next/navigation
- `useTransition()`: pending state
- `useState()`, `useEffect()`: React base hook

## 10. テスト戦略

### unit test (vitest)
- useAdminMutation hook: 成功/失敗/loading 状態
- API error 応答の parse

### component test (vitest + @testing-library)
- form submit → mutation trigger
- toast 通知の出現確認

### e2e test (Playwright)
- smoke test: admin route 遷移 + mutation
- visual test: chart/form レイアウト

## 11. 進行状況トラッキング

各 step の完了後、下記の artifact を確認:
- spec.md: 実装要件の詳細化
- コード: 実装完了 + test green
- artifacts: screenshot (VISUAL_ON_EXECUTION モード)

---

**Generated**: 2026-05-15
**Version**: 1.0
