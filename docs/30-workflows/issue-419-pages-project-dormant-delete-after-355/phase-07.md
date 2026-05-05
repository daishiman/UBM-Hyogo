# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

Issue #419 の AC-1〜AC-6 が、それぞれどの Phase 成果物・どの evidence file・どの gate で
covered されているかを 1 つの表に集約する。runtime cycle が「PASS / pending」を即判別できる状態にする。

## 入力（参照ドキュメント）

- `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md` AC 表
- Phase 5 [`phase-05.md`](phase-05.md) Step 手順
- Phase 6 [`phase-06.md`](phase-06.md) 異常系・停止条件
- Phase 9 [`phase-09.md`](phase-09.md) 自動 / 手動 gate

## 変更対象ファイル一覧

| パス | 種別 | 差分方針 |
| --- | --- | --- |
| `outputs/phase-07/main.md` | 新規 | AC マトリクス記録テンプレ |

## Issue #419 AC ↔ 実装 / Phase マッピング

| AC | 要件 | 検証手段 | evidence file | gate Phase | status |
| --- | --- | --- | --- | --- | --- |
| AC-1 | Workers production route と staging/production smoke evidence が完了 | `bash scripts/cf.sh deployments list` + 親仕様 #355 phase-11 smoke 参照 | `outputs/phase-11/preflight-ac1-ac2.md`, `outputs/phase-11/workers-pre-version-id.md` | Phase 5 Step 1, 2 | COVERED_BY_PLANNED_RUN |
| AC-2 | Pages プロジェクトに active な custom domain attachment が存在しない | `bash scripts/cf.sh pages project list` + `bash scripts/cf.sh api-get /client/v4/accounts/.../pages/projects` | `outputs/phase-11/preflight-ac1-ac2.md` | Phase 5 Step 1 | COVERED_BY_PLANNED_RUN |
| AC-3 | dormant 観察期間（開始日 / 終了日 / 観察結果）が記録 | 期間 ≥ 2 週間 + 週次サンプル ≥ 2 件 | `outputs/phase-11/dormant-period-log.md` | Phase 5 Step 3 / Phase 6 E-06 | COVERED_BY_PLANNED_RUN |
| AC-4 | 削除操作に user 明示承認が記録（PR description / Issue comment いずれか） | 承認文言・承認者・URL の貼付 | `outputs/phase-11/user-approval-record.md` | Phase 5 Step 4 / Phase 6 E-08 | COVERED_BY_PLANNED_GATE |
| AC-5 | evidence に Cloudflare API token / account secret / Logpush sink URL query / OAuth value が含まれない | `rg -i '(CLOUDFLARE_API_TOKEN|bearer|token=|sink|secret|account_id)' outputs/` = 0 件 | `outputs/phase-11/redaction-check.md` | Phase 5 Step 7 / Phase 9 redaction gate | COVERED_BY_PLANNED_GATE |
| AC-6 | `aiworkflow-requirements` 正本仕様の Pages 言及が削除済みステータスへ更新 | `rg "Cloudflare Pages|pages\.dev|pages project" .claude/skills/aiworkflow-requirements/references/` の差分 | `.claude/skills/aiworkflow-requirements/` 配下 + `mise exec -- pnpm indexes:rebuild` | Phase 5 Step 8 / Phase 9 indexes gate | COVERED_BY_PLANNED_DIFF |

## scope ↔ Phase マッピング

| Scope | Phase |
| --- | --- |
| Workers cutover 完了確認 | Phase 5 Step 1, 2 / Phase 6 E-01 |
| Pages dormant 確認（trafficeno 0 / domain 空） | Phase 5 Step 1 / Phase 6 E-02 |
| dormant 観察期間運用 | Phase 5 Step 3 / Phase 6 E-06 |
| user 明示承認 | Phase 5 Step 4 / Phase 6 E-08 |
| 削除コマンド実行 | Phase 5 Step 5 / Phase 6 E-03, E-04, E-05 |
| post-deletion smoke | Phase 5 Step 6 |
| redaction | Phase 5 Step 7 / Phase 6 E-07 / Phase 9 redaction gate |
| aiworkflow-requirements 更新 | Phase 5 Step 8 / Phase 9 indexes gate |

## status ラベルの定義

- `COVERED_BY_PLANNED_RUN`: runtime cycle で実行する evidence。spec_created 段階では skeleton のみ
- `COVERED_BY_PLANNED_GATE`: 自動 / 手動 gate により runtime PASS が担保される
- `COVERED_BY_PLANNED_DIFF`: docs / indexes diff を runtime cycle で適用する

## 完了条件 (DoD)

- [ ] AC-1〜AC-6 の全件が evidence file と gate Phase へ 1 対 1 以上でマップされている
- [ ] status ラベルが `COVERED_BY_PLANNED_*` のいずれかで明示されている
- [ ] runtime cycle が「未 PASS の AC」を本表のみで識別可能になっている

## 実行タスク

- Phase 07 の AC マッピング判断を確定する。

## 参照資料

- [phase-05.md](phase-05.md)
- [phase-06.md](phase-06.md)
- [phase-09.md](phase-09.md)
- `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`

## 成果物

- `outputs/phase-07/main.md`
