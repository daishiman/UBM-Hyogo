# Phase 4 — 詳細実装計画

## 1. 変更ファイル一覧

| # | パス | 種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `scripts/lib/phase12-compliance/types.ts` | 編集 | `ComplianceCheckResult.reason` に `"missing-evidence"` 追加。`Phase11EvidenceRow` interface を追加 |
| 2 | `scripts/lib/phase12-compliance/parse-phase11-evidence.ts` | 新規 | markdown parser |
| 3 | `scripts/lib/phase12-compliance/verify-phase11-evidence-existence.ts` | 新規 | 実在検証 |
| 4 | `scripts/lib/phase12-compliance/verify-compliance-file.ts` | 編集 | 既存 canonical heading 検査の後段に evidence existence チェックを直列追加 |
| 5 | `scripts/__tests__/verify-phase12-compliance.spec.ts` | 編集 | 新規ケース追加（後述 7 ケース） |
| 6 | `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-12/phase12-task-spec-compliance-check.md` | 編集 | Phase 11 evidence section を追記 |
| 7 | `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-11/manual-test-result.md` | 新規 | dummy 1 行 |
| 8 | `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-11/manual-smoke-log.md` | 新規 | dummy 1 行 |
| 9 | `scripts/__tests__/fixtures/phase12-compliance/pass/outputs/phase-11/link-checklist.md` | 新規 | dummy 1 行 |
| 10 | `scripts/__tests__/fixtures/phase12-compliance/fail-missing-evidence/artifacts.json` | 新規 | 既存 `pass/artifacts.json` を参考に最小実装 |
| 11 | `scripts/__tests__/fixtures/phase12-compliance/fail-missing-evidence/outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | canonical heading 全揃い + Phase 11 evidence `present` 宣言 / 実体不在 |
| 12 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | 編集 | 末尾に「validator 仕様」セクション追記 |
| 13 | `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-*/` | 新規 | Phase 6-13 の各成果物 |

## 2. 実装順序

1. **Step 1 — 型 + parser**: ファイル #1, #2 を作成し、`pnpm typecheck` green
2. **Step 2 — existence checker**: ファイル #3 を作成
3. **Step 3 — verify-compliance-file 拡張**: ファイル #4 編集
4. **Step 4 — pass fixture 拡張**: ファイル #6-#9 を整備し、既存 `pass` ケースが新ロジック込みで green になることを確認
5. **Step 5 — 新規 red fixture**: ファイル #10, #11 を作成
6. **Step 6 — spec 追加**: ファイル #5 にケース追加し `pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts` green
7. **Step 7 — docs**: ファイル #12 を編集
8. **Step 8 — 本タスク outputs**: ファイル #13 群を生成

## 3. 追加 vitest ケース仕様

| ID | 対象 fixture / 関数 | 期待 |
| --- | --- | --- |
| TC-1 | `pass` fixture | `verifyComplianceFile` → `{ ok: true }` |
| TC-2 | `fail-missing-evidence` fixture | `verifyComplianceFile` → `{ ok: false, reason: "missing-evidence" }`、`details` に missing path を含む |
| TC-3 | `parsePhase11EvidenceClaims` unit | heading + 3 行 table を渡し 3 件 row 取得 |
| TC-4 | `parsePhase11EvidenceClaims` unit | heading 無し → `[]` |
| TC-5 | `verifyPhase11EvidenceExistence` unit | docs-only 3 点 path を `present` 宣言 + 全実体あり → `{ ok: true, missing: [], invalidStatuses: [] }` |
| TC-6 | `verifyPhase11EvidenceExistence` unit | 1 件 missing → `ok: false`, `missing.length === 1` |
| TC-7 | `verifyPhase11EvidenceExistence` unit | `status: "へんなやつ"` → `invalidStatuses[]` に append、`ok: false` |

## 4. 検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts
mise exec -- pnpm test:phase12-compliance
mise exec -- pnpm verify:phase12-compliance
```

## 5. DoD（Phase 4 → 6 へ進む前提）

- Phase 1-3 の AC / 非機能要件 / レビュー合意事項を全て反映した実装プランであること
- 上記 13 ファイルの変更計画に欠落がないこと
- 新規 vitest ケース 7 件が AC-1〜AC-5 を網羅していること
