# Phase 07: AC マトリクス

## サマリ

AC-1〜AC-14 の全 PASS を Phase 11 evidence で証明する。

## AC 全件 PASS マトリクス

| AC | 内容 | 期待値 | 実測 | 判定 | evidence link |
| --- | --- | --- | --- | :---: | --- |
| AC-1 | H2 = 10 | 10 | 10 | PASS | `outputs/phase-11/evidence/structure-check.log` |
| AC-2 | `### 2.` = 20 | 20 | 20 | PASS | `outputs/phase-11/evidence/structure-check.log` |
| AC-3 | HEX 0 件 | 0 | 0 | PASS | `outputs/phase-11/evidence/grep-gate.log` |
| AC-4 | oklch() 値 0 件 | 0 | 0 | PASS | `outputs/phase-11/evidence/grep-gate.log` |
| AC-5 | px 値 0 件 | 0 | 0 | PASS | `outputs/phase-11/evidence/grep-gate.log` |
| AC-6 | `bg-[#`/`text-[#` 0 件 | 0 | 0 | PASS | `outputs/phase-11/evidence/grep-gate.log` |
| AC-7 | 19 routes + fallback | 20 | 20 | PASS | `outputs/phase-11/evidence/trace-check.log` |
| AC-8 | primitives 13 | 13 | 13 | PASS | `outputs/phase-11/evidence/structure-check.log` |
| AC-9 | login 5 状態 §4.2 | 1 | 1 | PASS | `outputs/phase-11/evidence/trace-check.log` |
| AC-10 | dialog aria-modal §5.2 | ≥1 | ≥1 | PASS | `outputs/phase-11/evidence/trace-check.log` |
| AC-11 | token prefix 8 種 | 8 | 8 | PASS | `outputs/phase-11/evidence/trace-check.log` |
| AC-12 | apps/web → D1 0 件 | 0 | 0 | PASS | `outputs/phase-11/evidence/trace-check.log` |
| AC-13 | gas-prototype 不採用 | ≥4 | 4 | PASS | `outputs/phase-11/evidence/trace-check.log` |
| AC-14 | repository lint exit 0 | 0 | 0 | PASS | `outputs/phase-11/evidence/markdown-lint.log` |

## 集計

- 全 AC 数: 14
- PASS: 14
- FAIL: 0
- 達成率: 100%

## 不変条件マッピング

| 不変条件 | 該当 AC | 結果 |
| --- | --- | :---: |
| #2 consent キー統一 | AC-7（routes 網羅） | PASS |
| #3 responseEmail = system field | AC-7 | PASS |
| #5 apps/web → D1 禁止 | AC-12 | PASS |
| #6 GAS prototype 非昇格 | AC-13 | PASS |

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | AC-1〜AC-14 マトリクス作成 | completed |
| 2 | 全 AC PASS 確認 | completed |
| 3 | evidence link 集約 | completed |
| 4 | 不変条件マッピング | completed |

## 次 Phase

Phase 8（DRY 化・Before/After）へ。
