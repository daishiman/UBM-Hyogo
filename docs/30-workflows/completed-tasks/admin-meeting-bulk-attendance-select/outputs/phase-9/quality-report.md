# 品質レポート — admin-meeting-bulk-attendance-select

本仕様の正本は [phase-9-qa.md](../../phase-9-qa.md)。本書は AC マッピングと gate サマリを保持する。

## QA gate サマリ（6 区分）

| # | 区分 | コマンド/手段 | 期待 |
| --- | --- | --- | --- |
| 1 | 静的解析 | `pnpm typecheck` / `pnpm lint` | exit 0 |
| 2 | focused vitest | `_meetings/__tests__` + `Checkbox.spec.tsx` + `api.attendance-import.spec.ts` | 全 PASS（T1..T6） |
| 3 | デザイントークン gate（AC-11） | arbitrary color 0 / HEX 0 / `verify:tokens` | PASS / green |
| 4 | API 非変更（AC-12） | `git diff --name-only -- apps/api packages` / migrations | 空（出力なし） |
| 5 | 端末焼込み禁止（task-18） | `grep 127.0.0.1\|localhost:8888` 新規ファイル | 該当なし |
| 6 | a11y DOM 確認 | Checkbox aria / モーダル role=dialog・aria-modal・focus | T1/T3/T4 でアサート |

## AC-1..AC-12 マッピング

| AC | 検証 spec / gate | 区分 |
| --- | --- | --- |
| AC-1 | `BulkAttendanceChecklist.spec.tsx` | 2 |
| AC-2 | `useBulkAttendanceSelection.spec.ts`（query） | 2 |
| AC-3 | `BulkAttendanceChecklist.spec.tsx`（件数 / disabled） | 2 |
| AC-4 | `useBulkAttendanceSelection.spec.ts`（attended 除外 / stale） | 2 |
| AC-5 | `api.attendance-import.spec.ts`（1 リクエスト・`?dryRun=false`） | 2 |
| AC-6 | Shell `onBulkAdd`（committed:true）+ checklist | 2 |
| AC-7 | `bulk-attendance-message` + Shell（committed:false） | 2 |
| AC-8 | `BulkAttendanceModal.spec.tsx` | 2 |
| AC-9 | hook 共有 + Phase 8 §1 grep | 2 |
| AC-10 | `MeetingAttendanceDrawer.spec.tsx`（回帰） | 2 |
| AC-11 | token gate（arbitrary 0 / HEX 0 / verify:tokens） | 3 |
| AC-12 | `git diff -- apps/api packages` 空 | 4 |

## a11y 確認項目（jsdom 範囲）

| 対象 | 確認 |
| --- | --- |
| Checkbox | `aria-label`（label 省略時）/ `aria-checked` = `checked` / controlled `onChange` |
| BulkAttendanceModal | `role="dialog"` + `aria-modal="true"` / open 時 focus 移動 / Escape で onClose |
| 検索 input | FormField 経由で label↔id 関連付け（不変条件 #9） |
| 送信ボタン | 選択 0 件で `disabled` |

> focus trap の完全性・pixel 表示・toast 描画は Phase 11 runtime（user-gated）で補完。

## 一括実行コマンド

```bash
mise exec -- pnpm typecheck && mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages | grep . && echo "[FAIL]" || echo "[PASS]"
```
