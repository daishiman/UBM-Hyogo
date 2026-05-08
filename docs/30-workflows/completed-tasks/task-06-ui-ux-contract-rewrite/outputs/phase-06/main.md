# Phase 06: 異常系 / Failure Cases

## サマリ

09-ui-ux.md 書き換え時に発生しうる異常系を列挙し、検出方法と是正手順を定める。すべての failure case は CI / grep / lint で機械的に検出可能。

## Failure Cases

### FC-1: 視覚詳細の混入

**症状**: HEX / oklch() 値 / px 値 / `bg-[#...]` / `text-[#...]` が 09-ui-ux.md に書き戻される。

**検出**:

```bash
grep -nE '#[0-9a-fA-F]{3,8}\b|oklch\(|\b[0-9]+px\b|bg-\[#|text-\[#' docs/00-getting-started-manual/specs/09-ui-ux.md
```

期待: 0 件。1 件でも検出されれば fail。

**是正**: 該当行を削除し、§6.3 prefix 名参照に置換。値は 09b に委譲。

### FC-2: API 列乖離

**症状**: §2 routes 表の API 列が `phase-3.md §2` と乖離する（endpoint 名 / method / route の不一致）。

**検出**: trace check（`outputs/phase-11/evidence/trace-check.log`）で各 routes の API 列を phase-3.md と突合。

**是正**: phase-3.md を正本として一字一句転記し直す。新規 endpoint 追加 / 改変は禁止（不変条件）。

### FC-3: 19 routes 漏れ（routes 軸網羅性違反）

**症状**: `### 2.` の数が 20 でない（19 routes + global-error.tsx fallback = 20）。

**検出**:

```bash
grep -c '^### 2\.' docs/00-getting-started-manual/specs/09-ui-ux.md
```

期待: 20。

**是正**: 不足分を補充。重複は削除。phase-1.md の 19 routes 一覧と突合。

### FC-4: primitives 13 漏れ

**症状**: `#### 3.1.` の数が 13 でない。

**検出**:

```bash
grep -c '^#### 3\.1\.' docs/00-getting-started-manual/specs/09-ui-ux.md
```

期待: 13。

**是正**: 不足分（Button/Card/Badge/Input/Select/Table/Tabs/Sidebar/Toast/Skeleton/DataTable/EmptyState/ErrorState）を補充。

### FC-5: token prefix 規則違反

**症状**: `--ubm-*` 以外の token 名 / 独自 prefix が混入。

**検出**: §6.3 表に列挙された 8 prefix 以外の出現を grep で検出。

**是正**: 8 prefix（`--ubm-{color,radius,shadow,space,text,font,dur,ease}-*`）に統一。

### FC-6: apps/web → D1 直接参照の表記混入

**症状**: §2 routes 表の API 列に D1 binding 直接参照（`d1Database.prepare` 等）が記述される。

**検出**: `grep -nE 'D1Database|d1.prepare|d1Binding' docs/00-getting-started-manual/specs/09-ui-ux.md` で 0 件。

**是正**: `apps/api` 経由の endpoint URL に置換（不変条件 #5）。

### FC-7: gas-prototype 昇格

**症状**: §4.6 / §8 不採用記述が消え、gas-prototype 由来挙動が正本仕様として記述される。

**検出**: `grep -n 'gas-prototype\|tweaks panel\|theme switcher\|data-theme' docs/00-getting-started-manual/specs/09-ui-ux.md` で 4 行以上の不採用文脈の記述を確認。

**是正**: §4.6 / §8 に不採用 4 項目を再掲（不変条件 #6）。

### FC-8: a11y dialog 規範漏れ

**症状**: §5.2 で `role="dialog"` + `aria-modal="true"` + focus trap + Esc close の組が欠ける。

**検出**: `grep -n 'aria-modal' docs/00-getting-started-manual/specs/09-ui-ux.md` で §5.2 配下に最低 1 件。

**是正**: §5.2 にフルセットを再掲。

### FC-9: login 5 状態 grep 不可

**症状**: §4.2 で 5 状態（input / sent / unregistered / deleted / error）が散在。

**検出**: `grep -n '^### 4\.2' docs/00-getting-started-manual/specs/09-ui-ux.md` で 1 件、配下に 5 状態が列挙されているか確認。

**是正**: §4.2 に 5 状態を集約。

### FC-10: markdown lint fail

**症状**: heading 階層飛び / table 構文崩れ / リンク切れ。

**検出**: `markdownlint docs/00-getting-started-manual/specs/09-ui-ux.md` exit 0。

**是正**: lint 指摘行を修正。heading 階層は `## → ### → ####` の連続性を厳守。

## 検証結果サマリ（Phase 11 evidence）

| FC | 結果 |
| --- | :---: |
| FC-1 視覚詳細混入 | PASS（0 件） |
| FC-2 API 列乖離 | PASS |
| FC-3 19 routes 漏れ | PASS（20 件一致） |
| FC-4 primitives 13 漏れ | PASS（13 件一致） |
| FC-5 token prefix 違反 | PASS |
| FC-6 apps/web → D1 | PASS（0 件） |
| FC-7 gas-prototype 昇格 | PASS（不採用記述あり） |
| FC-8 a11y dialog 漏れ | PASS |
| FC-9 login 5 状態 grep | PASS |
| FC-10 markdown lint | PASS（exit 0） |

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | FC-1〜FC-10 列挙 | completed |
| 2 | 各 FC の検出コマンド確定 | completed |
| 3 | 各 FC の是正手順記録 | completed |
| 4 | Phase 11 evidence 突合 | completed |

## 次 Phase

Phase 7（AC マトリクス）へ。
