# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 12 / 13 |
| 目的 | 6 必須タスク完遂、7 ファイル実体生成、Part 1 中学生レベル + Part 2 技術ドキュメント作成 |
| 依存 | Phase 11 |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## 6 必須タスク

### Task 12-1: 実装ガイド（Part 1 + Part 2）

**ファイル**: `outputs/phase-12/implementation-guide.md`

#### Part 1（中学生レベル概念説明）

最低トピック:
1. 「監査ログ」って何？ — 誰が何をいつ操作したかを記録する帳簿
2. なぜ R2 という別の場所に保存するの？ — D1 は普段使い用、R2 は長期保管庫（金庫）
3. 「Object Lock」って何？ — 7 年間誰も書き換えられない鍵をかける仕組み
4. PII を消すってどういうこと？ — メールアドレスや電話番号は名前を隠してから保存する
5. 失敗したらどうなるの？ — 2 段階で記録するから途中で止まっても安全（pending → completed）

#### Part 2（技術者レベル）

- migration `0018_*` schema 図
- redact.ts API 一覧と policy version 運用
- export-to-r2.ts シーケンス図（D1 SELECT → redact → gzip → R2 PUT → manifest commit）
- R2 Object Lock COMPLIANCE mode の制約と解除条件
- GitHub Actions cron 運用（dry_run default=true、workflow_dispatch 手順）
- runbook へのリンク

### Task 12-2: システム仕様書更新

**ファイル**: `outputs/phase-12/system-spec-update-summary.md`

更新対象（実在確認後に edit）:
- `docs/00-getting-started-manual/specs/08-free-database.md`（audit_log retention 90 日 / R2 7 年を追記）
- `.claude/skills/aiworkflow-requirements/references/` audit / r2 / cron 系 spec（diff 要否を Step 1-A/B/C で判定）
- 条件付き Step 2: 外部 SIEM スコープアウト判断を ADR として `docs/00-getting-started-manual/specs/` に追加するか判断（本タスクは「却下記録」のみで ADR 化は不要と判定する想定）

### Task 12-3: ドキュメント更新履歴

**ファイル**: `outputs/phase-12/documentation-changelog.md`

最低エントリ:
- `apps/api/migrations/0018_add_audit_log_export_manifest.sql`（new）
- `apps/api/src/lib/audit/redact.ts`（new）
- `apps/api/src/repository/auditLog.ts`（update: export 5 関数追加）
- `apps/api/wrangler.toml`（update: R2 binding × 3）
- `scripts/audit-log/export-to-r2.ts`（new）
- `.github/workflows/audit-log-cold-storage.yml`（new）
- `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md`（new）
- `docs/30-workflows/completed-tasks/task-07c-audit-log-external-siem.md`（update: `status: superseded` + `canonical_workflow` pointer 追記）
- skill 正本同期: `.claude/skills/aiworkflow-requirements/references/` 該当 inventory update
- validator 実行記録（コマンド + exit code + 件数）

### Task 12-4: 未タスク検出レポート

**ファイル**: `outputs/phase-12/unassigned-task-detection.md`

- **0 件で出力（必須出力）**
- 章: 「検出件数: 0」「却下記録: 外部 SIEM 連携（理由: solo dev 無料運用ポリシー / Cloudflare R2 Object Lock で代替）」
- スコープアウトされた項目は **未タスクではない** ことを明示（先送りではなく却下）

### Task 12-5: スキルフィードバックレポート

**ファイル**: `outputs/phase-12/skill-feedback-report.md`

3 観点固定章立て:
1. テンプレ改善: closed-issue-canonical-workflow-recovery テンプレを application 系（cf 系の対）への流用ケースとして適用した知見
2. ワークフロー改善: cf-audit-log と audit-log の二系統並走運用での cron 時間帯分離 best practice
3. ドキュメント改善: PII redaction 共通モジュール化を Phase 2 設計テンプレに昇格させる提案（改善点なしでも 0 件で出力可）

### Task 12-6: タスク仕様書コンプライアンスチェック

**ファイル**: `outputs/phase-12/phase12-task-spec-compliance-check.md`

`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の canonical 9 headings に従う:
1. 概要
2. 対象タスク仕様書
3. CONST_005 適合性
4. Phase 11 evidence file inventory
5. Phase 12 必須 7 ファイル実在チェック
6. 状態語彙整合性（`spec_created` / `runtime_pending` / `completed`）
7. 改善必要箇所
8. 改善実施記録
9. 結論（PASS / FAIL）

## consumed pointer 追記（必須）

`docs/30-workflows/completed-tasks/task-07c-audit-log-external-siem.md` の末尾に追記:

```markdown
---
status: superseded
consumed_at: 2026-05-XX
canonical_workflow: docs/30-workflows/issue-315-audit-log-application-cold-storage/
recovery_note: |
  Issue #315 は CLOSED 後に canonical workflow root が未生成のまま残っていたため、
  closed-issue-canonical-workflow-recovery パターンで後付け生成した。
  Phase 1-13 work はすべて canonical workflow root に移行済み。
  外部 SIEM 連携は本 recovery でスコープアウト（却下）し、Cloudflare R2 + Object Lock で代替実装した。
---
```

## main.md

**ファイル**: `outputs/phase-12/main.md`
- Phase 12 サマリ + 6 タスク完了状況 + 7 ファイル実在表

## 7 必須ファイル実在チェック

| # | ファイル |
|---|----------|
| 1 | `outputs/phase-12/main.md` |
| 2 | `outputs/phase-12/implementation-guide.md` |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 4 | `outputs/phase-12/system-spec-update-summary.md` |
| 5 | `outputs/phase-12/skill-feedback-report.md` |
| 6 | `outputs/phase-12/unassigned-task-detection.md` |
| 7 | `outputs/phase-12/documentation-changelog.md` |

## 成果物

§「7 必須ファイル実在チェック」の 7 ファイルを `outputs/phase-12/` 配下に物理生成する。各ファイルの内容は Task 12-1〜12-6 の定義に従う。

## 検証コマンド

```bash
# 7 ファイル実在
for f in main implementation-guide phase12-task-spec-compliance-check system-spec-update-summary skill-feedback-report unassigned-task-detection documentation-changelog; do
  test -f "docs/30-workflows/issue-315-audit-log-application-cold-storage/outputs/phase-12/${f}.md" && echo "OK: ${f}" || echo "MISSING: ${f}"
done

# Phase 12 compliance gate
bash scripts/verify-pr-ready.sh
```

## 完了条件

- [ ] 7 ファイル実在
- [ ] Part 1 / Part 2 セルフチェック PASS
- [ ] consumed pointer 追記済み
- [ ] unassigned-task-detection 0 件で出力済み（必須）
- [ ] skill-feedback-report 3 観点章立てで出力済み（必須）
- [ ] phase12-compliance check で canonical 9 headings 全揃い

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
