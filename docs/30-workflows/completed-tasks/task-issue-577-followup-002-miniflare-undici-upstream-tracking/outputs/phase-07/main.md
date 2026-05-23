# Phase 07 outputs / main

## AC マトリクス（要約）

| AC | verify | evidence |
| --- | --- | --- |
| AC-1 | phase-02/main.md 読込 | `outputs/phase-02/main.md` |
| AC-2 | gh api release + triage 表 | `triage-table.md` + `*-releases.json` |
| AC-3 | git status 0 行 | `pkg-unchanged.log` |
| AC-4 | 連続 3 回 vitest 133/133 PASS / 0 EADDRNOTAVAIL | `ab-{N}-run-{1,2,3}.log` + `ab-summary.md` |
| AC-5 | grep 0 件 | `secret-hygiene-grep.log` |
| AC-6 | git diff --stat 0 件 | `apps-api-untouched.log` |

## 場合分け（改善検知）

| 状況 | 必須 evidence | 充足 AC |
| --- | --- | --- |
| なし | triage + pkg-unchanged + hygiene + untouched | 1,2,3,5,6 |
| あり + 採用 | + ab logs + ab-summary | 1,2,4,5,6 |
| あり + 全不採用 | + ab-summary（不採用理由） | 1,2,3,4(部分),5,6 |

## 不変条件 trace

- #5 D1 不変
- CONST_002 commit/push/PR 禁止
- CONST_007 先送り禁止
- aiworkflow-requirements 不変

## ギャップ確認

未確認項目なし。

## 次フェーズ

Phase 8 DRY 化。
