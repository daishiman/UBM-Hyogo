# Phase 7: テスト計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | completed |

## 目的

router.refresh 追加に伴う新規テストケースと既存テストの non-regression 範囲を確定する。

## 7-1. 新規テストケース

### TC-RR-01: VisibilityRequestDialog success → router.refresh が呼ばれる

| 項目 | 内容 |
| --- | --- |
| 対象 | `VisibilityRequestDialog.component.spec.tsx` |
| 前提 | `useRouter` mock の `refresh` を spy |
| 操作 | `mockFetch(202, {...})` → submit click |
| 期待 | `refresh` が 1 回 called / `onSubmitted` called / `onClose` called |
| AC | AC-1, AC-4 |

### TC-RR-02: VisibilityRequestDialog 409 → router.refresh が呼ばれない

| 項目 | 内容 |
| --- | --- |
| 対象 | `VisibilityRequestDialog.component.spec.tsx` |
| 前提 | `mockFetch(409, { error: "DUPLICATE_PENDING_REQUEST" })` |
| 操作 | submit click |
| 期待 | `refresh` not called / `alert` role 要素出現 |
| AC | AC-3 |

### TC-RR-03: DeleteRequestDialog success → router.refresh が呼ばれる

| 項目 | 内容 |
| --- | --- |
| 対象 | `DeleteRequestDialog.component.spec.tsx` |
| 前提 | `delete-confirm-checkbox` チェック / `mockFetch(202, { type: "delete_request", ... })` |
| 操作 | submit click |
| 期待 | `refresh` が 1 回 called |
| AC | AC-2, AC-5 |

### TC-RR-04: DeleteRequestDialog 409 → router.refresh が呼ばれない

| 項目 | 内容 |
| --- | --- |
| 対象 | `DeleteRequestDialog.component.spec.tsx` |
| 前提 | `mockFetch(409, ...)` |
| 期待 | `refresh` not called / `alert` 出現 |
| AC | AC-3 |

## 7-2. mock 戦略

```ts
import { useRouter } from "next/navigation";
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
});
```

各テストで `refresh` を取り出して spy としてアサートする。

## 7-3. non-regression 範囲

| ファイル | 既存テスト | 期待 |
| --- | --- | --- |
| VisibilityRequestDialog.component.spec.tsx | TC-U-05, TC-U-06, TC-A-02, TC-U-07, TC-U-08, 409 alert, network error | 全て green |
| DeleteRequestDialog.component.spec.tsx | 既存全ケース | 全て green |
| RequestActionPanel.component.spec.tsx | TC-U-01..12 等の既存ケース | 全て green |

特に TC-U-08「202 → onSubmitted 呼ばれて onClose する」は本変更で挙動が変わる（refresh が先に呼ばれる）が、`onSubmitted` / `onClose` が呼ばれるという既存アサーションには影響しないため non-regression として扱う。

## 7-4. E2E (Playwright) — Phase 11 で実施

| シナリオ | 期待 |
| --- | --- |
| profile login → 公開停止 dialog 開く → 申請送信 | dialog が閉じ、`RequestPendingBanner` (visibility_request) が即時表示される |
| profile login → 退会 dialog 開く → 申請送信 | `RequestPendingBanner` (delete_request) が即時表示される |
| mutation 失敗（409） | banner 変化なし。dialog 内 alert 表示 |

Playwright assertion: `await page.locator('[data-pending-type="visibility_request"]').waitFor({ state: "visible" })` または `await expect(page.getByRole("status")).toBeVisible()`

## 7-5. 実行コマンド

```bash
# 単体
mise exec -- pnpm --filter @ubm-hyogo/web test -- VisibilityRequestDialog
mise exec -- pnpm --filter @ubm-hyogo/web test -- DeleteRequestDialog
mise exec -- pnpm --filter @ubm-hyogo/web test -- RequestActionPanel

# 一括
mise exec -- pnpm --filter @ubm-hyogo/web test

# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Playwright (Phase 11)
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile
```

## 実行タスク

- [ ] 新規 4 ケースの仕様を明記する
- [ ] mock 戦略を文書化する
- [ ] non-regression 範囲を表化する
- [ ] E2E シナリオ 3 件を計画する
- [ ] `outputs/phase-07/test-plan.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/test-plan.md | 新規 4 ケース + mock + non-regression + E2E |

## 完了条件

- [ ] 新規 4 ケースが表化されている
- [ ] mock 戦略が記録されている
- [ ] non-regression 範囲が明示されている

## 次 Phase

- 次: 8 (ドキュメント更新)
- 引き継ぎ事項: 新規ケース 4 件 / E2E 3 シナリオ
