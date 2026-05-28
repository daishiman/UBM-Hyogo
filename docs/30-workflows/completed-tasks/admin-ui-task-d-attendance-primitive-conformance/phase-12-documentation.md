---
実装区分: 実装仕様書
Phase: 12
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-11-manual-test.md](./phase-11-manual-test.md)
次: [phase-13-pr.md](./phase-13-pr.md)
---

# Phase 12: ドキュメント同期 / 未タスク検出

## 12.1 反映先

| 反映先 | 内容 |
|--------|------|
| `../admin-ui-prototype-alignment/phase-5-implementation.md` | Task D 章に本仕様の要約を追記（attendance を primitive 3 段構成へ） |
| `apps/web/src/features/admin/components/_shared/README.md` | attendance での shared primitive / client island 採用を追記 |
| `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` | 「孤立島 primitive の整流は同一画面内で完結させる（新 endpoint 追加禁止下では可視化 primitive を増やさない）」を 1 行追加 |
| `.claude/skills/aiworkflow-requirements/` 関連 surface | `implemented_local_evidence_captured` として登録・更新済み |

## 12.2 unassigned task detection（候補と判定）

| 候補 | 判定 | 理由 |
|------|------|------|
| 区画別出席率 endpoint 追加 + `AttendanceRateBar` 新規 primitive | **作らない** | 新 endpoint 禁止の不変条件に抵触。将来要件として採用する場合は別 workflow + ユーザー承認 |
| header の period filter client island 化 | **作らない** | 期間 API / query 契約が無い状態の UI は未接続 control。refresh は self-link で完結 |
| `KpiCard` に `unit?` / `formatter?` prop 追加 | **作らない** | 現行 `KpiCard.value: number` を維持し、率は `value=Math.round(rate*1000)/10` + `hint="%"` で表現 |
| AdminTable rate cell の inline progress bar | **作らない** | `fmtPct(rate)` テキストで十分。client boundary と token 検証の複雑性を増やさない |

**未タスク件数: 0 件**（"作らない" 3 候補はいずれも本タスクの不変条件と整合する明示的判定であり、別 workflow / Issue 起票も発行しない）。

## 12.3 中学生レベル概念説明

- **primitive**: 画面のレゴブロック。同じブロックを使い回せば見た目と動作がそろう。
- **孤立島**: 1 つの画面だけが他と違う作り方をしている状態。直すと保守が楽になる。
- **fail-soft**: 一部の取得が失敗しても、残りは表示し続ける作り方。

## 12.4 strict 7 成果物

本 standalone workflow は `outputs/phase-12/` 配下に以下を必ず配置:

- `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`

本仕様書作成 wave では placeholder として物理配置し、実装レビューサイクルで current fact に更新済み。

## 12.5 artifacts parity

root `artifacts.json` と `outputs/artifacts.json` は同一内容で配置する。実装サイクル中に Phase status / evidence path を更新した場合は両方を同時更新し、`cmp -s artifacts.json outputs/artifacts.json` を Phase 12 compliance に記録する。

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 12 |
| strict7 | required |

## 目的

Phase 12 strict 7、aiworkflow 同期、artifacts parity を満たす。

## 実行タスク

- strict 7 を作成する。
- aiworkflow indexes / task-workflow-active / changelog / LOGS を同期する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| phase12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| strict 7 | `outputs/phase-12/` | Phase 12 必須成果物 |

## 完了条件

- [ ] strict 7 が 7/7 present である。
- [ ] artifacts parity が PASS である。
