# Phase 3: アーキテクチャ・影響範囲

[実装区分: 実装仕様書]

## 1. 影響モジュール一覧

| パス | 変更種別 | 役割 |
|------|---------|------|
| `apps/web/playwright.admin-schema-diff.config.ts` | 新規 | spec 専用 Playwright config |
| `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts` | 新規 | 11 PNG capture spec |
| `apps/web/playwright/.auth/.gitignore` | 新規 | storageState を除外 |
| `scripts/fixtures/serial-05-step-03/seed-diff.sql` | 新規 | D1 local seed (diff + 409) |
| `scripts/fixtures/serial-05-step-03/seed-cleanup.sql` | 新規 | seed の冪等 cleanup |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/*.png` | 新規 (11 枚) | runtime evidence PNG |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json` | 編集 | `pass: true` / `verdict: PASS` |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence.md` | 編集 | runtime_pending → completed セクション追記 |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/main.md` | 編集 | phase_status / workflow_state / evidence_state 更新 |
| `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` | 編集 | 本 followup 行を consumed に |
| `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md` | 編集 (末尾追記のみ) | YAML frontmatter `status: consumed` |
| `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/outputs/phase-11/README.md` | 新規 | 親 workflow の evidence path への pointer |
| `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/outputs/phase-12/implementation-guide.md` | 新規 | Phase 12 documentation |

## 2. 不変ファイル（diff 0 を維持）

- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/lib/admin/api.ts`
- `apps/web/src/lib/admin/server-fetch.ts`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/src/routes/admin/schema.contract.spec.ts`
- `apps/web/app/(admin)/admin/schema/page.tsx`
- D1 migration ファイル群 (`apps/api/migrations/**`)

Phase 6 quality gate で `git diff dev...HEAD --name-only` を grep し、上記が含まれないことを確認する。

## 3. 依存関係

### Upstream（先に完了している必要）
- 親 workflow `serial-05-step-03-schema-diff-resolve` Phase 1-10, 12 完了済
- `apps/api` の local D1 binding (`ubm-hyogo-db-local`) が利用可能

### Downstream（本タスク完了後に進む）
- `ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/` の 5 ステップ完了集計
- task-22 regression smoke の SchemaDiffPanel baseline 参照

## 4. evidence 配置ポリシー

- 11 PNG は **親 workflow** の evidence path に直接配置（`completed-tasks/.../outputs/phase-11/screenshots/`）
- 本 workflow root の `outputs/phase-11/` には pointer README のみ（PNG 物理コピーしない — 二重管理回避）
- manifest.json は **親 workflow 側を正本**として更新する。本 workflow root の artifacts.json は本タスク自体の gate 状態のみ管理

## 5. 性能・サイズ予算

- PNG 個別 ≤ 500KB（chromium full-page で通常 100-300KB 程度を想定）
- 11 PNG 合計 ≤ 5MB
- Playwright run 時間目安: 60 秒以内（11 capture + dev server reuse）

## 6. セキュリティ境界

- `playwright/.auth/admin.json` の **session token は repo に commit しない**（`.gitignore` で除外）
- seed SQL に個人情報・実 email を含めない（ダミーのみ）
- `.env` 実値の read / cat / grep 禁止（CLAUDE.md「ローカル `.env` の運用ルール」）

## 7. ロールバック境界

すべての変更は新規ファイル or evidence ドキュメント更新のみで production code 変更なし。ロールバックは新規ファイル削除 + 編集 doc を git checkout で復元するだけで完結する（Phase 9 参照）。
