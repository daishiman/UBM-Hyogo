# Phase 9 品質レポート — admin-members-mobile-responsive-layout

- task_id: `admin-members-mobile-responsive-layout`
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004） / visual_category: VISUAL
- 段階: **spec_created**（各コマンド未実行 = pending。実装サイクルで実行し結果を確定）

> 本レポートは仕様段階のテンプレートである。実装サイクルで各コマンドを `mise exec --` 経由（SSOT §7）で実行し、結果欄を pending → PASS/FAIL に更新する。

## 1. CI gate 検証結果

| # | gate | 対応AC | コマンド | 合格基準 | 結果 |
| - | ---- | ------ | -------- | -------- | ---- |
| QA-1 | design token gate | AC-6 | `mise exec -- pnpm verify:design-tokens` ＋ globals.css 追加行 grep | HEX/任意値カラー新規混入ゼロ・gate 緑 | pending |
| QA-2 | targeted vitest | AC-7 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx` | TC-MT-01〜20 緑 + TC-MT-21〜24 緑（failed/skipped 0） | pending |
| QA-3 | typecheck | AC-9 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 | pending |
| QA-3 | lint | AC-9 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 | pending |
| QA-4 | API 非接触 diff | AC-8 | `git diff dev...HEAD --name-only -- apps/api 'packages/**/migrations/**'` | 出力が空 | pending |

## 2. FB-UI-02-1: ファイル削除 PASS 基準

- 本タスクは F1〜F3 編集・F4 新規で、**ファイル削除なし**。
- → 削除に伴う import 孤児チェック / 削除 PASS 基準は **非該当**。空振り PASS 扱いにせず明示的に非該当と記録する。

## 3. MINOR TECH-M-01 解決確認（実トークン名の実在）

| 項目 | 内容 |
| ---- | ---- |
| 指摘 | 追加 CSS が参照する `--ubm-space-*` / `--ubm-text-xs` / `--ubm-radius-md` / `--ubm-color-*` の実在は実装時確認に委ねていた |
| 確認コマンド | `git diff dev...HEAD -- apps/web/src/styles/globals.css \| grep -oE 'var\(--ubm-[a-z0-9-]+\)' \| sort -u` で参照トークン抽出 → `tokens.css` / `globals.css` の `:root` 定義と突合 |
| 合格基準 | 参照トークンが全て定義済み（未定義トークン参照ゼロ） |
| 結果 | pending（実装サイクルで grep 実行し確定） |

## 4. @layer ネスト整合

- 追加カード化 CSS ブロックが既存 issue-276（`globals.css:2576` 付近）と同一 `@layer` ネスト深さに配置されているか diff レビューで確認。
- 結果: pending。

## 5. 総合判定

- local implementation 段階: **pending**（実装未完のため未確定）。
- 実装サイクルで QA-1〜QA-4 + TECH-M-01 解決確認が全 PASS かつ @layer 整合 OK の場合に Phase 9 PASS とし、Phase 10 へ進む。
- いずれか FAIL の場合は Phase 5/6 へ差し戻す。
