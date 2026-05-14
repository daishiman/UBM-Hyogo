# Phase 12 — Task Spec Compliance Check

## チェックリスト

| # | 項目 | 結果 |
|---|------|------|
| 1 | Phase 1-13 仕様書が `outputs/phase-*/` に全て存在する | PASS |
| 2 | `index.md` に全 Phase の status table がある | PASS |
| 3 | 不変条件（SSOT / bridge / consumer 分離）が Phase 1-2-5-9 で一貫している | PASS |
| 4 | 置換マッピングが Phase 2 / 5 / 12 で identical | PASS |
| 5 | NON_VISUAL 宣言が Phase 11 に明記されている | PASS |
| 6 | `implementation-guide.md` Part 1（中学生レベル）が含まれる | PASS |
| 7 | `implementation-guide.md` Part 2（技術詳細）が含まれる | PASS |
| 8 | `unassigned-task-detection.md` が 0 件でなく current/baseline 分離されている | PASS（current 3 件） |
| 9 | `skill-feedback-report.md` が空でない | PASS（5 件） |
| 10 | `documentation-changelog.md` で Step 1-A / 1-B / 1-C / Step 2 全て記録されている | PASS |
| 11 | Phase 13 は user 承認後の blocked 状態である | PASS |
| 12 | `artifacts.json` / `outputs/artifacts.json` parity（未作成のため scope out） | N/A（本 spec 作成タスクの簡易構成） |

## 識別子整合性チェック（FB-W1-02b-3）

`implementation-guide.md` の utility 名（`text-text-3`, `bg-panel`, `text-danger` 等）は `apps/web/src/styles/globals.css` の `@theme inline` 定義と grep で一致する。

```bash
grep -E '^\s+--color-(text|text-2|text-3|panel|danger|danger-soft|border)' apps/web/src/styles/globals.css
```

## 完了判定

PASS（Phase 1-12 全成果物存在・Phase 13 は user 承認待ち）
