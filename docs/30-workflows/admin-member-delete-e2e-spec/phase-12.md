# Phase 12: 振り返り・正本仕様 sync

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 必須 7 outputs（path existence pre-check）

`outputs/phase-12/` 配下に以下 7 ファイルを必ず生成。**1 件欠落で FAIL 固定**（skill `phase12-checklist-definition.md` 規約）。

| # | path | 役割 |
|---|------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 全体サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | 中学生レベル概念説明（Phase 12 強制要件） |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 8 点 compliance チェック（quality-gates §7 準拠） |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements への反映概要（本タスクは UI E2E のため反映 minimum） |
| 5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への feedback |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（cascade preview Stage 3 持越し記録） |
| 7 | `outputs/phase-12/documentation-changelog.md` | spec 追加に伴う変更ドキュメント一覧 + canonical absolute path |

## 2. implementation-guide.md（Part 1 / Part 2）

Part 1 は中学生レベル説明として以下 7 セクション必須:

1. このタスクで何を作ったか（1 文で）
2. なぜ必要だったか
3. どこに保存されているか（`apps/web/playwright/tests/admin-member-delete.spec.ts`）
4. どう動くか（test の流れを順序で）
5. mock とは何か
6. 失敗したらどうなるか
7. 次に拡張するならどうするか（cascade preview 復活手順）

Part 2 は技術者向け説明として、SSR fixture gate、Client mutation `page.route()`、auth fixture、evidence command、状態語彙、CI/user-gate の 6 項目を必須とする。用語セルフチェック表も含める。

## 3. compliance check 8 点（quality-gates §7）

| # | 項目 | 確認 |
|---|------|------|
| 1 | 対象 spec の列挙 | `apps/web/playwright/tests/admin-member-delete.spec.ts` |
| 2 | 1 行実行コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium` |
| 3 | 実行前提と自動化スクリプト | `pnpm install` / `playwright install` |
| 4 | un-skip 不変条件 | skip = 1（cascade preview のみ） |
| 5 | browser binary 自動 install | CI で `playwright install --with-deps` |
| 6 | dev server 自動起動 | `apps/web/playwright.config.ts` の `webServer` |
| 7 | CI gate 化 | `.github/workflows/e2e-tests.yml`（現状は `workflow_dispatch`。CI artifact は user-gated runtime evidence） |
| 8 | E2E lines coverage ≥ 80% | 現 repo に coverage producer 未接続のため `runtime_pending` blocker として記録。今回 PASS 条件にしない |

## 4. unassigned-task-detection.md（cascade preview 持越し）

| 項目 | 内容 |
|------|------|
| 持越しタスク | cascade preview test 復活 |
| 理由 | API 未実装 |
| CONST_007 例外条件 | (1) 外部/未実装依存 / (2) 後続 Stage 持越し明記 — 2 条件同時該当 |
| 実施場所 | `docs/30-workflows/e2e-quality-uplift-stage-3-impl/`（Stage 3 実装 canonical） |
| 復活条件 | Stage 3 で cascade preview API 実装 + grep 確認 |
| トレーサビリティ | phase-1.md §3 #2 / phase-3.md skip 許容ゲート / phase-4.md §1 Q3 |

## 5. dirty-code gate

```bash
git status --porcelain apps/ packages/
```

期待: `apps/web/playwright/tests/admin-member-delete.spec.ts`、`apps/web/src/lib/admin/server-fetch.ts`、`apps/web/playwright.config.ts` の 3 件のみ。API route / fixture / packages の dirty diff は分類・分離記録なしに PASS しない。

## 6. placeholder token 0 件 gate

```bash
rg -n "token-sized|09b-token-value|token-mix|TODO\(.*\)" outputs/phase-12/ apps/web/playwright/tests/admin-member-delete.spec.ts
```

期待: spec 内は `// TODO(stage-3)` 1 件のみ、それ以外の placeholder token 0 件。

## 7. 状態確定

| 条件 | workflow_state |
|------|---------------|
| 7 outputs 揃い + 8 点 compliance PASS + dirty-code gate PASS + placeholder 0 | `implemented-local-runtime-pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| 1 件でも欠落 / FAIL | `runtime_pending` 維持、Phase 11 へ revert |
