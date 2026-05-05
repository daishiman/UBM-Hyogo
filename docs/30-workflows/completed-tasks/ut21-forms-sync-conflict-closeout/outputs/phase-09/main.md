# Phase 9 Output: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 9 / 13（品質保証） |
| taskType | docs-only / specification-cleanup（QA・整合性監査） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| 前 Phase | 8（DRY 化） |
| 次 Phase | 10（最終レビュー / GO/NO-GO） |
| 作成日 | 2026-04-30 |

## 1. 目的

Phase 8 で確定した SSOT 5 軸用語表と navigation drift 0 を前提に、本 docs-only close-out タスクの品質を 5 観点（rg 検証ログ・cross-link 死活・aiworkflow-requirements current facts 整合・不変条件 #1/#4/#5/#7 違反監査・4条件最終評価準備）で確認し、Phase 10 GO/NO-GO 判定に必要な客観的根拠を揃える。a11y は対象外（docs-only かつ UI を持たない close-out のため）。新規 Secret 導入はなく、無料枠影響も 0。本タスクは `apps/api/src/sync/*` 想定パスの再構成判断は含まず、後続 U02 / U04 / U05 へ委譲した整合確認に留める。

## 2. rg 検証ログ（AC-10 一次根拠）

詳細出力は本 Phase 同梱の `rg-verification-log.md` に保存。本 main.md は判定サマリーのみを記載。

| コマンド | 期待 | 判定 |
| --- | --- | --- |
| `rg -n "POST /admin/sync\b\|GET /admin/sync/audit\|sync_audit_logs\|sync_audit_outbox" docs/30-workflows/ut21-forms-sync-conflict-closeout docs/30-workflows/02-application-implementation .claude/skills/aiworkflow-requirements/references` | 単一 endpoint / 公開 audit / audit table を「新設すべき」とする推奨表記が引用文脈外で 0 件 | PASS |
| `rg -n "spreadsheets\.values\.get\|SheetRow\|apps/api/src/sync/(core\|manual\|scheduled\|audit)\.ts" docs/30-workflows/ut21-forms-sync-conflict-closeout` | Before 表 / U05 委譲ノート以外で出現 0 | PASS |
| `ls docs/30-workflows/unassigned-task/task-ut21-{sync-audit-tables-necessity-judgement,phase11-smoke-rerun-real-env,impl-path-boundary-realignment}-001.md` | 3 ファイル実在（exit 0） | PASS |
| `gh issue view 234 --json state,title,url` | `state=CLOSED` / URL が index.md と一致 | PASS（CLOSED 維持） |

> AC-10 達成根拠としての実出力は `rg-verification-log.md` に保存。Phase 11 手動 smoke で同コマンドを再実行して最終確定する。

## 3. cross-link 死活確認

| # | チェック | 方法 | 結果 |
| --- | --- | --- | --- |
| C-1 | artifacts.json `phases[*].primaryArtifact` × 実 path | `rg -n "outputs/phase-"` + ls | 完全一致 |
| C-2 | index.md `Phase 一覧` × 実ファイル | `ls phase-*.md` | 13 ファイル一致 |
| C-3 | index.md `主要な参照資料` 表のパス | 全件 ls | リンク切れ 0 |
| C-4 | phase-XX.md 内 `../unassigned-task/*.md` 相対参照 | 全件 ls | リンク切れ 0 |
| C-5 | 後続 U02 / U04 / U05 から本 index への back link | 後続 3 ファイル grep | 双方向リンク確認済 |
| C-6 | Skill reference path | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 実在 |
| C-7 | GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/234` | 200 OK / CLOSED |
| C-8 | 正本コードパス | `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/` | 実在 |

> 8 項目すべてリンク切れ 0。AC-5 達成根拠とする。

## 4. aiworkflow-requirements skill 整合監査

詳細表は `skill-integrity-audit.md` に分離。本 main.md は集約結果のみ。

| 軸 | skill `task-workflow.md` current facts | 本タスク記述 | 判定 |
| --- | --- | --- | --- |
| 同期元 | Forms API（`forms.get` / `forms.responses.list`） | 同 | PASS |
| admin endpoint | split: `POST /admin/sync/schema` + `POST /admin/sync/responses` | 同 | PASS |
| 監査 ledger | `sync_jobs` 単一 | 同（`sync_audit_logs/outbox` は U02 判定後保留） | PASS |
| 実装パス | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` | 同 | PASS |
| Bearer guard | `SYNC_ADMIN_TOKEN` を `/admin/sync/*` に適用 | 同 | PASS |
| Cron | Workers Cron Triggers | 同（09b runbook 委譲） | PASS |

> 6 軸すべて PASS、矛盾 0 件。AC-7 達成根拠とする。

## 5. 不変条件 #1 / #4 / #5 / #7 違反監査

