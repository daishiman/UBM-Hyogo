# Phase 13 user approval marker — task-761

| 項目 | 値 |
|------|------|
| task_id | task-761-visual-full-required-status-check |
| approval_timestamp_utc | 2026-05-17T12:49:39Z |
| approval_timestamp_jst | 2026-05-17 21:49 JST |
| approver | daishiman (manju.manju.03.28@gmail.com) |
| 媒体 | Claude Code AskUserQuestion 単一選択 |
| 文言 | 「承認する（dev → main の順で実行）」 |
| 対象操作 | `gh api -X POST repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection/required_status_checks/contexts` |
| 投入 contexts | `visual-full (desktop)`, `visual-full (tablet)`, `visual-full (mobile)` |
| check run name 実測根拠 | `gh api repos/daishiman/UBM-Hyogo/commits/502f6be815c1ab820a2a55ca36c075677fa4c936/check-runs` で取得した name フィールド |

## 確定 check run name (fresh evidence)

```
visual-full (desktop)
visual-full (tablet)
visual-full (mobile)
```

仕様書 (`厳守事項 5`) の例示にあった `visual-full (...)` 形式は GitHub
の check run 命名仕様上は使用されておらず、既存 contexts (`ci`, `Validate Build`,
`coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`) と同じく workflow prefix なしの
形式で登録した。この差異は実測に基づく上書きであり、user 承認時にも fresh evidence を
提示した。

## 実行結果

- dev: contexts 5 → 8 件、3 件追加のみ、不変条件全保持
- main: contexts 5 → 8 件、3 件追加のみ、不変条件全保持
- before/after JSON: `outputs/phase-11/evidence/{dev,main}-protection-{before,after}.json.md`
