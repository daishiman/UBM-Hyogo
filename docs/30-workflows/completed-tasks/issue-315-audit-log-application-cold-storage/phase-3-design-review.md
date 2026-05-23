# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 3 / 13 |
| 目的 | Phase 2 設計の GO/NO-GO 判定。Phase 4 以降の進行可否を確定する |
| 依存 | Phase 2 |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## レビュー観点 / チェックリスト

| ID | 観点 | 判定基準 | 結果記入欄 |
|----|------|----------|-----------|
| R-1 | migration 連番 | `0018_*` で `0017_audit_correlation_findings.sql` の直後である | TBD |
| R-2 | manifest schema | cf_audit_log_export_manifest と column 構造が一致する（type / nullability / UNIQUE） | TBD |
| R-3 | redact module 単一化 | UI 表示 / export の両方が `redact.ts` 経由となる設計である | TBD |
| R-4 | purge 安全装置 | `purgeExportedOlderThan` が未 export 行を削除しない条件式である | TBD |
| R-5 | R2 binding 衝突なし | 既存 `UBM_AUDIT_COLD_STORAGE` を変更しない | TBD |
| R-6 | cron 時間帯分離 | `0 3 * * *` で cf 系 `0 2 * * *` と衝突しない | TBD |
| R-7 | dry_run default=true | merge 直後に意図せず本番 PUT が走らない | TBD |
| R-8 | Object Lock 決定 | COMPLIANCE mode + 7 年 retention を ADR で正本化済 | TBD |
| R-9 | スコープアウト記録 | 外部 SIEM / Logpush / hash chain を Phase 1 で却下済（先送り禁止） | TBD |
| R-10 | unassigned-task の consumed 化計画 | `docs/30-workflows/completed-tasks/task-07c-audit-log-external-siem.md` に `status: superseded` + `canonical_workflow:` 追記する手順が Phase 12 にある | TBD |
| R-11 | governance mutation user gate | `bash scripts/cf.sh d1 migrations apply` / `r2 bucket create` / `deploy` をユーザー承認 gate 化（artifacts.json `governance_mutation_user_gate: true`） | TBD |
| R-12 | テスト計画粒度 | Phase 4 で redact unit / export integration / manifest 2-phase / purge guard / restore drill のテストを網羅 | TBD |

## GO 条件

- R-1..R-12 すべて GO

## NO-GO 条件と対応

| 条件 | 対応 |
|------|------|
| R-2 不一致 | Phase 2 に戻り schema align |
| R-4 安全装置欠落 | Phase 2 で `purgeExportedOlderThan` SQL を full export 被覆チェック付きに修正 |
| R-8 ADR 欠落 | Phase 2 `tamper-detection-decision.md` を ADR フォーマットで再記述 |

## 検証コマンド

```bash
# Phase 2 成果物の存在と完成度確認
ls docs/30-workflows/issue-315-audit-log-application-cold-storage/outputs/phase-2/
mise exec -- pnpm typecheck
```

## 成果物

- `outputs/phase-3/review-checklist.md`（R-1..R-12 判定結果）
- `outputs/phase-3/go-no-go-decision.md`（GO 判定 + Phase 4 着手記録）

## 完了条件

- [ ] R-1..R-12 すべて GO
- [ ] NO-GO 項目があれば対応完了まで Phase 4 に進まない

## 参照資料

- Phase 2 全成果物
- `.claude/skills/task-specification-creator/references/review-gate-criteria.md`
