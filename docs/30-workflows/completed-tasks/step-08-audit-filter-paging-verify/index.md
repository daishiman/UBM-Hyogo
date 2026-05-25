# step-08 Audit Filter/Paging — 回帰検証タスク仕様書（verify_existing）

**[実装区分: 実装仕様書（`taskType: implementation` / `implementation_mode: verify_existing` / `visualEvidence: NON_VISUAL`）]**

## 0. このタスクは何か

`/(admin)/admin/audit`（監査ログ閲覧 UI）の filter / cursor paging / PII masking は、元監査 spec（`serial-05-admin-mutation-ui/step-08-audit-filter-paging/spec.md`）で **「✅ OK - 改善不要」** と判定済み。本タスクは、その監査結論を **コード変更ゼロで回帰検証し、CI で守れる回帰保証として固定する** `verify_existing` 仕様書群（Phase 1〜13）である。

- **コード変更**: なし（`apps/` への差分ゼロ）
- **成果物**: 既存実装が監査結論どおり動作することの回帰検証証跡と coverage map、close-out ドキュメント
- **bonus（CSV export / Saved filters / Real-time）**: 元 spec が「core 外 bonus」と明示 → Phase 12 で `unassigned-task-detection.md` に理由付きのscope-outとして記録（未タスク新規作成なし）

## 1. 検証対象（current code anchor）

| 区分 | パス |
|------|------|
| Web route | `apps/web/app/(admin)/admin/audit/page.tsx` |
| Web util | `apps/web/app/(admin)/admin/audit/audit-query.ts` |
| Web loading | `apps/web/app/(admin)/admin/audit/loading.tsx` |
| Web component | `apps/web/src/components/admin/AuditLogPanel.tsx` |
| API route | `apps/api/src/routes/admin/audit.ts` |
| API repo / redact | `apps/api/src/repository/auditLog.ts` / `apps/api/src/lib/audit/redact.ts` |

## 2. 既存テスト（回帰の正本）

| テスト | パス | 行 |
|--------|------|----|
| Web component | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 423 |
| Web page | `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 14 |
| API contract | `apps/api/src/routes/admin/audit.contract.spec.ts` | 303 |
| E2E | `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` | 151 |
| Visual | `visual-full` snapshot `admin-audit-{desktop,tablet,mobile}`（流用） | — |

## 3. 検証コマンド（正本）

```bash
# 依存整合（worktree 直後の esbuild mismatch 予防）
mise exec -- pnpm install

# Lane A: Web component / page
mise exec -- pnpm --filter @ubm-hyogo/web test

# Lane B: API unit + API contract（contract は D1 config lane）
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts

# Validation lane（直列締め）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Lane C: コード変更ゼロの証跡（未コミット差分も含めて確認）
git status --short -- apps packages    # 空であること
git diff -- apps packages              # 空であること
git status --short                     # docs workflow + aiworkflow sync のみであること
```

## 4. Phase 一覧

| Phase | 名称 | 出力 |
|-------|------|------|
| 1 | 要件定義（監査スコープ・inventory） | `phase-1-requirements.md` |
| 2 | 設計（検証 topology / lane） | `phase-2-design.md` |
| 3 | 設計レビュー（Phase 4-6 再解釈宣言） | `phase-3-design-review.md` |
| 4 | テスト計画（既存テスト inventory + targeted run 設計） | `phase-4-test-plan.md` |
| 5 | 実装手順（diff 確認 = コード変更ゼロ証跡） | `phase-5-implementation.md` |
| 6 | テスト追加（fail path カバレッジ点検） | `phase-6-test-additions.md` |
| 7 | カバレッジ（変更範囲の coverage 実測） | `phase-7-coverage.md` |
| 8 | リファクタ（重複・drift 点検、無変更判定） | `phase-8-refactor.md` |
| 9 | QA（FR↔テスト 1:1 coverage map） | `phase-9-qa.md` |
| 10 | 最終レビュー（AC 判定 + MINOR 追跡） | `phase-10-final-review.md` |
| 11 | 手動テスト（再現コマンド実行・NON_VISUAL） | `phase-11-manual-test.md` |
| 12 | ドキュメント同期（strict 7 成果物 + bonus scope-out記録） | `phase-12-documentation.md` |
| 13 | PR 作成（user 承認後のみ） | `phase-13-pr.md` |

## 5. 不変条件（本タスクで維持を検証）

1. `apps/web` から D1 直接アクセス禁止（page.tsx は `fetchAdmin` 経由のみ） — NFR-1
2. admin form input は `FormField` 経由 — NFR-2
3. OKLch トークン正本化・HEX 直書き禁止（`verify-design-tokens`） — NFR-3
4. test suffix は `*.spec.*` のみ — NFR-4
5. **コード変更ゼロ**（`apps/` 差分なし） — NFR-5

## 6. 完了条件（タスク全体 DoD）

- [ ] Phase 1〜12 の全 phase ファイルが揃い、artifacts.json の status と整合する。
- [ ] AC-1〜AC-6（`phase-1-requirements.md` §6）を全て満たす。
- [ ] `apps/` のコード変更がゼロであることが Lane C で証跡化される。
- [ ] bonus 3 機能が `unassigned-task-detection.md` に core 外スコープとして記録され、未タスク新規作成は行わない。
- [ ] Phase 13（commit/PR）は user の明示承認後のみ着手する。

---

**Generated**: 2026-05-23
**Source**: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-08-audit-filter-paging/spec.md`
**Version**: 1.0
