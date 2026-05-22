# Phase 4 — テスト作成 (RED)

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 名前 | テスト作成 (RED) |
| 状態 | spec_created |
| 依存 | Phase 3 |
| 入力 | outputs/phase-02/*, outputs/phase-03/design-review.md |
| 出力 | outputs/phase-04/test-plan.md |

## 目的

Phase 5 実装の前に失敗するテスト（RED）を先に作成し、TDD サイクルを成立させる。

## タスク

- [ ] 追加 test ファイルを 3 本 **物理作成** する（Phase 4 は RED test 作成フェーズであり、計画だけで閉じない）
  - `apps/api/src/routes/admin/attendance-import.contract.spec.ts`
  - `apps/api/src/use-cases/admin/__tests__/import-attendance-bulk.spec.ts`
  - `apps/web/src/components/admin/__tests__/AttendanceCsvImportPanel.spec.tsx`
- [ ] 各ケースを test-plan.md に列挙する

## テストケース（test-plan.md 必須項目）

| # | ファイル | ケース | 期待 |
| --- | --- | --- | --- |
| 1 | attendance-import.contract.spec.ts | dry-run 成功 | 200 + summary + rows、D1 副作用なし |
| 2 | attendance-import.contract.spec.ts | commit 成功 | 200 + audit_log row 追加 |
| 3 | attendance-import.contract.spec.ts | 500 行超過 | 413 |
| 4 | attendance-import.contract.spec.ts | 未認証 | 401 |
| 5 | attendance-import.contract.spec.ts | non-admin | 403 |
| 6 | import-attendance-bulk.spec.ts | duplicate 行検出 | status=`duplicate` |
| 7 | import-attendance-bulk.spec.ts | deleted_member 検出 | status=`deleted_member`, D1 insert なし |
| 8 | import-attendance-bulk.spec.ts | unknown_member 検出 | status=`unknown_member` |
| 9 | import-attendance-bulk.spec.ts | invalid 行 (memberId/email どちらも無し) | status=`invalid` |
| 9b | import-attendance-bulk.spec.ts | memberId と email が別 member を指す | status=`invalid`, message=`memberId_email_mismatch` |
| 10 | import-attendance-bulk.spec.ts | 部分失敗時の audit_log 件数一致 | 成功行数 == audit_log row 数 |
| 11 | import-attendance-bulk.spec.ts | dry-run で副作用なし | D1 mock の write 呼び出し 0 |
| 12 | AttendanceCsvImportPanel.spec.tsx | upload → preview 遷移 | preview state で行別エラーが render される |
| 13 | AttendanceCsvImportPanel.spec.tsx | preview → confirm 遷移 | API に dryRun=false でリクエスト |
| 14 | AttendanceCsvImportPanel.spec.tsx | 413 受信時 UX | エラー panel が render される |

## 成果物

- `outputs/phase-04/test-plan.md`
  - 上記 14 ケース表
  - test ファイル配置パス（既存 `*.spec.ts` 規約遵守）
  - mock 戦略（D1 binding / `requireAdmin` / fetch）

## 完了条件

- 3 本の test ファイル仕様が確定する
- 追加 3 test ファイルが物理的に存在し、対象実装が未作成または stub のため RED になる
- test ファイル名が `*.spec.ts` / `*.spec.tsx` 規約を満たす

## 注意点 / リスク

- `*.test.ts` 形式は CLAUDE.md 不変条件 8 で禁止。lefthook が reject する
- D1 mock は既存 `apps/api/src/repository/__tests__/` の helper を再利用する
- 本 Phase では RED test を先に物理作成する。Phase 5 はその RED test を通す最小実装に限定する
