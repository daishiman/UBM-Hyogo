# Phase 6 — テスト拡充 / 補強 (F-series)

## 目的

Phase 4 で物理作成した 4 spec の minimum case set を、`docs/30-workflows/ut-07c-followup-001-attendance-csv-import/outputs/phase-03/design-review.md` の「対応するテスト戦略」と突合させ、境界条件・例外パスを F1〜F11 として 11 ケース追加する。

## 補強ケース一覧

| # | 種別 | ファイル | 追加目的 |
| --- | --- | --- | --- |
| F1 | parse | `parse-attendance.spec.ts` | 引用符不整合 (malformed CSV) でも abort せず errors に記録 |
| F2 | parse | `parse-attendance.spec.ts` | 空ファイルは `rows=[], errors=[]` |
| F3 | parse | `parse-attendance.spec.ts` | header のみは `rows=[], errors=[]` |
| F4 | service | `import-attendance-bulk.spec.ts` | 同一 email を別形式で 2 行入れた場合 2 行とも duplicate（既存 attendance あり） |
| F5 | parse / service | `parse-attendance.spec.ts` / `import-attendance-bulk.spec.ts` | 全角 email を NFKC + lowercase で正規化 |
| F6 | service | `import-attendance-bulk.spec.ts` | D1 insert 例外時、appended audit_log が 0 件で reject される（chunk 1 件目失敗） |
| F7 | parse | `parse-attendance.spec.ts` | 「memberId / email どちらも空」は errors に記録 + rows からスキップ |
| F8 | UI | `AttendanceCsvImportPanel.spec.tsx` | preview から cancel で idle 復帰 |
| F8b | UI | `AttendanceCsvImportPanel.spec.tsx` | 空 CSV 投入 → fetch を呼ばずにエラー panel |
| F9 | contract | `attendance-import.contract.spec.ts` | session 未存在 → 404 `session_not_found` (route 化された throw catch) |
| F10 | contract | `attendance-import.contract.spec.ts` | deleted_member を含む preview の status 表示 |
| F11 | service | `import-attendance-bulk.spec.ts` | `classifyImportRow` 単体 — memberId と email が別 member の場合 `memberId_email_mismatch` |

## 確認結果（Phase 4 minimum + F-series 含む実測）

| spec file | 既存 case | 追加 case | 合計 |
| --- | --- | --- | --- |
| `attendance-import.contract.spec.ts` | 8 (case#1〜#5) | F9 / F10（case#5b / 5c / 5d / 5e 内に内包） | 10 |
| `import-attendance-bulk.spec.ts` | 6 (case#6〜#11) | F4 / F5 / F6 / F11 + session-missing | 12 |
| `AttendanceCsvImportPanel.spec.tsx` | 3 (case#12〜#14) | F8 / F8b | 5 |
| `parse-attendance.spec.ts` | 1 (CSV 抽出) | F1 / F2 / F3 / F5 / F7 | 6 |

## 実行ログ抜粋

```
RUN  v2.1.9 (vitest.d1.config.ts) — attendance-import.contract.spec.ts
✓ 10 tests passed (case#1〜#5e)

RUN  v2.1.9 (vitest.config.ts) — import-attendance-bulk.spec.ts
✓ 12 tests passed (case#6〜#11 + F4/F5/F6/F11 + session-missing)

RUN  v2.1.9 (vitest.config.ts) — apps/web suite
✓ AttendanceCsvImportPanel.spec.tsx 5 tests passed
✓ parse-attendance.spec.ts 6 tests passed
```

## DoD チェック

- [x] F1〜F11 全件物理化済み
- [x] 既存 single add/remove テストへの regression なし（apps/api full suite 318 件、apps/web full suite 633 件いずれも GREEN）
- [x] `*.spec.ts` / `*.spec.tsx` 規約遵守