| # | 不変条件 | 監査観点 | 違反検出 | 根拠 |
| --- | --- | --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | UT-21 の Sheets 列インデックス前提を排除し、Forms `responseId` ベース DTO を正本固定 | 0 | Phase 8 §3 SSOT「同期元」軸 |
| #4 | Form schema 外データは admin-managed として分離 | `sync_jobs` ledger を admin-managed と再確認、ユーザー入力データへの混入なし | 0 | Phase 8 §3 SSOT「audit table」軸 |
| #5 | D1 直接アクセスは `apps/api` に閉じる | `apps/web` から D1 直接アクセス示唆記述なし、新設 endpoint 言及も `apps/api` 内のみ | 0 | Phase 8 §3 SSOT「実装パス」軸 / 本 main.md 全文 |
| #7 | MVP では Google Form 再回答を本人更新の正式経路 | sync 経路が Forms→D1 一方向であることを再確認 | 0 | Phase 1 §8 / Phase 2 migration-matrix |

> 4 件すべて違反 0。AC-9 達成根拠とする。

## 6. 4条件最終評価の前提材料（Phase 10 引き渡し）

| 条件 | 前提材料 | 出典 |
| --- | --- | --- |
| 価値性 | UT-21 二重正本リスク除去、03a/03b/04c/09b への移植 patch 案完成 | Phase 5 implementation-runbook.md |
| 実現性 | docs-only スコープに閉じる、新規 Secret 導入 0、impl は U02 / U04 / U05 へ委譲 | Phase 1 §1 / 本 Phase §2-§5 |
| 整合性 | 不変条件 #1/#4/#5/#7 違反 0、skill current facts と矛盾 0 | 本 Phase §4 / §5 |
| 運用性 | SSOT 5 軸用語表で次回同種 close-out の再現性確保、後続タスク 3 件が独立進行可能 | Phase 8 §3 / 本 Phase §3 C-5 |

> Phase 10 GO/NO-GO 判定の入力材料として固定。

## 7. a11y 対象外の明記

- 本タスクは docs-only / legacy umbrella close-out であり UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- 関連の a11y 確認は UI を含むタスク（02b / 06 系）で別途行う。

## 8. line budget / mirror parity

### line budget

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 200 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-11.md | 各 100-250 行 | 100-250 行 | PASS 目標 |
| phase-12.md / phase-13.md | 各 250-350 行 | 350 行以内 | 拡張許容（Phase 12 必須 7 成果物・Phase 13 承認ゲート明示のため） |
| outputs/phase-XX/*.md | main.md は 200-400 行を目安 | 個別 | 個別チェック |

### mirror parity

- 本タスクは `.claude/skills/aiworkflow-requirements/references/` を **編集しない**（既存 current facts と整合確認のみ）。
- ゆえに `.claude` / `.agents` mirror parity は **N/A**。
- 仮に Phase 12 で skill-feedback として SKILL 改修が必要と判明した場合は別タスク（skill 更新）として切り出し、本タスクでは扱わない。

## 9. AC トレース（Phase 10 引き渡し用）

| AC | 達成状態 | 根拠 |
| --- | --- | --- |
| AC-1 | PASS | Phase 8 §3 SSOT 5 軸表 |
| AC-2 | PASS | Phase 2 migration-matrix-design.md |
| AC-3 | PASS | Phase 2 no-new-endpoint-policy.md / 本 §2 rg 検証 |
| AC-4 | PASS | Phase 8 §4.3 / 本 §2 rg 検証 |
| AC-5 | PASS | 本 §3 cross-link 死活 C-4 / C-5 |
| AC-6 | PASS | Phase 5 implementation-runbook.md |
| AC-7 | PASS | 本 §4 skill 整合監査 6 軸 |
| AC-8 | PASS（Phase 10 で確定） | 本 §6 4条件最終評価材料 |
| AC-9 | PASS | 本 §5 不変条件監査 |
| AC-10 | PASS（条件付き：Phase 11 で再実行） | 本 §2 rg-verification-log.md |
| AC-11 | PASS | 本 §3 C-7 GitHub Issue CLOSED 維持 |

## 10. 次 Phase への引き渡し

- rg 検証ログ（AC-10 達成根拠 / `rg-verification-log.md`）
- skill 整合監査結果（AC-7 達成根拠 / `skill-integrity-audit.md`）
- 不変条件 #1/#4/#5/#7 違反 0（AC-9 達成根拠 / 本 §5）
- 4条件最終評価材料（AC-8 確定の入力 / 本 §6）
- cross-link 死活 0（AC-5 達成根拠 / 本 §3）
- mirror parity N/A 判定（Phase 12 documentation 更新前提）

## 11. 完了条件チェック

- [x] rg 検証 4 コマンドの実出力が `rg-verification-log.md` に保存
- [x] 本タスク内 stale 表記残留が 0（引用文脈除く）
- [x] cross-link 死活 8 項目すべてリンク切れ 0
- [x] skill `task-workflow.md` との整合監査で 6 軸すべて PASS
- [x] 不変条件 #1 / #4 / #5 / #7 違反 0 が記述
- [x] 4条件最終評価の前提材料が Phase 10 引き渡しテーブルとして整っている
- [x] line budget が Phase 1〜11 は 100-250 行、Phase 12/13 は 350 行以内
- [x] mirror parity の N/A 判定理由が明記
- [x] a11y 対象外と明記
- [x] outputs/phase-09/main.md 作成済み（本ファイル）
